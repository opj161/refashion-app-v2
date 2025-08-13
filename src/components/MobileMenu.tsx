'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/actions/authActions';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { ShieldCheck, Menu, Sun, Moon, Monitor, LogOut, LogIn } from 'lucide-react';

export function MobileMenu() {
  const { user } = useAuth();
  const { setTheme } = useTheme();

  return (
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
          {user?.role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Console</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuGroup>
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTheme('light')}><Sun className="mr-2 h-4 w-4" /> Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}><Moon className="mr-2 h-4 w-4" /> Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}><Monitor className="mr-2 h-4 w-4" /> System</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {user?.isLoggedIn ? (
            <DropdownMenuItem asChild>
              <form action={logoutUser} className="w-full">
                <button type="submit" className="flex items-center w-full h-full cursor-default text-left">
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
  );
}
