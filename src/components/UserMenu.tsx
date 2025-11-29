"use client";

import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/actions/authActions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

export function UserMenu() {
  const { user } = useAuth();

  if (!user?.isLoggedIn) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Login</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* REFACTOR: h-8 w-8 -> size-8 */}
        <Button variant="ghost" className="relative size-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold">
          {user.username.charAt(0).toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/history" className="w-full cursor-default">
            History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logoutUser} className="w-full">
            <button type="submit" className="flex items-center w-full h-full text-left cursor-default">
              {/* REFACTOR: h-4 w-4 -> size-4 */}
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
