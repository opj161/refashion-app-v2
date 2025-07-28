"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { UserAuthStatus, useAuth, logoutUser } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, LayoutGroup } from 'motion/react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { Palette, History as HistoryIcon, ShieldCheck, Menu, Sun, Moon, Monitor, LogOut, LogIn, User } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Define ONLY primary navigation items here. Admin is a secondary action.
  const primaryNavItems = [
    { href: '/create', label: 'Create', icon: Palette },
    { href: '/history', label: 'History', icon: HistoryIcon },
  ];

  return (
    <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="container mx-auto flex justify-between items-center max-w-7xl h-20 px-4">
        {/* Make Logo and Title a link to the homepage */}
        <Link href="/create" className="flex items-center gap-2.5 sm:gap-3 text-foreground group">
          <Image
            src="/refashion.webp"
            alt="Refashion AI logo"
            width={40}
            height={60}
            className="h-12 w-auto sm:h-14 sm:w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-xl sm:text-3xl font-bold transition-colors duration-300 group-hover:text-primary">
            Refashion AI
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {/* --- CORRECTED ALWAYS-VISIBLE PRIMARY NAVIGATION --- */}
          {/* The nav element is now always a flex container. The responsive magic happens inside the buttons. */}
          <nav className="flex items-center gap-1">
            {isClient && primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Button asChild variant={isActive ? 'secondary' : 'ghost'} size="sm" key={item.href}>
                  <Link href={item.href}>
                    <Icon className="h-5 w-5 mr-2" />
                    {/* Text is now always visible */}
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* --- DESKTOP-ONLY SECONDARY CONTROLS --- */}
          <div className="hidden md:flex items-center gap-3">
            {/* The Admin button now correctly lives with other secondary desktop controls */}
            {user?.role === 'admin' && (
              <Button asChild variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'} size="sm">
                <Link href="/admin">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  <span>Admin</span>
                </Link>
              </Button>
            )}
            <Separator orientation="vertical" className="h-6" />
            <ThemeToggleImproved variant="compact" />
            <UserAuthStatus />
          </div>

          {/* --- MOBILE HAMBURGER MENU --- */}
          {/* This menu correctly contains ONLY the secondary actions now. */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user?.isLoggedIn ? `Hello, ${user.username}` : "Menu"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Admin link is a secondary action, so it goes in the menu on mobile */}
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Console</Link>
                  </DropdownMenuItem>
                )}
                {user?.role === 'admin' && <DropdownMenuSeparator />}
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme('light')}><Sun className="mr-2 h-4 w-4" /> Light</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}><Moon className="mr-2 h-4 w-4" /> Dark</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}><Monitor className="mr-2 h-4 w-4" /> System</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {user?.isLoggedIn ? (
                  <DropdownMenuItem asChild>
                    <form action={logoutUser} className="w-full h-full">
                      <button type="submit" className="flex items-center w-full h-full cursor-default">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </button>
                    </form>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}