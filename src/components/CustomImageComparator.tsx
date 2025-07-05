"use client";

import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { getDisplayableImageUrl } from '@/lib/utils';

interface CustomImageComparatorProps {
  leftImageUri: string;
  rightImageUri: string;
}

export default function CustomImageComparator({
  leftImageUri,
  rightImageUri,
}: CustomImageComparatorProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="w-full relative overflow-hidden rounded-lg bg-muted cursor-ew-resize"
      onMouseDown={handleMouseDown}
    >
      {/* Base/Right Image (for sizing and as the 'After' view) */}
      <img
        src={getDisplayableImageUrl(rightImageUri) || ''}
        alt="After"
        className="w-full max-h-[60vh] object-contain"
        draggable={false}
      />

      {/* Clipped Left Image (Overlay 'Before' view) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={getDisplayableImageUrl(leftImageUri) || ''}
          alt="Before"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      />

      {/* Slider Handle */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full border-2 border-primary shadow-lg flex items-center justify-center z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <ChevronsLeftRight className="h-5 w-5 text-primary" />
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Before
      </div>
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        After
      </div>
    </div>
  );
}
