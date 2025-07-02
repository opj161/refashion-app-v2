// src/stores/imageStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Server Actions
import { removeBackgroundAction } from "@/ai/actions/remove-background.action";
import { upscaleImageAction, faceDetailerAction } from "@/ai/actions/upscale-image.action";

// --- Types ---
export interface ImageVersion {
  id: string;
  dataUri: string;
  label: string;
  sourceVersionId: string;
  createdAt: number;
}

export interface ImageState {
  original: {
    file: File;
    dataUri: string;
    hash: string;
  } | null;
  versions: Record<string, ImageVersion>;
  activeVersionId: string | null;
  comparison: {
    left: string;
    right: string;
  } | null;
  isProcessing: boolean;
  processingStep: 'crop' | 'bg' | 'upscale' | 'face' | 'confirm' | null;
}

export interface ImageActions {
  // Synchronous actions
  setOriginalImage: (file: File, dataUri: string, hash: string) => void;
  addVersion: (version: Omit<ImageVersion, 'id' | 'createdAt'>) => string;
  setActiveVersion: (versionId: string) => void;
  setComparison: (comparison: { left: string; right: string } | null) => void;
  setProcessing: (isProcessing: boolean, step: ImageState['processingStep']) => void;
  reset: () => void;
  
  // Async actions
  removeBackground: () => Promise<void>;
  upscaleImage: () => Promise<void>;
  faceDetailer: () => Promise<void>;
}

export type ImageStore = ImageState & ImageActions;

// --- Helper Functions ---
const fileToDataUri = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const generateHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

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
      setOriginalImage: async (file: File, dataUri: string, hash: string) => {
        const originalVersion: ImageVersion = {
          id: 'original',
          dataUri,
          label: 'Original',
          sourceVersionId: '',
          createdAt: Date.now(),
        };

        set({
          original: { file, dataUri, hash },
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
          isProcessing: false,
          processingStep: null,
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
      removeBackground: async () => {
        const { activeVersionId, versions, original } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for background removal');
          return;
        }

        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'bg' }, false, 'removeBackground:start');

        try {
          const { savedPath } = await removeBackgroundAction(
            currentVersion.dataUri,
            original?.hash
          );

          // Add new version
          const newVersionId = get().addVersion({
            dataUri: savedPath,
            label: 'Background Removed',
            sourceVersionId: activeVersionId,
          });

          // Set up comparison
          get().setComparison({
            left: currentVersion.dataUri,
            right: savedPath,
          });

          console.log('Background removed successfully');
        } catch (error) {
          console.error('Background removal failed:', error);
          set({ isProcessing: false, processingStep: null }, false, 'removeBackground:error');
          throw error;
        }
      },

      upscaleImage: async () => {
        const { activeVersionId, versions, original } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for upscaling');
          return;
        }

        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'upscale' }, false, 'upscaleImage:start');

        try {
          const { savedPath } = await upscaleImageAction(
            currentVersion.dataUri,
            original?.hash,
            original?.file?.name
          );

          // Add new version
          const newVersionId = get().addVersion({
            dataUri: savedPath,
            label: 'Upscaled',
            sourceVersionId: activeVersionId,
          });

          // Set up comparison
          get().setComparison({
            left: currentVersion.dataUri,
            right: savedPath,
          });

          console.log('Image upscaled successfully');
        } catch (error) {
          console.error('Image upscaling failed:', error);
          set({ isProcessing: false, processingStep: null }, false, 'upscaleImage:error');
          throw error;
        }
      },

      faceDetailer: async () => {
        const { activeVersionId, versions, original } = get();
        if (!activeVersionId || !versions[activeVersionId]) {
          console.warn('No active version for face detailing');
          return;
        }

        const currentVersion = versions[activeVersionId];
        set({ isProcessing: true, processingStep: 'face' }, false, 'faceDetailer:start');

        try {
          const { savedPath } = await faceDetailerAction(
            currentVersion.dataUri,
            original?.hash,
            original?.file?.name
          );

          // Add new version
          const newVersionId = get().addVersion({
            dataUri: savedPath,
            label: 'Face Enhanced',
            sourceVersionId: activeVersionId,
          });

          // Set up comparison
          get().setComparison({
            left: currentVersion.dataUri,
            right: savedPath,
          });

          console.log('Face details enhanced successfully');
        } catch (error) {
          console.error('Face enhancement failed:', error);
          set({ isProcessing: false, processingStep: null }, false, 'faceDetailer:error');
          throw error;
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

// --- Utility Functions for Components ---
export const processFileAndSetOriginal = async (file: File): Promise<void> => {
  const dataUri = await fileToDataUri(file);
  const hash = await generateHash(file);
  useImageStore.getState().setOriginalImage(file, dataUri, hash);
};

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
