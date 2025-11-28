"use client";

import React from "react";
import { useImageStore } from "@/stores/imageStore";
import ReactCrop, { type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getDisplayableImageUrl } from "@/lib/utils";

interface ImageEditorCanvasProps {
  image: { id: string; imageUrl: string; };
}

export default function ImageEditorCanvas({
  image,
}: ImageEditorCanvasProps) {
  const { crop, setCrop, setCompletedCrop, aspect, setDimensions, scale } = useImageStore();

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setDimensions(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight);
  };

  if (!image) {
    return null;
  }

  const imageUrlToDisplay = getDisplayableImageUrl(image.imageUrl);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
    >
      <ReactCrop
        crop={crop}
        onChange={(_, percentCrop) => setCrop(percentCrop)}
        onComplete={(c) => setCompletedCrop(c)}
        aspect={aspect}
        ruleOfThirds={true}
        keepSelection={true}
        className="w-full h-full flex justify-center items-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlToDisplay || '/placeholder.png'}
          alt="Editor"
          onLoad={onImageLoad}
          style={{
            objectFit: 'contain',
            width: '100%',
            height: '100%',
          }}
        />
      </ReactCrop>
    </div>
  );
}