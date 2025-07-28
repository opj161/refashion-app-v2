"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { BaseMediaModal, MediaContainer, Sidebar, ParameterSection, ParameterRow } from "./BaseMediaModal";
import { Button } from "@/components/ui/button";
import { Download, Copy, X } from "lucide-react";
import { getDisplayableImageUrl } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface HistoryDetailModalProps {
  item: HistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReloadConfig: (item: HistoryItem) => void;
}

export function HistoryDetailModal({ item, isOpen, onClose, onReloadConfig }: HistoryDetailModalProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const allImages = useMemo(() => {
    if (!item) return [];
    return [
      { type: 'Original', url: item.originalClothingUrl },
      ...item.editedImageUrls
        .map((url, i) => (url ? { type: `Generated #${i + 1}`, url } : null))
        .filter((img): img is { type: string; url: string } => img !== null)
    ];
  }, [item]);

  useEffect(() => {
    if (item) {
      const firstGenerated = item.editedImageUrls?.find(url => url);
      setSelectedImageUrl(firstGenerated || item.originalClothingUrl);
    } else {
      setSelectedImageUrl(null);
    }
  }, [item]);

  if (!item) return null;

  const handleCopyPrompt = () => {
    if (!item.constructedPrompt) return;
    navigator.clipboard.writeText(item.constructedPrompt);
    toast({ title: 'Copied!', description: 'Prompt has been copied to clipboard.' });
  };

  return (
    <BaseMediaModal
      isOpen={isOpen}
      onClose={onClose}
      title="History Item Details"
      description={`Review of saved configuration from ${new Date(item.timestamp).toLocaleString()}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
          <Button onClick={() => onReloadConfig(item)}>
            <Copy className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Use as Template</span>
          </Button>
          {selectedImageUrl &&
            <a href={getDisplayableImageUrl(selectedImageUrl) ?? '#'} download={`Refashion_Image_${item.id.substring(0, 6)}.png`}>
              <Button>
                <Download className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Download Selected</span>
              </Button>
            </a>
          }
        </>
      }
    >
      {/* Optimal Image Container */}
      <MediaContainer aspectRatio="auto">
        <AnimatePresence mode="wait">
          {selectedImageUrl && (
            <Image
              key={selectedImageUrl}
              src={getDisplayableImageUrl(selectedImageUrl) ?? '/placeholder.png'}
              alt="Selected view"
              fill
              className="object-contain transition-opacity duration-200"
              sizes="(max-width: 768px) 100vw, 66vw"
              priority
            />
          )}
        </AnimatePresence>
      </MediaContainer>
      
      {/* Unified Sidebar */}
      <Sidebar>
        {/* Image Thumbnails - Fixed at top */}
        <div className="flex-shrink-0 p-4 md:p-6 border-b border-border/20">
          <h4 className="font-semibold text-sm mb-3 text-foreground/90">Generated Images</h4>
          <div className="grid grid-cols-4 md:grid-cols-2 gap-3 md:gap-4">
            {allImages.map(({ type, url }, index) => (
              <button 
                key={`${url}-${index}`} 
                onClick={() => setSelectedImageUrl(url)} 
                className={cn(
                  "relative aspect-[2/3] rounded-md overflow-hidden border transition-all duration-200 ring-offset-background ring-offset-2 focus:outline-none focus:ring-2 focus:ring-ring", 
                  selectedImageUrl === url 
                    ? 'ring-2 ring-primary border-primary/50' 
                    : 'border-border/20 hover:border-border/40 hover:scale-105'
                )}
              >
                <Image 
                  src={getDisplayableImageUrl(url) ?? '/placeholder.png'} 
                  alt={type} 
                  fill 
                  className={cn(
                    type === 'Original' ? 'object-contain p-1' : 'object-cover',
                    "transition-transform duration-200"
                  )} 
                  sizes="(max-width: 768px) 25vw, 15vw" 
                />
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] p-1.5 text-center">
                  <span className="font-medium">{type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Scrollable Parameters */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Generation Parameters */}
          {item.attributes && Object.keys(item.attributes).length > 0 && (
            <ParameterSection title="Generation Parameters">
              <div className="space-y-1">
                {Object.entries(item.attributes).map(([key, value]) => {
                  if (value === 'default' || !value) return null;
                  const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return (
                    <ParameterRow 
                      key={key} 
                      label={formattedKey} 
                      value={String(value)} 
                    />
                  );
                })}
              </div>
            </ParameterSection>
          )}

          {/* Full Prompt */}
          <ParameterSection title="Full Prompt" collapsible={false}>
            <div className="relative">
              <p className="text-xs leading-relaxed text-muted-foreground p-3 pr-10 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                {item.constructedPrompt}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6 hover:bg-background/10" 
                onClick={handleCopyPrompt}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </ParameterSection>

          {/* Metadata */}
          <ParameterSection title="Metadata">
            <div className="space-y-1">
              <ParameterRow label="Created" value={new Date(item.timestamp).toLocaleString()} />
              <ParameterRow label="User" value={item.username} />
              <ParameterRow label="Settings Mode" value={item.settingsMode || 'basic'} />
              <ParameterRow label="ID" value={item.id.substring(0, 12)} />
            </div>
          </ParameterSection>
        </div>
      </Sidebar>
    </BaseMediaModal>
  );
}
