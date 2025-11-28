import { create } from 'zustand';
import { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { toast } from '@/hooks/use-toast';
import type { HistoryItem, PixelCrop as ScaledPixelCrop } from '@/lib/types';
import {
  prepareInitialImage, cropImage, rotateImage, flipImage,
  recreateStateFromHistoryAction, recreateStateFromImageUrl
} from '@/actions/imageActions';
import { removeBackgroundAction } from '@/ai/actions/remove-background.action';
import { upscaleImageAction, faceDetailerAction } from '@/ai/actions/upscale-image.action';

// --- TYPES ---

export interface ImageVersion {
  id: string;
  imageUrl: string;
  label: string;
  sourceVersionId: string;
  createdAt: number;
  hash: string;
  status?: 'processing' | 'complete';
}

interface ImagePreparationState {
  original: { file: File; imageUrl: string; hash: string; } | null;
  versions: Record<string, ImageVersion>;
  activeVersionId: string | null;
  versionHistory: string[];
  historyIndex: number;
  crop?: Crop;
  completedCrop?: PixelCrop;
  aspect?: number;
  imageDimensions?: { originalWidth: number; originalHeight: number; };
  comparison: {
    left: string;
    right: string;
  } | null;
  scale: number;
}

interface ImagePreparationActions {
  // Sync Actions
  setOriginal: (payload: { file: File; imageUrl: string; hash: string; width: number; height: number; }) => void;
  addVersion: (version: ImageVersion) => void;
  setActiveVersion: (versionId: string) => void;
  undo: () => void;
  redo: () => void;
  setCrop: (crop?: Crop) => void;
  setCompletedCrop: (crop?: PixelCrop) => void;
  setAspect: (aspect?: number) => void;
  setDimensions: (width: number, height: number) => void;
  setComparison: (comparison: { left: string; right: string } | null) => void;
  setScale: (scale: number) => void;
  reset: () => void;

  // Async Actions
  uploadOriginalImage: (file: File) => Promise<{ resized: boolean; originalWidth: number; originalHeight: number; }>;
  applyCrop: () => Promise<void>;
  removeBackground: () => Promise<void>;
  upscaleImage: () => Promise<void>;
  faceDetailer: () => Promise<void>;
  rotateImageLeft: () => Promise<void>;
  rotateImageRight: () => Promise<void>;
  flipHorizontal: () => Promise<void>;
  flipVertical: () => Promise<void>;
  initializeFromHistory: (item: HistoryItem) => Promise<void>;
  initializeFromUrl: (url: string) => Promise<void>;
}

const initialState: ImagePreparationState = {
  original: null,
  versions: {},
  activeVersionId: null,
  versionHistory: [],
  historyIndex: -1,
  crop: undefined,
  completedCrop: undefined,
  aspect: undefined,
  imageDimensions: undefined,
  comparison: null,
  scale: 1,
};

export const useImageStore = create<ImagePreparationState & ImagePreparationActions>((set, get) => ({
  ...initialState,

  // --- SYNC ACTIONS ---

  setOriginal: ({ file, imageUrl, hash, width, height }) => {
    const originalVersion: ImageVersion = {
      id: 'original', imageUrl, label: 'Original', sourceVersionId: '', createdAt: Date.now(), hash, status: 'complete'
    };
    set({
      ...initialState,
      original: { file, imageUrl, hash },
      versions: { original: originalVersion },
      activeVersionId: 'original',
      versionHistory: ['original'],
      historyIndex: 0,
      imageDimensions: { originalWidth: width, originalHeight: height },
    });
  },

  addVersion: (version) => {
    const finalVersion = { ...version, status: 'complete' as const };
    set((state) => {
      const newHistory = state.historyIndex < state.versionHistory.length - 1
        ? [...state.versionHistory.slice(0, state.historyIndex + 1), finalVersion.id]
        : [...state.versionHistory, finalVersion.id];
      return {
        versions: { ...state.versions, [finalVersion.id]: finalVersion },
        activeVersionId: finalVersion.id,
        versionHistory: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  setActiveVersion: (versionId) => set((state) => {
    // Get the version we are switching TO
    // const targetVersion = state.versions[versionId]; // Unused but available if needed logic depends on it

    // If we are switching images, we MUST clear the pixel crop
    // because coordinates for Image A don't make sense for Image B
    // unless they have identical dimensions (which we can't guarantee).

    return {
      activeVersionId: versionId,
      crop: undefined,           // FORCE RESET
      completedCrop: undefined,  // FORCE RESET
      aspect: undefined,         // Reset aspect preference on switch
      // imageDimensions: undefined, // Keep dimensions if possible, or let onLoad update it? 
      // Better to let the Canvas onLoad event update dimensions to ensure accuracy.
      imageDimensions: undefined,
      comparison: null,
      scale: 1,
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    const newIndex = state.historyIndex - 1;
    return {
      historyIndex: newIndex,
      activeVersionId: state.versionHistory[newIndex],
      crop: undefined,
      completedCrop: undefined,
      aspect: undefined,
      imageDimensions: undefined,
      comparison: null,
      scale: 1,
    };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.versionHistory.length - 1) return state;
    const newIndex = state.historyIndex + 1;
    return {
      historyIndex: newIndex,
      activeVersionId: state.versionHistory[newIndex],
      crop: undefined,
      completedCrop: undefined,
      aspect: undefined,
      imageDimensions: undefined,
      comparison: null,
      scale: 1,
    };
  }),

  setCrop: (crop) => set({ crop }),
  setCompletedCrop: (crop) => set({ completedCrop: crop }),

  setAspect: (aspect) => set((state) => {
    if (state.imageDimensions?.originalWidth && state.imageDimensions?.originalHeight) {
      const { originalWidth: width, originalHeight: height } = state.imageDimensions;
      const newCrop = aspect
        ? centerCrop(
          makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
          width,
          height
        )
        : undefined;
      return { aspect, crop: newCrop, completedCrop: undefined };
    }
    return { aspect, crop: undefined, completedCrop: undefined };
  }),

  setDimensions: (width, height) => set({ imageDimensions: { originalWidth: width, originalHeight: height } }),
  setComparison: (comparison) => set({ comparison }),
  setScale: (scale) => set({ scale }),
  reset: () => set(initialState),

  // --- ASYNC ACTIONS ---

  uploadOriginalImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const result = await prepareInitialImage(formData);
    if (!result.success) throw new Error(result.error);

    get().setOriginal({ file, imageUrl: result.imageUrl, hash: result.hash, width: result.originalWidth, height: result.originalHeight });
    return { resized: result.resized, originalWidth: result.originalWidth, originalHeight: result.originalHeight };
  },

  applyCrop: async () => {
    const state = get();
    const { crop, imageDimensions, activeVersionId: sourceVersionId } = state;

    if (!crop || !sourceVersionId || !imageDimensions) {
      toast({ title: 'Cannot apply crop: Missing state.', variant: 'destructive' });
      return;
    }
    const sourceImage = state.versions[sourceVersionId];

    const scaledCrop: ScaledPixelCrop = {
      x: Math.round((crop.x / 100) * imageDimensions.originalWidth),
      y: Math.round((crop.y / 100) * imageDimensions.originalHeight),
      width: Math.round((crop.width / 100) * imageDimensions.originalWidth),
      height: Math.round((crop.height / 100) * imageDimensions.originalHeight),
    };

    if (scaledCrop.width === 0 || scaledCrop.height === 0) {
      toast({ title: "Invalid crop selection", description: "Please select an area to crop.", variant: "destructive" });
      return;
    }

    // Optimistic Update
    const tempId = `optimistic_crop_${Date.now()}`;
    set((s) => ({
      versions: {
        ...s.versions,
        [tempId]: {
          id: tempId,
          label: 'Cropping...',
          sourceVersionId,
          imageUrl: sourceImage.imageUrl,
          createdAt: Date.now(),
          hash: 'optimistic',
          status: 'processing'
        }
      }
    }));

    try {
      const result = await cropImage(sourceImage.imageUrl, scaledCrop);
      if (!result.success) throw new Error(result.error);

      // Check consistency
      if (!get().versions[sourceVersionId]) return;

      get().addVersion({
        id: `cropped_${Date.now()}`,
        imageUrl: result.imageUrl,
        label: 'Cropped',
        sourceVersionId,
        hash: result.hash,
        createdAt: Date.now(),
        status: 'complete',
      });

      get().setAspect(undefined);
      toast({ title: "Crop Applied", description: "A new cropped version has been created." });

    } catch (error) {
      console.error('Crop failed:', error);
      toast({ title: "Cropping Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      // Cleanup optimistic version
      set((s) => {
        const { [tempId]: _, ...rest } = s.versions;
        return { versions: rest };
      });
    }
  },

  removeBackground: async () => performOptimisticAction(get, set, 'Background Removed', removeBackgroundAction),
  upscaleImage: async () => performOptimisticAction(get, set, 'Upscaled', upscaleImageAction),
  faceDetailer: async () => performOptimisticAction(get, set, 'Face Enhanced', faceDetailerAction),
  rotateImageLeft: async () => performOptimisticAction(get, set, 'Rotated Left', (url, hash) => rotateImage(url, -90)),
  rotateImageRight: async () => performOptimisticAction(get, set, 'Rotated Right', (url, hash) => rotateImage(url, 90)),
  flipHorizontal: async () => performOptimisticAction(get, set, 'Flipped Horizontal', (url, hash) => flipImage(url, 'horizontal')),
  flipVertical: async () => performOptimisticAction(get, set, 'Flipped Vertical', (url, hash) => flipImage(url, 'vertical')),

  initializeFromHistory: async (item) => {
    try {
      const result = await recreateStateFromHistoryAction(item.id);
      if (!result.success) throw new Error(result.error);

      get().setOriginal({
        file: new File([], 'history_image.png'),
        imageUrl: result.imageUrl,
        hash: result.hash,
        width: result.originalWidth,
        height: result.originalHeight,
      });

      toast({
        title: "History Item Loaded",
        description: "Configuration restored. You can now generate new images or videos.",
      });
    } catch (error) {
      console.error('Failed to initialize from history:', error);
      toast({ title: "Error", description: "Could not load history item.", variant: "destructive" });
    }
  },

  initializeFromUrl: async (url) => {
    try {
      const result = await recreateStateFromImageUrl(url);
      if (!result.success) throw new Error(result.error);

      get().setOriginal({
        file: new File([], 'generated_image.png'),
        imageUrl: url,
        hash: result.hash,
        width: result.originalWidth,
        height: result.originalHeight,
      });

      toast({
        title: "Image Loaded",
        description: "You can now begin a new creative workflow.",
      });
    } catch (error) {
      console.error('Failed to initialize from URL:', error);
      toast({ title: "Error", description: "Could not load image.", variant: "destructive" });
    }
  }
}));

// Helper for optimistic actions
async function performOptimisticAction(
  get: () => ImagePreparationState & ImagePreparationActions,
  set: (partial: Partial<ImagePreparationState> | ((state: ImagePreparationState) => Partial<ImagePreparationState>)) => void,
  label: string,
  action: (url: string, hash: string) => Promise<any>
) {
  const state = get();
  const activeVersionId = state.activeVersionId;
  if (!activeVersionId) {
    toast({ title: "No active image selected.", variant: "destructive" });
    return;
  }

  const sourceImage = state.versions[activeVersionId];
  if (!sourceImage) {
    toast({ title: "Source image not found.", variant: "destructive" });
    return;
  }

  const tempId = `optimistic_${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

  // Optimistic Update
  set((s) => ({
    versions: {
      ...s.versions,
      [tempId]: {
        id: tempId,
        label: `${label}...`,
        sourceVersionId: activeVersionId,
        imageUrl: sourceImage.imageUrl,
        createdAt: Date.now(),
        hash: 'optimistic',
        status: 'processing'
      }
    }
  }));

  try {
    const result = await action(sourceImage.imageUrl, sourceImage.hash);

    if (!get().versions[activeVersionId]) return;

    const finalImageUrl = result.savedPath || result.imageUrl;
    const finalHash = result.outputHash || result.hash;

    if (!finalImageUrl || !finalHash) throw new Error('Invalid action result');

    get().addVersion({
      id: `${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      imageUrl: finalImageUrl,
      label,
      sourceVersionId: activeVersionId,
      hash: finalHash,
      createdAt: Date.now(),
      status: 'complete',
    });

    if (result.originalWidth && result.originalHeight) {
      get().setDimensions(result.originalWidth, result.originalHeight);
    }

    toast({ title: `${label} applied successfully.` });

  } catch (error) {
    console.error(`${label} failed:`, error);
    toast({ title: `${label} Failed`, description: (error as Error).message, variant: "destructive" });
  } finally {
    set((s) => {
      const { [tempId]: _, ...rest } = s.versions;
      return { versions: rest };
    });
  }
}
