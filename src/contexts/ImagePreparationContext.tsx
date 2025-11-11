// src/contexts/ImagePreparationContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
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
  removeBackground: (username: string) => Promise<void>;
  upscaleImage: (username: string) => Promise<void>;
  faceDetailer: (username: string) => Promise<void>;
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
      const newHistory = state.historyIndex < state.versionHistory.length - 1
        ? [...state.versionHistory.slice(0, state.historyIndex + 1), version.id]
        : [...state.versionHistory, version.id];
      return {
        ...state,
        versions: { ...state.versions, [version.id]: version },
        activeVersionId: version.id,
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

  const activeImage = state.activeVersionId ? state.versions[state.activeVersionId] : null;
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.versionHistory.length - 1;

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

  const applyCrop = useCallback(async () => {
    if (!state.crop || !activeImage || !state.imageDimensions) {
      throw new Error('Cannot apply crop: Missing state.');
    }
    await withProcessing('crop', async () => {
      const { originalWidth, originalHeight } = state.imageDimensions!;
      const scaledCrop: ScaledPixelCrop = {
        x: Math.round((state.crop!.x / 100) * originalWidth), 
        y: Math.round((state.crop!.y / 100) * originalHeight),
        width: Math.round((state.crop!.width / 100) * originalWidth), 
        height: Math.round((state.crop!.height / 100) * originalHeight),
      };
      
      if (scaledCrop.width === 0 || scaledCrop.height === 0) {
        throw new Error("Invalid crop selection: width or height is zero.");
      }
      
      const result = await cropImage(activeImage.imageUrl, scaledCrop);
      if (!result.success) throw new Error(result.error);
      addVersion({ imageUrl: result.imageUrl, label: 'Cropped', sourceVersionId: activeImage.id, hash: result.hash });
      dispatch({ type: 'SET_ASPECT', payload: { aspect: undefined } });
    });
  }, [state.crop, activeImage, state.imageDimensions, withProcessing, addVersion]);

  // Generic async action handler
  const createAsyncAction = useCallback((
    label: string, 
    step: ImagePreparationState['processingStep'], 
    serverAction: (imageUrl: string, hash?: string) => Promise<{ savedPath: string; outputHash: string }>
  ) => async (username: string) => { // username parameter kept for signature compatibility
    if (!activeImage) throw new Error('No active image.');
    await withProcessing(step, async () => {
      const { savedPath, outputHash } = await serverAction(activeImage.imageUrl, activeImage.hash);
      addVersion({ imageUrl: savedPath, label, sourceVersionId: activeImage.id, hash: outputHash });
    });
  }, [activeImage, withProcessing, addVersion]);

  const removeBackground = useCallback(createAsyncAction('Background Removed', 'bg', removeBackgroundAction), [createAsyncAction]);
  const upscaleImage = useCallback(createAsyncAction('Upscaled', 'upscale', upscaleImageAction), [createAsyncAction]);
  const faceDetailer = useCallback(createAsyncAction('Face Enhanced', 'face', faceDetailerAction), [createAsyncAction]);
  
  // Handlers for rotate and flip
  const createTransformAction = useCallback((
    label: string, 
    step: ImagePreparationState['processingStep'], 
    serverAction: (imageUrl: string, arg: any) => Promise<any>,
    arg: any
  ) => async () => {
    if (!activeImage) throw new Error('No active image.');
    await withProcessing(step, async () => {
      const result = await serverAction(activeImage.imageUrl, arg);
      if (!result.success) throw new Error(result.error);
      addVersion({ imageUrl: result.imageUrl, label, sourceVersionId: activeImage.id, hash: result.hash });
      dispatch({ type: 'SET_DIMENSIONS', payload: { width: result.originalWidth, height: result.originalHeight } });
      toast({ title: "Transform Applied", description: `A new ${label.toLowerCase()} version has been created.` });
    });
  }, [activeImage, withProcessing, addVersion]);

  const rotateImageLeft = useCallback(() => createTransformAction('Rotated Left', 'rotate', rotateImage, -90)(), [createTransformAction]);
  const rotateImageRight = useCallback(() => createTransformAction('Rotated Right', 'rotate', rotateImage, 90)(), [createTransformAction]);
  const flipHorizontal = useCallback(() => createTransformAction('Flipped Horizontal', 'flip', flipImage, 'horizontal')(), [createTransformAction]);
  const flipVertical = useCallback(() => createTransformAction('Flipped Vertical', 'flip', flipImage, 'vertical')(), [createTransformAction]);

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
    state, dispatch, activeImage, canUndo, canRedo,
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
