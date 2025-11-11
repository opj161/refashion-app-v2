// src/stores/imageStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { toast } from '@/hooks/use-toast';
import type { PixelCrop as ScaledPixelCrop, HistoryItem } from '@/lib/types';

// Server Actions
import { removeBackgroundAction } from '@/ai/actions/remove-background.action';
import { upscaleImageAction, faceDetailerAction } from '@/ai/actions/upscale-image.action';
import { 
  prepareInitialImage, 
  cropImage, 
  recreateStateFromHistoryAction, 
  rotateImage, 
  flipImage,
  recreateStateFromImageUrl
} from '@/actions/imageActions';

// Types for the image preparation workflow
export interface ImageVersion {
  id: string;
  imageUrl: string;
  label: string;
  sourceVersionId: string;
  createdAt: number;
  hash: string;
}

export interface ImagePreparationState {
  // Core image state
  original: {
    file: File;
    imageUrl: string;
    hash: string;
  } | null;
  versions: Record<string, ImageVersion>;
  activeVersionId: string | null;
  
  // Version history for undo/redo
  versionHistory: string[];
  historyIndex: number;
  
  // Crop-related state
  crop?: Crop;
  completedCrop?: PixelCrop;
  aspect?: number;
  imageDimensions?: { 
    originalWidth: number;
    originalHeight: number;
  };
  
  // Processing state
  isProcessing: boolean;
  processingStep: 'upload' | 'crop' | 'bg' | 'upscale' | 'face' | 'rotate' | 'flip' | 'confirm' | null;
  
  // Comparison state
  comparison: {
    left: string;
    right: string;
  } | null;
  
  // Tab state (lifted from CreationHub)
  currentTab: string;
}

export interface ImagePreparationActions {
  // Core actions
  setOriginalImage: (file: File, imageUrl: string, hash: string) => void;
  addVersion: (version: Omit<ImageVersion, 'id' | 'createdAt'>) => string;
  setActiveVersion: (versionId: string) => void;
  reset: () => void;
  
  // Undo/Redo actions
  undo: () => void;
  redo: () => void;
  
  // Crop actions
  setCrop: (crop?: Crop) => void;
  setCompletedCrop: (crop?: PixelCrop) => void;
  setAspect: (aspect?: number) => void;
  setOriginalImageDimensions: (dimensions: { width: number; height: number }) => void;
  
  // Processing actions
  setProcessing: (isProcessing: boolean, step: ImagePreparationState['processingStep']) => void;
  setComparison: (comparison: { left: string; right: string } | null) => void;
  
  // Tab navigation actions
  setCurrentTab: (tab: string) => void;
  
  // Async actions
  applyCrop: () => Promise<void>;
  removeBackground: (username: string) => Promise<void>;
  upscaleImage: (username: string) => Promise<void>;
  faceDetailer: (username: string) => Promise<void>;
  rotateImageLeft: () => Promise<void>;
  rotateImageRight: () => Promise<void>;
  flipHorizontal: () => Promise<void>;
  flipVertical: () => Promise<void>;
  uploadOriginalImage: (file: File) => Promise<{ resized: boolean; originalWidth: number; originalHeight: number; }>;
  initializeFromHistory: (item: HistoryItem) => Promise<void>;
  initializeFromImageUrl: (imageUrl: string) => Promise<void>;
}

type ImagePreparationStore = ImagePreparationState & ImagePreparationActions & {
  canUndo: boolean;
  canRedo: boolean;
};

// Initial state
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
  isProcessing: false,
  processingStep: null,
  comparison: null,
  currentTab: 'image',
};

