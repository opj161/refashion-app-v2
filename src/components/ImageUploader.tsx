// src/components/ImageUploader.tsx
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";
import { UploadCloud, Loader2 } from "lucide-react";
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// --- Constants ---
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'];

interface ImageUploaderProps {
  recentUploads?: string[];
}

export default function ImageUploader({ recentUploads = [] }: ImageUploaderProps) {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Zustand state
  const { uploadOriginalImage } = useImageStore();

  // Local UI state
  const [isUploading, setIsUploading] = useState(false);
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

  const isDisabled = isUploading;

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

      {/* Removed Card wrapper or styled it to be transparent/borderless if inside InputStage */}
      <div
        className={cn(
          "flex flex-col items-center justify-center p-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-300 cursor-pointer gap-6 group",
          isDraggingOverDropZone && "border-primary/50 bg-primary/5"
        )}
        onClick={() => !isDisabled && fileInputRef.current?.click()}
        onDragEnter={(e) => handleDropZoneDrag(e, 'enter')}
        onDragLeave={(e) => handleDropZoneDrag(e, 'leave')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { setIsDraggingOverDropZone(false); handleDragAction(e, 'drop'); }}
      >
        <motion.div animate={{ scale: isDraggingOverDropZone ? 1.1 : 1 }}>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UploadCloud className="w-10 h-10 text-primary" />
          </div>
        </motion.div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Upload Source Image</h3>
          <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
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
      </div>
    </>
  );
}
