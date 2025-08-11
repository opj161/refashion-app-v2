// src/stores/imageStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import type { PixelCrop as ScaledPixelCrop } from '@/lib/types';

// Server Actions
import { removeBackgroundAction } from "@/ai/actions/remove-background.action";
import { upscaleImageAction, faceDetailerAction } from "@/ai/actions/upscale-image.action";
import { prepareInitialImage, cropImage, fetchImageAndConvertToDataUri } from "@/actions/imageActions"; // Updated/new Server Actions

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
  // Crop-related state
  crop?: Crop;
  completedCrop?: PixelCrop;
  aspect?: number;
  imageDimensions?: { 
    originalWidth: number;
    originalHeight: number;
  };
}

export interface ImageActions {
  // Synchronous actions
  setOriginalImage: (file: File, imageUrl: string, hash: string) => void;
  addVersion: (version: Omit<ImageVersion, 'id' | 'createdAt'>) => string;
  setActiveVersion: (versionId: string) => void;
  setComparison: (comparison: { left: string; right: string } | null) => void;
  setProcessing: (isProcessing: boolean, step: ImageState['processingStep']) => void;
  reset: () => void;
  
  // Crop-related actions
  setCrop: (crop?: Crop) => void;
  setCompletedCrop: (crop?: PixelCrop) => void;
  setAspect: (aspect?: number) => void;
  setOriginalImageDimensions: (dimensions: { width: number; height: number }) => void;
  
  // Async actions
  removeBackground: (username: string) => Promise<void>;
  upscaleImage: (username: string) => Promise<void>;
  faceDetailer: (username: string) => Promise<void>;
  uploadOriginalImage: (file: File) => Promise<{ resized: boolean; originalWidth: number; originalHeight: number; }>;
  applyCrop: () => Promise<void>; // Updated to not require crop parameter
  loadImageFromUrl: (imageUrl: string) => Promise<void>;
}

export type ImageStore = ImageState & ImageActions;

