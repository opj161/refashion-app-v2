// src/stores/imageStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';

// Server Actions
import { removeBackgroundAction } from "@/ai/actions/remove-background.action";
import { upscaleImageAction, faceDetailerAction } from "@/ai/actions/upscale-image.action";
import { prepareInitialImage, cropImage, fetchImageAndConvertToDataUri } from "@/actions/imageActions"; // Updated/new Server Actions

// Define the PixelCrop type for our use (matches the one expected by cropImage action)
interface ScaledPixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
    displayedWidth?: number; // NEW: Width of the <img> element
    displayedHeight?: number; // NEW: Height of the <img> element
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
  setImageDimensions: (dimensions: { originalWidth: number; originalHeight: number }) => void;
  setDisplayedImageDimensions: (dimensions: { width: number; height: number }) => void; // NEW
  
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
  imageDimensions: undefined,
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
      setImageDimensions: (dimensions) => set({ imageDimensions: dimensions }, false, 'setImageDimensions'),

      // NEW action to store displayed dimensions
      setDisplayedImageDimensions: (dimensions) => {
        set((state) => ({
          imageDimensions: state.imageDimensions
            ? { ...state.imageDimensions, displayedWidth: dimensions.width, displayedHeight: dimensions.height }
            : undefined,
        }), false, 'setDisplayedImageDimensions');
      },

      setAspect: (aspect) => {
        const { imageDimensions } = get();
        
        // If dimensions are already available (e.g., image is loaded and user changes aspect),
        // calculate the crop immediately.
        if (imageDimensions) {
          const { originalWidth, originalHeight } = imageDimensions;
          const newCrop = aspect
            ? centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, aspect, originalWidth, originalHeight),
                originalWidth,
                originalHeight
              )
            : undefined; // Reset to undefined for free crop
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
          get().setImageDimensions({ originalWidth, originalHeight });
          
          return { resized, originalWidth, originalHeight };
        } catch (error) {
          console.error('Upload failed in store:', error);
          throw error;
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'uploadOriginalImage:end');
        }
      },
      
      applyCrop: async () => {
        const { completedCrop, activeVersionId, versions, imageDimensions } = get();

        // 1. Guard against missing data (increased robustness)
        if (!completedCrop || !activeVersionId || !imageDimensions || !imageDimensions.displayedWidth || !imageDimensions.displayedHeight) {
          throw new Error('Cannot apply crop: Missing image dimensions or crop selection.');
        }

        const { originalWidth, originalHeight, displayedWidth, displayedHeight } = imageDimensions;
        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'crop' }, false, 'applyCrop:start');

        try {
          // 2. Calculate the scaling factors
          const scaleX = originalWidth / displayedWidth;
          const scaleY = originalHeight / displayedHeight;

          // 3. Create the scaled crop object with absolute pixel values for the original image
          const scaledPixelCrop: ScaledPixelCrop = {
            x: Math.round(completedCrop.x * scaleX),
            y: Math.round(completedCrop.y * scaleY),
            width: Math.round(completedCrop.width * scaleX),
            height: Math.round(completedCrop.height * scaleY),
          };

          // 4. Call the server action with the CORRECTLY scaled crop data
          const result = await cropImage(currentVersion.imageUrl, scaledPixelCrop);
          if (!result.success) {
            throw new Error(result.error);
          }

          // 5. Add the new version to the store (unchanged logic)
          get().addVersion({
            imageUrl: result.imageUrl,
            label: 'Cropped',
            sourceVersionId: activeVersionId,
            hash: result.hash,
          });
          get().setAspect(undefined);

        } catch (error) {
          console.error('Error applying crop:', error);
          throw error; // Re-throw to be caught by the component
        } finally {
          set({ isProcessing: false, processingStep: null }, false, 'applyCrop:end');
        }
      },

      loadImageFromUrl: async (imageUrl: string) => {
        set({ isProcessing: true, processingStep: 'upload' }, false, 'loadImageFromUrl:start');
        
        try {
          let imageDataUri: string;
          let imageHash: string;

          // Check if it's an external URL that needs server-side fetching
          if (imageUrl.startsWith('http')) {
            console.log('Fetching external image via server action:', imageUrl);
            const result = await fetchImageAndConvertToDataUri(imageUrl);
            if (!result.success) {
              throw new Error(result.error);
            }
            imageDataUri = result.dataUri;
            imageHash = result.hash;
          } else {
            // Assume it's a local relative URL, which can be used directly.
            // Create a simple hash from the local URL.
            console.log('Using local image URL directly:', imageUrl);
            imageDataUri = imageUrl;
            imageHash = btoa(imageUrl).replace(/[/+=]/g, '').substring(0, 16);
          }

          // Create a File object from the (potentially fetched) data URI
          const blob = dataUriToBlob(imageDataUri);
          const fileName = imageUrl.split('/').pop()?.split('?')[0] || 'loaded-image.jpg';
          const file = new File([blob], fileName, { type: blob.type });

          // Set the image in the store
          get().setOriginalImage(file, imageDataUri, imageHash);
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