"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetFooter } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

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

interface UnifiedMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description: React.ReactNode;
  footerLeft?: React.ReactNode; // Optional left content (e.g., logo)
  footerRight: React.ReactNode; // Required right content (e.g., buttons)
  children: React.ReactNode;
  layoutId?: string;
}
export function UnifiedMediaModal({ isOpen, onClose, title, description, footerLeft, footerRight, children, layoutId }: UnifiedMediaModalProps) {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch by waiting for client mount
  if (!isMounted) return null;

  const ModalContent = (
    <motion.div layoutId={layoutId} className="contents"> {/* `contents` prevents this from adding a DOM element */}
      <DialogHeader className="lg:col-span-2 shrink-0">
        {title}
        {description}
      </DialogHeader>

      {/* Main content area (MediaSlot and SidebarSlot) */}
      {children}

      {/* Footer */}
      <div className="lg:col-span-2 px-0 pt-2 pb-0 shrink-0">
        <div className="glass-card w-full p-3 rounded-xl flex items-center justify-between">
          <div>
            {footerLeft}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {footerRight}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (isMobile === false) { // Desktop View
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn(
          // FIX: Changed max-h to h- to give the grid a defined height, preventing row collapse.
          "max-w-6xl w-full h-[90vh] p-6 !gap-y-4 glass-card flex flex-col",
          // THE CORE LAYOUT LOGIC (Desktop)
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
