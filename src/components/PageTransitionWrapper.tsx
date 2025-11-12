"use client";

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { COMMON_VARIANTS, MOTION_TRANSITIONS } from '@/lib/motion-constants';

// Define a simplified variant for reduced motion
const reducedMotionVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const PageTransitionWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Note: Image preparation state reset is now handled by the local context providers
    // in each tab, so no global reset is needed here
    previousPathnameRef.current = pathname;
  }, [pathname]);

  return (
    <motion.div
      key={pathname} // Add key for AnimatePresence to work on route changes
      variants={shouldReduceMotion ? reducedMotionVariant : COMMON_VARIANTS.pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={shouldReduceMotion ? { duration: 0 } : MOTION_TRANSITIONS.tween.standard}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
};

export default PageTransitionWrapper;
