"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { UserAuthStatus, useAuth, logoutUser } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { Palette, History as HistoryIcon, ShieldCheck, Menu, Sun, Moon, Monitor, LogOut, LogIn, User } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Define navigation items for clean rendering
  const navItems = [
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
          {/* Add Navigation Links */}
          <nav className="flex items-center gap-1">
            {/* Only render the navigation buttons on the client to avoid hydration mismatch */}
            {isClient && (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Button asChild variant={isActive ? 'secondary' : 'ghost'} size="sm" key={item.href}>
                      <Link href={item.href}>
                        <Icon className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline">{item.label}</span>
                      </Link>
                    </Button>
                  );
                })}

                {/* Admin Console Button */}
                {user?.role === 'admin' && (
                  <Button asChild variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'} size="sm">
                    <Link href="/admin">
                      <ShieldCheck className="h-5 w-5 md:mr-2" />
                      <span className="hidden md:inline">Admin</span>
                    </Link>
                  </Button>
                )}
              </>
            )}
          </nav>
          {/* --- DESKTOP CONTROLS --- */}
          <div className="hidden md:flex items-center gap-3">
            <Separator orientation="vertical" className="h-6" />
            <ThemeToggleImproved variant="compact" />
            <UserAuthStatus />
          </div>

          {/* --- MOBILE HAMBURGER MENU --- */}
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
                <DropdownMenuGroup>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin"><ShieldCheck className="mr-2" /> Admin Console</Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme('light')}><Sun className="mr-2" /> Light</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}><Moon className="mr-2" /> Dark</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}><Monitor className="mr-2" /> System</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {user?.isLoggedIn ? (
                  <DropdownMenuItem asChild>
                    {/* Use a form for the logout action */}
                    <form action={logoutUser} className="w-full">
                      <button type="submit" className="flex items-center w-full cursor-default">
                        <LogOut className="mr-2" /> Logout
                      </button>
                    </form>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/login"><LogIn className="mr-2" /> Login</Link>
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