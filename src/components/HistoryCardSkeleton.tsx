// src/components/HistoryCardSkeleton.tsx
"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

/**
 * Skeleton loader for HistoryCard
 * Matches the structure of the actual HistoryCard component
 */
export function HistoryCardSkeleton() {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg animate-pulse">
      <CardContent className="p-0">
        {/* Image skeleton */}
        <div className="relative aspect-square bg-muted">
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
        </div>

        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          {/* Date skeleton */}
          <div className="h-3 bg-muted rounded-sm w-24" />
          
          {/* Attributes skeletons */}
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 bg-muted rounded-full w-16" />
            <div className="h-5 bg-muted rounded-full w-20" />
            <div className="h-5 bg-muted rounded-full w-14" />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-2 pt-2">
            <div className="h-8 bg-muted rounded-sm flex-1" />
            <div className="h-8 bg-muted rounded-sm w-8" />
            <div className="h-8 bg-muted rounded-sm w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Gallery of skeleton loaders
 * @param count - Number of skeleton cards to render
 */
export function HistoryGallerySkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <HistoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
