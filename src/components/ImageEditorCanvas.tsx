// src/components/ImageEditorCanvas.tsx
"use client";

import React from "react";
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Image from 'next/image';
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

  // --- THE CORE FIX ---
  // We create a wrapper div that will be dynamically sized to match the image's aspect ratio.
  // This ensures the ReactCrop component has the exact same dimensions as the image, eliminating black bars.
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div 
        className="relative"
        style={{ 
          width: imageDimensions ? '100%' : 'auto',
          // Set aspect ratio dynamically once dimensions are known.
          // This prevents layout shift and ensures the container is correctly sized.
          aspectRatio: imageDimensions ? `${imageDimensions.width} / ${imageDimensions.height}` : 'auto',
          // Max height is still respected, but the width will shrink accordingly.
          maxHeight: '60vh' 
        }}
      >
        {imageUrlToDisplay && (
          <ReactCrop 
            crop={crop}
            onChange={onCropChange}
            onComplete={(c) => onCropComplete(c)} 
            aspect={aspect} 
            // The crop component should fill its new, perfectly-sized container.
            className="w-full h-full" 
            disabled={disabled}
            ruleOfThirds={ruleOfThirds}
            keepSelection={true}
          >
            <Image 
              key={image.id}
              src={imageUrlToDisplay} 
              alt="Image for cropping" 
              onLoad={onImageLoad} 
              // The image should fill the ReactCrop component.
              fill
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 1023px) 100vw, 75vw"
              priority
            />
          </ReactCrop>
        )}
      </div>
    </div>
  );
}