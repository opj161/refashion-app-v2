// src/components/ImagePreparationContainer.tsx
"use client";

import React, { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type PixelCrop, type Crop } from 'react-image-crop';
import { motion, AnimatePresence } from 'motion/react';
import { useImageStore } from "@/stores/imageStore";
import { useIsMobile } from "@/hooks/use-mobile";

import ImageUploader from "./ImageUploader";
import ImageEditorCanvas from "./ImageEditorCanvas";
import EditingHubSidebar from "./EditingHubSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { UploadCloud, Trash2, Brush } from "lucide-react";

interface ImagePreparationContainerProps {
  preparationMode: 'image' | 'video';
  onReset: () => void;
  resetRef?: React.MutableRefObject<(() => void) | null>;
}

// Component that uses the Zustand store
export default function ImagePreparationContainer({
  preparationMode,
  onReset,
  resetRef,
}: ImagePreparationContainerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Use Zustand Store
  const {
    versions,
    activeVersionId,
    crop,
    aspect,
    imageDimensions,
    applyCrop,
    reset,
    setAspect,
    setDimensions,
    setCrop,
  } = useImageStore();

  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');

  // Expose reset to parent via ref
  React.useEffect(() => {
    if (resetRef) {
      resetRef.current = reset;
    }
  }, [reset, resetRef]);

  // Local UI state for managing the cropping flow
  const [isCropping, setIsCropping] = useState<boolean>(false);

  const handleApplyCrop = async () => {
    setIsCropping(false);
    try {
      await applyCrop();
      toast({ title: "Crop Applied", description: "A new cropped version has been created." });
    } catch (error) {
      toast({ title: "Cropping Failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setAspect(undefined);
    toast({ title: "Crop Canceled" });
  };

  const handleAspectChange = (newAspect?: number) => {
    setAspect(newAspect);
    // An explicit aspect selection always means we are in a cropping state.
    setIsCropping(true);
  };

  // --- THE CORE FIX: A robust onImageLoad handler ---
  // This is the single source of truth for what happens when an image is loaded or re-loaded.
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;

    // 1. Always store the new dimensions.
    setDimensions(naturalWidth, naturalHeight);

    // 2. Check if there's a predefined aspect ratio we need to apply.
    if (aspect) {
      // 3. Calculate and set the centered crop - the reducer will handle this
      setAspect(aspect);
    }
  }, [setDimensions, setAspect, aspect]);
  
  const handleCropChange = (pixelCrop: PixelCrop, percentCrop: Crop) => {
    setCrop(percentCrop);
    // *** BUG FIX ***: Activate cropping UI on manual drag
    if (!isCropping && percentCrop.width > 0 && percentCrop.height > 0) {
      setIsCropping(true);
    }
  };

  // Render logic remains similar, but is now driven by the global store state.
  const hubContent = (
    <EditingHubSidebar
      preparationMode={preparationMode}
      isCropping={isCropping}
      isProcessing={isAnyVersionProcessing}
      aspect={aspect}
      onAspectChange={handleAspectChange} // *** BUG FIX ***: Wire to correct handler
      onConfirmCrop={handleApplyCrop}
      onCancelCrop={handleCancelCrop}
      versions={versions}
      activeVersionId={activeVersionId}
    />
  );

  // Define animation variants for the container switch
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2, ease: 'easeIn' as const } },
  };

  return (
    <AnimatePresence mode="wait">
      {!activeImage ? (
        // --- UPLOADER STATE ---
        <motion.div
          key="uploader"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <ImageUploader />
        </motion.div>
      ) : (
        // --- EDITOR STATE ---
        <motion.div
          key="editor"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout // Keep the layout prop for internal resizing animations
          transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
          data-testid="image-preparation-container"
        >
          <Card variant="glass">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <UploadCloud className="h-6 w-6 text-primary" />
                    Prepare Your Image
                  </CardTitle>
                  <CardDescription>
                    Crop, and process your clothing image before generation.
                  </CardDescription>
                </div>
                <Button variant="destructive" size="sm" onClick={onReset} disabled={isAnyVersionProcessing}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Image
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {isMobile === false ? ( // DESKTOP VIEW
                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
                  <div className="relative flex flex-col items-center justify-center bg-muted/20 p-2 rounded-lg min-h-[70vh] shadow-lg shadow-black/10">
                    <ImageEditorCanvas
                      key={activeImage.id}
                      image={activeImage}
                      crop={crop}
                      aspect={aspect}
                      onCropChange={handleCropChange} // *** BUG FIX ***: Use new handler
                      onCropComplete={() => {}}
                      onImageLoad={onImageLoad}
                      disabled={isAnyVersionProcessing}
                      ruleOfThirds={true}
                    />
                  </div>
                  {hubContent}
                </div>
              ) : ( // MOBILE VIEW
                <div className="flex flex-col gap-4">
                  <div className="relative flex flex-col items-center justify-center bg-muted/20 p-2 rounded-lg min-h-[60vh] shadow-lg shadow-black/10">
                    <ImageEditorCanvas
                      key={activeImage.id}
                      image={activeImage}
                      crop={crop}
                      aspect={aspect}
                      onCropChange={handleCropChange} // *** BUG FIX ***: Use new handler
                      onCropComplete={() => {}}
                      onImageLoad={onImageLoad}
                      disabled={isAnyVersionProcessing}
                      ruleOfThirds={true}
                    />
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button className="w-full"><Brush className="mr-2 h-4 w-4" /> Edit & Manage Versions</Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85vh] p-4 flex flex-col">
                      {hubContent}
                    </SheetContent>
                  </Sheet>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

