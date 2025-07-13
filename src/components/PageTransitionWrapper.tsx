"use client";

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { useImageStore } from '@/stores/imageStore';
import { MOTION_VARIANTS, MOTION_TRANSITIONS } from '@/lib/motion-constants';

// NOTE: This component intentionally does not handle imageStore reset.
// That logic is now correctly placed in creation-hub.tsx's unmount effect,
// and this wrapper provides the graceful exit animation needed to prevent race conditions.

const PageTransitionWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const previousPathnameRef = useRef<string | null>(null);
  const shouldResetOnExitRef = useRef<boolean>(false);
  const { reset } = useImageStore();

  const pageVariants = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : MOTION_VARIANTS.page;

  const pageTransition = shouldReduceMotion
    ? { duration: 0.1, ease: [0.16, 1, 0.3, 1] as const }
    : MOTION_TRANSITIONS.tween.standard;

  useEffect(() => {
    const previousPath = previousPathnameRef.current;
    if (previousPath) {
      const wasInEditingWorkflow = previousPath.startsWith('/create') || previousPath.startsWith('/history');
      const isInEditingWorkflow = pathname.startsWith('/create') || pathname.startsWith('/history');
      if (wasInEditingWorkflow && !isInEditingWorkflow) {
        shouldResetOnExitRef.current = true;
      } else {
        shouldResetOnExitRef.current = false;
      }
    }
    previousPathnameRef.current = pathname;
  }, [pathname]);

  const handleExitComplete = () => {
    if (shouldResetOnExitRef.current) {
      reset();
      shouldResetOnExitRef.current = false;
    }
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransitionWrapper;
