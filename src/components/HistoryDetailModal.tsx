"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UnifiedMediaModal, MediaSlot, SidebarSlot } from "./UnifiedMediaModal";
import { ParameterSection, ParameterRow } from "./ParameterDisplay";
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

  const handleCopyPrompt = () => {
    if (!item?.constructedPrompt) return;
    navigator.clipboard.writeText(item.constructedPrompt);
    toast({ title: 'Copied!', description: 'Prompt has been copied to clipboard.' });
  };

  if (!item) return null;

  return (
    <UnifiedMediaModal
      isOpen={isOpen}
      onClose={onClose}
      title={<DialogTitle>History Item Details</DialogTitle>}
      description={<DialogDescription>{`Review of saved configuration from ${new Date(item.timestamp).toLocaleString()}.`}</DialogDescription>}
      layoutId={`history-card-${item.id}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" /> Close
          </Button>
          <Button variant="outline" onClick={handleCopyPrompt}>
            <Copy className="w-4 h-4 mr-2" /> Copy Prompt
          </Button>
          <Button variant="outline" onClick={() => item && onReloadConfig(item)}>
            <Download className="w-4 h-4 mr-2" /> Reload Config
          </Button>
        </>
      }
    >
      <MediaSlot>
        <Image
          key={selectedImageUrl}
          src={getDisplayableImageUrl(selectedImageUrl) ?? '/placeholder.png'}
          alt="Selected view"
          width={1200}
          height={900}
          className="w-full h-full object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
          priority
        />
      </MediaSlot>
      <SidebarSlot>
        <div>
          <h4 className="font-semibold text-sm mb-3 text-foreground/90">Generated Images</h4>
          <div 
            className="grid gap-2"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))'
            }}
          >
            {allImages.map((img, i) => (
              <button
                key={img.url}
                className={cn(
                  "border rounded overflow-hidden aspect-square flex items-center justify-center p-1 transition-all duration-200",
                  selectedImageUrl === img.url 
                    ? "ring-2 ring-primary border-primary/50" 
                    : "border-border/20 hover:border-border/40 hover:scale-105"
                )}
                onClick={() => setSelectedImageUrl(img.url)}
              >
                <Image
                  src={getDisplayableImageUrl(img.url) ?? '/placeholder.png'}
                  alt={img.type}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <ParameterSection title="Generation Parameters">
            {Object.entries(item.attributes).map(([label, value]) => (
              <ParameterRow key={label} label={label} value={value} />
            ))}
          </ParameterSection>
        )}
        <ParameterSection title="Full Prompt">
          <p className="text-xs whitespace-pre-wrap break-words leading-relaxed text-foreground/80">
            {item.constructedPrompt}
          </p>
        </ParameterSection>
        <ParameterSection title="Metadata">
          <ParameterRow label="Timestamp" value={new Date(item.timestamp).toLocaleString()} />
          <ParameterRow label="ID" value={item.id} />
          <ParameterRow label="Type" value={item.videoGenerationParams ? 'Video' : 'Image'} />
        </ParameterSection>
      </SidebarSlot>
    </UnifiedMediaModal>
  );
}