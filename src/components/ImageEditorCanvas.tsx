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
  imageDimensions, // NEW PROP
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
    <div className="w-full flex-1 flex items-center justify-center">
      <ReactCrop 
        crop={crop}
        onChange={onCropChange}
        onComplete={(c) => onCropComplete(c)} 
        aspect={aspect} 
        disabled={disabled}
        ruleOfThirds={ruleOfThirds}
        keepSelection={true}
      >
        <img 
          key={image.id}
          src={imageUrlToDisplay || '/placeholder.png'} 
          alt="Image for cropping" 
          onLoad={onImageLoad} 
          style={{
            maxHeight: '65vh',
            maxWidth: '100%',
            height: 'auto',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
      </ReactCrop>
    </div>
  );
}