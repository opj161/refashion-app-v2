// src/components/image-preparation.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image"; // Using Next/Image for optimized image handling
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ReactCompareImage from 'react-compare-image';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { getDisplayableImageUrl } from "@/lib/utils";
import { uploadUserImageAction } from "@/ai/actions/upload-user-image";
import { removeBackgroundAction, isBackgroundRemovalAvailable as checkBackgroundRemovalAvailable } from "@/ai/actions/remove-background";
import { upscaleImageAction, isUpscalingAvailable as checkUpscalingAvailable } from "@/ai/actions/upscale-image";
import styles from "./comparison-slider.module.css"; // Assuming this path is correct or will be created

import {
  UploadCloud,
  X,
  CropIcon,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Loader2,
  CheckCircle,
  Wand2, // For BG Removal and general "Process"
  Sparkles, // For Upscaling
  ZoomIn, // For Image Processing section title
  Camera // For "Use Original" button
} from "lucide-react";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif', // Keep GIF for now, consider implications
  'image/heic',
  'image/heif',
  'image/avif',
];

interface ImagePreparationProps {
  onImageReady: (imageDataUri: string | null) => void;
}

// Helper to get data URL from canvas - improved for better quality (from video-generation page)
async function getCroppedImgDataUrl(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const finalWidth = Math.floor(crop.width * scaleX);
  const finalHeight = Math.floor(crop.height * scaleY);
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = finalWidth * pixelRatio;
  canvas.height = finalHeight * pixelRatio;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Failed to get canvas context'));
  }

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    finalWidth,
    finalHeight
  );

  return new Promise((resolve, reject) => {
    try {
      const quality = finalWidth * finalHeight > 1000000 ? 0.8 : 0.95; // JPEG quality
      const dataUrl = canvas.toDataURL('image/jpeg', quality); // Consider making type dynamic or PNG for transparency
      resolve(dataUrl);
    } catch (error) {
      reject(new Error('Failed to generate image data URL'));
    }
  });
}

// Helper function to convert File to data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to convert data URI to File
const dataUriToFile = (dataUri: string, fileName: string): File => {
  const arr = dataUri.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};


