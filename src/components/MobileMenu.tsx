'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/actions/authActions';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggleImproved } from "@/components/ui/ThemeToggleImproved";
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Menu, Sun, Moon, Monitor, LogOut, LogIn, User } from 'lucide-react';

export function MobileMenu() {
  const { user } = useAuth();
  const { setTheme, theme } = useTheme();

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          {/* 7. TOUCH TARGET: touch-target-min -> min-h-touch min-w-touch */}
          <Button variant="ghost" size="icon" className="min-h-touch min-w-touch">
            <Menu className="size-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-mobile-menu sm:w-mobile-menu-lg flex flex-col">
          <div className="flex flex-col gap-6 py-4">
            <div className="flex items-center gap-2 px-2">
              <span className="font-bold text-lg">Refashion AI</span>
            </div>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-2 py-2 text-lg font-medium hover:text-primary transition-colors"
              >
                Studio
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-2 px-2 py-2 text-lg font-medium hover:text-primary transition-colors"
              >
                History
              </Link>
              <div className="px-2 py-2">
                <ThemeToggleImproved />
              </div>
            </nav>
          </div>

          {/* 6. SAFE AREA: pb-safe -> pb-safe-bottom */}
          <div className="mt-auto pb-safe-bottom pt-4 border-t border-border/40">
            {user?.isLoggedIn ? (
              <form action={logoutUser} className="w-full">
                {/* REFACTOR: size-5 for icons */}
                <Button type="submit" variant="destructive" className="w-full justify-start h-12 text-base">
                  <LogOut className="mr-3 size-5" /> Logout
                </Button>
              </form>
            ) : (
              <Button asChild className="w-full justify-start h-12 text-base">
                <Link href="/login"><LogIn className="mr-3 size-5" /> Login</Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
