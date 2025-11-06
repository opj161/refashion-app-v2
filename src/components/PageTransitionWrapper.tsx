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
      // Improved page transitions with slide effect
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={
        shouldReduceMotion 
          ? { duration: 0 } 
          : {
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1], // Smooth ease-out curve
            }
      }
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
};

export default PageTransitionWrapper;
