// src/components/ImagePreparationContainer.tsx
"use client";

import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type PixelCrop, type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { motion, AnimatePresence } from 'motion/react';
import { useImagePreparation, useActivePreparationImage } from "@/contexts/ImagePreparationContext";

import ImageUploader from "./ImageUploader";
import ImageEditorCanvas from "./ImageEditorCanvas";
import ImageProcessingTools from "./ImageProcessingTools";
import AspectRatioSelector from "./AspectRatioSelector";
import ImageVersionStack from "./ImageVersionStack";

import { UploadCloud, Trash2, X, Check } from "lucide-react";

interface ImagePreparationContainerProps {
  preparationMode: 'image' | 'video';
  onReset: () => void;
}

// Internal component that uses the context
function ImagePreparationContainerInternal({
  preparationMode,
  onReset,
}: ImagePreparationContainerProps) {
  const { toast } = useToast();

  // --- Read ALL state directly from the local context ---
  const {
    versions,
    activeVersionId,
    isProcessing,
    crop,
    aspect,
    imageDimensions,
    setCrop,
    setAspect,
    setOriginalImageDimensions,
    applyCrop,
  } = useImagePreparation();
  
  const activeImage = useActivePreparationImage();
  
  const handleApplyCrop = async () => {
    try {
      await applyCrop();
      toast({ title: "Crop Applied", description: "A new cropped version has been created." });
    } catch (error) {
      toast({ title: "Cropping Failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleCancelCrop = () => {
    setAspect(undefined); // This store action now resets the crop state
    toast({ title: "Crop Canceled" });
  };
  
  // --- THE CORE FIX: A robust onImageLoad handler ---
  // This is the single source of truth for what happens when an image is loaded or re-loaded.
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;

    // 1. Always store the new dimensions.
    setOriginalImageDimensions({ width: naturalWidth, height: naturalHeight });

    // 2. Check if there's a predefined aspect ratio we need to apply.
    if (aspect) {
      // 3. Calculate and set the centered crop.
      const newCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, naturalWidth, naturalHeight),
        naturalWidth,
        naturalHeight
      );
      setCrop(newCrop);
    }
  }, [setOriginalImageDimensions, setCrop, aspect]);
  
  // The complex useEffect is GONE! The logic is now correctly placed in the store's `setAspect` action.

  // Render logic remains similar, but is now driven by the global store state.
  if (!activeImage) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ImageUploader />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div layout transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}>
      <Card variant="glass">
        <CardHeader>
            <div className="flex justify-between items-start gap-4">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <UploadCloud className="h-6 w-6 text-primary" />
                        Prepare Your Image
                    </CardTitle>
                    <CardDescription>
                        Upload, crop, and process your clothing image before generation.
                    </CardDescription>
                </div>
                <Button variant="destructive" size="sm" onClick={onReset} disabled={isProcessing}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Image
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 relative flex flex-col items-center justify-center bg-muted/20 p-2 rounded-lg min-h-[70vh] shadow-2xl shadow-primary/10 transition-shadow duration-300 hover:shadow-primary/20">
              <ImageEditorCanvas
                key={activeImage.id} // Re-mounts when active image changes, triggering onLoad
                image={activeImage}
                crop={crop}
                aspect={aspect}
                // react-image-crop works with percentage-based `Crop` by default
                onCropChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                onCropComplete={() => {}} // No-op since we use percentage-based crops
                onImageLoad={onImageLoad}
                disabled={isProcessing}
                ruleOfThirds={true} // Enhancement: Enable rule of thirds
                imageDimensions={imageDimensions ? {
                  width: imageDimensions.originalWidth,
                  height: imageDimensions.originalHeight
                } : undefined}
              />
            </div>
            <div className="lg:col-span-1 flex flex-col space-y-6">
              <AspectRatioSelector
                preparationMode={preparationMode}
                aspect={aspect}
                onAspectChange={setAspect} // Directly calls the store action
                disabled={isProcessing}
              />
              <ImageProcessingTools
                preparationMode={preparationMode}
                disabled={isProcessing || aspect !== undefined}
              />
                <AnimatePresence>
                  {aspect !== undefined && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex gap-2"
                    >
                      <Button variant="outline" size="sm" className="flex-1" onClick={handleCancelCrop} disabled={isProcessing}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                      <Button size="sm" className="flex-1" onClick={handleApplyCrop} disabled={isProcessing}>
                        <Check className="mr-2 h-4 w-4" /> Apply Crop
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </div>
          {Object.keys(versions).length > 1 && (
            <ImageVersionStack
              versions={versions}
              activeVersionId={activeVersionId}
              isProcessing={isProcessing}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main component - context is now provided by CreationHub
export default function ImagePreparationContainer(props: ImagePreparationContainerProps) {
  return <ImagePreparationContainerInternal {...props} />;
}