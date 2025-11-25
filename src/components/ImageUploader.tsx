// src/components/ImageUploader.tsx
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";
import { UploadCloud, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import { RecentAssetsPanel } from './RecentAssetsPanel';
import { recreateStateFromImageUrl } from '@/actions/imageActions';
import { cn } from '@/lib/utils';

// --- Constants ---
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'];

interface ImageUploaderProps {
  recentUploads?: string[];
}
import { useRouter } from 'next/navigation';

export default function ImageUploader({ recentUploads = [] }: ImageUploaderProps) {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  
  // Zustand state
  const { uploadOriginalImage, setOriginal } = useImageStore();
  
  // Local UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const [isDraggingOverDropZone, setIsDraggingOverDropZone] = useState(false);

  // Define variants for the dropzone's different states - more subtle
  const dropZoneVariants = {
    idle: {
      borderColor: 'hsl(210 10% 23%)',
      backgroundColor: 'hsla(224 40% 8% / 0.5)'
    },
    dragOver: {
      borderColor: 'hsl(173 71% 42%)',
      backgroundColor: 'hsla(173 71% 42% / 0.1)',
      scale: 1.015,
    },
  };

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

    setIsUploading(true);
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
      router.refresh();
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process the uploaded image.";
      toast({ 
        title: "Upload Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, uploadOriginalImage, router]);

  // --- Recent Asset Handling ---
  const handleRecentSelect = async (url: string) => {
    if (isUploading || isLoadingRecent) return;
    
    setIsLoadingRecent(true);
    try {
      const result = await recreateStateFromImageUrl(url);
      
      if (!result.success) throw new Error(result.error);

      // Manually set the original state in the store since we're bypassing the upload flow
      // We create a dummy file object because the store expects it, but it might not be strictly necessary if we populate everything else
      // However, looking at the store, uploadOriginalImage does a lot. 
      // Ideally we should have a `setOriginalFromUrl` action in the store, but `setOriginal` seems to be exposed.
      // Let's check if `setOriginal` is exposed. The user code snippet used `setOriginal`.
      // Assuming `setOriginal` takes { file, imageUrl, hash, width, height }
      
      setOriginal({
        file: new File([], 'history_image.png', { type: 'image/png' }), 
        imageUrl: result.imageUrl,
        hash: result.hash,
        width: result.originalWidth,
        height: result.originalHeight
      });

      toast({ 
        title: "Image Loaded", 
        description: "Restored from your recent uploads." 
      });
    } catch (error) {
      console.error('Error loading recent image:', error);
      toast({ 
        title: "Error", 
        description: "Could not load this image.", 
        variant: "destructive" 
      });
    } finally {
       setIsLoadingRecent(false);
    }
  };

  // --- Event Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
  };
  
  const handleDragAction = useCallback((e: React.DragEvent, action: 'enter' | 'leave' | 'over' | 'drop') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUploading) return;
    
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
  }, [processFile, isUploading]);

  // Modify handleDragAction to set state for the drop zone specifically
  const handleDropZoneDrag = (e: React.DragEvent, action: 'enter' | 'leave') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverDropZone(action === 'enter');
  };

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

  // Determine layout mode
  const hasHistory = recentUploads.length > 0;
  const isDisabled = isUploading || isLoadingRecent;

  return (
    <>
      {/* Global drag overlay */}
      {isDraggingOverPage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <UploadCloud 
            className="h-24 w-24 text-primary"
            style={{ animation: 'var(--motion-bounce-subtle) infinite' }}
          />
          <p className="mt-4 text-2xl font-semibold text-foreground">Drop image to upload</p>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-primary" />
            Upload Your Image
          </CardTitle>
          <CardDescription>
            Drag and drop your clothing image, or click to browse.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className={cn(
            "grid gap-6 transition-all duration-300 ease-in-out",
            hasHistory ? "grid-cols-1 md:grid-cols-[1fr_240px]" : "grid-cols-1"
          )}>
            
            {/* Left Side: Drop Zone */}
            <div className="flex flex-col h-full min-h-[280px]">
              <motion.div
                animate={isDraggingOverDropZone ? "dragOver" : "idle"}
                variants={dropZoneVariants}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "flex-1 p-8 rounded-lg flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed cursor-pointer transition-opacity",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && fileInputRef.current?.click()}
                onDragEnter={(e) => handleDropZoneDrag(e, 'enter')}
                onDragLeave={(e) => handleDropZoneDrag(e, 'leave')}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { setIsDraggingOverDropZone(false); handleDragAction(e, 'drop'); }}
              >
                {isUploading || isLoadingRecent ? (
                  <>
                    <Loader2 className="w-16 h-16 mb-4 text-primary animate-spin" />
                    <p className="font-semibold text-foreground">
                      {isUploading ? "Processing Upload..." : "Restoring Image..."}
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: isDraggingOverDropZone ? 1.05 : 1, y: isDraggingOverDropZone ? -3 : 0 }}
                    >
                      <UploadCloud className="w-16 h-16 mb-4 text-muted-foreground" />
                    </motion.div>
                    <p className="font-semibold text-foreground">Click to upload or drag & drop</p>
                    <p className="text-sm">PNG, JPG, WEBP, etc.</p>
                  </>
                )}
                <Input 
                  id="image-upload" 
                  type="file" 
                  className="sr-only" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept={ALLOWED_FILE_TYPES.join(',')} 
                  disabled={isDisabled}
                />
              </motion.div>
            </div>

            {/* Right Side: Recent Panel */}
            {hasHistory && (
               <RecentAssetsPanel 
                 images={recentUploads} 
                 onSelect={handleRecentSelect}
                 disabled={isDisabled} 
               />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

