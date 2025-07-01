// src/components/image-preparation.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Server Actions
import { removeBackgroundAction, isBackgroundRemovalAvailable as checkBgAvailable } from "@/ai/actions/remove-background";
import { upscaleImageAction, isUpscalingAvailable as checkUpscaleAvailable } from "@/ai/actions/upscale-image";
import { faceDetailerAction, isFaceDetailerAvailable as checkFaceDetailerAvailable } from "@/ai/actions/face-detailer";

// Utilities & Icons
import { getDisplayableImageUrl } from "@/lib/utils";
import {
  UploadCloud, X, Crop as CropIcon, Square, RectangleVertical, RectangleHorizontal,
  Loader2, CheckCircle, Wand2, Sparkles, RefreshCw, UserCheck
} from "lucide-react";

// --- Constants & Types ---
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'];
const SERVER_IMAGE_PATH_PREFIX = '/uploads/';

interface ImagePreparationProps {
  onImageReady: (imageDataUri: string | null) => void;
}

type ProcessingStep = 'crop' | 'bg' | 'upscale' | 'face' | 'confirm' | null;

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
export default function ImagePreparation({ onImageReady }: ImagePreparationProps) {
  const { toast } = useToast();

  // --- State Management ---
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageDataUri, setOriginalImageDataUri] = useState<string | null>(null);
  const [originalImageHash, setOriginalImageHash] = useState<string | null>(null);
  const [workingImageDataUri, setWorkingImageDataUri] = useState<string | null>(null);
  const [preBgRemoveDataUri, setPreBgRemoveDataUri] = useState<string | null>(null);
  
  const [isBgRemoved, setIsBgRemoved] = useState(false);
  const [isUpscaled, setIsUpscaled] = useState(false);
  const [isFaceDetailed, setIsFaceDetailed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>(null);

  const [isBgRemovalAvailable, setIsBgRemovalAvailable] = useState(false);
  const [isUpscalingAvailable, setIsUpscalingAvailable] = useState(false);
  const [isFaceDetailerAvailable, setIsFaceDetailerAvailable] = useState(false);

  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  
  const dragCounter = useRef(0);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = processingStep !== null;

  // --- Effects ---
  useEffect(() => {
    checkBgAvailable().then(setIsBgRemovalAvailable);
    checkUpscaleAvailable().then(setIsUpscalingAvailable);
    checkFaceDetailerAvailable().then(setIsFaceDetailerAvailable);
  }, []);

  // --- Handlers ---
  const resetAllState = useCallback(() => {
    setOriginalFile(null);
    setOriginalImageDataUri(null);
    setOriginalImageHash(null);
    setWorkingImageDataUri(null);
    setPreBgRemoveDataUri(null);
    setIsBgRemoved(false);
    setIsUpscaled(false);
    setIsFaceDetailed(false);
    setIsConfirmed(false);
    setProcessingStep(null);
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
    setOriginalFile(file);

    // Calculate hash first
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setOriginalImageHash(hashHex);

    // Then process the image data
    const dataUri = await fileToDataUri(file);
    setOriginalImageDataUri(dataUri);
    setWorkingImageDataUri(dataUri);
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
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(makeAspectCrop({ unit: 'px', width, height }, width / height, width, height), width, height);
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef) return;
    setProcessingStep('crop');
    try {
      const croppedDataUrl = await getCroppedImgDataUrl(imgRef, completedCrop);
      setWorkingImageDataUri(croppedDataUrl);
      setOriginalImageDataUri(croppedDataUrl);
      setIsBgRemoved(false);
      setIsUpscaled(false);
      setIsFaceDetailed(false);
      setPreBgRemoveDataUri(null);
      setIsConfirmed(false);
      // Reset hash when image is cropped since it's now a different image
      setOriginalImageHash(null);
      toast({ title: "Crop Applied" });
    } catch (e) {
      toast({ title: "Cropping Failed", variant: "destructive" });
    } finally {
      setProcessingStep(null);
    }
  }, [completedCrop, imgRef, toast]);

  const handleToggleBackgroundRemoval = useCallback(async (checked: boolean) => {
    if (checked) {
      if (!workingImageDataUri) return;
      setProcessingStep('bg');
      setPreBgRemoveDataUri(workingImageDataUri);
      try {
        const { savedPath } = await removeBackgroundAction(workingImageDataUri, originalImageHash ?? undefined);
        setWorkingImageDataUri(savedPath);
        setIsBgRemoved(true);
        toast({ title: "Background Removed" });
      } catch (e) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
        setIsBgRemoved(false);
      } finally {
        setProcessingStep(null);
      }
    } else {
      setWorkingImageDataUri(preBgRemoveDataUri);
      setIsBgRemoved(false);
    }
  }, [workingImageDataUri, preBgRemoveDataUri, toast, originalImageHash]);

  const handleUpscaleImage = useCallback(async () => {
    if (!workingImageDataUri) return;
    setProcessingStep('upscale');
    try {
      const { savedPath } = await upscaleImageAction(workingImageDataUri, originalImageHash ?? undefined, originalFile?.name);
      setWorkingImageDataUri(savedPath);
      setIsUpscaled(true);
      toast({ title: "Image Upscaled" });
    } catch (e) {
      toast({ title: "Upscaling Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setProcessingStep(null);
    }
  }, [workingImageDataUri, originalImageHash, originalFile?.name, toast]);
  
  const handleFaceDetailer = useCallback(async () => {
    if (!workingImageDataUri) return;
    setProcessingStep('face');
    try {
      const { savedPath } = await faceDetailerAction(workingImageDataUri, originalImageHash ?? undefined, originalFile?.name);
      setWorkingImageDataUri(savedPath);
      setIsFaceDetailed(true);
      toast({ title: "Face Details Improved" });
    } catch (e) {
      toast({ title: "Face Detailing Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setProcessingStep(null);
    }
  }, [workingImageDataUri, originalImageHash, originalFile?.name, toast]);
  
  const handleConfirmForGeneration = useCallback(async () => {
    if (!workingImageDataUri) return;
    let finalDataUri = workingImageDataUri;
    setProcessingStep('confirm');

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
        setProcessingStep(null);
        return;
      }
    }
    
    onImageReady(finalDataUri);
    setProcessingStep(null);
    setIsConfirmed(true);
    toast({ title: "Image Confirmed", description: "Proceed to generation parameters." });
  }, [workingImageDataUri, onImageReady, toast]);

  const handleChangeImage = () => {
    setIsConfirmed(false);
    onImageReady(null);
  };

  const aspectRatios = [
    { name: "Free", value: "free", icon: <CropIcon /> },
    { name: "Square", value: (1 / 1).toString(), icon: <Square /> },
    { name: "Portrait", value: (9 / 16).toString(), icon: <RectangleVertical /> },
    { name: "Landscape", value: (16 / 9).toString(), icon: <RectangleHorizontal /> },
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
          <CardTitle className="text-xl flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-primary" />
            1. Prepare Your Image
          </CardTitle>
          <CardDescription>Upload, crop, and process your clothing image. The canvas shows the version that will be used for generation.</CardDescription>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-3 relative flex items-center justify-center bg-muted/20 p-2 rounded-lg border min-h-[400px]">
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/70 z-20 flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-2 text-sm font-semibold">{getProcessingMessage(processingStep)}</p>
                  </div>
                )}
                <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={aspect} className="max-h-[60vh]" disabled={isConfirmed}>
                  <img src={getDisplayableImageUrl(workingImageDataUri) || ''} alt="Editable image" onLoad={onImageLoad} className="max-h-[60vh] object-contain" />
                </ReactCrop>
              </div>

              <div className="md:col-span-2 flex flex-col space-y-6">
                <div className={isConfirmed ? 'opacity-50 pointer-events-none' : ''}>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-semibold">Aspect Ratio</Label>
                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={resetAllState} disabled={isProcessing} className="h-7 w-7"><X className="h-4 w-4" /></Button>
                    </TooltipTrigger><TooltipContent>Clear Image</TooltipContent></Tooltip></TooltipProvider>
                  </div>
                  <ToggleGroup type="single" value={aspect?.toString() || 'free'} onValueChange={(v) => setAspect(v === 'free' ? undefined : Number(v))} className="grid grid-cols-4 gap-1">
                    {aspectRatios.map(ar => (
                      <TooltipProvider key={ar.value}><Tooltip><TooltipTrigger asChild>
                        <ToggleGroupItem value={ar.value} className="flex-col h-auto p-2 gap-1 text-xs">{ar.icon}<span>{ar.name}</span></ToggleGroupItem>
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
                  {isUpscalingAvailable && (
                    <Button onClick={handleUpscaleImage} variant="outline" disabled={isProcessing || isUpscaled} className="w-full">
                      {isUpscaled ? <><CheckCircle className="mr-2" /> Upscaled</> : <><Sparkles className="mr-2" /> Upscale Image</>}
                    </Button>
                  )}
                  {isFaceDetailerAvailable && (
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
        </CardContent>
      </Card>
    </div>
  );
}