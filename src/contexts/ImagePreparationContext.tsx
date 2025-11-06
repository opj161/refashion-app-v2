// src/contexts/ImagePreparationContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
import { toast } from "@/hooks/use-toast";
import type { PixelCrop as ScaledPixelCrop, HistoryItem } from '@/lib/types';
import { getDisplayableImageUrl } from '@/lib/utils';

// Server Actions
import { removeBackgroundAction } from "@/ai/actions/remove-background.action";
import { upscaleImageAction, faceDetailerAction } from "@/ai/actions/upscale-image.action";
import { prepareInitialImage, cropImage, recreateStateFromHistoryAction, rotateImage, flipImage } from "@/actions/imageActions";

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
  versionHistory: string[]; // Array of version IDs in chronological order
  historyIndex: number; // Current position in history (-1 means no history)
  
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
  canUndo: boolean;
  canRedo: boolean;
  
  // Crop actions
  setCrop: (crop?: Crop) => void;
  setCompletedCrop: (crop?: PixelCrop) => void;
  setAspect: (aspect?: number) => void;
  setOriginalImageDimensions: (dimensions: { width: number; height: number }) => void;
  
  // Processing actions
  setProcessing: (isProcessing: boolean, step: ImagePreparationState['processingStep']) => void;
  setComparison: (comparison: { left: string; right: string } | null) => void;
  
  // Tab navigation actions (eliminates prop drilling)
  setCurrentTab: (tab: string) => void;
  
  // Async actions (these will call server actions but manage local state)
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
}

type ImagePreparationContextType = ImagePreparationState & ImagePreparationActions & {
  currentTab: string;
};

const ImagePreparationContext = createContext<ImagePreparationContextType | undefined>(undefined);

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
};

