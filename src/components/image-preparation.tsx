// src/components/image-preparation.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useReducer } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Custom Components for Phase 2
import ImageVersionStack from "./ImageVersionStack";
import ComparisonSlider from "./ComparisonSlider";

// Server Actions
import { removeBackgroundAction, isBackgroundRemovalAvailable as checkBgAvailable } from "@/ai/actions/remove-background";
import { upscaleImageAction, isUpscaleServiceAvailable as checkUpscaleAvailable, faceDetailerAction, isFaceDetailerAvailable as checkFaceDetailerAvailable } from "@/ai/actions/upscale-image";

// Utilities & Icons
import { getDisplayableImageUrl } from "@/lib/utils";
import {
  UploadCloud, X, Crop as CropIcon, Square, RectangleVertical, RectangleHorizontal,
  Loader2, CheckCircle, Wand2, Sparkles, RefreshCw, UserCheck, Trash2
} from "lucide-react";

// --- Constants & Types ---
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'];
const SERVER_IMAGE_PATH_PREFIX = '/uploads/';

interface ImagePreparationProps {
  onImageReady: (imageDataUri: string | null) => void;
  sourceImageUrl?: string | null;
  preparationMode: 'image' | 'video';
}

type ProcessingStep = 'crop' | 'bg' | 'upscale' | 'face' | 'confirm' | null;

// --- New State Management Types for Phase 1 ---
interface ImageVersion {
  id: string;
  dataUri: string;
  label: string;
  sourceVersionId: string;
  createdAt: number;
}

interface ImageState {
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
  processingStep: ProcessingStep;
}

type ImageAction = 
  | { type: 'SET_ORIGINAL'; payload: { file: File; dataUri: string; hash: string; } }
  | { type: 'ADD_VERSION'; payload: ImageVersion }
  | { type: 'SET_ACTIVE_VERSION'; payload: { versionId: string } }
  | { type: 'SET_COMPARISON'; payload: { left: string; right: string } | null }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean; step: ProcessingStep } }
  | { type: 'RESET' };

// Initial state for the reducer
const initialImageState: ImageState = {
  original: null,
  versions: {},
  activeVersionId: null,
  comparison: null,
  isProcessing: false,
  processingStep: null,
};

// Image state reducer function
function imageReducer(state: ImageState, action: ImageAction): ImageState {
  switch (action.type) {
    case 'SET_ORIGINAL': {
      const { file, dataUri, hash } = action.payload;
      const originalVersion: ImageVersion = {
        id: 'original',
        dataUri,
        label: 'Original',
        sourceVersionId: '',
        createdAt: Date.now(),
      };
      
      return {
        ...state,
        original: { file, dataUri, hash },
        versions: { original: originalVersion },
        activeVersionId: 'original',
        comparison: null,
        isProcessing: false,
        processingStep: null,
      };
    }
    
    case 'ADD_VERSION': {
      const newVersion = action.payload;
      return {
        ...state,
        versions: {
          ...state.versions,
          [newVersion.id]: newVersion,
        },
        activeVersionId: newVersion.id,
        isProcessing: false,
        processingStep: null,
      };
    }
    
    case 'SET_ACTIVE_VERSION': {
      return {
        ...state,
        activeVersionId: action.payload.versionId,
        comparison: null, // Clear comparison when switching versions
      };
    }
    
    case 'SET_COMPARISON': {
      return {
        ...state,
        comparison: action.payload,
      };
    }
    
    case 'SET_PROCESSING': {
      return {
        ...state,
        isProcessing: action.payload.isProcessing,
        processingStep: action.payload.step,
      };
    }
    
    case 'RESET': {
      return initialImageState;
    }
    
    default:
      return state;
  }
}

