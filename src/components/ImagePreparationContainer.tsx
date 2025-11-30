"use client";

import React, { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type PixelCrop, type Crop } from 'react-image-crop';
import { m, AnimatePresence } from 'motion/react';
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
  recentUploads?: string[];
}

export default function ImagePreparationContainer({
  preparationMode,
  onReset,
  resetRef,
  recentUploads = [],
}: ImagePreparationContainerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const {
    versions,
    activeVersionId,
    crop,
    aspect,
    imageDimensions,
    applyCrop,
    reset,
    setAspect,
    // setDimensions, // Removed: No longer needed here
    setCrop,
  } = useImageStore();

  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');

  React.useEffect(() => {
    if (resetRef) {
      resetRef.current = reset;
    }
  }, [reset, resetRef]);

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
    setIsCropping(true);
  };

  // Refactored: Only handles Aspect Ratio logic now
  // Dimensions are handled internally by ImageEditorCanvas
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      setAspect(aspect);
    }
  }, [setAspect, aspect]);

  const handleCropChange = (pixelCrop: PixelCrop, percentCrop: Crop) => {
    setCrop(percentCrop);
    if (!isCropping && percentCrop.width > 0 && percentCrop.height > 0) {
      setIsCropping(true);
    }
  };

  const hubContent = (
    <EditingHubSidebar
      preparationMode={preparationMode}
      isCropping={isCropping}
      isProcessing={isAnyVersionProcessing}
      aspect={aspect}
      onAspectChange={handleAspectChange}
      onConfirmCrop={handleApplyCrop}
      onCancelCrop={handleCancelCrop}
      versions={versions}
      activeVersionId={activeVersionId}
    />
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2, ease: 'easeIn' as const } },
  };

  return (
    <AnimatePresence mode="wait">
      {!activeImage ? (
        <m.div
          key="uploader"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <ImageUploader recentUploads={recentUploads} />
        </m.div>
      ) : (
        <m.div
          key="editor"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
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
              {isMobile === false ? (
                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
                  <div className="relative flex flex-col items-center justify-center bg-muted/20 p-2 rounded-lg min-h-[70vh] shadow-lg shadow-black/10">
                    <ImageEditorCanvas
                      key={activeImage.id}
                      image={activeImage}
                      crop={crop}
                      aspect={aspect}
                      onCropChange={handleCropChange}
                      onCropComplete={() => { }}
                      onImageLoad={onImageLoad}
                      disabled={isAnyVersionProcessing}
                      ruleOfThirds={true}
                    />
                  </div>
                  {hubContent}
                </div>
              ) : (
                <div className="flex flex-col h-[calc(100dvh-220px)] gap-4">
                  <div className="relative flex-1 flex flex-col items-center justify-center bg-muted/20 p-2 rounded-lg shadow-lg shadow-black/10 overflow-hidden min-h-0">
                    <ImageEditorCanvas
                      key={activeImage.id}
                      image={activeImage}
                      crop={crop}
                      aspect={aspect}
                      onCropChange={handleCropChange}
                      onCropComplete={() => { }}
                      onImageLoad={onImageLoad}
                      disabled={isAnyVersionProcessing}
                      ruleOfThirds={true}
                    />
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button className="w-full h-12 text-base shadow-xl"><Brush className="mr-2 h-5 w-5" /> Edit & Manage Versions</Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85vh] p-4 flex flex-col">
                      {hubContent}
                    </SheetContent>
                  </Sheet>
                </div>
              )}
            </CardContent>
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  );
}
