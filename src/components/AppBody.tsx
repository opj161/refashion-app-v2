'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ImagePreparationProvider } from '@/contexts/ImagePreparationContext';
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
    <>
      <div className="aurora-bg"></div>
      {/* Splash screen overlay: controlled by client-side hydration state */}
      <div className={cn("splash-screen", isHydrated && "hidden")}> 
        <AnimatedLogo animationType="aurora" />
      </div>
      {/* Main application content */}
      <AuthProvider initialUser={initialUser}>
        <ThemeProvider>
          <ImagePreparationProvider>
            <ErrorBoundary>
              <SiteHeader />
              {/* Use separate content offset variable to control spacing independently of header height */}
              <main className="flex-1 flex flex-col" style={{ paddingTop: 'var(--content-offset)' }}>
                <PageTransitionWrapper>{children}</PageTransitionWrapper>
              </main>
              <Toaster />
            </ErrorBoundary>
          </ImagePreparationProvider>
        </ThemeProvider>
      </AuthProvider>
    </>
  );
}