// Helper function to convert data URI to Blob
function dataUriToBlob(dataURI: string): Blob {
  const [header, data] = dataURI.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

// --- Initial State ---
const initialState: ImageState = {
  original: null,
  versions: {},
  activeVersionId: null,
  comparison: null,
  isProcessing: false,
  processingStep: null,
  crop: undefined,
  completedCrop: undefined,
  aspect: undefined,
  imageDimensions: undefined
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
          comparison: null,
          // IMPORTANT: Reset dimensions and crop when switching images.
          imageDimensions: undefined,
          crop: undefined,
          completedCrop: undefined,
          // The currently selected aspect ratio is preserved as an "intent".
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

      // --- Crop Actions ---
      setCrop: (crop) => set({ crop }, false, 'setCrop'),
      setCompletedCrop: (completedCrop) => set({ completedCrop }, false, 'setCompletedCrop'),
      setOriginalImageDimensions: (dimensions) => set({ 
        imageDimensions: { 
          originalWidth: dimensions.width, 
          originalHeight: dimensions.height 
        } 
      }, false, 'setOriginalImageDimensions'),

      setAspect: (aspect) => {
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
          set({ aspect, crop: newCrop, completedCrop: undefined }, false, 'setAspect');
        } else {
          // If dimensions aren't ready, just set the desired aspect.
          // The onImageLoad handler in the component will take care of the initial crop calculation.
          set({ aspect, crop: undefined, completedCrop: undefined }, false, 'setAspect');
        }
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
        set({ isProcessing: true, processingStep: 'upload' }, false, 'uploadOriginalImage:start');
        try {
          const formData = new FormData();
          formData.append('file', file);

          const result = await prepareInitialImage(formData);

          if (!result.success) {
            throw new Error(result.error);
          }

          const { imageUrl, hash, resized, originalWidth, originalHeight } = result;

          // Set original image and dimensions
          get().setOriginalImage(file, imageUrl, hash);
          get().setOriginalImageDimensions({ width: originalWidth, height: originalHeight });
          
          return { resized, originalWidth, originalHeight };
        } catch (error) {
          console.error('Upload failed in store:', error);
          throw error;
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'uploadOriginalImage:end');
        }
      },
      
      applyCrop: async () => {
        const { crop, activeVersionId, versions, imageDimensions } = get();
        if (!crop || !activeVersionId || !imageDimensions) {
          throw new Error('Cannot apply crop: No active image, dimensions, or crop selection.');
        }

        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'crop' }, false, 'applyCrop:start');

        try {
          // Convert percentage-based crop to absolute pixels for the server
          const scaledPixelCrop: ScaledPixelCrop = {
            x: Math.round((crop.x / 100) * imageDimensions.originalWidth),
            y: Math.round((crop.y / 100) * imageDimensions.originalHeight),
            width: Math.round((crop.width / 100) * imageDimensions.originalWidth),
            height: Math.round((crop.height / 100) * imageDimensions.originalHeight),
          };

          // A width of 0 means the user likely just clicked the image without dragging.
          if (scaledPixelCrop.width === 0 || scaledPixelCrop.height === 0) {
            throw new Error("Invalid crop selection: width or height is zero.");
          }

          // Call server action with the correctly scaled pixel values
          const result = await cropImage(currentVersion.imageUrl, scaledPixelCrop);
          if (!result.success) {
            throw new Error(result.error);
          }
          
          get().addVersion({
            imageUrl: result.imageUrl,
            label: 'Cropped',
            sourceVersionId: activeVersionId,
            hash: result.hash,
          });

          // After cropping, reset aspect ratio to freeform for the new version
          get().setAspect(undefined);

        } catch (error) {
          console.error('Error applying crop:', error);
          throw error; // Re-throw to be caught in the component for a toast
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'applyCrop:end');
        }
      },

      loadImageFromUrl: async (imageUrl: string) => {
        set({ isProcessing: true, processingStep: 'upload' }, false, 'loadImageFromUrl:start');
        try {
          let file: File;
          let hash: string;
          let displayImageUrl = imageUrl;

          if (imageUrl.startsWith('http')) {
            // External URL: fetch via server action
            console.log('Fetching external image via server action:', imageUrl);
            const result = await fetchImageAndConvertToDataUri(imageUrl);
            if (!result.success) {
              throw new Error(result.error);
            }
            const blob = dataUriToBlob(result.dataUri);
            const fileName = imageUrl.split('/').pop()?.split('?')[0] || 'loaded-image.jpg';
            file = new File([blob], fileName, { type: blob.type });
            hash = result.hash;
            displayImageUrl = result.dataUri;
          } else if (imageUrl.startsWith('data:')) {
            // Base64 data URI
            const blob = dataUriToBlob(imageUrl);
            const fileName = 'pasted-image.png';
            file = new File([blob], fileName, { type: blob.type });
            const base64 = imageUrl.split(',')[1];
            hash = btoa(base64.substring(0, 32)).replace(/[/+=]/g, '');
            displayImageUrl = imageUrl;
          } else if (imageUrl.startsWith('/')) {
            // Local relative URL: fetch as blob
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`Failed to fetch local image: ${response.statusText}`);
            const blob = await response.blob();
            const fileName = imageUrl.split('/').pop() || 'local-image.png';
            file = new File([blob], fileName, { type: blob.type });
            hash = btoa(imageUrl).replace(/[/+=]/g, '').substring(0, 16);
            displayImageUrl = imageUrl;
          } else {
            throw new Error(`Unsupported image URL format: ${imageUrl}`);
          }

          get().setOriginalImage(file, displayImageUrl, hash);
          console.log('Successfully loaded image into store from URL:', imageUrl);
        } catch (error) {
          console.error('Error loading image from URL:', {
            url: imageUrl,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'loadImageFromUrl:end');
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