export default function ImagePreparation({ onImageReady }: ImagePreparationProps) {
  const { toast } = useToast();

  // State for image URLs and data
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null); // Object URL for cropper
  const [originalImageDataUri, setOriginalImageDataUri] = useState<string | null>(null); // Original file as data URI
  const [croppedImageDataUri, setCroppedImageDataUri] = useState<string | null>(null); // Cropped image as data URI
  const [backgroundRemovedImageUrl, setBackgroundRemovedImageUrl] = useState<string | null>(null); // Server URL
  const [upscaledImageUrl, setUpscaledImageUrl] = useState<string | null>(null); // Server URL
  const [currentDisplayImageUrl, setCurrentDisplayImageUrl] = useState<string | null>(null);
  const [finalImageDataUri, setFinalImageDataUri] = useState<string | null>(null); // Final data URI

  // Cropping state
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(undefined);
  const [isDraggingCropper, setIsDraggingCropper] = useState(false);

  // File and loading states
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef<number>(0);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState<boolean>(false);

  const [isUploadingSource, setIsUploadingSource] = useState<boolean>(false);
  const [isProcessingCrop, setIsProcessingCrop] = useState<boolean>(false);
  const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);

  // Availability states for services
  const [isBackgroundRemovalAvailable, setIsBackgroundRemovalAvailable] = useState<boolean>(false);
  const [isUpscalingAvailable, setIsUpscalingAvailable] = useState<boolean>(false);

  // Comparison slider state
  const [comparisonLeftImage, setComparisonLeftImage] = useState<string | null>(null);
  const [comparisonRightImage, setComparisonRightImage] = useState<string | null>(null);
  const [showComparisonSlider, setShowComparisonSlider] = useState<boolean>(false);

  // Check service availability on mount
  useEffect(() => {
    checkBackgroundRemovalAvailable().then(setIsBackgroundRemovalAvailable).catch(() => setIsBackgroundRemovalAvailable(false));
    checkUpscalingAvailable().then(setIsUpscalingAvailable).catch(() => setIsUpscalingAvailable(false));
  }, []);

  // Helper to determine current display image
  useEffect(() => {
    if (upscaledImageUrl) setCurrentDisplayImageUrl(upscaledImageUrl);
    else if (backgroundRemovedImageUrl) setCurrentDisplayImageUrl(backgroundRemovedImageUrl);
    else if (croppedImageDataUri) setCurrentDisplayImageUrl(croppedImageDataUri);
    else if (originalImageDataUri) setCurrentDisplayImageUrl(originalImageDataUri);
    else if (sourceImageUrl) setCurrentDisplayImageUrl(sourceImageUrl);
    else setCurrentDisplayImageUrl(null);
  }, [sourceImageUrl, originalImageDataUri, croppedImageDataUri, backgroundRemovedImageUrl, upscaledImageUrl]);

  const commonDisabled = isUploadingSource || isProcessingCrop || isBgRemoving || isUpscaling;

  // --- File Handling & Upload ---
  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({ title: "Image too large", description: `Max ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: `Supported: ${ALLOWED_FILE_TYPES.join(', ')}`, variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setOriginalFile(file);
    setIsUploadingSource(true);

    // Reset all derived images
    setSourceImageUrl(null);
    setOriginalImageDataUri(null);
    setCroppedImageDataUri(null);
    setBackgroundRemovedImageUrl(null);
    setUpscaledImageUrl(null);
    setFinalImageDataUri(null);
    setCompletedCrop(undefined);
    setShowComparisonSlider(false);

    // Create object URL for cropper
    const objectUrl = URL.createObjectURL(file);
    setSourceImageUrl(objectUrl);
    setSelectedAspect(undefined);

    try {
      // Convert file to data URI
      const dataUri = await fileToDataUri(file);
      setOriginalImageDataUri(dataUri);
      setFinalImageDataUri(dataUri); // Default to original
      toast({ title: "Image Loaded", description: "Ready for cropping or processing." });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({ title: "Processing Failed", description: (error as Error).message, variant: "destructive" });
      setSourceImageUrl(null);
      setOriginalFile(null);
    } finally {
      setIsUploadingSource(false);
    }
  }, [toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
    if (event.target) event.target.value = ""; // Allow re-uploading same file
  };

  const handleRemoveImage = useCallback(() => {
    if (sourceImageUrl && sourceImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(sourceImageUrl);
    }
    setSourceImageUrl(null);
    setOriginalImageDataUri(null);
    setCroppedImageDataUri(null);
    setBackgroundRemovedImageUrl(null);
    setUpscaledImageUrl(null);
    setCurrentDisplayImageUrl(null);
    setFinalImageDataUri(null);
    setOriginalFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setImgRef(null);
    setShowComparisonSlider(false);
    onImageReady(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [sourceImageUrl, onImageReady]);

  // Drag and Drop Handlers (from video-generation)
  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) setIsDraggingOverPage(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDraggingOverPage(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingOverPage(false); dragCounter.current = 0;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      if (e.dataTransfer) e.dataTransfer.clearData();
    }
  }, [processFile]);

  // Attach drag-drop listeners to window
  useEffect(() => {
    const dragEnter = (e: DragEvent) => handleDragEnter(e as any);
    const dragLeave = (e: DragEvent) => handleDragLeave(e as any);
    const dragOver = (e: DragEvent) => handleDragOver(e as any);
    const drop = (e: DragEvent) => handleDrop(e as any);

    window.addEventListener('dragenter', dragEnter);
    window.addEventListener('dragleave', dragLeave);
    window.addEventListener('dragover', dragOver);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', dragEnter);
      window.removeEventListener('dragleave', dragLeave);
      window.removeEventListener('dragover', dragOver);
      window.removeEventListener('drop', drop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);


  // --- Cropping Logic (from video-generation) ---
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgRef(e.currentTarget);
  }, []);

  const onCropChange = useCallback((_: PixelCrop, percentCrop: Crop) => {
    setCrop(percentCrop);
  }, []);

  const onCropComplete = useCallback((pixelCrop: PixelCrop, percentCrop: Crop) => {
    setCompletedCrop(pixelCrop);
  }, []);

  const onCropperDragStart = useCallback(() => setIsDraggingCropper(true), []);
  const onCropperDragEnd = useCallback(() => setIsDraggingCropper(false), []);

  const recalculateCrop = useCallback((aspect: number | undefined, imageElement: HTMLImageElement | null) => {
    if (imageElement) {
      const { naturalWidth: imgWidth, naturalHeight: imgHeight } = imageElement;
      let newCalculatedCrop: Crop | undefined = undefined;
      if (aspect === undefined) { // Free crop
        newCalculatedCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, imgWidth / imgHeight, imgWidth, imgHeight), imgWidth, imgHeight);
      } else {
        const imageAspectRatio = imgWidth / imgHeight;
        if (imageAspectRatio > aspect) {
          newCalculatedCrop = centerCrop(makeAspectCrop({ unit: '%', height: 100 }, aspect, imgWidth, imgHeight), imgWidth, imgHeight);
        } else {
          newCalculatedCrop = centerCrop(makeAspectCrop({ unit: '%', width: 100 }, aspect, imgWidth, imgHeight), imgWidth, imgHeight);
        }
      }
      setCrop(newCalculatedCrop);
      setCompletedCrop(newCalculatedCrop ? {
        x: Math.round(newCalculatedCrop.x * imgWidth / 100),
        y: Math.round(newCalculatedCrop.y * imgHeight / 100),
        width: Math.round(newCalculatedCrop.width * imgWidth / 100),
        height: Math.round(newCalculatedCrop.height * imgHeight / 100),
        unit: 'px'
      } : undefined);
    }
  }, []);

  useEffect(() => {
    if (imgRef) {
      recalculateCrop(selectedAspect, imgRef);
    }
  }, [imgRef, selectedAspect, recalculateCrop]);

  const handleAspectChange = useCallback((aspectValue: string) => {
    if (aspectValue) { // Ensure a value is selected from ToggleGroup
        const newAspect = aspectValue === "free" ? undefined : parseFloat(aspectValue);
        setSelectedAspect(newAspect);
    }
  }, []);

  const handleConfirmCrop = useCallback(async () => {
    if (!completedCrop || !imgRef || !originalFile) {
      toast({ title: "Error", description: "Cannot process crop. Missing image or crop selection.", variant: "destructive" });
      return;
    }

    setIsProcessingCrop(true);
    try {
      const croppedDataUrl = await getCroppedImgDataUrl(imgRef, completedCrop, originalFile.name);
      setCroppedImageDataUri(croppedDataUrl);
      setFinalImageDataUri(croppedDataUrl); // Cropped image is now the final one

      // Reset processed versions
      setBackgroundRemovedImageUrl(null);
      setUpscaledImageUrl(null);
      setShowComparisonSlider(false);

      toast({ title: "Crop Confirmed", description: "Cropped image is ready." });
    } catch (error) {
      console.error('Error processing cropped image:', error);
      toast({ title: "Cropping Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessingCrop(false);
    }
  }, [completedCrop, imgRef, originalFile, toast]);


  // Background removal - now works with data URI
  const handleRemoveBackground = useCallback(async () => {
    const imageToProcess = finalImageDataUri || originalImageDataUri;
    if (!imageToProcess) {
      toast({ title: "No Image", description: "Please upload an image first.", variant: "destructive" });
      return;
    }

    setIsBgRemoving(true);
    setShowComparisonSlider(false);
    
    try {
      // Upload the data URI to get a server URL for processing
      const uploadedUrl = await uploadUserImageAction(imageToProcess);
      
      toast({ title: "Processing Image", description: "Removing background..." });
      const { savedPath } = await removeBackgroundAction(uploadedUrl, "image_for_bg_removal");
      
      setBackgroundRemovedImageUrl(savedPath);
      setCurrentDisplayImageUrl(savedPath);
      setUpscaledImageUrl(null); // Reset upscale

      // Setup comparison slider
      setComparisonLeftImage(imageToProcess);
      setComparisonRightImage(savedPath);
      setShowComparisonSlider(true);

      toast({ title: "Background Removed", description: "Image processed successfully." });
    } catch (error) {
      console.error("Background removal failed:", error);
      toast({ title: "Background Removal Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsBgRemoving(false);
    }
  }, [finalImageDataUri, originalImageDataUri, toast]);

  // Upscaling - now works with data URI
  const handleUpscaleImage = useCallback(async () => {
    const imageToProcess = backgroundRemovedImageUrl || finalImageDataUri || originalImageDataUri;
    if (!imageToProcess) {
      toast({ title: "No Image", description: "Please upload an image first.", variant: "destructive" });
      return;
    }

    setIsUpscaling(true);
    setShowComparisonSlider(false);
    
    try {
      // If it's a data URI, upload it first
      let urlToProcess = imageToProcess;
      if (imageToProcess.startsWith('data:')) {
        urlToProcess = await uploadUserImageAction(imageToProcess);
      }
      
      toast({ title: "Processing Image", description: "Upscaling image..." });
      const { savedPath } = await upscaleImageAction(urlToProcess, "image_for_upscale");
      
      setUpscaledImageUrl(savedPath);
      setCurrentDisplayImageUrl(savedPath);

      // Setup comparison slider
      setComparisonLeftImage(imageToProcess);
      setComparisonRightImage(savedPath);
      setShowComparisonSlider(true);

      toast({ title: "Image Upscaled", description: "Image processed successfully." });
    } catch (error) {
      console.error("Upscaling failed:", error);
      toast({ title: "Upscaling Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpscaling(false);
    }
  }, [backgroundRemovedImageUrl, finalImageDataUri, originalImageDataUri, toast]);

  // Buttons to switch active image
  const handleUseOriginal = () => {
    if (originalImageDataUri) {
      setCurrentDisplayImageUrl(originalImageDataUri);
      setFinalImageDataUri(originalImageDataUri);
      setShowComparisonSlider(false);
      toast({ title: "Using Original Image" });
    }
  };

  const handleUseCropped = () => {
    if (croppedImageDataUri) {
      setCurrentDisplayImageUrl(croppedImageDataUri);
      setFinalImageDataUri(croppedImageDataUri);
      setShowComparisonSlider(false);
      toast({ title: "Using Cropped Image" });
    }
  };

  const handleUseBgRemoved = () => {
    if (backgroundRemovedImageUrl) {
      setCurrentDisplayImageUrl(backgroundRemovedImageUrl);
      // Convert server URL back to data URI for consistency
      // For now, we'll pass the server URL - this could be improved
      setFinalImageDataUri(backgroundRemovedImageUrl);
      setShowComparisonSlider(false);
      toast({ title: "Using Background-Removed Image" });
    }
  };

  const handleUseUpscaled = () => {
    if (upscaledImageUrl) {
      setCurrentDisplayImageUrl(upscaledImageUrl);
      // Convert server URL back to data URI for consistency
      // For now, we'll pass the server URL - this could be improved
      setFinalImageDataUri(upscaledImageUrl);
      setShowComparisonSlider(false);
      toast({ title: "Using Upscaled Image" });
    }
  };

  // Confirm image for generation
  const handleConfirmForGeneration = () => {
    if (!finalImageDataUri) {
      toast({ title: "No Image Selected", description: "Please upload and prepare an image first.", variant: "destructive" });
      return;
    }
    onImageReady(finalImageDataUri);
    toast({ title: "Image Confirmed", description: "Ready to configure generation parameters." });
  };

  const aspectRatios = [
    { name: "Free", value: "free", icon: <CropIcon className="h-4 w-4" /> },
    { name: "Square (1:1)", value: (1 / 1).toString(), icon: <Square className="h-4 w-4" /> },
    { name: "Portrait (9:16)", value: (9 / 16).toString(), icon: <RectangleVertical className="h-4 w-4" /> },
    { name: "Landscape (16:9)", value: (16 / 9).toString(), icon: <RectangleHorizontal className="h-4 w-4" /> },
  ];

  // --- Render ---
  return (
    <div className="space-y-6" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      {isDraggingOverPage && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <UploadCloud className="h-24 w-24 text-primary animate-bounce" />
          <p className="mt-4 text-xl sm:text-2xl font-semibold text-foreground">Drop image to prepare</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-primary" />
            1. Upload & Crop Image
          </CardTitle>
          <CardDescription>Upload your image. Then, optionally crop it to the desired aspect ratio.</CardDescription>
          <div className="pt-2">
            <Button asChild variant="outline">
              <label htmlFor="imagePreparationUpload" className="cursor-pointer">
                <UploadCloud className="mr-2 h-4 w-4" /> Choose File
              </label>
            </Button>
            <Input
              id="imagePreparationUpload"
              type="file"
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={commonDisabled}
              className="sr-only"
            />
            {originalFile && (
              <span className="ml-4 text-sm text-muted-foreground truncate max-w-xs">
                {originalFile.name}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUploadingSource && (
            <div className="p-4 border rounded-lg bg-muted/50 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Uploading and preparing image...</p>
              <div className="aspect-video w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div> {/* Skeleton for preview */}
            </div>
          )}

          {/* Cropper and Aspect Ratio Controls */}
          {sourceImageUrl && !isUploadingSource && ( // Show cropper if a source (local or remote) is set and not uploading
            // Make this div a grid for two-column layout on md screens and up
            <div className="md:grid md:grid-cols-3 md:gap-6 p-4 border rounded-lg bg-muted/10 relative space-y-4 md:space-y-0">
              {/* Column 1: Cropper (takes 2/3 width on md+) */}
              <div className="md:col-span-2 space-y-4">
                <Button
                  variant="ghost" size="icon"
                  className="absolute md:relative top-2 right-2 md:top-auto md:right-auto md:self-start bg-background/50 hover:bg-background/80 rounded-full h-8 w-8 z-10"
                  onClick={handleRemoveImage} aria-label="Remove image" disabled={commonDisabled}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
                <div className="flex flex-col items-center max-h-[60vh] overflow-hidden rounded-md border">
                  <ReactCrop
                    crop={crop}
                    onChange={onCropChange}
                    onComplete={onCropComplete}
                    aspect={selectedAspect}
                    minWidth={50} minHeight={50}
                    ruleOfThirds={true}
                    className={`max-w-full rounded-md overflow-hidden ${isDraggingCropper ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onDragStart={onCropperDragStart}
                    onDragEnd={onCropperDragEnd}
                    disabled={commonDisabled}
                  >
                    <img // Using standard img tag for ReactCrop
                      src={getDisplayableImageUrl(sourceImageUrl) || ''} // Use sourceImageUrl for cropper
                      alt="Input for cropping"
                      onLoad={onImageLoad}
                      style={{ maxHeight: '60vh', objectFit: 'contain' }}
                    />
                  </ReactCrop>
                </div>
              </div>

              {/* Column 2: Controls (takes 1/3 width on md+) */}
              <div className="md:col-span-1 space-y-4 flex flex-col">
                <div className="flex flex-col gap-3 items-center justify-center">
                  <Label className="text-sm font-medium">Aspect Ratio:</Label>
                  <ToggleGroup
                    type="single"
                    value={selectedAspect === undefined ? "free" : selectedAspect.toString()}
                    onValueChange={handleAspectChange}
                    variant="outline" className="gap-1 flex-wrap justify-center" // Added flex-wrap and justify-center
                    disabled={commonDisabled}
                    aria-label="Select crop aspect ratio"
                  >
                    {aspectRatios.map(ar => (
                      <ToggleGroupItem
                        key={ar.name}
                        value={ar.value}
                        aria-label={ar.name} // Existing aria-label is good
                        title={ar.name} // Add title for tooltip on hover
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        {ar.icon} <span className="">{ar.name.split(' ')[0]}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <Button
                  onClick={handleConfirmCrop}
                  disabled={!completedCrop || !imgRef || commonDisabled || isProcessingCrop}
                  className="w-full mt-auto" // Added mt-auto to push to bottom
                >
                  {isProcessingCrop ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Crop...</>
                  ) : (
                    <><CropIcon className="mr-2 h-4 w-4" /> Confirm Crop & Prepare</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Fallback if no image is uploaded/source set */}
          {!sourceImageUrl && !isUploadingSource && (
             <div
                className="p-12 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/10 cursor-pointer hover:bg-muted/20 hover:border-muted-foreground/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-16 h-16 mb-4 text-muted-foreground/60" />
                <p className="font-semibold text-base mb-1">Click to upload or drag & drop</p>
                <p className="text-sm">Max {MAX_FILE_SIZE_MB}MB • PNG, JPG, WEBP, GIF, HEIC, AVIF</p>
              </div>
          )}
        </CardContent>
      </Card>

      {/* Image Processing Section (BG Removal, Upscale) */}
      {(originalImageDataUri || sourceImageUrl) && (isBackgroundRemovalAvailable || isUpscalingAvailable) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ZoomIn className="h-6 w-6 text-primary" />
              Image Processing (Optional)
            </CardTitle>
            <CardDescription>
              Further enhance your prepared image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Comparison Slider or Preview */}
            {showComparisonSlider && comparisonLeftImage && comparisonRightImage ? (
                 <div className={`relative border rounded-lg overflow-hidden ${styles.comparisonContainer}`}>
                    <ReactCompareImage
                        leftImage={comparisonLeftImage}
                        rightImage={comparisonRightImage}
                        hover={true}
                        leftImageAlt="Before processing"
                        rightImageAlt="After processing"
                        sliderLineWidth={2}
                        sliderPositionPercentage={0.5}
                    />
                    <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1"><span className="text-xs font-medium">Before</span></div>
                    <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1"><span className="text-xs font-medium">After</span></div>
                 </div>
            ) : currentDisplayImageUrl && (
                <div className="p-2 border rounded-md bg-muted/20 relative">
                     <img src={currentDisplayImageUrl} alt="Current image preview" className="rounded-md object-contain mx-auto max-h-60 w-auto" />
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isBackgroundRemovalAvailable && (
                <Button onClick={handleRemoveBackground} variant="outline" disabled={commonDisabled || !finalImageDataUri}>
                  {isBgRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Remove Background
                </Button>
              )}
              {isUpscalingAvailable && (
                <Button onClick={handleUpscaleImage} variant="outline" disabled={commonDisabled || !finalImageDataUri}>
                  {isUpscaling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Upscale Image
                </Button>
              )}
            </div>

            {/* Version selection buttons */}
            {(originalImageDataUri || croppedImageDataUri || backgroundRemovedImageUrl || upscaledImageUrl) && (
              <div className="space-y-2">
                <Label>Select Version to Use</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {originalImageDataUri && (
                    <Button
                      onClick={handleUseOriginal}
                      variant={finalImageDataUri === originalImageDataUri ? "default" : "outline"}
                      size="sm"
                    >
                      <Camera className="mr-1 h-3 w-3" />
                      Original
                    </Button>
                  )}
                  {croppedImageDataUri && (
                    <Button
                      onClick={handleUseCropped}
                      variant={finalImageDataUri === croppedImageDataUri ? "default" : "outline"}
                      size="sm"
                    >
                      <CropIcon className="mr-1 h-3 w-3" />
                      Cropped
                    </Button>
                  )}
                  {backgroundRemovedImageUrl && (
                    <Button
                      onClick={handleUseBgRemoved}
                      variant={finalImageDataUri === backgroundRemovedImageUrl ? "default" : "outline"}
                      size="sm"
                    >
                      <Wand2 className="mr-1 h-3 w-3" />
                      No BG
                    </Button>
                  )}
                  {upscaledImageUrl && (
                    <Button
                      onClick={handleUseUpscaled}
                      variant={finalImageDataUri === upscaledImageUrl ? "default" : "outline"}
                      size="sm"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      Upscaled
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current preview */}
      {currentDisplayImageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <img
                src={currentDisplayImageUrl}
                alt="Current prepared image"
                className="w-full h-auto rounded-lg border"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm button */}
      {finalImageDataUri && (
        <Button
          onClick={handleConfirmForGeneration}
          disabled={!finalImageDataUri || commonDisabled}
          className="w-full"
          size="lg"
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Confirm Image for Generation
        </Button>
      )}
    </div>
  );
}
