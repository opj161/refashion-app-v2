// src/components/HistoryCardSkeleton.tsx
"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export function HistoryCardSkeleton() {
  return (
    <Card className="group overflow-hidden border border-white/5 bg-card/30">
      <CardContent className="p-0">
        {/* Image skeleton with shimmer */}
        <div className="relative aspect-2/3 bg-muted overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-white/10" />
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Content skeleton */}
        <div className="p-4 space-y-3 bg-card/50">
          {/* Badge skeletons */}
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
            <div className="h-6 w-12 rounded-full bg-white/10 animate-pulse" />
          </div>
          
          {/* Text skeletons */}
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded-sm bg-white/10 animate-pulse" />
            <div className="h-3 w-1/2 rounded-sm bg-white/5 animate-pulse" />
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

export function HistoryGallerySkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <HistoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
