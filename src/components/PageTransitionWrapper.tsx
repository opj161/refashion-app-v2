"use client";

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { useImageStore } from '@/stores/imageStore';
import { MOTION_VARIANTS, MOTION_TRANSITIONS } from '@/lib/motion-constants';

const PageTransitionWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const shouldResetOnExitRef = useRef<boolean>(false);
  const { reset } = useImageStore();
  const shouldReduceMotion = useReducedMotion();

  // Use reduced motion aware variants and transitions
  const pageVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : MOTION_VARIANTS.page;

  const pageTransition = shouldReduceMotion
    ? { duration: 0.1, ease: [0.16, 1, 0.3, 1] as const }
    : MOTION_TRANSITIONS.tween.standard;

  useEffect(() => {
    const previousPath = previousPathnameRef.current;

    // This logic is critical. We define an "editing workflow" that includes
    // both the create and history pages. The store should be reset only
    // when the user navigates *away* from this entire workflow.
    if (previousPath) {
      const wasInEditingWorkflow =
        previousPath.includes('/create') || previousPath.includes('/history');
      const isInEditingWorkflow =
        pathname.includes('/create') || pathname.includes('/history');

      if (wasInEditingWorkflow && !isInEditingWorkflow) {
        shouldResetOnExitRef.current = true;
      } else {
        shouldResetOnExitRef.current = false;
      }
    }

    previousPathnameRef.current = pathname;
  }, [pathname]);

  // This is the key to the fix. The reset is called AFTER the exit animation
  // of the old page is complete, preventing any race conditions.
  const handleExitComplete = () => {
    if (shouldResetOnExitRef.current) {
      reset();
      shouldResetOnExitRef.current = false; // Reset the flag after use
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
