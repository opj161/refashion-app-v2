"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetFooter } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

// --- Slot Components for Explicit API ---

export const MediaSlot = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
      "relative bg-black/10 rounded-lg flex items-center justify-center overflow-hidden",
      // On desktop, this slot is placed in the second row, first column
      "lg:row-start-2 lg:col-start-1",
      className
  )}>
    {children}
  </div>
);

export const SidebarSlot = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
      "overflow-y-auto",
      // On desktop, this slot is placed in the second row, second column
      "lg:row-start-2 lg:col-start-2",
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
  footer: React.ReactNode;
  children: React.ReactNode;
  layoutId?: string;
}

export function UnifiedMediaModal({ isOpen, onClose, title, description, footer, children, layoutId }: UnifiedMediaModalProps) {
  const isMobile = useIsMobile();

  const ModalContent = (
    <motion.div layoutId={layoutId} className="contents"> {/* `contents` prevents this from adding a DOM element */}
      <DialogHeader className="lg:col-span-2">
        {title}
        {description}
      </DialogHeader>

      {/* Main content area (MediaSlot and SidebarSlot) */}
      {children}
      
      <DialogFooter className="lg:col-span-2 flex-row justify-end gap-2 border-t bg-background/50">
        {footer}
      </DialogFooter>
    </motion.div>
  );

  if (isMobile === false) { // Desktop View
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn(
          "max-w-6xl w-full max-h-[90vh] p-6 !gap-y-4 glass-card",
          // THE CORE LAYOUT LOGIC (Desktop)
          "grid grid-rows-[auto_1fr_auto] grid-cols-1 lg:grid-cols-[1fr,minmax(350px,400px)] lg:gap-x-6"
        )}>
          {ModalContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile View
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className={cn(
        "h-[95vh] p-4 !gap-y-4",
        // THE CORE LAYOUT LOGIC (Mobile)
        // --- THE FIX ---
        // From [header, content, footer] to [header, media, scrollable_sidebar, footer]
        // This gives the media its own auto-sized row, allowing it to be much larger.
        "grid grid-rows-[auto_auto_minmax(0,1fr)_auto]"
      )}>
        {ModalContent}
      </SheetContent>
    </Sheet>
  );
}
