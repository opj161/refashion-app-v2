// src/contexts/ImagePreparationContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect, useOptimistic, startTransition } from 'react';
import { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { toast } from '@/hooks/use-toast';
import type { HistoryItem, PixelCrop as ScaledPixelCrop } from '@/lib/types';

// Import all relevant server actions
import {
  prepareInitialImage, cropImage, rotateImage, flipImage,
  recreateStateFromHistoryAction, recreateStateFromImageUrl
} from '@/actions/imageActions';
import { removeBackgroundAction } from '@/ai/actions/remove-background.action';
import { upscaleImageAction, faceDetailerAction } from '@/ai/actions/upscale-image.action';

// --- STATE AND ACTION TYPES ---

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
  isProcessing: boolean;
  processingStep: 'upload' | 'crop' | 'bg' | 'upscale' | 'face' | 'rotate' | 'flip' | 'confirm' | null;
  comparison: {
    left: string;
    right: string;
  } | null;
}

// Reducer actions for predictable state management
type Action =
  | { type: 'SET_ORIGINAL'; payload: { file: File; imageUrl: string; hash: string; width: number; height: number; } }
  | { type: 'ADD_VERSION'; payload: { version: ImageVersion } }
  | { type: 'SET_ACTIVE_VERSION'; payload: { versionId: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean; step: ImagePreparationState['processingStep'] } }
  | { type: 'SET_CROP'; payload: { crop?: Crop } }
  | { type: 'SET_COMPLETED_CROP'; payload: { crop?: PixelCrop } }
  | { type: 'SET_ASPECT'; payload: { aspect?: number } }
  | { type: 'SET_DIMENSIONS'; payload: { width: number; height: number } }
  | { type: 'SET_COMPARISON'; payload: { comparison: { left: string; right: string } | null } }
  | { type: 'RESET' };

// Context shape
interface ImagePreparationContextType {
  state: ImagePreparationState;
  dispatch: React.Dispatch<Action>;
  // Derived state
  activeImage: ImageVersion | null;
  canUndo: boolean;
  canRedo: boolean;
  // Async actions
  uploadOriginalImage: (file: File) => Promise<{ resized: boolean; originalWidth: number; originalHeight: number; }>;
  applyCrop: () => Promise<void>;
  removeBackground: () => Promise<void>;
  upscaleImage: () => Promise<void>;
  faceDetailer: () => Promise<void>;
  rotateImageLeft: () => Promise<void>;
  rotateImageRight: () => Promise<void>;
  flipHorizontal: () => Promise<void>;
  flipVertical: () => Promise<void>;
  reset: () => void;
}

// --- INITIAL STATE & REDUCER ---

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
};

