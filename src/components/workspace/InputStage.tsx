// src/components/workspace/InputStage.tsx
'use client';

import React, { useCallback } from 'react';
import { useImageStore } from '@/stores/imageStore';
import ImageEditorCanvas from '@/components/ImageEditorCanvas';
import ImageUploader from '@/components/ImageUploader';
import { CanvasToolbar } from './CanvasToolbar';
import { AssetStrip } from './AssetStrip';
import { UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Crop, PixelCrop } from 'react-image-crop';

interface InputStageProps {
  recentUploads?: string[];
}

/**
 * InputStage - The left column of the workspace.
 * Contains the image uploader/canvas with floating toolbar and asset strip.
 */
export function InputStage({ recentUploads = [] }: InputStageProps) {
  const { 
    versions, 
    activeVersionId, 
    crop, 
    aspect, 
    setDimensions, 
    setAspect,
    setCrop 
  } = useImageStore();

  const activeImage = activeVersionId ? versions[activeVersionId] : null;

  // Handler for when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setDimensions(naturalWidth, naturalHeight);
    if (aspect) setAspect(aspect);
  }, [setDimensions, setAspect, aspect]);

  // Handler for crop changes
  const handleCropChange = useCallback((pixelCrop: PixelCrop, percentCrop: Crop) => {
    setCrop(percentCrop);
  }, [setCrop]);

  return (
    <section className="flex flex-col h-full w-full bg-black/20 min-w-0 lg:flex">
      {/* Header */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Input Stage
        </span>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative min-h-0 w-full flex items-center justify-center bg-dot-pattern p-4 overflow-hidden group">
        
        <AnimatePresence mode="wait">
          {!activeImage ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full"
            >
              {/* Use showRecentUploads=false since we show the AssetStrip below */}
              <ImageUploader recentUploads={[]} showRecentUploads={false} />
            </motion.div>
          ) : (
            <motion.div 
              key="canvas"
              className="w-full h-full flex items-center justify-center relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Image Editor Canvas */}
              <div className="relative w-full h-full flex items-center justify-center">
                <ImageEditorCanvas
                  image={activeImage}
                  crop={crop}
                  aspect={aspect}
                  onCropChange={handleCropChange}
                  onCropComplete={() => {}}
                  onImageLoad={onImageLoad}
                />
              </div>

              {/* Floating Toolbar - Only show when image is active */}
              <CanvasToolbar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Asset Strip at Bottom */}
      <AssetStrip recentUploads={recentUploads} />
      
    </section>
  );
}

export default InputStage;