export const useImageStore = create<ImagePreparationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Derived state for undo/redo (computed values, not getters)
      canUndo: false,
      canRedo: false,
      
      // Core actions
      setOriginalImage: (file: File, imageUrl: string, hash: string) => {
        const originalVersion: ImageVersion = {
          id: 'original',
          imageUrl,
          label: 'Original',
          sourceVersionId: '',
          createdAt: Date.now(),
          hash,
        };

        set({
          ...initialState,
          original: { file, imageUrl, hash },
          versions: { original: originalVersion },
          activeVersionId: 'original',
          versionHistory: ['original'],
          historyIndex: 0,
          canUndo: false,
          canRedo: false,
        });
      },

      addVersion: (version: Omit<ImageVersion, 'id' | 'createdAt'>) => {
        const id = `${version.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const newVersion: ImageVersion = {
          ...version,
          id,
          createdAt: Date.now(),
        };

        set((state) => {
          const newHistory = state.historyIndex < state.versionHistory.length - 1
            ? [...state.versionHistory.slice(0, state.historyIndex + 1), id]
            : [...state.versionHistory, id];
          const newIndex = newHistory.length - 1;

          return {
            versions: {
              ...state.versions,
              [id]: newVersion,
            },
            activeVersionId: id,
            versionHistory: newHistory,
            historyIndex: newIndex,
            canUndo: newIndex > 0,
            canRedo: false, // We're at the end after adding
          };
        });

        return id;
      },

      setActiveVersion: (versionId: string) => {
        set({
          activeVersionId: versionId,
          comparison: null,
          imageDimensions: undefined,
          crop: undefined,
          completedCrop: undefined,
          aspect: undefined, // Also reset aspect when switching versions
        });
      },

      reset: () => {
        set(initialState);
      },

      // Undo/Redo actions
      undo: () => {
        set((state) => {
          if (state.historyIndex <= 0) return state;
          
          const newIndex = state.historyIndex - 1;
          const newActiveId = state.versionHistory[newIndex];
          
          return {
            activeVersionId: newActiveId,
            historyIndex: newIndex,
            crop: undefined,
            completedCrop: undefined,
            imageDimensions: undefined,
            comparison: null,
            canUndo: newIndex > 0,
            canRedo: true, // We can always redo after undo
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex >= state.versionHistory.length - 1) return state;
          
          const newIndex = state.historyIndex + 1;
          const newActiveId = state.versionHistory[newIndex];
          
          return {
            activeVersionId: newActiveId,
            historyIndex: newIndex,
            crop: undefined,
            completedCrop: undefined,
            imageDimensions: undefined,
            comparison: null,
            canUndo: true, // We can always undo after redo
            canRedo: newIndex < state.versionHistory.length - 1,
          };
        });
      },

      // Crop actions
      setCrop: (crop?: Crop) => {
        set({ crop });
      },

      setCompletedCrop: (completedCrop?: PixelCrop) => {
        set({ completedCrop });
      },

      setOriginalImageDimensions: (dimensions: { width: number; height: number }) => {
        set({ 
          imageDimensions: { 
            originalWidth: dimensions.width, 
            originalHeight: dimensions.height 
          } 
        });
      },

      setAspect: (aspect?: number) => {
        const { imageDimensions } = get();
        
        if (imageDimensions?.originalWidth && imageDimensions?.originalHeight) {
          const { originalWidth: width, originalHeight: height } = imageDimensions;
          const newCrop = aspect
            ? centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
                width,
                height
              )
            : undefined;
          set({ aspect, crop: newCrop, completedCrop: undefined });
        } else {
          set({ aspect, crop: undefined, completedCrop: undefined });
        }
      },

      // Processing actions
      setProcessing: (isProcessing: boolean, step: ImagePreparationState['processingStep']) => {
        set({ isProcessing, processingStep: step });
      },

      setComparison: (comparison: { left: string; right: string } | null) => {
        set({ comparison });
      },

      setCurrentTab: (tab: string) => {
        set({ currentTab: tab });
      },

      // Async actions
      applyCrop: async () => {
        const { crop, activeVersionId, versions, imageDimensions, setProcessing, addVersion, setAspect } = get();
        if (!crop || !activeVersionId || !imageDimensions) {
          throw new Error('Cannot apply crop: No active image, dimensions, or crop selection.');
        }

        const currentVersion = versions[activeVersionId];
        setProcessing(true, 'crop');

        try {
          const scaledPixelCrop: ScaledPixelCrop = {
            x: Math.round((crop.x / 100) * imageDimensions.originalWidth),
            y: Math.round((crop.y / 100) * imageDimensions.originalHeight),
            width: Math.round((crop.width / 100) * imageDimensions.originalWidth),
            height: Math.round((crop.height / 100) * imageDimensions.originalHeight),
          };

          if (scaledPixelCrop.width === 0 || scaledPixelCrop.height === 0) {
            throw new Error("Invalid crop selection: width or height is zero.");
          }

          const result = await cropImage(currentVersion.imageUrl, scaledPixelCrop);
          if (!result.success) {
            throw new Error(result.error);
          }
          
          addVersion({
            imageUrl: result.imageUrl,
            label: 'Cropped',
            sourceVersionId: activeVersionId,
            hash: result.hash,
          });

          setAspect(undefined);

        } catch (error) {
          console.error('Error applying crop:', error);
          throw error;
        } finally {
          setProcessing(false, null);
        }
      },

      rotateImageLeft: async () => {
        const { activeVersionId, versions, setProcessing, addVersion, setOriginalImageDimensions } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          toast({ title: 'No active image to rotate', variant: 'destructive' });
          return;
        }

        const currentVersion = versions[activeVersionId];
        setProcessing(true, 'rotate');

        try {
          const result = await rotateImage(currentVersion.imageUrl, -90);
          if (!result.success) {
            throw new Error(result.error);
          }

          addVersion({
            imageUrl: result.imageUrl,
            label: 'Rotated Left',
            sourceVersionId: activeVersionId,
            hash: result.hash,
          });

          setOriginalImageDimensions({ width: result.originalWidth, height: result.originalHeight });
          
          toast({ title: "Image Rotated", description: "A new rotated version has been created." });
        } catch (error) {
          console.error('Error rotating image:', error);
          toast({ title: "Rotation Failed", description: (error as Error).message, variant: "destructive" });
        } finally {
          setProcessing(false, null);
        }
      },

      rotateImageRight: async () => {
        const { activeVersionId, versions, setProcessing, addVersion, setOriginalImageDimensions } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          toast({ title: 'No active image to rotate', variant: 'destructive' });
          return;
        }

        const currentVersion = versions[activeVersionId];
        setProcessing(true, 'rotate');

        try {
          const result = await rotateImage(currentVersion.imageUrl, 90);
          if (!result.success) {
            throw new Error(result.error);
          }

          addVersion({
            imageUrl: result.imageUrl,
            label: 'Rotated Right',
            sourceVersionId: activeVersionId,
            hash: result.hash,
          });

          setOriginalImageDimensions({ width: result.originalWidth, height: result.originalHeight });
          
          toast({ title: "Image Rotated", description: "A new rotated version has been created." });
        } catch (error) {
          console.error('Error rotating image:', error);
          toast({ title: "Rotation Failed", description: (error as Error).message, variant: "destructive" });
        } finally {
          setProcessing(false, null);
        }
      },

      flipHorizontal: async () => {
        const { activeVersionId, versions, setProcessing, addVersion, setOriginalImageDimensions } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          toast({ title: 'No active image to flip', variant: 'destructive' });
          return;
        }

        const currentVersion = versions[activeVersionId];
        setProcessing(true, 'flip');

        try {
          const result = await flipImage(currentVersion.imageUrl, 'horizontal');
          if (!result.success) {
            throw new Error(result.error);
          }

          addVersion({
            imageUrl: result.imageUrl,
            label: 'Flipped Horizontal',
            sourceVersionId: activeVersionId,
            hash: result.hash,
          });

          setOriginalImageDimensions({ width: result.originalWidth, height: result.originalHeight });
          
          toast({ title: "Image Flipped", description: "A new flipped horizontal version has been created." });
        } catch (error) {
          console.error('Error flipping image:', error);
          toast({ title: "Flip Failed", description: (error as Error).message, variant: "destructive" });
        } finally {
          setProcessing(false, null);
        }
      },

      flipVertical: async () => {
        const { activeVersionId, versions, setProcessing, addVersion, setOriginalImageDimensions } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          toast({ title: 'No active image to flip', variant: 'destructive' });
          return;
        }

        const currentVersion = versions[activeVersionId];
        setProcessing(true, 'flip');

        try {
          const result = await flipImage(currentVersion.imageUrl, 'vertical');
          if (!result.success) {
            throw new Error(result.error);
          }

          addVersion({
            imageUrl: result.imageUrl,
            label: 'Flipped Vertical',
            sourceVersionId: activeVersionId,
            hash: result.hash,
          });

          setOriginalImageDimensions({ width: result.originalWidth, height: result.originalHeight });
          
          toast({ title: "Image Flipped", description: "A new flipped vertical version has been created." });
        } catch (error) {
          console.error('Error flipping image:', error);
          toast({ title: "Flip Failed", description: (error as Error).message, variant: "destructive" });
        } finally {
          setProcessing(false, null);
        }
      },

      removeBackground: async (username: string) => {
        const { activeVersionId, versions, setProcessing, addVersion } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for background removal');
          return;
        }
        const currentVersion = versions[activeVersionId];
        setProcessing(true, 'bg');

        try {
          const { savedPath, outputHash } = await removeBackgroundAction(currentVersion.imageUrl, currentVersion.hash);
          addVersion({
            imageUrl: savedPath,
            label: 'Background Removed',
            sourceVersionId: activeVersionId,
            hash: outputHash,
          });
        } catch (error) {
          console.error('Error removing background:', error);
          throw error;
        } finally {
          setProcessing(false, null);
        }
      },

      upscaleImage: async (username: string) => {
        const { activeVersionId, versions, setProcessing, addVersion } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for upscaling');
          return;
        }
        const currentVersion = versions[activeVersionId];
        setProcessing(true, 'upscale');

        try {
          const { savedPath, outputHash } = await upscaleImageAction(currentVersion.imageUrl, currentVersion.hash);
          addVersion({
            imageUrl: savedPath,
            label: 'Upscaled',
            sourceVersionId: activeVersionId,
            hash: outputHash,
          });
        } catch (error) {
          console.error('Error upscaling image:', error);
          throw error;
        } finally {
          setProcessing(false, null);
        }
      },

      faceDetailer: async (username: string) => {
        const { activeVersionId, versions, setProcessing, addVersion } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for face detailer');
          return;
        }
        const currentVersion = versions[activeVersionId];
        setProcessing(true, 'face');

        try {
          const { savedPath, outputHash } = await faceDetailerAction(currentVersion.imageUrl, currentVersion.hash);
          addVersion({
            imageUrl: savedPath,
            label: 'Face Enhanced',
            sourceVersionId: activeVersionId,
            hash: outputHash,
          });
        } catch (error) {
          console.error('Error enhancing face details:', error);
          throw error;
        } finally {
          setProcessing(false, null);
        }
      },

      uploadOriginalImage: async (file: File) => {
        const { setProcessing, setOriginalImage, setOriginalImageDimensions } = get();
        setProcessing(true, 'upload');
        try {
          const formData = new FormData();
          formData.append('file', file);

          const result = await prepareInitialImage(formData);

          if (!result.success) {
            throw new Error(result.error);
          }

          const { imageUrl, hash, resized, originalWidth, originalHeight } = result;

          setOriginalImage(file, imageUrl, hash);
          setOriginalImageDimensions({ width: originalWidth, height: originalHeight });
          
          return { resized, originalWidth, originalHeight };
        } catch (error) {
          console.error('Upload failed in store:', error);
          throw error;
        } finally {
          setProcessing(false, null);
        }
      },

      initializeFromHistory: async (item: HistoryItem) => {
        const { reset, setProcessing, setOriginalImage, setOriginalImageDimensions } = get();
        reset();
        setProcessing(true, 'upload');

        try {
          const result = await recreateStateFromHistoryAction(item.id);

          if (!result.success) {
            throw new Error(result.error);
          }

          const { imageUrl, hash, originalWidth, originalHeight } = result;

          setOriginalImage(new File([], "history_image.png"), imageUrl, hash);
          setOriginalImageDimensions({ width: originalWidth, height: originalHeight });

          toast({
            title: "History Item Loaded",
            description: "Configuration restored. You can now generate new images or videos.",
          });

        } catch (error) {
          console.error('Failed to initialize from history:', error);
          toast({
            title: "Error",
            description: "Could not load image from history.",
            variant: "destructive"
          });
          throw error;
        } finally {
          setProcessing(false, null);
        }
      },

      initializeFromImageUrl: async (imageUrl: string) => {
        const { reset, setProcessing, setOriginalImage, setOriginalImageDimensions } = get();
        reset();
        setProcessing(true, 'upload');

        try {
          const result = await recreateStateFromImageUrl(imageUrl);

          if (!result.success) {
            throw new Error(result.error);
          }

          const { hash, originalWidth, originalHeight } = result;

          // Use a dummy File object as it's required by setOriginalImage, 
          // but the important parts are the URL and hash
          setOriginalImage(new File([], "generated_image.png"), imageUrl, hash);
          setOriginalImageDimensions({ width: originalWidth, height: originalHeight });

          toast({
            title: "Image Loaded into Creative Studio",
            description: "You can now begin a new creative workflow.",
          });

        } catch (error) {
          console.error('Failed to initialize from image URL:', error);
          toast({
            title: "Error Loading Image",
            description: "Could not load the selected image for editing.",
            variant: "destructive"
          });
          throw error;
        } finally {
          setProcessing(false, null);
        }
      },
    }),
    {
      name: 'image-preparation-store',
    }
  )
);

// Convenience selector to get the active image
export const useActivePreparationImage = () => {
  return useImageStore((state) => 
    state.activeVersionId ? state.versions[state.activeVersionId] : null
  );
};

// For development - access in console
if (typeof window !== 'undefined') {
  (window as any).imageStore = useImageStore;
}