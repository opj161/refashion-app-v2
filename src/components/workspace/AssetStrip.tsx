'use client';

import React from 'react';
import Image from 'next/image';
import { getDisplayableImageUrl } from '@/lib/utils';
import { useImageStore } from '@/stores/imageStore';
import { Plus } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AssetStripProps {
    recentUploads: string[];
}

export function AssetStrip({ recentUploads }: AssetStripProps) {
    const { initializeFromUrl } = useImageStore();

    return (
        <div className="w-full h-20 px-4 py-3 flex items-center gap-4">

            {/* Upload New Button */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="shrink-0 h-14 w-14 rounded-lg border border-dashed border-white/20 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all group"
                            onClick={() => document.getElementById('image-upload')?.click()}
                        >
                            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">New</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Upload New Image</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <div className="h-8 w-px bg-white/10" />

            {/* Scrollable Assets */}
            <ScrollArea className="flex-1 w-full whitespace-nowrap">
                <div className="flex gap-3 pb-2">
                    {recentUploads.length === 0 ? (
                        <div className="flex items-center text-muted-foreground/50 text-xs italic px-2 h-14">
                            Recent uploads will appear here
                        </div>
                    ) : (
                        recentUploads.map((url, i) => (
                            <TooltipProvider key={`${url}-${i}`}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => initializeFromUrl(url)}
                                            className="relative h-14 w-14 rounded-lg overflow-hidden border border-white/10 bg-black/20 hover:border-primary hover:ring-2 hover:ring-primary/30 transition-all group shrink-0"
                                        >
                                            <Image
                                                src={getDisplayableImageUrl(url) || ''}
                                                alt={`Recent upload ${i + 1}`}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                sizes="56px"
                                            />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Use this image</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))
                    )}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
