// src/components/ImagePreparationContainer.tsx
"use client";

import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImageStore, useActiveImage } from "@/stores/imageStore";
import { useToast } from "@/hooks/use-toast";
import { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { motion, AnimatePresence } from "motion/react";

// New Components
import ImageUploader from "./ImageUploader";
import ImageEditorCanvas from "./ImageEditorCanvas";
import ImageProcessingTools from "./ImageProcessingTools";
import AspectRatioSelector from "./AspectRatioSelector";
import ImageVersionStack from "./ImageVersionStack";

import { 
  UploadCloud, Trash2, X, Check
} from "lucide-react";

interface ImagePreparationContainerProps {
  preparationMode: 'image' | 'video';
  onReset: () => void;
}

export default function ImagePreparationContainer({
  preparationMode,
  onReset,
}: ImagePreparationContainerProps) {
  const { toast } = useToast();
  
  // Store state
  const { 
    original,
    versions,
    activeVersionId,
    isProcessing,
    applyCrop
  } = useImageStore();
  
  const activeImage = useActiveImage();

  // --- State Management: All state is centralized here ---
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  
  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement | null>(null);

  // --- Core Logic: Event-driven calculation ---
  const handleAspectChange = useCallback((newAspect: number | undefined) => {
    setAspect(newAspect);
    const imageElement = imgRef.current;

    if (imageElement && newAspect) {
      const { naturalWidth: width, naturalHeight: height } = imageElement;
      
      const newCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, newAspect, width, height),
        width,
        height
      );

      setCrop(newCrop);
      // Also set a completedCrop immediately for instant apply-ability
      setCompletedCrop({
          unit: 'px',
          x: (newCrop.x / 100) * width,
          y: (newCrop.y / 100) * height,
          width: (newCrop.width / 100) * width,
          height: (newCrop.height / 100) * height,
      });
    } else {
      // If switching to "Free" aspect, clear the crop to allow free selection
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, []);

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    imgRef.current = img;
    // When a new image is loaded (e.g., from version stack), if an aspect ratio is
    // already selected, we should re-calculate and apply the crop for the new image.
    if (aspect) {
      handleAspectChange(aspect);
    }
  }, [aspect, handleAspectChange]); // Dependency on aspect is intentional here
  
  
  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop) {
      toast({ title: "No Crop Selected", description: "Please select an area to crop.", variant: "destructive" });
      return;
    }
    
    try {
      await applyCrop(completedCrop);
      toast({ title: "Crop Applied", description: "A new cropped version of your image has been created." });
      setAspect(undefined); // Deactivate cropping mode after applying
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      toast({ title: "Cropping Failed", description: (error as Error).message, variant: "destructive" });
    }
  }, [completedCrop, applyCrop, toast]);

  const handleCancelCrop = () => {
    setAspect(undefined);
    setCrop(undefined);
    setCompletedCrop(undefined);
    toast({ title: "Crop Canceled" });
  };

  // --- Render Logic ---
  
  // Show uploader if no image
  if (!original) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ImageUploader />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Main editor interface
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
            {activeImage && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onReset} 
                disabled={isProcessing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Image
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Canvas Area */}
            <div className="lg:col-span-3 relative flex flex-col items-center justify-center bg-muted/20 p-2 rounded-lg border">
              <ImageEditorCanvas 
                image={activeImage}
                crop={crop}
                aspect={aspect}
                onCropChange={setCrop} // Directly pass the setter
                onCropComplete={setCompletedCrop} // Directly pass the setter
                onImageLoad={handleImageLoad} // Pass the handler to get the img element
                disabled={isProcessing}
              />
            </div>

            {/* Controls Panel */}
            <div className="lg:col-span-1 flex flex-col space-y-6">
              <AspectRatioSelector
                preparationMode={preparationMode}
                aspect={aspect}
                onAspectChange={handleAspectChange} // The logic is now handled here
                disabled={isProcessing}
              />

              <ImageProcessingTools 
                preparationMode={preparationMode} 
                disabled={isProcessing || aspect !== undefined} 
              />

              {/* Contextual Crop Action Bar */}
              <AnimatePresence>
                {aspect !== undefined && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2"
                  >
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
                      disabled={isProcessing || !completedCrop}
                    >
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