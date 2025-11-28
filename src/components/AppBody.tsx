'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SiteHeader } from '@/components/SiteHeader';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/lib/types';

interface AppBodyProps {
  children: ReactNode;
  initialUser: SessionUser | null;
}

export function AppBody({ children, initialUser }: AppBodyProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className="aurora-bg"></div>
      <div className={cn("splash-screen", isHydrated && "hidden")}>
        <AnimatedLogo animationType="aurora" />
      </div>

      <AuthProvider initialUser={initialUser}>
        <ThemeProvider>
          <ErrorBoundary>
            {/* Use 100dvh for robust mobile support */}
            <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-background/50">
              <SiteHeader />

              <main className="flex-1 min-h-0 relative flex flex-col w-full">
                <PageTransitionWrapper>{children}</PageTransitionWrapper>
              </main>
            </div>
            <Toaster />
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </LazyMotion>
  );
}
