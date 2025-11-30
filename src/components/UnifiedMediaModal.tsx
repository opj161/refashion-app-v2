
"use client";

import React, { useState, useEffect, useId } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// Define the glass styles constant to reuse here without importing the Card component
// This ensures visual consistency with the Card variant defined in step 3
const GLASS_STYLES = "border border-white/10 bg-card/50 shadow-2xl shadow-black/20 backdrop-blur-xl";

// --- Slot Components for Explicit API ---

// FIX: Update MediaSlot to be flexible
export const MediaSlot = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "w-full bg-black/20 p-4 flex items-center justify-center relative",
    // Desktop: Grid positioning | Mobile: Flex grow/shrink to fit available space
    "lg:row-start-2 lg:col-start-1 lg:h-full lg:min-h-0",
    "flex-1 min-h-0", // Mobile specific: allow shrinking
    className
  )}>
    {children}
  </div>
);

// FIX: Update SidebarSlot
export const SidebarSlot = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "overflow-y-auto p-1 custom-scrollbar",
    "lg:row-start-2 lg:col-start-2 lg:h-full",
    "h-auto max-h-[35vh] lg:max-h-none", // Mobile: limit height so image stays visible
    className
  )}>
    {children}
  </div>
);

// --- Main Unified Modal Component ---

interface UnifiedMediaModalItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  createdAt: string;
  aspectRatio: string;
}

interface UnifiedMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  items: UnifiedMediaModalItem[];
  onDelete: (id: string) => void;
  onDownload: (item: UnifiedMediaModalItem) => void;
}

export function UnifiedMediaModal({
  isOpen,
  onClose,
  initialIndex = 0,
  items,
  onDelete,
  onDownload
}: UnifiedMediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const layoutId = useId();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < items.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  const isVideo = currentItem.type === 'video';

  const footerLeft = (
    <div className="flex flex-col gap-1">
      <h3 className="font-medium text-foreground text-sm lg:text-base line-clamp-1" title={currentItem.prompt}>
        {currentItem.prompt}
      </h3>
      <p className="text-xs text-muted-foreground">
        {new Date(currentItem.createdAt).toLocaleDateString()} • {currentItem.aspectRatio}
      </p>
    </div>
  );

  const footerRight = (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDownload(currentItem)}
        className="h-8 w-8 hover:bg-white/10"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(currentItem.id)}
        className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );

  const ModalContent = (
    <m.div layoutId={layoutId} className="contents">
      {/* Main Preview Area */}
      <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden group">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <m.div
            key={currentIndex}
            custom={direction}
            variants={{
              enter: (direction: number) => ({
                x: direction > 0 ? 1000 : -1000,
                opacity: 0
              }),
              center: {
                zIndex: 1,
                x: 0,
                opacity: 1
              },
              exit: (direction: number) => ({
                zIndex: 0,
                x: direction < 0 ? 1000 : -1000,
                opacity: 0
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            {isVideo ? (
              <video
                src={currentItem.url}
                controls
                autoPlay
                loop
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
            ) : (
              <img
                src={currentItem.url}
                alt={currentItem.prompt}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </m.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        {currentIndex < items.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Footer */}
      <div className="lg:col-span-2 px-0 pt-2 pb-0 shrink-0">
        {/* REFACTOR: Replaced "glass-card" class with utility string */}
        <div className={cn("w-full p-3 rounded-xl flex items-center justify-between", GLASS_STYLES)}>
          <div>{footerLeft}</div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {footerRight}
          </div>
        </div>
      </div>
    </m.div>
  );

  if (isMobile === false) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn(
          "max-w-6xl w-full h-[90vh] p-6 !gap-y-4 flex flex-col",
          // REFACTOR: Replaced "glass-card" with utility string
          GLASS_STYLES,
          "lg:grid lg:grid-rows-[auto_1fr_auto] lg:grid-cols-[1fr,minmax(350px,400px)] lg:gap-x-6"
        )}>
          {ModalContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile View - FIX: Switch to Flexbox
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className={cn(
        "h-[95dvh] p-4 gap-3", // 95dvh to show a bit of context behind
        "flex flex-col" // Switch from Grid to Flex column
      )}>
        {ModalContent}
      </SheetContent>
    </Sheet>
  );
}
