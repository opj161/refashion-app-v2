"use client";

import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'motion/react';

interface ResponsiveMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  layoutId?: string; // Prop for motion layout animations
}

export function ResponsiveMediaModal({
  isOpen, onClose, title, description, children, footer, layoutId
}: ResponsiveMediaModalProps) {
  const isMobile = useIsMobile();

  // isMobile is undefined on initial server render, so we default to desktop view
  // to avoid hydration mismatch. It will correct itself on client-side mount.
  if (isMobile === false) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col p-0 glass-card !gap-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <motion.div layoutId={layoutId} className="flex-1 px-6 pb-4 min-h-0">
            {children}
          </motion.div>
          <DialogFooter className="flex-row justify-end gap-2 p-4 border-t flex-shrink-0">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render Sheet for mobile (or when isMobile is undefined during SSR)
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0 !gap-0" onOpenAutoFocus={e => e.preventDefault()}>
        <SheetHeader className="p-4 border-b text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <motion.div layoutId={layoutId}>
            {children}
          </motion.div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2 p-4 border-t mt-auto">{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
