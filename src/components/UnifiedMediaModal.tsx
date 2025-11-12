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
      // Add w-full and h-full to make the div fill its grid cell
      "relative w-full h-full bg-muted/20 rounded-lg overflow-hidden p-2", // [!code focus]
      // On desktop, this slot is placed in the second row, first column
      "lg:row-start-2 lg:col-start-1",
      className
  )}>
    {children}
  </div>
);

export const SidebarSlot = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
      "overflow-y-auto p-1", // Added p-1 for scrollbar clearance
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
  footerLeft?: React.ReactNode; // Optional left content (e.g., logo)
  footerRight: React.ReactNode; // Required right content (e.g., buttons)
  children: React.ReactNode;
  layoutId?: string;
}
export function UnifiedMediaModal({ isOpen, onClose, title, description, footerLeft, footerRight, children, layoutId }: UnifiedMediaModalProps) {
  const isMobile = useIsMobile();

  const ModalContent = (
    <motion.div layoutId={layoutId} className="contents"> {/* `contents` prevents this from adding a DOM element */}
      <DialogHeader className="lg:col-span-2">
        {title}
        {description}
      </DialogHeader>

      {/* Main content area (MediaSlot and SidebarSlot) */}
      {children}
      
      {/* --- MODERNIZED FOOTER --- */}
      <div className="lg:col-span-2 px-0 pt-2 pb-0"> {/* Use a div instead of DialogFooter for simpler styling */}
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

  // Mobile View
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className={cn(
        "h-[95vh] p-4 !gap-y-4",
        // THE CORE LAYOUT LOGIC (Mobile)
        // --- THE FIX: The image row was 'auto', causing collapse. ---
        // We change it to a flexible unit '1.5fr' to give it proportional space.
        // The sidebar gets '1fr', and both can shrink to zero if needed.
        "grid grid-rows-[auto_minmax(0,1.5fr)_minmax(0,1fr)_auto]"
      )}>
        {ModalContent}
      </SheetContent>
    </Sheet>
  );
}
