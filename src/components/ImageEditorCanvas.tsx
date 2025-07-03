// src/components/ImageEditorCanvas.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useImageStore, useActiveImage } from "@/stores/imageStore";
import { useToast } from "@/hooks/use-toast";
import { getDisplayableImageUrl } from "@/lib/utils";
import { Crop as CropIcon, Loader2, Eye } from "lucide-react";

interface ImageEditorCanvasProps {
  preparationMode: 'image' | 'video';
  aspect?: number;
  disabled?: boolean;
  onAspectChange: (aspect: number | undefined) => void; // ADD THIS PROP
}

// --- Helper Functions ---
// The Definitive Cropping Helper Function
// This function now correctly uses the full-resolution data URI for the source.
async function getCroppedImgDataUrl(
  displayedImage: HTMLImageElement, // The scaled-down image from the DOM (for scaling calculation)
  crop: PixelCrop,
  sourceDataUri: string // The full-resolution data URI from the store
): Promise<string> {
  // Create a new image object in memory to ensure we work with the original data.
  const offscreenImage = new window.Image();
  offscreenImage.src = sourceDataUri;

  // Wait for the full-res image to load before proceeding.
  return new Promise((resolve, reject) => {
    offscreenImage.onload = () => {
      const canvas = document.createElement('canvas');
      // The scaling factors correctly bridge the gap between the display size and the original file size.
      const scaleX = offscreenImage.naturalWidth / displayedImage.width;
      const scaleY = offscreenImage.naturalHeight / displayedImage.height;

      // The final canvas should have the high-resolution dimensions.
      canvas.width = Math.floor(crop.width * scaleX);
      canvas.height = Math.floor(crop.height * scaleY);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      // Draw the cropped section from the full-resolution image onto the canvas.
      ctx.drawImage(
        offscreenImage,     // <-- THE CRITICAL FIX: Use the full-res image as the source.
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0, 0, canvas.width, canvas.height
      );

      // Return the result as a high-quality JPEG data URL.
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    offscreenImage.onerror = (err) => reject(err);
  });
}

export default function ImageEditorCanvas({ preparationMode, aspect, disabled = false, onAspectChange }: ImageEditorCanvasProps) {
  const { toast } = useToast();
  const { addVersion, isProcessing, processingStep, versions } = useImageStore();
  const activeImage = useActiveImage();
  
  // Use a ref for the displayed image element to avoid re-renders.
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isComparing, setIsComparing] = useState(false);

  // --- Recalculation logic when aspect ratio changes ---
  const recalculateCrop = useCallback((aspectRatio: number | undefined, imageElement: HTMLImageElement) => {
    const { naturalWidth: imgWidth, naturalHeight: imgHeight } = imageElement;
    let newCrop: Crop;

    if (aspectRatio) {
      // Check if a full-height crop with the target aspect ratio fits within the image width
      const requiredWidthForFullHeight = imgHeight * aspectRatio;
      if (requiredWidthForFullHeight <= imgWidth) {
        // It fits, so use full height
        newCrop = centerCrop(
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
      } else {
        // It doesn't fit (image is too narrow/tall), so use full width instead
        newCrop = centerCrop(
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
      }
    } else {
      // Fallback for "free" aspect ratio
      newCrop = centerCrop(
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
    }

    // FIX: Set BOTH the preview crop and the completed crop.
    // This makes the "Apply Crop" button immediately active after a preset is clicked.
    setCrop(newCrop as Crop);
    setCompletedCrop({
      unit: 'px',
      x: (newCrop.x / 100) * imgWidth,
      y: (newCrop.y / 100) * imgHeight,
      width: (newCrop.width / 100) * imgWidth,
      height: (newCrop.height / 100) * imgHeight,
    });
  }, []);

  // --- Event Handlers ---
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    // No longer automatically calculates crop here - only when aspect changes
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !activeImage) return;
    
    try {
      // FIX: Pass the full-resolution data URI to the cropping function.
      const croppedDataUrl = await getCroppedImgDataUrl(
        imgRef.current,
        completedCrop,
        activeImage.dataUri
      );
      
      // Add new version to the store
      addVersion({
        dataUri: croppedDataUrl,
        label: 'Cropped',
        sourceVersionId: activeImage.id,
      });
      
      toast({ title: "Crop Applied", description: "A new cropped version has been added to your history." });

      // Reset the UI to a non-cropping state after successfully applying
      onAspectChange(undefined);
    } catch (error) {
      console.error('Cropping failed:', error);
      toast({ title: "Cropping Failed", description: "Could not apply the crop.", variant: "destructive" });
    }
  }, [completedCrop, activeImage, addVersion, toast, onAspectChange]); // Add onAspectChange to dependency array

  // --- Effects ---
  
  // Handle crop activation and deactivation based on aspect ratio
  useEffect(() => {
    if (imgRef.current && aspect !== undefined) {
      // Activate cropping mode: calculate and set the crop
      recalculateCrop(aspect, imgRef.current);
    } else if (aspect === undefined) {
      // Deactivate cropping mode: clear the crop states
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [aspect, recalculateCrop]);

  // Reset crop when active image changes
  useEffect(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    imgRef.current = null;
  }, [activeImage?.id]);

  // Find the source image for comparison
  const sourceVersion = activeImage?.sourceVersionId ? versions[activeImage.sourceVersionId] : null;
  const sourceImageUri = sourceVersion ? sourceVersion.dataUri : null;

  // Determine which image to display
  const imageUrlToDisplay = isComparing && sourceImageUri 
    ? getDisplayableImageUrl(sourceImageUri) 
    : activeImage ? getDisplayableImageUrl(activeImage.dataUri) : null;
  
  // Don't render if no active image
  if (!activeImage) {
    return null;
  }

  const isCurrentlyProcessing = isProcessing && processingStep === 'crop';

  return (
    <div className="relative flex flex-col items-center justify-center bg-muted/20 p-2 rounded-lg border min-h-[400px]">
      {/* Processing overlay */}
      {isCurrentlyProcessing && (
        <div className="absolute inset-0 bg-background/70 z-30 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-2 text-sm font-semibold">Cropping...</p>
        </div>
      )}

      {/* Hold-to-compare button - Enhanced for better visibility */}
      {sourceImageUri && !disabled && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  className="bg-background/80 hover:bg-background/95 backdrop-blur-sm shadow-lg border border-border/50"
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={(e) => { e.preventDefault(); setIsComparing(true); }}
                  onTouchEnd={() => setIsComparing(false)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Hold to Compare
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hold down to see the previous version</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Crop controls - Positioned absolutely to prevent layout shift */}
      {completedCrop && !disabled && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <Button 
            onClick={handleApplyCrop} 
            disabled={isProcessing}
            size="sm"
            variant="default"
            className="shadow-lg"
          >
            <CropIcon className="mr-2 h-4 w-4" />
            Apply Crop
          </Button>
        </div>
      )}

      {/* Image with crop overlay */}
      <ReactCrop 
        // Conditionally pass the crop object. If it's undefined, the crop UI is not shown.
        crop={crop}
        onChange={(_, percentCrop) => setCrop(percentCrop)} 
        onComplete={(c) => setCompletedCrop(c)} 
        aspect={aspect} 
        className="max-h-[60vh]" 
        disabled={disabled || isProcessing}
      >
        {/* Using a key ensures the img element is re-mounted when the active image changes. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          key={activeImage.id}
          src={imageUrlToDisplay || ''} 
          alt="Editable image" 
          onLoad={onImageLoad} 
          className="max-h-[60vh] object-contain" 
        />
      </ReactCrop>
    </div>
  );
}