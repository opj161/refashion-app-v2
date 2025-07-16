// src/app/template.tsx
'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useImageStore } from '@/stores/imageStore';
import { useEffect, useRef } from 'react';

const EDITING_WORKFLOW_PATHS = ['/create', '/history'];

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Determine if we are navigating *away* from the editing workflow.
    const wasInEditingWorkflow = previousPathnameRef.current && EDITING_WORKFLOW_PATHS.some(p => previousPathnameRef.current!.startsWith(p));
    const isInEditingWorkflow = EDITING_WORKFLOW_PATHS.some(p => pathname.startsWith(p));

    if (wasInEditingWorkflow && !isInEditingWorkflow) {
      console.log('Exiting editing workflow, resetting image store.');
      useImageStore.getState().reset();
    }
    
    // Update the previous pathname ref for the next navigation.
    previousPathnameRef.current = pathname;
  }, [pathname]);

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  // Your existing motion constants
  const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };
  const PAGE_TRANSITION = { type: 'tween', ease: 'easeInOut', duration: 0.4 } as const;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={PAGE_VARIANTS}
        transition={PAGE_TRANSITION}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}