"use client";

import { motion } from 'motion/react';
import { AnimatedLogo } from './AnimatedLogo';
import { cn } from '@/lib/utils';

export function SplashScreen({ className }: { className?: string }) {
  return (
    <motion.div
      key="splash"
      className={cn("splash-screen", className)}
    >
      <AnimatedLogo animationType="aurora" />
    </motion.div>
  );
}