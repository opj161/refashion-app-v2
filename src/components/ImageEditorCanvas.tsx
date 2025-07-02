// src/components/ImageEditorCanvas.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from "@/components/ui/button";
import { useImageStore, useActiveImage } from "@/stores/imageStore";
import { useToast } from "@/hooks/use-toast";
import { getDisplayableImageUrl } from "@/lib/utils";
import { Crop as CropIcon, Loader2 } from "lucide-react";

interface ImageEditorCanvasProps {
  preparationMode: 'image' | 'video';
  aspect?: number;
  disabled?: boolean;
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

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function ImageEditorCanvas({ preparationMode, aspect, disabled = false }: ImageEditorCanvasProps) {
  const { toast } = useToast();
  const { addVersion, isProcessing, processingStep } = useImageStore();
  const activeImage = useActiveImage();
  
  // Local cropping state
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  // Don't render if no active image
  if (!activeImage) {
    return null;
  }

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

  // --- Event Handlers ---
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgRef(e.currentTarget);
    recalculateCrop(aspect, e.currentTarget);
  }, [aspect, recalculateCrop]);

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef || !activeImage) return;
    
    try {
      const croppedDataUrl = await getCroppedImgDataUrl(imgRef, completedCrop);
      
      // Add new version to the store
      addVersion({
        dataUri: croppedDataUrl,
        label: 'Cropped',
        sourceVersionId: activeImage.id,
      });
      
      toast({ title: "Crop Applied", description: "Your image has been cropped successfully." });
    } catch (error) {
      console.error('Cropping failed:', error);
      toast({ title: "Cropping Failed", description: "Failed to apply the crop.", variant: "destructive" });
    }
  }, [completedCrop, imgRef, activeImage, addVersion, toast]);

  // --- Effects ---
  
  // Recalculate crop when aspect ratio changes
  useEffect(() => {
    if (imgRef) {
      recalculateCrop(aspect, imgRef);
    }
  }, [aspect, imgRef, recalculateCrop]);

  // Reset crop when active image changes
  useEffect(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setImgRef(null);
  }, [activeImage.id]);

  const imageUrl = getDisplayableImageUrl(activeImage.dataUri);
  const isCurrentlyProcessing = isProcessing && processingStep === 'crop';

  return (
    <div className="relative flex flex-col items-center justify-center bg-muted/20 p-2 rounded-lg border min-h-[400px]">
      {/* Processing overlay */}
      {isCurrentlyProcessing && (
        <div className="absolute inset-0 bg-background/70 z-20 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-2 text-sm font-semibold">Cropping...</p>
        </div>
      )}

      {/* Crop controls */}
      <div className="w-full flex justify-center mb-4">
        <Button 
          onClick={handleApplyCrop} 
          disabled={isProcessing || !completedCrop || disabled}
          size="sm"
          variant="outline"
        >
          <CropIcon className="mr-2 h-4 w-4" />
          Apply Crop
        </Button>
      </div>

      {/* Image with crop overlay */}
      <ReactCrop 
        crop={crop} 
        onChange={(_, percentCrop) => setCrop(percentCrop)} 
        onComplete={(c) => setCompletedCrop(c)} 
        aspect={aspect} 
        className="max-h-[60vh]" 
        disabled={disabled || isProcessing}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageUrl || ''} 
          alt="Editable image" 
          onLoad={onImageLoad} 
          className="max-h-[60vh] object-contain" 
        />
      </ReactCrop>
    </div>
  );
}
