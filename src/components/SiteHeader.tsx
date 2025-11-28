'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';
import { ShieldCheck, LayoutGrid, Film } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

export function SiteHeader() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  const { activeView, setActiveView } = useGenerationSettingsStore(
    useShallow(state => ({
      activeView: state.activeView,
      setActiveView: state.setActiveView
    }))
  );

  // Effect for scroll-based style changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full h-[var(--header-height)] transition-all duration-300 ease-in-out',
        'border-b border-white/5 bg-background/80 backdrop-blur-md'
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Side: Branding */}
        <div className="flex items-center gap-8">
          <Link href="/" prefetch={true} className="flex items-center gap-3 text-foreground group">
            <Image
              src="/refashion.svg"
              alt="Refashion AI logo"
              width={120}
              height={40}
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Mode Switcher */}
          <div className="hidden md:block w-[240px]">
            <SegmentedControl
              value={activeView}
              onValueChange={(v) => setActiveView(v as 'image' | 'video')}
              options={[
                { value: 'image', label: 'Studio', icon: LayoutGrid },
                { value: 'video', label: 'Motion', icon: Film },
              ]}
            />
          </div>
        </div>

        {/* Right Side: Actions & User Menu */}
        <div className="flex items-center gap-4">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user?.role === 'admin' && (
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/admin" prefetch={true}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
            <div className="h-6 w-px bg-white/10 mx-1" />
            <ThemeToggleImproved variant="compact" />
            <UserMenu />
          </div>

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}