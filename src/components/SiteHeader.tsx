'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/SegmentedControl';
import { ShieldCheck, History, Image as ImageIcon, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Get active view state from global store
  const activeView = useGenerationSettingsStore(state => state.activeView);
  const setActiveView = useGenerationSettingsStore(state => state.setActiveView);

  // Effect for scroll-based style changes
  useEffect(() => {
    const handleScroll = () => {
      // Set isScrolled to true if user scrolls more than 10px
      setIsScrolled(window.scrollY > 10);
    };

    // Add event listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full h-[var(--header-height)] shrink-0 transition-all duration-300 ease-in-out',
        isScrolled
          ? 'border-b border-white/10 bg-background/95 backdrop-blur-md'
          : 'border-b border-white/5 bg-background/80 backdrop-blur-sm'
      )}
    >
      <div className="w-full h-full px-4 flex items-center justify-between relative">
        {/* LEFT: Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" prefetch={true} className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image 
                src="/refashion.svg" 
                alt="Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground/90 group-hover:text-foreground transition-colors hidden sm:inline">
              Refashion<span className="text-primary">AI</span>
            </span>
          </Link>
        </div>

        {/* CENTER: Context Switcher (Desktop only) */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <div className="bg-black/20 p-1 rounded-lg border border-white/5">
            <SegmentedControl 
              value={activeView} 
              onValueChange={(v) => setActiveView(v as 'image' | 'video')}
              className="gap-1"
            >
              <SegmentedControlItem value="image" className="px-6 py-1.5 text-xs font-medium">
                <ImageIcon className="h-3.5 w-3.5 mr-2" /> Image Mode
              </SegmentedControlItem>
              <SegmentedControlItem value="video" className="px-6 py-1.5 text-xs font-medium">
                <Video className="h-3.5 w-3.5 mr-2" /> Video Mode
              </SegmentedControlItem>
            </SegmentedControl>
          </div>
        </div>

        {/* RIGHT: Utilities */}
        <div className="flex items-center gap-2">
          {/* History Link */}
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground">
            <Link href="/history">
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
          </Button>

          {/* Admin Link */}
          {user?.role === 'admin' && (
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <Link href="/admin" prefetch={true}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Admin
              </Link>
            </Button>
          )}

          <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

          <ThemeToggleImproved variant="compact" />
          
          <UserMenu />

          {/* Mobile Menu Trigger (already handled in MobileMenu component) */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}