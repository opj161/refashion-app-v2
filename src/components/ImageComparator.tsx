"use client";

import React from 'react';
import ReactCompareImage from 'react-compare-image';
import { ChevronsLeftRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDisplayableImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ImageComparatorProps {
  leftImageUrl: string;
  rightImageUrl: string;
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
  leftImageUrl,
  rightImageUrl,
}: ImageComparatorProps) {
  return (
    // This div makes the component fill its parent container.
    <div className="w-full h-full image-comparator-wrapper">
      {/*
        EXPLANATION: Global Style Override for react-compare-image Library
        
        The react-compare-image library applies an inline style of `object-fit: cover`
        to its images, which causes unwanted cropping behavior. To preserve the full
        image without cropping, we need to override this with `object-fit: contain`.
        
        Because inline styles have the highest CSS specificity, the only way to override
        them is by using `!important` in our CSS rule. This is one of the rare cases where
        `!important` is justified and necessary.
        
        The `.image-comparator-wrapper` class scopes this override to only affect images
        within this specific component, preventing any unintended side effects elsewhere
        in the application.
      */}
      <style jsx global>{`
        .image-comparator-wrapper .ReactCompareImage_img {
          object-fit: contain !important;
        }
      `}</style>
      <ReactCompareImage
        leftImage={getDisplayableImageUrl(leftImageUrl) || ''}
        rightImage={getDisplayableImageUrl(rightImageUrl) || ''}
        hover={true}
        handle={<CustomHandle />}
        sliderLineWidth={3}
        sliderLineColor="hsl(var(--primary))"
        skeleton={<ComparisonSkeleton />}
      />
    </div>
  );
}
