'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function SiteHeader() {
  const { user } = useAuth();

  return (
    <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="container mx-auto flex justify-between items-center max-w-7xl h-20 px-4">
        {/* Left Side: Branding */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 text-foreground group">
          <Image
            src="/refashion.svg"
            alt="Refashion AI logo"
            width={40}
            height={60}
            className="h-12 w-auto sm:h-14 sm:w-auto transition-transform duration-200 group-hover:scale-102"
          />
          <span className="text-xl sm:text-3xl font-bold transition-colors duration-300 group-hover:text-primary">
            Refashion AI
          </span>
        </Link>

        {/* Right Side: Actions & User Menu */}
        <div className="flex items-center gap-2">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user?.role === 'admin' && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  <span>Admin</span>
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