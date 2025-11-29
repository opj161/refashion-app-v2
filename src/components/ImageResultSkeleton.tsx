// src/components/ImageResultSkeleton.tsx
"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

/**
 * Skeleton loader for image generation results
 * Matches the structure of the image result cards in image-parameters
 */
export function ImageResultSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <CardContent className="p-4 space-y-4">
        {/* Image skeleton */}
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted-foreground/5 to-muted" />
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <div className="h-9 bg-muted rounded-sm flex-1" />
          <div className="h-9 bg-muted rounded-sm w-9" />
        </div>
      </CardContent>
    </Card>
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
        <ImageResultSkeleton key={i} />
      ))}
    </div>
  );
}