export const ImagePreparationProvider = ({ children }: { children: ReactNode }) => {
  // LIFT tab state from CreationHub into the provider to eliminate prop drilling
  const [currentTab, setCurrentTab] = useState<string>('image');
  const [state, setState] = useState<ImagePreparationState>(initialState);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<ImagePreparationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Core actions
  const setOriginalImage = useCallback((file: File, imageUrl: string, hash: string) => {
    const originalVersion: ImageVersion = {
      id: 'original',
      imageUrl,
      label: 'Original',
      sourceVersionId: '',
      createdAt: Date.now(),
      hash,
    };

    setState({
      ...initialState, // Reset everything
      original: { file, imageUrl, hash },
      versions: { original: originalVersion },
      activeVersionId: 'original',
      versionHistory: ['original'],
      historyIndex: 0,
    });
  }, []);

  const addVersion = useCallback((version: Omit<ImageVersion, 'id' | 'createdAt'>) => {
    const id = `${version.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    const newVersion: ImageVersion = {
      ...version,
      id,
      createdAt: Date.now(),
    };

    setState(prev => {
      // When adding a new version, clear any forward history if we're not at the end
      const newHistory = prev.historyIndex < prev.versionHistory.length - 1
        ? [...prev.versionHistory.slice(0, prev.historyIndex + 1), id]
        : [...prev.versionHistory, id];

      return {
        ...prev,
        versions: {
          ...prev.versions,
          [id]: newVersion,
        },
        activeVersionId: id,
        versionHistory: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });

    return id;
  }, []);

  const setActiveVersion = useCallback((versionId: string) => {
    updateState({
      activeVersionId: versionId,
      comparison: null,
      // Reset dimensions and crop when switching images
      imageDimensions: undefined,
      crop: undefined,
      completedCrop: undefined,
    });
  }, [updateState]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // Undo/Redo actions
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev; // Can't undo further
      
      const newIndex = prev.historyIndex - 1;
      const newActiveId = prev.versionHistory[newIndex];
      
      return {
        ...prev,
        activeVersionId: newActiveId,
        historyIndex: newIndex,
        // Reset crop/dimensions when undoing
        crop: undefined,
        completedCrop: undefined,
        imageDimensions: undefined,
        comparison: null,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.versionHistory.length - 1) return prev; // Can't redo further
      
      const newIndex = prev.historyIndex + 1;
      const newActiveId = prev.versionHistory[newIndex];
      
      return {
        ...prev,
        activeVersionId: newActiveId,
        historyIndex: newIndex,
        // Reset crop/dimensions when redoing
        crop: undefined,
        completedCrop: undefined,
        imageDimensions: undefined,
        comparison: null,
      };
    });
  }, []);

  // Derived state for undo/redo availability
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.versionHistory.length - 1;

  // Crop actions
  const setCrop = useCallback((crop?: Crop) => {
    updateState({ crop });
  }, [updateState]);

  const setCompletedCrop = useCallback((completedCrop?: PixelCrop) => {
    updateState({ completedCrop });
  }, [updateState]);

  const setOriginalImageDimensions = useCallback((dimensions: { width: number; height: number }) => {
    updateState({ 
      imageDimensions: { 
        originalWidth: dimensions.width, 
        originalHeight: dimensions.height 
      } 
    });
  }, [updateState]);

  const setAspect = useCallback((aspect?: number) => {
    // Import centerCrop and makeAspectCrop dynamically to avoid issues
    import('react-image-crop').then(({ centerCrop, makeAspectCrop }) => {
      setState(prev => {
        const { imageDimensions } = prev;
        
        if (imageDimensions?.originalWidth && imageDimensions?.originalHeight) {
          const { originalWidth: width, originalHeight: height } = imageDimensions;
          const newCrop = aspect
            ? centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
                width,
                height
              )
            : undefined;
          return { ...prev, aspect, crop: newCrop, completedCrop: undefined };
        } else {
          // If dimensions aren't ready, just set the desired aspect
          return { ...prev, aspect, crop: undefined, completedCrop: undefined };
        }
      });
    });
  }, []);

  // Processing actions
  const setProcessing = useCallback((isProcessing: boolean, step: ImagePreparationState['processingStep']) => {
    updateState({ isProcessing, processingStep: step });
  }, [updateState]);

  const setComparison = useCallback((comparison: { left: string; right: string } | null) => {
    updateState({ comparison });
  }, [updateState]);

  // Async actions - implemented to call the existing server actions
  const applyCrop = useCallback(async () => {
    const { crop, activeVersionId, versions, imageDimensions } = state;
    if (!crop || !activeVersionId || !imageDimensions) {
      throw new Error('Cannot apply crop: No active image, dimensions, or crop selection.');
    }

    const currentVersion = versions[activeVersionId];
    setProcessing(true, 'crop');

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
      
      addVersion({
        imageUrl: result.imageUrl,
        label: 'Cropped',
        sourceVersionId: activeVersionId,
        hash: result.hash,
      });

      // After cropping, reset aspect ratio to freeform for the new version
      setAspect(undefined);

    } catch (error) {
      console.error('Error applying crop:', error);
      throw error; // Re-throw to be caught in the component for a toast
    } finally {
      setProcessing(false, null);
    }
  }, [state, setProcessing, addVersion, setAspect]);

  const handleRotation = useCallback(async (angle: 90 | -90) => {
    const { activeVersionId, versions } = state;
    if (!activeVersionId || !versions[activeVersionId]) {
      toast({ title: 'No active image to rotate', variant: 'destructive' });
      return;
    }

    const currentVersion = versions[activeVersionId];
    setProcessing(true, 'rotate');

    try {
      const result = await rotateImage(currentVersion.imageUrl, angle);
      if (!result.success) {
        throw new Error(result.error);
      }

      const newVersionId = addVersion({
        imageUrl: result.imageUrl,
        label: angle === -90 ? 'Rotated Left' : 'Rotated Right',
        sourceVersionId: activeVersionId,
        hash: result.hash,
      });

      // Explicitly update dimensions in the context.
      // The canvas will reload via key change and its onLoad will also fire,
      // but this makes the state update more immediate and robust.
      setOriginalImageDimensions({ width: result.originalWidth, height: result.originalHeight });
      
      toast({ title: "Image Rotated", description: "A new rotated version has been created." });
    } catch (error) {
      console.error('Error rotating image:', error);
      toast({ title: "Rotation Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setProcessing(false, null);
    }
  }, [state, addVersion, setProcessing, setOriginalImageDimensions]);

  const rotateImageLeft = useCallback(() => handleRotation(-90), [handleRotation]);
  const rotateImageRight = useCallback(() => handleRotation(90), [handleRotation]);

  const handleFlip = useCallback(async (direction: 'horizontal' | 'vertical') => {
    const { activeVersionId, versions } = state;
    if (!activeVersionId || !versions[activeVersionId]) {
      toast({ title: 'No active image to flip', variant: 'destructive' });
      return;
    }

    const currentVersion = versions[activeVersionId];
    setProcessing(true, 'flip');

    try {
      const result = await flipImage(currentVersion.imageUrl, direction);
      if (!result.success) {
        throw new Error(result.error);
      }

      const label = direction === 'horizontal' ? 'Flipped Horizontal' : 'Flipped Vertical';
      const newVersionId = addVersion({
        imageUrl: result.imageUrl,
        label,
        sourceVersionId: activeVersionId,
        hash: result.hash,
      });

      // Update dimensions
      setOriginalImageDimensions({ width: result.originalWidth, height: result.originalHeight });
      
      toast({ title: "Image Flipped", description: `A new ${label.toLowerCase()} version has been created.` });
    } catch (error) {
      console.error('Error flipping image:', error);
      toast({ title: "Flip Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setProcessing(false, null);
    }
  }, [state, addVersion, setProcessing, setOriginalImageDimensions]);

  const flipHorizontal = useCallback(() => handleFlip('horizontal'), [handleFlip]);
  const flipVertical = useCallback(() => handleFlip('vertical'), [handleFlip]);

  const removeBackground = useCallback(async (username: string) => {
    const { activeVersionId, versions } = state;
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
  }, [state, setProcessing, addVersion]);

  const upscaleImage = useCallback(async (username: string) => {
    const { activeVersionId, versions } = state;
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
  }, [state, setProcessing, addVersion]);

  const faceDetailer = useCallback(async (username: string) => {
    const { activeVersionId, versions } = state;
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
  }, [state, setProcessing, addVersion]);

  const uploadOriginalImage = useCallback(async (file: File) => {
    setProcessing(true, 'upload');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await prepareInitialImage(formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      const { imageUrl, hash, resized, originalWidth, originalHeight } = result;

      // Set original image and dimensions
      setOriginalImage(file, imageUrl, hash);
      setOriginalImageDimensions({ width: originalWidth, height: originalHeight });
      
      return { resized, originalWidth, originalHeight };
    } catch (error) {
      console.error('Upload failed in context:', error);
      throw error;
    } finally {
      setProcessing(false, null);
    }
  }, [setProcessing, setOriginalImage, setOriginalImageDimensions]);

  const initializeFromHistory = useCallback(async (item: HistoryItem) => {
    reset(); // Reset current state
    setProcessing(true, 'upload'); // Use 'upload' step for consistent loading UI

    try {
      // Call the new, efficient server action. This replaces the entire
      // client-side fetch and re-upload process.
      const result = await recreateStateFromHistoryAction(item.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // The server action gives us everything we need directly.
      const { imageUrl, hash, originalWidth, originalHeight } = result;

      // Update the context state directly with the info from the existing file.
      // NOTE: We pass a dummy File object because the function signature requires it,
      // but its content is not used. The imageUrl and hash are what matter for this flow.
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
  }, [reset, setProcessing, setOriginalImage, setOriginalImageDimensions]);

  const value: ImagePreparationContextType = {
    // State
    ...state,
    currentTab, // PROVIDE tab state
    
    // Actions
    setOriginalImage,
    addVersion,
    setActiveVersion,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
    setCrop,
    setCompletedCrop,
    setAspect,
    setOriginalImageDimensions,
    setProcessing,
    setComparison,
    setCurrentTab, // PROVIDE tab action
    applyCrop,
    removeBackground,
    upscaleImage,
    faceDetailer,
    rotateImageLeft,
    rotateImageRight,
    flipHorizontal,
    flipVertical,
    uploadOriginalImage,
    initializeFromHistory,
  };

  return (
    <ImagePreparationContext.Provider value={value}>
      {children}
    </ImagePreparationContext.Provider>
  );
};

export const useImagePreparation = () => {
  const context = useContext(ImagePreparationContext);
  if (!context) {
    throw new Error('useImagePreparation must be used within an ImagePreparationProvider');
  }
  return context;
};

// Convenience hook to get the active image
export const useActivePreparationImage = () => {
  const { activeVersionId, versions } = useImagePreparation();
  return activeVersionId ? versions[activeVersionId] : null;
};