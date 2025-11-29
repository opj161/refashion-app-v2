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
    <div className="flex flex-col h-full lg:border-l border-white/10 lg:pl-6 pt-0 lg:pt-0">
      <div className="flex items-center justify-between mb-4 px-1">
         <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
           <Clock className="w-3.5 h-3.5" />
           <span>Recent</span>
         </div>
         <span className="text-[10px] text-muted-foreground/60 bg-white/5 px-2 py-0.5 rounded-full">Last 12</span>
      </div>

      {/* Desktop: Vertical Grid */}
      <div className="hidden lg:grid grid-cols-2 gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
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
      <ScrollArea className="lg:hidden w-full whitespace-nowrap pb-2">
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
        "group relative overflow-hidden rounded-lg border border-white/10 bg-black/20 hover:border-primary/50 transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
        // Changed aspect-square to aspect-[3/4] for better fashion framing
        mobile ? "w-24 h-32 flex-shrink-0 touch-manipulation" : "w-full aspect-[3/4]"
      )}
      title="Use this image"
      type="button"
    >
      <Image
        src={getDisplayableImageUrl(url) || ''}
        alt="Recent upload"
        fill
        // Changed from center default to object-top to prioritize faces/shoulders
        className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 768px) 80px, 150px"
      />
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 bg-background/95 backdrop-blur-xs rounded-full p-1.5 shadow-xs transform scale-75 group-hover:scale-100 transition-all duration-200">
          <ArrowRight className="w-3 h-3 text-primary" />
        </div>
      </div>
    </button>
  );
}
