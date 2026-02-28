// src/components/ImageResultSkeleton.tsx
import React from 'react';

/**
 * Skeleton loader for image generation results.
 * Designed to fill its parent container (rendered inside an `absolute inset-0` wrapper).
 * Uses a subtle shimmer effect with no extra Card chrome.
 */
export function ImageResultSkeleton() {
  return (
    <div className="w-full h-full bg-muted/40 rounded-lg overflow-hidden animate-pulse flex flex-col items-center justify-center gap-3" role="status" aria-label="Loading image result">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      {/* Centered icon placeholder */}
      <div className="relative z-[1] flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted-foreground/10" />
        <div className="h-3 w-24 rounded-full bg-muted-foreground/10" />
        <div className="h-2 w-16 rounded-full bg-muted-foreground/[0.06]" />
      </div>
    </div>
  );
}

/**
 * Grid of image result skeletons
 * @param count - Number of skeleton cards to render (default: 3)
 */
export function ImageResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative aspect-[2/3] bg-muted/30 rounded-lg overflow-hidden">
          <ImageResultSkeleton />
        </div>
      ))}
    </div>
  );
}
