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
    
    // Logic to determine if we are leaving the "creation workflow"
    if (previousPath) {
      const wasInCreationWorkflow = previousPath.startsWith('/create') || previousPath.startsWith('/history');
      const isInCreationWorkflow = pathname.startsWith('/create') || pathname.startsWith('/history');

      if (wasInCreationWorkflow && !isInCreationWorkflow) {
        shouldResetOnExitRef.current = true;
      } else {
        shouldResetOnExitRef.current = false;
      }
    }

    previousPathnameRef.current = pathname;
  }, [pathname]);

  // Use the robust onExitComplete to reset state after the page has transitioned out.
  const handleExitComplete = () => {
    if (shouldResetOnExitRef.current) {
      console.log("Exited creation workflow. Resetting image store.");
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
