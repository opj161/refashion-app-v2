"use client";

import React from 'react';
import ReactCompareImage from 'react-compare-image';
import { ChevronsLeftRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDisplayableImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ImageComparatorProps {
  leftImageUri: string;
  rightImageUri: string;
  className?: string;
}

const CustomHandle = () => (
  <div className="flex items-center justify-center h-10 w-10 bg-white/80 backdrop-blur-sm rounded-full border shadow-md cursor-ew-resize opacity-75 group-hover:opacity-100 transition-opacity">
    <ChevronsLeftRight className="h-5 w-5 text-gray-700" />
  </div>
);

const ComparisonSkeleton = () => (
  <div className="w-full h-full max-h-[60vh] bg-muted rounded-md flex items-center justify-center">
    <Skeleton className="w-full h-full" />
  </div>
);

export default function ImageComparator({
  leftImageUri,
  rightImageUri,
  className,
}: ImageComparatorProps) {
  return (
    <div className={cn("image-comparator-container w-full", className)}>
      {/* This style block is crucial. It targets the img elements directly
          within the react-compare-image component, forcing them to scale
          correctly without stretching or overflowing. */}
      <style>{`
        .image-comparator-container > div {
          max-height: 60vh;
        }
        .image-comparator-container img {
          object-fit: contain !important;
          max-height: 60vh !important;
        }
      `}</style>
      <ReactCompareImage
        leftImage={getDisplayableImageUrl(leftImageUri) || ''}
        rightImage={getDisplayableImageUrl(rightImageUri) || ''}
        hover={true}
        handle={<CustomHandle />}
        sliderLineWidth={3}
        sliderLineColor="hsl(var(--primary))"
        skeleton={<ComparisonSkeleton />}
      />
    </div>
  );
}
