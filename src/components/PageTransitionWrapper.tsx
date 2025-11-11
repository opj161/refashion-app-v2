"use client";

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { MOTION_VARIANTS, MOTION_TRANSITIONS } from '@/lib/motion-constants';

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
