'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

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
        'sticky top-0 z-50 w-full transition-all duration-300 ease-in-out',
        isScrolled
          ? 'border-b border-border/20 bg-background/95 backdrop-blur-md'
          : 'border-b border-transparent bg-background/80 backdrop-blur-sm'
      )}
    >
      <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 h-[var(--header-height)]">
        {/* Left Side: Branding */}
        <Link href="/" prefetch={true} className="flex items-center gap-3 text-foreground group">
          <Image
            src="/refashion.svg"
            alt="Refashion AI logo"
            width={100}
            height={60}
            className="h-16 w-auto transition-transform duration-300 group-hover:scale-105"
            priority
          />
            {/* <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-gradient-end bg-clip-text text-transparent">
            Refashion AI
            </span> */}
        </Link>

        {/* Right Side: Actions & User Menu */}
        <div className="flex items-center gap-2">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {user?.role === 'admin' && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin" prefetch={true}>
                  <ShieldCheck className="h-4 w-4" />
                  <span className="ml-2">Admin</span>
                </Link>
              </Button>
            )}
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