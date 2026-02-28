'use client';

import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { LazyMotion, domMax, MotionConfig } from 'motion/react';
import { AuthStoreInitializer } from '@/stores/AuthStoreInitializer';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SiteHeader } from '@/components/SiteHeader';
import { Toaster } from '@/components/ui/toaster';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/lib/types';

const emptySubscribe = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;

interface AppBodyProps {
  children: ReactNode;
  initialUser: SessionUser | null;
}

export function AppBody({ children, initialUser }: AppBodyProps) {
  const isHydrated = useSyncExternalStore(emptySubscribe, returnTrue, returnFalse);

  return (
    <LazyMotion features={domMax}>
    <MotionConfig reducedMotion="user">
      <div className="aurora-bg" />
      {/* Splash screen overlay: controlled by client-side hydration state */}
      <div className={cn("splash-screen", isHydrated && "hidden")}> 
        <AnimatedLogo animationType="aurora" />
      </div>
      {/* Main application content */}
      <AuthStoreInitializer initialUser={initialUser} />
      <ThemeProvider>
        <ErrorBoundary>
          <SiteHeader />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Toaster />
        </ErrorBoundary>
      </ThemeProvider>
    </MotionConfig>
    </LazyMotion>
  );
}
