// src/components/ImageEditorCanvas.tsx
"use client";

import React from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
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
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: PixelCrop) => void;
  onImageLoad: (img: HTMLImageElement) => void;
}

export default function ImageEditorCanvas({ 
  image,
  aspect, 
  disabled = false, 
  crop,
  onCropChange,
  onCropComplete,
  onImageLoad,
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
    <ReactCrop 
      crop={crop}
      onChange={(_, percentCrop) => onCropChange(percentCrop)} 
      onComplete={(c) => onCropComplete(c)} 
      aspect={aspect} 
      className="max-h-[60vh]" 
      disabled={disabled}
    >
      <Image 
        key={image.id}
        src={imageUrlToDisplay || '/placeholder.png'} 
        alt="Image for cropping" 
        onLoad={(e) => onImageLoad(e.currentTarget)} 
        className="max-h-[60vh] object-contain" 
        width={800}
        height={600}
        sizes="(max-width: 1023px) 100vw, 75vw"
        priority
      />
    </ReactCrop>
  );
}