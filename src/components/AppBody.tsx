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
      {/* Aurora background - only visible on pages that use scrolling layout */}
      <div className="aurora-bg"></div>
      
      {/* Splash screen overlay: controlled by client-side hydration state */}
      <div className={cn("splash-screen", isHydrated && "hidden")}> 
        <AnimatedLogo animationType="aurora" />
      </div>
      
      {/* Main application wrapper - fixed viewport height */}
      <AuthProvider initialUser={initialUser}>
        <ThemeProvider>
          <ErrorBoundary>
            {/* Flex container for fixed viewport layout */}
            <div className="flex flex-col h-screen overflow-hidden">
              <SiteHeader />
              {/* Main content area - takes remaining height */}
              <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
