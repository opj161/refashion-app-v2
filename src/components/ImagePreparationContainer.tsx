// src/components/ImagePreparationContainer.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImageStore, useActiveImage } from "@/stores/imageStore";
import { useToast } from "@/hooks/use-toast";
import { getDisplayableImageUrl } from "@/lib/utils";

// New Components
import ImageUploader from "./ImageUploader";
import ImageEditorCanvas from "./ImageEditorCanvas";
import ImageProcessingTools from "./ImageProcessingTools";
import AspectRatioSelector from "./AspectRatioSelector";
import ImageVersionStack from "./ImageVersionStack";

import { 
  UploadCloud, CheckCircle, RefreshCw, Loader2, Trash2 
} from "lucide-react";

// --- Constants ---
const SERVER_IMAGE_PATH_PREFIX = '/uploads/';

// --- Helper function to get the default aspect based on mode ---
const getDefaultAspect = (mode: 'image' | 'video') => {
  return mode === 'video' ? 9 / 16 : 3 / 4;
};

interface ImagePreparationContainerProps {
  onImageReady: (imageDataUri: string | null) => void;
  sourceImageUrl?: string | null;
  preparationMode: 'image' | 'video';
}

export default function ImagePreparationContainer({ 
  onImageReady, 
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
    setProcessing
  } = useImageStore();
  
  const activeImage = useActiveImage();

  // Local UI state
  const [aspect, setAspect] = useState<number | undefined>(getDefaultAspect(preparationMode));
  const [isConfirmed, setIsConfirmed] = useState(false);

  // --- Effects ---
  
  // Update aspect ratio when preparation mode changes
  useEffect(() => {
    const newDefaultAspect = getDefaultAspect(preparationMode);
    setAspect(newDefaultAspect);
  }, [preparationMode]);

  // --- Handlers ---
  
  const handleSetActiveVersion = useCallback((versionId: string) => {
    setActiveVersion(versionId);
  }, [setActiveVersion]);

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
    
    onImageReady(finalDataUri);
    setIsConfirmed(true);
    setProcessing(false, null);
    toast({ title: "Image Confirmed", description: "Proceed to generation parameters." });
  }, [activeImage, onImageReady, toast, setProcessing]);

  const handleChangeImage = () => {
    resetStore();
    setIsConfirmed(false);
    onImageReady(null);
  };

  const resetAllState = useCallback(() => {
    resetStore();
    setIsConfirmed(false);
    onImageReady(null);
  }, [resetStore, onImageReady]);

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
          {/* Main Image Editor */}
          <div className="lg:col-span-3">
            <ImageEditorCanvas 
              preparationMode={preparationMode}
              aspect={aspect}
              disabled={isConfirmed}
            />
          </div>

          {/* Controls Panel */}
          <div className="lg:col-span-1 flex flex-col space-y-6">
            <AspectRatioSelector
              preparationMode={preparationMode}
              aspect={aspect}
              onAspectChange={setAspect}
              disabled={isConfirmed}
            />

            <div className={`space-y-3 ${isConfirmed ? 'opacity-50 pointer-events-none' : ''}`}>
              <ImageProcessingTools
                preparationMode={preparationMode}
                disabled={isConfirmed}
              />
            </div>

            <div className="pt-6 border-t mt-auto">
              {isConfirmed ? (
                <Button onClick={handleChangeImage} size="lg" className="w-full" variant="outline">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Change Image
                </Button>
              ) : (
                <Button 
                  onClick={handleConfirmForGeneration} 
                  disabled={!activeImage || isProcessing} 
                  size="lg" 
                  className="w-full"
                >
                  {processingStep === 'confirm' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Confirm and Continue
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Version Stack - Always visible when there are images */}
        {Object.keys(versions).length > 0 && (
          <ImageVersionStack
            versions={versions}
            activeVersionId={activeVersionId}
            onSetActiveVersion={handleSetActiveVersion}
            isProcessing={isProcessing}
          />
        )}
      </CardContent>
    </Card>
  );
}