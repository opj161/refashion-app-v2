'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { LazyMotion, domMax } from 'motion/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SiteHeader } from '@/components/SiteHeader';
import { Toaster } from '@/components/ui/toaster';
import { AnimatedLogo } from '@/components/AnimatedLogo';
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
    <LazyMotion features={domMax}>
      <div className="aurora-bg" />
      {/* Splash screen overlay: controlled by client-side hydration state */}
      <div className={cn("splash-screen", isHydrated && "hidden")}> 
        <AnimatedLogo animationType="aurora" />
      </div>
      {/* Main application content */}
      <AuthProvider initialUser={initialUser}>
        <ThemeProvider>
          <ErrorBoundary>
            <SiteHeader />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Toaster />
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </LazyMotion>
  );
}