function imagePreparationReducer(state: ImagePreparationState, action: Action): ImagePreparationState {
  switch (action.type) {
    case 'SET_ORIGINAL': {
      const { file, imageUrl, hash, width, height } = action.payload;
      const originalVersion: ImageVersion = {
        id: 'original', imageUrl, label: 'Original', sourceVersionId: '', createdAt: Date.now(), hash
      };
      return {
        ...initialState,
        original: { file, imageUrl, hash },
        versions: { original: originalVersion },
        activeVersionId: 'original',
        versionHistory: ['original'],
        historyIndex: 0,
        imageDimensions: { originalWidth: width, originalHeight: height },
      };
    }
    case 'ADD_VERSION': {
      const { version } = action.payload;
      
      // Ensure the version being added is marked as complete
      const finalVersion = { ...version, status: 'complete' as const };
      
      const newHistory = state.historyIndex < state.versionHistory.length - 1
        ? [...state.versionHistory.slice(0, state.historyIndex + 1), finalVersion.id]
        : [...state.versionHistory, finalVersion.id];
      return {
        ...state,
        versions: { ...state.versions, [finalVersion.id]: finalVersion },
        activeVersionId: finalVersion.id,
        versionHistory: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case 'SET_ACTIVE_VERSION': {
      return {
        ...state,
        activeVersionId: action.payload.versionId,
        crop: undefined, 
        completedCrop: undefined, 
        aspect: undefined, 
        imageDimensions: undefined,
        comparison: null,
      };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        historyIndex: newIndex,
        activeVersionId: state.versionHistory[newIndex],
        crop: undefined, 
        completedCrop: undefined, 
        aspect: undefined, 
        imageDimensions: undefined,
        comparison: null,
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.versionHistory.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        historyIndex: newIndex,
        activeVersionId: state.versionHistory[newIndex],
        crop: undefined, 
        completedCrop: undefined, 
        aspect: undefined, 
        imageDimensions: undefined,
        comparison: null,
      };
    }
    case 'SET_PROCESSING': return { ...state, ...action.payload };
    case 'SET_CROP': return { ...state, crop: action.payload.crop };
    case 'SET_COMPLETED_CROP': return { ...state, completedCrop: action.payload.crop };
    case 'SET_ASPECT': {
      const { aspect } = action.payload;
      const { imageDimensions } = state;
      
      if (imageDimensions?.originalWidth && imageDimensions?.originalHeight) {
        const { originalWidth: width, originalHeight: height } = imageDimensions;
        const newCrop = aspect
          ? centerCrop(
              makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
              width,
              height
            )
          : undefined;
        return { ...state, aspect, crop: newCrop, completedCrop: undefined };
      }
      return { ...state, aspect, crop: undefined, completedCrop: undefined };
    }
    case 'SET_DIMENSIONS': return { ...state, imageDimensions: { originalWidth: action.payload.width, originalHeight: action.payload.height } };
    case 'SET_COMPARISON': return { ...state, comparison: action.payload.comparison };
    case 'RESET': return initialState;
    default: return state;
  }
}

// --- CONTEXT PROVIDER & HOOK ---

const ImagePreparationContext = createContext<ImagePreparationContextType | undefined>(undefined);

interface ImagePreparationProviderProps {
  children: ReactNode;
  initialHistoryItem?: HistoryItem | null;
  initialImageUrl?: string | null;
  onInitializationComplete?: () => void;
}

export function ImagePreparationProvider({ 
  children, 
  initialHistoryItem, 
  initialImageUrl,
  onInitializationComplete 
}: ImagePreparationProviderProps) {
  const [state, dispatch] = useReducer(imagePreparationReducer, initialState);

  // Define the type for an optimistic action
  type OptimisticActionPayload = {
    label: string;
    sourceVersionId: string;
  };
  
  // Wrap the state from the reducer with useOptimistic
  const [optimisticState, addOptimisticAction] = useOptimistic(
    state,
    (currentState: ImagePreparationState, payload: OptimisticActionPayload): ImagePreparationState => {
      // This reducer runs instantly on the client when addOptimisticAction is called
      const tempId = `optimistic_${crypto.randomUUID()}`;
      
      const optimisticVersion: ImageVersion = {
        id: tempId,
        label: `${payload.label}...`,
        sourceVersionId: payload.sourceVersionId,
        imageUrl: currentState.versions[payload.sourceVersionId].imageUrl, // Use source as placeholder
        createdAt: Date.now(),
        hash: 'optimistic-hash',
        status: 'processing', // Mark this version as pending
      };

      // Return the new state with the optimistic version added
      return {
        ...currentState,
        versions: {
          ...currentState.versions,
          [tempId]: optimisticVersion,
        },
        // We do NOT modify versionHistory here. It should only track final, committed states.
      };
    }
  );

  // From now on, use optimisticState for rendering
  const activeImage = optimisticState.activeVersionId ? optimisticState.versions[optimisticState.activeVersionId] : null;
  const canUndo = optimisticState.historyIndex > 0;
  const canRedo = optimisticState.historyIndex < optimisticState.versionHistory.length - 1;

  // --- ASYNC ACTIONS ---
  // These wrap server actions and dispatch state updates

  const withProcessing = useCallback(async (step: ImagePreparationState['processingStep'], fn: () => Promise<void>) => {
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, step } });
    try {
      await fn();
    } catch (error) {
      console.error(`Error during processing step '${step}':`, error);
      toast({ title: `Error: ${step}`, description: (error as Error).message, variant: 'destructive' });
      // Re-throw to allow component-level handling if needed
      throw error;
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, step: null } });
    }
  }, []);

  const addVersion = useCallback((version: Omit<ImageVersion, 'id' | 'createdAt'>) => {
    const id = `${version.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    dispatch({ type: 'ADD_VERSION', payload: { version: { ...version, id, createdAt: Date.now() } } });
  }, []);

  // A generic wrapper for all optimistic image processing actions
  const createOptimisticAction = useCallback((
    label: string,
    serverAction: (...args: any[]) => Promise<{ imageUrl?: string; savedPath?: string; hash?: string; outputHash?: string; [key: string]: any; }>
  ) => {
    return async (...args: any[]) => {
      const activeVersionId = state.activeVersionId; // Use the "real" state here, not optimisticState
      if (!activeVersionId) {
        toast({ title: "No active image selected.", variant: "destructive" });
        return;
      }
      
      // Immediately add an optimistic update to the UI
      startTransition(() => {
        addOptimisticAction({ label, sourceVersionId: activeVersionId });
      });

      try {
        // Await the actual server action
        const result = await serverAction(...args);
        
        // --- STATE CONSISTENCY CHECK ---
        // Before dispatching the final result, check if the source version is still part of the committed state.
        // This prevents updating state if the user has undone, reset, or navigated away.
        if (!state.versions[activeVersionId]) {
          console.log(`[Optimistic Action] Action for '${label}' completed, but source version '${activeVersionId}' is no longer present. Aborting final state update.`);
          return; // Silently abort the update. The optimistic UI will have already disappeared.
        }
        // --- END STATE CONSISTENCY CHECK ---
        
        // On success, dispatch the final state to the reducer
        // Handle both old (savedPath/outputHash) and new (imageUrl/hash) return formats
        const finalImageUrl = result.savedPath || result.imageUrl;
        const finalHash = result.outputHash || result.hash;
        
        if (!finalImageUrl || !finalHash) {
          throw new Error('Server action did not return required imageUrl and hash');
        }
        
        dispatch({
          type: 'ADD_VERSION',
          payload: {
            version: {
              id: `${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
              imageUrl: finalImageUrl,
              label,
              sourceVersionId: activeVersionId,
              hash: finalHash,
              createdAt: Date.now(),
              status: 'complete',
            },
          },
        });

        // Handle dimension changes for transforms like rotate/crop
        if (result.originalWidth && result.originalHeight) {
          dispatch({ type: 'SET_DIMENSIONS', payload: { width: result.originalWidth, height: result.originalHeight } });
        }
        
        toast({ title: `${label} applied successfully.` });

      } catch (error) {
        // On failure, React automatically reverts the optimistic update.
        // We just need to show a toast.
        console.error(`Optimistic action for '${label}' failed:`, error);
        toast({
          title: `${label} Failed`,
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    };
  }, [state, addOptimisticAction]);

  const uploadOriginalImage = useCallback(async (file: File) => {
    let resultData = { resized: false, originalWidth: 0, originalHeight: 0 };
    await withProcessing('upload', async () => {
      const formData = new FormData();
      formData.append('file', file);
      const result = await prepareInitialImage(formData);
      if (!result.success) throw new Error(result.error);
      
      dispatch({ type: 'SET_ORIGINAL', payload: { file, imageUrl: result.imageUrl, hash: result.hash, width: result.originalWidth, height: result.originalHeight } });
      resultData = { resized: result.resized, originalWidth: result.originalWidth, originalHeight: result.originalHeight };
    });
    return resultData;
  }, [withProcessing]);

  // Special handling for applyCrop as it uses local state (crop region)
  const applyCrop = useCallback(async () => {
    const { crop, imageDimensions, activeVersionId: sourceVersionId } = optimisticState;
    if (!crop || !sourceVersionId || !imageDimensions) {
      toast({ title: 'Cannot apply crop: Missing state.', variant: 'destructive' });
      return;
    }
    const sourceImage = optimisticState.versions[sourceVersionId];

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
    
    // This follows the same optimistic pattern manually
    startTransition(() => {
      addOptimisticAction({ label: 'Cropping', sourceVersionId });
    });

    try {
      const result = await cropImage(sourceImage.imageUrl, scaledCrop);
      if (!result.success) throw new Error(result.error);
      
      // Check state consistency
      if (!state.versions[sourceVersionId]) {
        console.log('[Optimistic Action] Crop completed, but source version is no longer present. Aborting final state update.');
        return;
      }
      
      dispatch({
        type: 'ADD_VERSION',
        payload: {
          version: {
            id: `cropped_${Date.now()}`,
            imageUrl: result.imageUrl,
            label: 'Cropped',
            sourceVersionId: sourceVersionId,
            hash: result.hash,
            createdAt: Date.now(),
            status: 'complete',
          },
        },
      });

      // After cropping, reset the aspect ratio selection
      dispatch({ type: 'SET_ASPECT', payload: { aspect: undefined } });
      toast({ title: "Crop Applied", description: "A new cropped version has been created." });

    } catch (error) {
      console.error('Optimistic crop failed:', error);
      toast({ title: "Cropping Failed", description: (error as Error).message, variant: "destructive" });
    }
  }, [optimisticState, state, addOptimisticAction]);

  // Refactor all async actions using the generic wrapper
  const removeBackground = createOptimisticAction(
    'Background Removed',
    () => {
      if (!activeImage) throw new Error('No active image.');
      return removeBackgroundAction(activeImage.imageUrl, activeImage.hash);
    }
  );
  
  const upscaleImage = createOptimisticAction(
    'Upscaled',
    () => {
      if (!activeImage) throw new Error('No active image.');
      return upscaleImageAction(activeImage.imageUrl, activeImage.hash);
    }
  );
  
  const faceDetailer = createOptimisticAction(
    'Face Enhanced',
    () => {
      if (!activeImage) throw new Error('No active image.');
      return faceDetailerAction(activeImage.imageUrl, activeImage.hash);
    }
  );

  const rotateImageLeft = createOptimisticAction(
    'Rotated Left',
    () => {
      if (!activeImage) throw new Error('No active image.');
      return rotateImage(activeImage.imageUrl, -90);
    }
  );

  const rotateImageRight = createOptimisticAction(
    'Rotated Right',
    () => {
      if (!activeImage) throw new Error('No active image.');
      return rotateImage(activeImage.imageUrl, 90);
    }
  );

  const flipHorizontal = createOptimisticAction(
    'Flipped Horizontal',
    () => {
      if (!activeImage) throw new Error('No active image.');
      return flipImage(activeImage.imageUrl, 'horizontal');
    }
  );

  const flipVertical = createOptimisticAction(
    'Flipped Vertical',
    () => {
      if (!activeImage) throw new Error('No active image.');
      return flipImage(activeImage.imageUrl, 'vertical');
    }
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Effect to handle initialization from props
  useEffect(() => {
    if (!initialHistoryItem && !initialImageUrl) return;

    const initialize = async () => {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, step: 'upload' } });
      try {
        let result;
        if (initialHistoryItem) {
          result = await recreateStateFromHistoryAction(initialHistoryItem.id);
          if (!result.success) throw new Error(result.error);

          dispatch({
            type: 'SET_ORIGINAL',
            payload: {
              file: new File([], 'history_image.png'),
              imageUrl: result.imageUrl,
              hash: result.hash,
              width: result.originalWidth,
              height: result.originalHeight,
            }
          });

          toast({
            title: "History Item Loaded",
            description: "Configuration restored. You can now generate new images or videos.",
          });
        } else if (initialImageUrl) {
          result = await recreateStateFromImageUrl(initialImageUrl);
          if (!result.success) throw new Error(result.error);

          dispatch({
            type: 'SET_ORIGINAL',
            payload: {
              file: new File([], 'generated_image.png'),
              imageUrl: initialImageUrl,
              hash: result.hash,
              width: result.originalWidth,
              height: result.originalHeight,
            }
          });

          toast({
            title: "Image Loaded into Creative Studio",
            description: "You can now begin a new creative workflow.",
          });
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        toast({
          title: "Error",
          description: "Could not load image.",
          variant: "destructive"
        });
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, step: null } });
        onInitializationComplete?.();
      }
    };

    initialize();
  }, [initialHistoryItem, initialImageUrl, onInitializationComplete]);

  const value: ImagePreparationContextType = {
    state: optimisticState, // IMPORTANT: Pass optimistic state to all consumers
    dispatch,
    activeImage, // Derived from optimisticState
    canUndo, // Derived from optimisticState
    canRedo, // Derived from optimisticState
    uploadOriginalImage, applyCrop, removeBackground, upscaleImage, faceDetailer,
    rotateImageLeft, rotateImageRight, flipHorizontal, flipVertical, reset
  };

  return <ImagePreparationContext.Provider value={value}>{children}</ImagePreparationContext.Provider>;
}

export const useImagePreparation = (): ImagePreparationContextType => {
  const context = useContext(ImagePreparationContext);
  if (context === undefined) {
    throw new Error('useImagePreparation must be used within an ImagePreparationProvider');
  }
  return context;
};

// Convenience hook to get just the active image
export const useActivePreparationImage = () => {
  const { activeImage } = useImagePreparation();
  return activeImage;
};
