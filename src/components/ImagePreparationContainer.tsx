// src/components/ImagePreparationContainer.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImageStore, useActiveImage } from "@/stores/imageStore";
import { useToast } from "@/hooks/use-toast";
import { getDisplayableImageUrl } from "@/lib/utils";
import { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';

// New Components
import ImageUploader from "./ImageUploader";
import ImageEditorCanvas from "./ImageEditorCanvas";
import ImageProcessingTools from "./ImageProcessingTools";
import AspectRatioSelector from "./AspectRatioSelector";
import ImageVersionStack from "./ImageVersionStack";
import ImageComparator from "./ImageComparator";

import { 
  UploadCloud, CheckCircle, RefreshCw, Loader2, Trash2, Eye, X, Check, Edit 
} from "lucide-react";

// --- Constants ---
const SERVER_IMAGE_PATH_PREFIX = '/uploads/';

// --- Helper function to get the default aspect based on mode ---
const getDefaultAspect = (mode: 'image' | 'video') => {
  return mode === 'video' ? 9 / 16 : 3 / 4;
};

// --- Cropping Helper Function ---
async function getCroppedImgDataUrl(
  displayedImage: HTMLImageElement,
  crop: PixelCrop,
  sourceDataUri: string
): Promise<string> {
  const offscreenImage = new window.Image();
  offscreenImage.src = sourceDataUri;

  return new Promise((resolve, reject) => {
    offscreenImage.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleX = offscreenImage.naturalWidth / displayedImage.width;
      const scaleY = offscreenImage.naturalHeight / displayedImage.height;

      canvas.width = Math.floor(crop.width * scaleX);
      canvas.height = Math.floor(crop.height * scaleY);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      ctx.drawImage(
        offscreenImage,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0, 0, canvas.width, canvas.height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    offscreenImage.onerror = (err) => reject(err);
  });
}

interface ImagePreparationContainerProps {
  sourceImageUrl?: string | null;
  preparationMode: 'image' | 'video';
}

export default function ImagePreparationContainer({ 
  sourceImageUrl, 
  preparationMode 
}: ImagePreparationContainerProps) {
  const { toast } = useToast();
  
  // Store state
  const { 
    original, 
    versions, 
    activeVersionId, 
    isProcessing, 
    processingStep,
    setActiveVersion,
    reset: resetStore,
    setProcessing,
    addVersion
  } = useImageStore();
  
  const activeImage = useActiveImage();

  // Local UI state
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Logic to determine if comparison is possible
  const sourceVersion = activeImage?.sourceVersionId ? versions[activeImage.sourceVersionId] : null;

  // --- Effects ---
  
  // Reset aspect ratio when preparation mode changes to ensure clean slate
  useEffect(() => {
    // When the preparation mode (Image/Video) changes, reset the aspect ratio to ensure
    // no crop is active from the previous mode. The user must explicitly select one.
    setAspect(undefined);
  }, [preparationMode]);

  // --- Cropping Handlers ---
  
  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !activeImage) return;
    
    try {
      const croppedDataUrl = await getCroppedImgDataUrl(
        imgRef.current,
        completedCrop,
        activeImage.dataUri
      );
      
      addVersion({
        dataUri: croppedDataUrl,
        label: 'Cropped',
        sourceVersionId: activeImage.id,
      });
      
      toast({ title: "Crop Applied", description: "A new cropped version has been added to your history." });
      setAspect(undefined); // Deactivate cropping mode
    } catch (error) {
      console.error('Cropping failed:', error);
      toast({ title: "Cropping Failed", description: "Could not apply the crop.", variant: "destructive" });
    }
  }, [completedCrop, activeImage, addVersion, toast]);

  const handleCancelCrop = () => {
    setAspect(undefined); // This will clear the crop UI
  };

  const handleImageLoad = (img: HTMLImageElement) => {
    imgRef.current = img;
  };

  // --- Handlers ---
  
  const handleConfirmForGeneration = useCallback(async () => {
    if (!activeImage) return;
    
    let finalDataUri = activeImage.dataUri;
    
    setProcessing(true, 'confirm');

    // If the image is a server path, convert it to data URI
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
        setProcessing(false, null);
        return;
      }
    }
    
    setIsConfirmed(true);
    setProcessing(false, null);
    toast({ title: "Image Confirmed", description: "Proceed to generation parameters." });
  }, [activeImage, toast, setProcessing]);

  const handleChangeImage = () => {
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
    resetStore();
    setIsConfirmed(false);
  };

  const resetAllState = useCallback(() => {
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
    resetStore();
    setIsConfirmed(false);
  }, [resetStore]);

  // --- Render Logic ---
  
  // Show uploader if no image
  if (!original) {
    return <ImageUploader sourceImageUrl={sourceImageUrl} />;
  }

  // Main editor interface
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <UploadCloud className="h-6 w-6 text-primary" />
              Prepare Your Image
            </CardTitle>
            <CardDescription>
              Upload, crop, and process your clothing image. The canvas shows the version that will be used for generation.
            </CardDescription>
          </div>
          {activeImage && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={resetAllState} 
              disabled={isProcessing}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Image
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main View Area: Conditionally render Editor or Comparator */}
          <div className="lg:col-span-3 relative">
            {showComparison && activeImage && sourceVersion ? (
              <ImageComparator
                leftImageUri={sourceVersion.dataUri}
                rightImageUri={activeImage.dataUri}
                // Match the styling wrapper of the editor for consistency
                className="bg-muted/20 p-2 rounded-lg border min-h-[400px]"
              />
            ) : (
              <ImageEditorCanvas 
                preparationMode={preparationMode}
                aspect={aspect}
                disabled={isConfirmed}
                onAspectChange={setAspect}
                crop={crop}
                onCropChange={setCrop}
                onCropComplete={setCompletedCrop}
                onImageLoad={handleImageLoad}
              />
            )}

            {/* "Compare" button positioned over the canvas */}
            {sourceVersion && !showComparison && !isConfirmed && (
              <Button 
                variant="outline" 
                className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
                onClick={() => setShowComparison(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Compare
              </Button>
            )}
          </div>

          {/* Controls Panel: Conditionally render controls based on view */}
          <div className="lg:col-span-1 flex flex-col space-y-6">
            {showComparison ? (
              // --- COMPARISON CONTROLS ---
              <div className="flex flex-col space-y-4">
                <h3 className="font-semibold text-sm">Comparison View</h3>
                <p className="text-xs text-muted-foreground">
                  Hover over the image to slide between the &ldquo;before&rdquo; and &ldquo;after&rdquo; versions.
                </p>
                <Button onClick={() => setShowComparison(false)} className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Back to Editor
                </Button>
              </div>
            ) : (
              // --- EDITOR CONTROLS ---
              <>
                <AspectRatioSelector
                  preparationMode={preparationMode}
                  aspect={aspect}
                  onAspectChange={setAspect}
                  disabled={isConfirmed}
                />

                {/* Processing Tools are always visible but disabled during crop */}
                <ImageProcessingTools 
                  preparationMode={preparationMode} 
                  disabled={isProcessing || aspect !== undefined || isConfirmed} 
                />

                {/* Contextual Crop Action Bar */}
                {aspect !== undefined && !isConfirmed && (
                  <div className="flex gap-2 animate-in fade-in">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCancelCrop}
                      disabled={isProcessing}
                    >
                      <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleApplyCrop}
                      disabled={isProcessing}
                    >
                      <Check className="mr-2 h-4 w-4" /> Apply Crop
                    </Button>
                  </div>
                )}

                {/* Final Confirmation Button */}
                {!isConfirmed && (
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={handleConfirmForGeneration}
                    disabled={isProcessing || aspect !== undefined}
                  >
                    {isProcessing && processingStep === 'confirm' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Confirm and Continue
                  </Button>
                )}

                {isConfirmed && (
                  <div className="pt-6 border-t mt-auto">
                    <Button onClick={handleChangeImage} size="lg" className="w-full" variant="outline">
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Change Image
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Version Stack - Always visible when there are images */}
        {Object.keys(versions).length > 0 && (
          <ImageVersionStack
            versions={versions}
            activeVersionId={activeVersionId}
            isProcessing={isProcessing}
          />
        )}
      </CardContent>
    </Card>
  );
}