// --- Helper Functions ---
async function getCroppedImgDataUrl(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

const fileToDataUri = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const getProcessingMessage = (step: ProcessingStep): string => {
  switch (step) {
    case 'crop': return 'Cropping...';
    case 'bg': return 'Removing Background...';
    case 'upscale': return 'Upscaling...';
    case 'face': return 'Improving Face Details...';
    case 'confirm': return 'Preparing...';
    default: return 'Processing...';
  }
};

// --- Main Component ---
export default function ImagePreparation({ onImageReady, sourceImageUrl, preparationMode }: ImagePreparationProps) {
  const { toast } = useToast();

  // --- New State Management with useReducer (Phase 1) ---
  const [imageState, dispatch] = useReducer(imageReducer, initialImageState);
  const {
    original,
    versions,
    activeVersionId,
    comparison,
    isProcessing,
    processingStep,
  } = imageState;

  // --- Service Availability State ---
  const [isBgRemovalAvailable, setIsBgRemovalAvailable] = useState(false);
  const [isUpscalingAvailable, setIsUpscalingAvailable] = useState(false);
  const [isFaceDetailerAvailable, setIsFaceDetailerAvailable] = useState(false);

  // --- Cropping State (still using useState for cropping UI) ---
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(3 / 4);
  
  // --- UI State ---
  const dragCounter = useRef(0);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Computed values from new state ---
  const currentVersion = activeVersionId ? versions[activeVersionId] : null;
  const workingImageDataUri = currentVersion?.dataUri || null;
  
  // --- Phase 2: Improved computed values using version-based logic ---
  const isBgRemoved = activeVersionId ? versions[activeVersionId]?.label.includes('Background Removed') : false;
  const isUpscaled = activeVersionId ? versions[activeVersionId]?.label.includes('Upscaled') : false;
  const isFaceDetailed = activeVersionId ? versions[activeVersionId]?.label.includes('Face Enhanced') : false;
  const isConfirmed = false; // Will be managed differently in future phases
  
  // --- Phase 2: New handlers for version management ---
  const handleSetActiveVersion = useCallback((versionId: string) => {
    dispatch({ type: 'SET_ACTIVE_VERSION', payload: { versionId } });
  }, []);
  
  const handleShowComparison = useCallback((versionId: string, sourceVersionId: string) => {
    const version = versions[versionId];
    const sourceVersion = versions[sourceVersionId];
    
    if (version && sourceVersion) {
      dispatch({
        type: 'SET_COMPARISON',
        payload: { left: sourceVersion.dataUri, right: version.dataUri }
      });
    }
  }, [versions]);
  
  const handleCloseComparison = useCallback(() => {
    dispatch({ type: 'SET_COMPARISON', payload: null });
  }, []);

  // --- Recalculation Logic ---
  const recalculateCrop = useCallback((aspectRatio: number | undefined, imageElement: HTMLImageElement | null) => {
    if (!imageElement) return;

    const { naturalWidth: imgWidth, naturalHeight: imgHeight } = imageElement;

    if (aspectRatio) {
      // Check if a full-height crop with the target aspect ratio fits within the image width
      const requiredWidthForFullHeight = imgHeight * aspectRatio;
      if (requiredWidthForFullHeight <= imgWidth) {
        // It fits, so use full height
        const newCrop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              height: 100,
            },
            aspectRatio,
            imgWidth,
            imgHeight
          ),
          imgWidth,
          imgHeight
        );
        setCrop(newCrop as Crop);
        // Also set the completedCrop so the "Apply" button is enabled immediately
        setCompletedCrop({
          unit: 'px',
          x: (newCrop.x / 100) * imgWidth,
          y: (newCrop.y / 100) * imgHeight,
          width: (newCrop.width / 100) * imgWidth,
          height: (newCrop.height / 100) * imgHeight,
        });
      } else {
        // It doesn't fit (image is too narrow/tall), so use full width instead
        const newCrop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 100,
            },
            aspectRatio,
            imgWidth,
            imgHeight
          ),
          imgWidth,
          imgHeight
        );
        setCrop(newCrop as Crop);
        // Also set the completedCrop so the "Apply" button is enabled immediately
        setCompletedCrop({
          unit: 'px',
          x: (newCrop.x / 100) * imgWidth,
          y: (newCrop.y / 100) * imgHeight,
          width: (newCrop.width / 100) * imgWidth,
          height: (newCrop.height / 100) * imgHeight,
        });
      }
    } else {
      // Fallback for "free" aspect ratio
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          imgWidth / imgHeight,
          imgWidth,
          imgHeight
        ),
        imgWidth,
        imgHeight
      );
      setCrop(newCrop as Crop);
      // Also set the completedCrop so the "Apply" button is enabled immediately
      setCompletedCrop({
        unit: 'px',
        x: (newCrop.x / 100) * imgWidth,
        y: (newCrop.y / 100) * imgHeight,
        width: (newCrop.width / 100) * imgWidth,
        height: (newCrop.height / 100) * imgHeight,
      });
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    checkBgAvailable().then(setIsBgRemovalAvailable);
    checkUpscaleAvailable().then(setIsUpscalingAvailable);
    checkFaceDetailerAvailable().then(setIsFaceDetailerAvailable);
  }, []);

  // Load image from sourceImageUrl when provided (for history restoration)
  useEffect(() => {
    if (sourceImageUrl && !original) {
      const loadImageFromUrl = async () => {
        try {
          const displayUrl = getDisplayableImageUrl(sourceImageUrl);
          if (!displayUrl) {
            console.warn('Could not generate displayable URL for:', sourceImageUrl);
            return;
          }

          const response = await fetch(displayUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }

          const blob = await response.blob();
          const dataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Create a fake File object for consistency
          const file = new File([blob], 'loaded-image.jpg', { type: blob.type });
          
          // Dispatch SET_ORIGINAL action with the loaded image data
          dispatch({ 
            type: 'SET_ORIGINAL', 
            payload: { file, dataUri, hash: '' } // Note: No hash for loaded images
          });
          
          toast({ 
            title: "Image Loaded", 
            description: "Original image loaded from history." 
          });
        } catch (error) {
          console.error('Error loading image from sourceImageUrl:', error);
          toast({ 
            title: "Load Error", 
            description: "Failed to load the original image from history.", 
            variant: "destructive" 
          });
        }
      };

      loadImageFromUrl();
    }
  }, [sourceImageUrl, original, toast]);

  // Recalculate crop when aspect ratio changes
  useEffect(() => {
    if (imgRef) {
      recalculateCrop(aspect, imgRef);
    }
  }, [aspect, imgRef, recalculateCrop]);

  // --- Handlers ---
  const resetAllState = useCallback(() => {
    dispatch({ type: 'RESET' });
    setCrop(undefined);
    setCompletedCrop(undefined);
    setImgRef(null);
    onImageReady(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onImageReady]);

  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES || !ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ title: "Invalid File", description: `File must be a valid image under ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
      return;
    }
    resetAllState();

    // Calculate hash first
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Then process the image data
    const dataUri = await fileToDataUri(file);
    
    // Dispatch SET_ORIGINAL action with the new image data
    dispatch({ 
      type: 'SET_ORIGINAL', 
      payload: { file, dataUri, hash: hashHex } 
    });
  }, [resetAllState, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0]);

  const handleDragAction = useCallback((e: React.DragEvent, action: 'enter' | 'leave' | 'over' | 'drop') => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    if (action === 'enter') dragCounter.current++;
    if (action === 'leave') dragCounter.current--;
    setIsDraggingOverPage(dragCounter.current > 0);

    if (action === 'drop' && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile, isProcessing]);

  useEffect(() => {
    const enter = (e: DragEvent) => handleDragAction(e as any, 'enter');
    const leave = (e: DragEvent) => handleDragAction(e as any, 'leave');
    const over = (e: DragEvent) => handleDragAction(e as any, 'over');
    const drop = (e: DragEvent) => handleDragAction(e as any, 'drop');
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, [handleDragAction]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgRef(e.currentTarget);
    recalculateCrop(aspect, e.currentTarget);
  }, [aspect, recalculateCrop]);

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef || !activeVersionId) return;
    
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, step: 'crop' } });
    
    try {
      const croppedDataUrl = await getCroppedImgDataUrl(imgRef, completedCrop);
      
      // Create a new version for the cropped image
      const newVersion: ImageVersion = {
        id: `crop_${Date.now()}`,
        dataUri: croppedDataUrl,
        label: 'Cropped',
        sourceVersionId: activeVersionId,
        createdAt: Date.now(),
      };
      
      dispatch({ type: 'ADD_VERSION', payload: newVersion });
      toast({ title: "Crop Applied" });
    } catch (e) {
      toast({ title: "Cropping Failed", variant: "destructive" });
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, step: null } });
    }
  }, [completedCrop, imgRef, activeVersionId, toast]);

  const handleToggleBackgroundRemoval = useCallback(async (checked: boolean) => {
    if (checked) {
      if (!workingImageDataUri || !activeVersionId) return;
      
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, step: 'bg' } });
      
      try {
        const { savedPath } = await removeBackgroundAction(workingImageDataUri, original?.hash ?? undefined);
        
        // Create a new version for the background-removed image
        const newVersion: ImageVersion = {
          id: `bg_removed_${Date.now()}`,
          dataUri: savedPath,
          label: 'Background Removed',
          sourceVersionId: activeVersionId,
          createdAt: Date.now(),
        };
        
        dispatch({ type: 'ADD_VERSION', payload: newVersion });
        
        // Set up comparison slider
        dispatch({ 
          type: 'SET_COMPARISON', 
          payload: { left: workingImageDataUri, right: savedPath } 
        });
        
        toast({ title: "Background Removed" });
      } catch (e) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, step: null } });
      }
    } else {
      // Phase 2: Find and switch to a version without background removal
      const currentVersionId = activeVersionId;
      const currentVersion = currentVersionId ? versions[currentVersionId] : null;
      
      if (currentVersion?.sourceVersionId) {
        // Switch back to the source version
        handleSetActiveVersion(currentVersion.sourceVersionId);
        toast({ title: "Switched to Previous Version", description: "Background restoration isn't needed - just select a different version." });
      } else {
        toast({ title: "Info", description: "Use the version history below to switch between different processed versions." });
      }
    }
  }, [workingImageDataUri, activeVersionId, original?.hash, versions, handleSetActiveVersion, toast]);

  const handleUpscaleImage = useCallback(async () => {
    if (!workingImageDataUri || !activeVersionId) return;
    
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, step: 'upscale' } });
    
    try {
      const { savedPath } = await upscaleImageAction(workingImageDataUri, original?.hash ?? undefined, original?.file?.name);
      
      // Create a new version for the upscaled image
      const newVersion: ImageVersion = {
        id: `upscaled_${Date.now()}`,
        dataUri: savedPath,
        label: 'Upscaled',
        sourceVersionId: activeVersionId,
        createdAt: Date.now(),
      };
      
      dispatch({ type: 'ADD_VERSION', payload: newVersion });
      
      // Set up comparison slider
      dispatch({ 
        type: 'SET_COMPARISON', 
        payload: { left: workingImageDataUri, right: savedPath } 
      });
      
      toast({ title: "Image Upscaled" });
    } catch (e) {
      toast({ title: "Upscaling Failed", description: (e as Error).message, variant: "destructive" });
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, step: null } });
    }
  }, [workingImageDataUri, activeVersionId, original?.hash, original?.file?.name, toast]);
  
  const handleFaceDetailer = useCallback(async () => {
    if (!workingImageDataUri || !activeVersionId) return;
    
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, step: 'face' } });
    
    try {
      const { savedPath } = await faceDetailerAction(workingImageDataUri, original?.hash ?? undefined, original?.file?.name);
      
      // Create a new version for the face-detailed image
      const newVersion: ImageVersion = {
        id: `face_detailed_${Date.now()}`,
        dataUri: savedPath,
        label: 'Face Enhanced',
        sourceVersionId: activeVersionId,
        createdAt: Date.now(),
      };
      
      dispatch({ type: 'ADD_VERSION', payload: newVersion });
      
      // Set up comparison slider
      dispatch({ 
        type: 'SET_COMPARISON', 
        payload: { left: workingImageDataUri, right: savedPath } 
      });
      
      toast({ title: "Face Details Enhanced" });
    } catch (e) {
      toast({ title: "Face Enhancement Failed", description: (e as Error).message, variant: "destructive" });
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, step: null } });
    }
  }, [workingImageDataUri, activeVersionId, original?.hash, original?.file?.name, toast]);
  
  const handleConfirmForGeneration = useCallback(async () => {
    if (!workingImageDataUri) return;
    let finalDataUri = workingImageDataUri;
    
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, step: 'confirm' } });

    if (finalDataUri.startsWith(SERVER_IMAGE_PATH_PREFIX)) {
      try {
        const absoluteUrl = `${window.location.origin}${getDisplayableImageUrl(finalDataUri)}`;
        const response = await fetch(absoluteUrl);
        const blob = await response.blob();
        finalDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        toast({ title: "Error Preparing Image", variant: "destructive" });
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, step: null } });
        return;
      }
    }
    
    onImageReady(finalDataUri);
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, step: null } });
    toast({ title: "Image Confirmed", description: "Proceed to generation parameters." });
  }, [workingImageDataUri, onImageReady, toast]);

  const handleChangeImage = () => {
    onImageReady(null);
  };

  const aspectRatios = [
    { name: "Free", value: "free", icon: <CropIcon /> },
    { name: "Square", value: (1 / 1).toString(), icon: <Square /> },
    { name: "Portrait", value: (3 / 4).toString(), icon: <RectangleVertical /> },
    { name: "Landscape", value: (4 / 3).toString(), icon: <RectangleHorizontal /> },
  ];

  return (
    <div onDragEnter={(e) => handleDragAction(e, 'enter')} onDragLeave={(e) => handleDragAction(e, 'leave')} onDragOver={(e) => handleDragAction(e, 'over')} onDrop={(e) => handleDragAction(e, 'drop')}>
      {isDraggingOverPage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <UploadCloud className="h-24 w-24 text-primary animate-bounce" />
          <p className="mt-4 text-2xl font-semibold text-foreground">Drop image to upload</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <UploadCloud className="h-6 w-6 text-primary" />
                Prepare Your Image
              </CardTitle>
              <CardDescription>Upload, crop, and process your clothing image. The canvas shows the version that will be used for generation.</CardDescription>
            </div>
            {workingImageDataUri && (
              <Button variant="destructive" size="sm" onClick={resetAllState} disabled={isProcessing}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Image
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!workingImageDataUri ? (
            <div className="p-12 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="w-16 h-16 mb-4" />
              <p className="font-semibold text-foreground">Click to upload or drag & drop</p>
              <p className="text-sm">Max {MAX_FILE_SIZE_MB}MB • PNG, JPG, WEBP, etc.</p>
              <Input id="image-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(',')} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Phase 2: Show comparison slider if active, otherwise show normal editor */}
              {comparison ? (
                <ComparisonSlider
                  leftImage={comparison.left}
                  rightImage={comparison.right}
                  leftLabel="Before"
                  rightLabel="After"
                  onClose={handleCloseComparison}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Main Image Editor */}
                  <div className="lg:col-span-3 relative flex items-center justify-center bg-muted/20 p-2 rounded-lg border min-h-[400px]">
                    {isProcessing && (
                      <div className="absolute inset-0 bg-background/70 z-20 flex flex-col items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="mt-2 text-sm font-semibold">{getProcessingMessage(processingStep)}</p>
                      </div>
                    )}
                    <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={aspect} className="max-h-[60vh]" disabled={isConfirmed}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getDisplayableImageUrl(workingImageDataUri) || ''} alt="Editable image" onLoad={onImageLoad} className="max-h-[60vh] object-contain" />
                    </ReactCrop>
                  </div>

                  {/* Controls Panel */}
                  <div className="lg:col-span-1 flex flex-col space-y-6">
                    <div className={isConfirmed ? 'opacity-50 pointer-events-none' : ''}>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="font-semibold">Aspect Ratio</Label>
                      </div>
                      <ToggleGroup type="single" value={aspect?.toString() || 'free'} onValueChange={(v) => {
                          const newAspect = v === 'free' ? undefined : Number(v);
                          setAspect(newAspect);
                          recalculateCrop(newAspect, imgRef);
                        }} className="flex flex-row gap-1 w-full">
                        {aspectRatios.map(ar => (
                          <TooltipProvider key={ar.value}><Tooltip><TooltipTrigger asChild>
                            <ToggleGroupItem value={ar.value} className="flex-col h-auto p-3 gap-1 text-xs flex-1">{ar.icon}<span>{ar.name}</span></ToggleGroupItem>
                          </TooltipTrigger><TooltipContent>{ar.name}</TooltipContent></Tooltip></TooltipProvider>
                        ))}
                      </ToggleGroup>
                    </div>

                    <div className={`space-y-3 ${isConfirmed ? 'opacity-50 pointer-events-none' : ''}`}>
                      <h3 className="font-semibold text-sm">Processing Tools</h3>
                      <Button onClick={handleApplyCrop} disabled={isProcessing || !completedCrop || isUpscaled} className="w-full"><CropIcon className="mr-2" /> Apply Crop</Button>
                      {isBgRemovalAvailable && (
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <Label htmlFor="bg-remove-switch" className="flex items-center gap-2"><Wand2 /> Remove Background</Label>
                          <Switch id="bg-remove-switch" checked={isBgRemoved} onCheckedChange={handleToggleBackgroundRemoval} disabled={isProcessing || isUpscaled} />
                        </div>
                      )}
                      {preparationMode === 'video' && isUpscalingAvailable && (
                        <Button onClick={handleUpscaleImage} variant="outline" disabled={isProcessing || isUpscaled} className="w-full">
                          {isUpscaled ? <><CheckCircle className="mr-2" /> Upscaled</> : <><Sparkles className="mr-2" /> Upscale Image</>}
                        </Button>
                      )}
                      {preparationMode === 'video' && isFaceDetailerAvailable && (
                        <Button onClick={handleFaceDetailer} variant="outline" disabled={isProcessing || isFaceDetailed} className="w-full">
                          {isFaceDetailed ? <><CheckCircle className="mr-2" /> Face Detailed</> : <><UserCheck className="mr-2" /> Face Detailer</>}
                        </Button>
                      )}
                    </div>

                    <div className="pt-6 border-t mt-auto">
                      {isConfirmed ? (
                        <Button onClick={handleChangeImage} size="lg" className="w-full" variant="outline">
                          <RefreshCw className="mr-2 h-5 w-5" />
                          Change Image
                        </Button>
                      ) : (
                        <Button onClick={handleConfirmForGeneration} disabled={!workingImageDataUri || isProcessing} size="lg" className="w-full">
                            {processingStep === 'confirm' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                            Confirm and Continue
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Phase 2: Version Stack - Always visible when there are images */}
              {Object.keys(versions).length > 0 && (
                <ImageVersionStack
                  versions={versions}
                  activeVersionId={activeVersionId}
                  onSetActiveVersion={handleSetActiveVersion}
                  onShowComparison={handleShowComparison}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}