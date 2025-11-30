'use client';

import { AnimatePresence } from 'motion/react';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    // mode="wait" ensures the old page exits before the new one enters
    // initial={false} prevents animation on first load (splash screen handles that)
    <AnimatePresence mode="wait" initial={false}>
      <PageTransitionWrapper>
        {children}
      </PageTransitionWrapper>
    </AnimatePresence>
  );
}
