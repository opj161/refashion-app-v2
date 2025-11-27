// src/components/ImageEditorCanvas.tsx
"use client";

import React from "react";
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getDisplayableImageUrl } from "@/lib/utils";

interface ImageVersion {
  id: string;
  imageUrl: string;
}

interface ImageEditorCanvasProps {
  image: ImageVersion | null;
  aspect?: number;
  disabled?: boolean;
  crop?: Crop;
  onCropChange: (pixelCrop: PixelCrop, percentCrop: Crop) => void; // Be explicit about params
  onCropComplete: (crop: PixelCrop) => void;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  ruleOfThirds?: boolean; // New prop for enhancement
  imageDimensions?: { width: number; height: number }; // NEW PROP
}

export default function ImageEditorCanvas({ 
  image,
  aspect, 
  disabled = false, 
  crop,
  onCropChange, // Use refined prop
  onCropComplete,
  onImageLoad,
  ruleOfThirds = false, // Default to false
}: ImageEditorCanvasProps) {
  if (!image) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg min-h-[300px]">
        <p className="text-muted-foreground">No image selected.</p>
      </div>
    );
  }

  const imageUrlToDisplay = getDisplayableImageUrl(image.imageUrl);

  return (
    // Changed container styles to fill parent for flexible layout
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <ReactCrop 
        crop={crop}
        onChange={onCropChange}
        onComplete={(c) => onCropComplete(c)} 
        aspect={aspect} 
        disabled={disabled}
        ruleOfThirds={ruleOfThirds}
        keepSelection={true}
        style={{ maxHeight: '100%', maxWidth: '100%' }}
        className="max-h-full max-w-full"
      >
        {/* 
          CRITICAL: img styles for fixed viewport.
          object-contain ensures it scales down. 
          max-height: 100% relative to the flex container.
        */}
        <img 
          key={image.id}
          src={imageUrlToDisplay || '/placeholder.png'} 
          alt="Image for cropping" 
          onLoad={onImageLoad} 
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 200px)', // Fallback calculation
            height: 'auto',
            width: 'auto',
            objectFit: 'contain',
            touchAction: 'none'
          }}
          className="max-h-full w-auto object-contain"
        />
      </ReactCrop>
    </div>
  );
}