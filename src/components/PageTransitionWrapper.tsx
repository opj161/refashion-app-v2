"use client";

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { MOTION_VARIANTS, MOTION_TRANSITIONS } from '@/lib/motion-constants';

// NOTE: This component intentionally does not handle imageStore reset.
// That logic is now correctly placed in creation-hub.tsx's unmount effect,
// and this wrapper provides the graceful exit animation needed to prevent race conditions.

const PageTransitionWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const pageVariants = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : MOTION_VARIANTS.page;

  const pageTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : MOTION_TRANSITIONS.tween.standard;

  return (
    <AnimatePresence mode="wait">
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
