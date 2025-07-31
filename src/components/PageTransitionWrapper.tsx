"use client";

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { useImageStore } from '@/stores/imageStore';
import { MOTION_VARIANTS, MOTION_TRANSITIONS } from '@/lib/motion-constants';

const PageTransitionWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const { reset } = useImageStore();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const previousPath = previousPathnameRef.current;

    if (previousPath) {
      const wasInEditingWorkflow =
        previousPath === '/' || previousPath.includes('/history');
      const isInEditingWorkflow =
        pathname === '/' || pathname.includes('/history');

      // --- FIX: Decoupled state reset logic ---
      // If we were in the editing workflow and are now navigating out of it, reset the store.
      if (wasInEditingWorkflow && !isInEditingWorkflow) {
        reset();
      }
    }

    previousPathnameRef.current = pathname;
  }, [pathname, reset]);

  return (
    <motion.div
      // --- FIX: Removed key={pathname} to prevent full page remounts ---
      // This preserves component state and allows for a true SPA-like navigation.
      // A simple animation provides visual feedback without breaking Next.js architecture.
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeInOut' }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
};

export default PageTransitionWrapper;
