// src/components/workspace/AssetStrip.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { getDisplayableImageUrl } from '@/lib/utils';
import { useImageStore } from '@/stores/imageStore';
import { History, Plus } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface AssetStripProps {
  recentUploads: string[];
}

/**
 * AssetStrip - A horizontal filmstrip of recent uploads at the bottom of the Input Stage.
 * Clicking an asset loads it into the main canvas.
 */
export function AssetStrip({ recentUploads }: AssetStripProps) {
  const { initializeFromUrl } = useImageStore();

  if (recentUploads.length === 0) return null;

  return (
    <div className="h-24 border-t border-white/5 bg-black/20 flex flex-col shrink-0">
      <div className="px-4 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <History className="h-3 w-3" /> Recent Assets
        </span>
      </div>
      
      <ScrollArea className="flex-1 w-full whitespace-nowrap px-4 pb-3">
        <div className="flex gap-2">
          {/* Upload New Placeholder (Visual cue - actual upload is in main stage) */}
          <div className="w-14 h-14 rounded-md border border-dashed border-white/10 flex items-center justify-center text-muted-foreground/50 shrink-0">
            <Plus className="h-5 w-5" />
          </div>

          {recentUploads.map((url, i) => (
            <button
              key={`${url}-${i}`}
              onClick={() => initializeFromUrl(url)}
              className="relative w-14 h-14 rounded-md overflow-hidden border border-white/5 hover:border-primary/50 transition-all hover:scale-105 active:scale-95 shrink-0 group"
            >
              <Image
                src={getDisplayableImageUrl(url) || ''}
                alt="Recent"
                fill
                className="object-cover"
                sizes="56px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>
    </div>
  );
}

export default AssetStrip;
