// src/stores/imageStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Server Actions
import { removeBackgroundAction } from "@/ai/actions/remove-background.action";
import { upscaleImageAction, faceDetailerAction } from "@/ai/actions/upscale-image.action";
import { prepareInitialImage, cropImage } from "@/actions/imageActions"; // Updated/new Server Actions
import type { PixelCrop } from 'react-image-crop';

// --- Types ---
export interface ImageVersion {
  id: string;
  imageUrl: string; // Changed from dataUri
  label: string;
  sourceVersionId: string;
  createdAt: number;
  hash: string;
}

export interface ImageState {
  original: {
    file: File;
    imageUrl: string; // Changed from dataUri
    hash: string;
  } | null;
  versions: Record<string, ImageVersion>;
  activeVersionId: string | null;
  comparison: {
    left: string;
    right: string;
  } | null;
  isProcessing: boolean;
  processingStep: 'upload' | 'crop' | 'bg' | 'upscale' | 'face' | 'confirm' | null;
}

export interface ImageActions {
  // Synchronous actions
  setOriginalImage: (file: File, imageUrl: string, hash: string) => void;
  addVersion: (version: Omit<ImageVersion, 'id' | 'createdAt'>) => string;
  setActiveVersion: (versionId: string) => void;
  setComparison: (comparison: { left: string; right: string } | null) => void;
  setProcessing: (isProcessing: boolean, step: ImageState['processingStep']) => void;
  reset: () => void;
  
  // Async actions
  removeBackground: (username: string) => Promise<void>;
  upscaleImage: (username: string) => Promise<void>;
  faceDetailer: (username: string) => Promise<void>;
  uploadOriginalImage: (file: File) => Promise<{ resized: boolean; originalWidth: number; originalHeight: number; }>;
  applyCrop: (crop: PixelCrop) => Promise<void>;
}

export type ImageStore = ImageState & ImageActions;


// --- Initial State ---
const initialState: ImageState = {
  original: null,
  versions: {},
  activeVersionId: null,
  comparison: null,
  isProcessing: false,
  processingStep: null,
};

// --- Store Implementation ---
export const useImageStore = create<ImageStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // --- Synchronous Actions ---
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
          original: { file, imageUrl, hash },
          versions: { original: originalVersion },
          activeVersionId: 'original',
          comparison: null,
          isProcessing: false,
          processingStep: null,
        }, false, 'setOriginalImage');
      },

      addVersion: (version: Omit<ImageVersion, 'id' | 'createdAt'>) => {
        const id = `${version.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const newVersion: ImageVersion = {
          ...version,
          id,
          createdAt: Date.now(),
        };

        set((state) => ({
          versions: {
            ...state.versions,
            [id]: newVersion,
          },
          activeVersionId: id,
        }), false, 'addVersion');

        return id;
      },

      setActiveVersion: (versionId: string) => {
        set({
          activeVersionId: versionId,
          comparison: null, // Clear comparison when switching versions
        }, false, 'setActiveVersion');
      },

      setComparison: (comparison: { left: string; right: string } | null) => {
        set({ comparison }, false, 'setComparison');
      },

      setProcessing: (isProcessing: boolean, step: ImageState['processingStep']) => {
        set({ isProcessing, processingStep: step }, false, 'setProcessing');
      },

      reset: () => {
        set(initialState, false, 'reset');
      },

      // --- Async Actions ---
      removeBackground: async (username: string) => {
        const { activeVersionId, versions } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for background removal');
          return;
        }
        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'bg' }, false, 'removeBackground:start');

        try {
          const { savedPath, outputHash } = await removeBackgroundAction(currentVersion.imageUrl, currentVersion.hash);
          get().addVersion({
            imageUrl: savedPath,
            label: 'Background Removed',
            sourceVersionId: activeVersionId,
            hash: outputHash,
          });
        } catch (error) {
          console.error('Error removing background:', error);
          throw error;
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'removeBackground:end');
        }
      },
      upscaleImage: async (username: string) => {
        const { activeVersionId, versions, original } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for upscaling');
          return;
        }
        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'upscale' }, false, 'upscaleImage:start');

        try {
          const { savedPath, outputHash } = await upscaleImageAction(currentVersion.imageUrl, currentVersion.hash);
          get().addVersion({
            imageUrl: savedPath,
            label: 'Upscaled',
            sourceVersionId: activeVersionId,
            hash: outputHash,
          });
        } catch (error) {
          console.error('Error upscaling image:', error);
          throw error;
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'upscaleImage:end');
        }
      },
      faceDetailer: async (username: string) => {
        const { activeVersionId, versions, original } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for face detailer');
          return;
        }
        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'face' }, false, 'faceDetailer:start');

        try {
          const { savedPath, outputHash } = await faceDetailerAction(currentVersion.imageUrl, currentVersion.hash);
          get().addVersion({
            imageUrl: savedPath,
            label: 'Face Enhanced',
            sourceVersionId: activeVersionId,
            hash: outputHash,
          });
        } catch (error) {
          console.error('Error enhancing face details:', error);
          throw error;
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'faceDetailer:end');
        }
      },

      uploadOriginalImage: async (file: File) => {
        get().setProcessing(true, 'upload');
        try {
          const formData = new FormData();
          formData.append('file', file);

          const result = await prepareInitialImage(formData);

          if (!result.success) {
            throw new Error(result.error);
          }

          const { imageUrl, hash, resized, originalWidth, originalHeight } = result;

          // We still need the file object for potential future use, but state holds the URL
          get().setOriginalImage(file, imageUrl, hash);
          return { resized, originalWidth, originalHeight };
        } catch (error) {
          console.error('Upload and resize failed in store action:', error);
          get().setProcessing(false, null);
          throw error;
        } finally {
          // On successful upload, we are ready to crop, not idle.
          get().setProcessing(false, 'crop');
        }
      },
      
      applyCrop: async (crop: PixelCrop) => {
        const { activeVersionId, versions } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version to crop');
          return;
        }
        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'crop' }, false, 'applyCrop:start');

        try {
          const result = await cropImage(currentVersion.imageUrl, crop);
          if (!result.success) {
            throw new Error(result.error);
          }

          get().addVersion({
            imageUrl: result.imageUrl,
            label: 'Cropped',
            sourceVersionId: activeVersionId,
            hash: result.hash,
          });

        } catch (error) {
          console.error('Error applying crop:', error);
          throw error;
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'applyCrop:end');
        }
      },
    }),
    {
      name: 'image-store', // This will show up in Redux DevTools
    }
  )
);

// --- Convenience Selectors ---
export const useActiveImage = () => useImageStore((state) => {
  const { activeVersionId, versions } = state;
  return activeVersionId ? versions[activeVersionId] : null;
});

export const useImageProcessingState = () => useImageStore((state) => ({
  isProcessing: state.isProcessing,
  processingStep: state.processingStep,
}));

// --- Debug Helpers ---
export const getStoreSnapshot = () => {
  const state = useImageStore.getState();
  return {
    hasOriginal: !!state.original,
    versionCount: Object.keys(state.versions).length,
    activeVersionId: state.activeVersionId,
    isProcessing: state.isProcessing,
    processingStep: state.processingStep,
    hasComparison: !!state.comparison,
  };
};

// For development - access in console as window.imageStore
if (typeof window !== 'undefined') {
  (window as any).imageStore = useImageStore;
  (window as any).imageStoreSnapshot = getStoreSnapshot;
}