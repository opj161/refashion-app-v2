"use client";

import React from 'react';
import Image from 'next/image';
import { useImageStore } from '@/stores/imageStore';
import type { ImageVersion } from '@/stores/imageStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ImageVersionStackProps {
  versions: Record<string, ImageVersion>;
  activeVersionId: string | null;
  isProcessing: boolean;
}

const ImageVersionStack: React.FC<ImageVersionStackProps> = ({ versions, activeVersionId, isProcessing }) => {
  const setActiveVersion = useImageStore((state) => state.setActiveVersion);

  // Sort versions by creation time for a consistent order
  const sortedVersions = Object.values(versions).sort((a, b) => a.createdAt - b.createdAt);

  if (sortedVersions.length <= 1) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-2">Version History</h3>
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex w-max space-x-4 p-2">
          <AnimatePresence>
            {sortedVersions.map((version) => (
              <motion.div key={version.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} layout>
                <button onClick={() => setActiveVersion(version.id)} disabled={isProcessing} className={cn('relative h-24 w-20 rounded-md overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring ring-offset-background ring-offset-2', activeVersionId === version.id ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50', isProcessing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')} title={`Version: ${version.label}`}>
                  <Image src={version.dataUri} alt={version.label} fill className="object-cover" sizes="80px" />
                  <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] p-1 text-center truncate backdrop-blur-sm">{version.label}</div>
                  {activeVersionId === version.id && (<div className="absolute inset-0 bg-primary/30" />)}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default ImageVersionStack;
