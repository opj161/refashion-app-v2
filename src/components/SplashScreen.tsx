"use client";

import { m } from 'motion/react';
import { AnimatedLogo } from './AnimatedLogo';
import { cn } from '@/lib/utils';

export function SplashScreen({ className }: { className?: string }) {
  return (
    <m.div
      key="splash"
      className={cn("splash-screen", className)}
    >
      <AnimatedLogo animationType="aurora" />
    </m.div>
  );
}
