'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';
import { getDisplayableImageUrl, cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface RecentAssetsPanelProps {
  images: string[];
  onSelect: (url: string) => void;
  disabled: boolean;
}

export function RecentAssetsPanel({ images, onSelect, disabled }: RecentAssetsPanelProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-col h-full border-t md:border-t-0 md:border-l border-border/40 md:pl-5 pt-5 md:pt-0">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        <Clock className="w-3.5 h-3.5" />
        <span>Recent Uploads</span>
      </div>

      {/* Desktop: Vertical Grid */}
      <div className="hidden md:grid grid-cols-2 gap-3 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
        {images.map((url, i) => (
          <AssetButton 
            key={url} 
            url={url} 
            onSelect={onSelect} 
            disabled={disabled} 
          />
        ))}
      </div>

      {/* Mobile: Horizontal Scroll */}
      <ScrollArea className="md:hidden w-full whitespace-nowrap pb-2">
        <div className="flex space-x-3">
          {images.map((url, i) => (
             <AssetButton 
               key={url} 
               url={url} 
               onSelect={onSelect} 
               disabled={disabled} 
               mobile 
             />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function AssetButton({ url, onSelect, disabled, mobile }: { url: string, onSelect: (u:string) => void, disabled: boolean, mobile?: boolean }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering parent click events if any
        onSelect(url);
      }}
      disabled={disabled}
      className={cn(
        "group relative overflow-hidden rounded-md border border-border/50 bg-muted/30 hover:border-primary/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
        mobile ? "w-24 h-24 flex-shrink-0 touch-manipulation" : "w-full aspect-square"
      )}
      title="Use this image"
      type="button"
    >
      <Image
        src={getDisplayableImageUrl(url) || ''}
        alt="Recent upload"
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 768px) 80px, 150px"
      />
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 bg-background/95 backdrop-blur-sm rounded-full p-1.5 shadow-sm transform scale-75 group-hover:scale-100 transition-all duration-200">
          <ArrowRight className="w-3 h-3 text-primary" />
        </div>
      </div>
    </button>
  );
}
