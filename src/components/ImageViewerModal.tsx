"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, Copy, RefreshCw, Sparkles, UserCheck, 
  ChevronLeft, ChevronRight, Info, Video as VideoIcon, Loader2
} from "lucide-react";
import { getDisplayableImageUrl, cn } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ParameterSection, ParameterRow } from "./ParameterDisplay";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "motion/react";

interface ImageViewerModalProps {
  item: HistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl?: string | null;
  onReloadConfig?: (item: HistoryItem) => void;
  
  // Action Handlers
  onUpscale?: (index: number) => void;
  onFaceDetail?: (index: number) => void;
  onSendToVideo?: (url: string) => void;
  
  // Action States
  isUpscalingSlot?: number | null;
  isFaceRetouchingSlot?: number | null;
  isFaceDetailerAvailable?: boolean;
}

// Helper component for action buttons (shared between desktop and mobile)
function ActionButtons({ 
  currentImage, 
  isUpscalingSlot, 
  isFaceRetouchingSlot, 
  isFaceDetailerAvailable, 
  onUpscale, 
  onFaceDetail 
}: {
  currentImage: { isGenerated: boolean; index: number };
  isUpscalingSlot: number | null | undefined;
  isFaceRetouchingSlot: number | null | undefined;
  isFaceDetailerAvailable: boolean;
  onUpscale?: (index: number) => void;
  onFaceDetail?: (index: number) => void;
}) {
  if (!currentImage.isGenerated) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mb-3">
      <Button 
        variant="outline" 
        className="bg-background/50"
        onClick={() => onUpscale?.(currentImage.index)}
        disabled={!!isUpscalingSlot || !!isFaceRetouchingSlot}
      >
         {isUpscalingSlot === currentImage.index ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-purple-500" />}
         Upscale
      </Button>
      {isFaceDetailerAvailable && (
        <Button 
          variant="outline" 
          className="bg-background/50"
          onClick={() => onFaceDetail?.(currentImage.index)}
          disabled={!!isUpscalingSlot || !!isFaceRetouchingSlot}
        >
          {isFaceRetouchingSlot === currentImage.index ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2 text-green-500" />}
          Fix Face
        </Button>
      )}
    </div>
  );
}

export function ImageViewerModal({ 
  item, 
  isOpen, 
  onClose, 
  initialImageUrl,
  onReloadConfig,
  onUpscale,
  onFaceDetail,
  onSendToVideo,
  isUpscalingSlot,
  isFaceRetouchingSlot,
  isFaceDetailerAvailable = false
}: ImageViewerModalProps) {
  const { toast } = useToast();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  // Aggregate all images: Original + Generated (filtering out nulls)
  const images = useMemo(() => {
    if (!item) return [];
    // Only include generated images, not the original
    const imgs = item.editedImageUrls.map((url, i) => ({ 
      type: `Generated #${i + 1}`, 
      url, 
      isGenerated: true, 
      index: i // Keep track of the real slot index for actions
    })).filter(img => img.url); // Filter out failed generations
    return imgs;
  }, [item]);

  // Set initial index based on passed URL
  useEffect(() => {
    if (isOpen && initialImageUrl && images.length > 0) {
      const foundIndex = images.findIndex(img => img.url === initialImageUrl);
      if (foundIndex !== -1) {
        setSelectedIndex(foundIndex);
      } else {
        // Default to the first image
        setSelectedIndex(0);
      }
    }
  }, [isOpen, initialImageUrl, images]);

  const hasNext = selectedIndex < images.length - 1;
  const hasPrev = selectedIndex > 0;

  const handleNext = useCallback(() => hasNext && setSelectedIndex(prev => prev + 1), [hasNext]);
  const handlePrev = useCallback(() => hasPrev && setSelectedIndex(prev => prev - 1), [hasPrev]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  const handleCopyPrompt = () => {
    if (!item?.constructedPrompt) return;
    navigator.clipboard.writeText(item.constructedPrompt);
    toast({ title: 'Copied!', description: 'Prompt copied to clipboard.' });
  };

  if (!item) return null;

  const currentImage = images[selectedIndex] || images[0];
  // Guard against empty images array if something went wrong
  if (!currentImage) return null;

  const downloadFilename = `RefashionAI_${item.id.slice(0, 8)}_${currentImage.type.replace(/[^a-z0-9]/gi, '_')}.png`;
  const displayUrl = getDisplayableImageUrl(currentImage.url);

  // Check if this is Studio Mode
  const isStudioMode = item.generation_mode === 'studio';
  
  // Handle "Processing..." state or missing prompts
  const displayPrompt = item.constructedPrompt === 'Processing...' 
    ? 'Generation in progress...'
    : (item.constructedPrompt || 'No prompt available');

  // Content for the sidebar / mobile sheet
  const InspectorContent = (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold leading-tight mb-1">{currentImage.type}</h2>
        <p className="text-sm text-muted-foreground">
          {new Date(item.timestamp).toLocaleString()} • ID: {item.id.slice(0, 8)}
        </p>
      </div>

      <ParameterSection title="Prompt & Config">
        <div className="relative bg-muted/50 rounded-md p-3 text-xs font-mono leading-relaxed text-foreground/80 max-h-[150px] overflow-y-auto custom-scrollbar">
          {displayPrompt}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 hover:bg-background"
            onClick={handleCopyPrompt}
            title="Copy Prompt"
            disabled={displayPrompt === 'Generation in progress...' || displayPrompt === 'No prompt available'}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        {onReloadConfig && (
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => onReloadConfig(item)}>
            <RefreshCw className="mr-2 h-3 w-3" /> Reuse These Settings
          </Button>
        )}
      </ParameterSection>

      {/* Conditionally display parameters based on generation mode */}
      {!isStudioMode && item.attributes && Object.keys(item.attributes).length > 0 ? (
        <ParameterSection title="Generation Parameters">
          {Object.entries(item.attributes).map(([label, value]) => (
            <ParameterRow key={label} label={label} value={value as string} />
          ))}
        </ParameterSection>
      ) : isStudioMode ? (
        <div className="p-4 bg-muted/30 rounded text-center text-sm text-muted-foreground">
          <p className="font-medium mb-1">Studio Mode</p>
          <p className="text-xs">Custom prompt-driven generation</p>
        </div>
      ) : (
         <div className="p-4 bg-muted/30 rounded text-center text-sm text-muted-foreground">
            No parameters available for this item.
         </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent variant="fullscreen" className="p-0 gap-0 overflow-hidden bg-background border-0">
        <div className="sr-only"><DialogTitle>Image Viewer</DialogTitle></div>
        
        <div className="flex flex-col lg:flex-row h-full w-full">
          
          {/* --- MAIN CANVAS AREA (Left/Top) --- */}
          <div className="relative flex-1 h-full bg-zinc-950 flex flex-col justify-center items-center overflow-hidden">
            
            {/* Image Display */}
            <div className="relative w-full h-full p-4 lg:p-12 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentImage.url}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={displayUrl || '/placeholder.png'}
                    alt={currentImage.type}
                    fill
                    className="object-contain"
                    priority
                    quality={90}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Arrows (Visible on Mobile & Desktop) */}
            <div className="absolute inset-x-2 lg:inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
              <Button 
                variant="secondary" size="icon" 
                className={cn(
                  "h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border-white/10 pointer-events-auto transition-opacity shadow-lg", 
                  !hasPrev && "opacity-0 pointer-events-none"
                )}
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button 
                variant="secondary" size="icon" 
                className={cn(
                  "h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border-white/10 pointer-events-auto transition-opacity shadow-lg", 
                  !hasNext && "opacity-0 pointer-events-none"
                )}
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Filmstrip (Desktop Bottom Overlay) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl p-2 rounded-full border border-white/10 hidden lg:flex gap-2 overflow-x-auto max-w-[90%] z-10">
              {images.map((img, idx) => (
                <button
                  key={img.url}
                  onClick={() => setSelectedIndex(idx)}
                  className={cn(
                    "relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-200",
                    idx === selectedIndex ? "border-primary scale-110 ring-2 ring-black" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <Image 
                    src={getDisplayableImageUrl(img.url) || ''} 
                    alt={img.type} 
                    fill 
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>

            {/* Mobile Top Bar (Sticky) */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-center items-center lg:hidden z-20 pointer-events-none">
               <div className="text-white/90 text-xs font-medium backdrop-blur-xl bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                 {selectedIndex + 1} / {images.length} • {currentImage.type}
               </div>
            </div>
            
            {/* Mobile Bottom Controls (Floating) */}
            <div className="absolute bottom-6 left-4 right-4 flex gap-2 lg:hidden z-20">
               {currentImage.isGenerated && onSendToVideo && currentImage.url && (
                 <Button className="flex-1 shadow-xl bg-white text-black hover:bg-white/90" onClick={() => onSendToVideo(currentImage.url!)}>
                   <VideoIcon className="mr-2 h-4 w-4" /> Animate
                 </Button>
               )}
               <Sheet open={showMobileInfo} onOpenChange={setShowMobileInfo}>
                 <SheetTrigger asChild>
                   <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full shadow-xl shrink-0 bg-white/10 text-white border-white/10 backdrop-blur-md">
                     <Info className="h-5 w-5" />
                   </Button>
                 </SheetTrigger>
                 <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl z-[60]">
                    <ScrollArea className="h-full pr-4">
                      {InspectorContent}
                      {/* Mobile Actions in Sheet */}
                      <div className="mt-8 pb-8 grid gap-3">
                        <ActionButtons 
                          currentImage={currentImage}
                          isUpscalingSlot={isUpscalingSlot}
                          isFaceRetouchingSlot={isFaceRetouchingSlot}
                          isFaceDetailerAvailable={isFaceDetailerAvailable}
                          onUpscale={onUpscale}
                          onFaceDetail={onFaceDetail}
                        />
                        <Button className="w-full" asChild variant="secondary">
                          <a href={displayUrl || '#'} download={downloadFilename}>
                            <Download className="mr-2 h-4 w-4" /> Download Image
                          </a>
                        </Button>
                      </div>
                    </ScrollArea>
                 </SheetContent>
               </Sheet>
            </div>
          </div>

          {/* --- INSPECTOR PANEL (Right Sidebar - Desktop Only) --- */}
          <div className="hidden lg:flex w-[400px] h-full border-l border-border bg-background flex-col z-10 shadow-xl">
            <ScrollArea className="flex-1">
              <div className="p-6">
                 {InspectorContent}
              </div>
            </ScrollArea>
            
            {/* Sticky Action Footer (Desktop) */}
            <div className="p-6 border-t border-border bg-muted/10">
               <ActionButtons 
                 currentImage={currentImage}
                 isUpscalingSlot={isUpscalingSlot}
                 isFaceRetouchingSlot={isFaceRetouchingSlot}
                 isFaceDetailerAvailable={isFaceDetailerAvailable}
                 onUpscale={onUpscale}
                 onFaceDetail={onFaceDetail}
               />
               
               <div className="flex gap-3">
                 <Button className="flex-1" variant="secondary" asChild>
                    <a href={displayUrl || '#'} download={downloadFilename}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </a>
                 </Button>
                 {currentImage.isGenerated && onSendToVideo && currentImage.url && (
                    <Button className="flex-1" onClick={() => onSendToVideo(currentImage.url!)}>
                      <VideoIcon className="mr-2 h-4 w-4" /> Animate
                    </Button>
                 )}
               </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
