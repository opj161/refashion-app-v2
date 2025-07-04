// src/components/ImageUploader.tsx
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";
import { UploadCloud } from "lucide-react";

// --- Constants ---
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'];

interface ImageUploaderProps {
  sourceImageUrl?: string | null;
}

export default function ImageUploader({ sourceImageUrl }: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  
  // Store state
  const { original, isProcessing, reset, uploadOriginalImage } = useImageStore();
  
  // Local UI state
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);

  // --- File Processing ---
  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    
    // Validate file
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({ 
        title: "File Too Large", 
        description: `File must be under ${MAX_FILE_SIZE_MB}MB.`, 
        variant: "destructive" 
      });
      return;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ 
        title: "Invalid File Type", 
        description: "Please upload a valid image file (PNG, JPG, WEBP, etc.).", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const { resized, originalWidth, originalHeight } = await uploadOriginalImage(file);
      let toastDescription = "Your image is ready for editing.";
      if (resized) {
        toastDescription = `Image was downscaled from ${originalWidth}x${originalHeight} and is ready for editing.`;
      }
      toast({ 
        title: "Image Uploaded", 
        description: toastDescription
      });
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process the uploaded image.";
      toast({ 
        title: "Upload Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  }, [toast, uploadOriginalImage]);

  // --- Event Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
  };
  
  const handleDragAction = useCallback((e: React.DragEvent, action: 'enter' | 'leave' | 'over' | 'drop') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    
    if (action === 'enter') {
      dragCounter.current++;
    }
    if (action === 'leave') {
      dragCounter.current--;
    }
    
    setIsDraggingOverPage(dragCounter.current > 0);

    if (action === 'drop' && e.dataTransfer.files.length > 0) {
      dragCounter.current = 0;
      setIsDraggingOverPage(false);
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile, isProcessing]);

  // --- Effects ---
  
  // Handle drag and drop events on the page
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

  // Load image from sourceImageUrl when provided (for history restoration)
  useEffect(() => {
    if (sourceImageUrl && !original) {
      const loadImageFromUrl = async () => {
        try {
          // Import getDisplayableImageUrl utility
          const { getDisplayableImageUrl } = await import("@/lib/utils");
          const displayUrl = getDisplayableImageUrl(sourceImageUrl);
          
          if (!displayUrl) {
            console.warn('Could not generate displayable URL for:', sourceImageUrl);
            return;
          }

          const response = await fetch(displayUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }

          const blob = await response.blob();
          
          // Create a File object from the blob
          const file = new File([blob], 'loaded-image.jpg', { type: blob.type });
          await uploadOriginalImage(file);
          // Removed toast for 'Image Loaded' here
        } catch (error) {
          console.error('Error loading image from sourceImageUrl:', error);
          toast({ 
            title: "Load Error", 
            description: "Failed to load the original image from history.", 
            variant: "destructive" 
          });
        }
      };

      loadImageFromUrl();
    }
  }, [sourceImageUrl, original, toast, reset, uploadOriginalImage]);

  // Don't render if we already have an image
  if (original) {
    return null;
  }

  return (
    <>
      {/* Global drag overlay */}
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
            Upload Your Image
          </CardTitle>
          <CardDescription>
            Upload your clothing image to get started. Drag and drop or click to browse.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div 
            className="p-12 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors" 
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => handleDragAction(e, 'enter')}
            onDragLeave={(e) => handleDragAction(e, 'leave')}
            onDragOver={(e) => handleDragAction(e, 'over')}
            onDrop={(e) => handleDragAction(e, 'drop')}
          >
            <UploadCloud className="w-16 h-16 mb-4" />
            <p className="font-semibold text-foreground">Click to upload or drag & drop</p>
            <p className="text-sm">PNG, JPG, WEBP, etc.</p>
            
            <Input 
              id="image-upload" 
              type="file" 
              className="sr-only" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept={ALLOWED_FILE_TYPES.join(',')} 
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
