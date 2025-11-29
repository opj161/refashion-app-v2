"use client";

import React from "react";
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { getDisplayableImageUrl } from "@/lib/utils";
import { useImageStore } from "@/stores/imageStore";

interface ImageVersion {
  id: string;
  imageUrl: string;
}

interface ImageEditorCanvasProps {
  image: ImageVersion | null;
  aspect?: number;
  disabled?: boolean;
  crop?: Crop;
  onCropChange: (pixelCrop: PixelCrop, percentCrop: Crop) => void;
  onCropComplete: (crop: PixelCrop) => void;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  ruleOfThirds?: boolean;
}

export default function ImageEditorCanvas({
  image,
  aspect,
  disabled = false,
  crop,
  onCropChange,
  onCropComplete,
  onImageLoad,
  ruleOfThirds = false,
}: ImageEditorCanvasProps) {
  // Access store action directly
  const setDimensions = useImageStore(state => state.setDimensions);

  // NEW: Subscribe to scale state
  const scale = useImageStore(state => state.scale);

  // Enhanced load handler
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;

    // 1. Immediately sync dimensions to store (The Fix)
    setDimensions(naturalWidth, naturalHeight);

    // 2. Call parent handler
    if (onImageLoad) onImageLoad(e);
  };

  if (!image) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg min-h-[300px]">
        <p className="text-muted-foreground">No image selected.</p>
      </div>
    );
  }

  const imageUrlToDisplay = getDisplayableImageUrl(image.imageUrl);

  return (
    <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
      <div
        // 5. PERFORMANCE: Add will-change-transform
        // This hints to the browser that 'transform' will change, optimizing the 
        // composite layer for the scaling animation used below.
        className="will-change-transform"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.2s ease-out',
          transformOrigin: 'center center'
        }}
      >
        <ReactCrop
          crop={crop}
          onChange={onCropChange}
          onComplete={(c) => onCropComplete(c)}
          aspect={aspect}
          disabled={disabled}
          ruleOfThirds={ruleOfThirds}
          keepSelection={true}
          style={{ touchAction: 'none' }}
        >
          <img
            key={image.id}
            src={imageUrlToDisplay || '/placeholder.png'}
            alt="Image for cropping"
            onLoad={handleLoad}
            style={{
              maxHeight: '65vh', // Keeping original layout constraint
              maxWidth: '100%',
              height: 'auto',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </ReactCrop>
      </div>
    </div>
  );
}