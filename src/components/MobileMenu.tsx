'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/actions/authActions';
import { useTheme } from '@/contexts/ThemeContext';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Menu, Sun, Moon, Monitor, LogOut, LogIn, User, Image as ImageIcon, Video, History } from 'lucide-react';

export function MobileMenu() {
  const { user } = useAuth();
  const { setTheme, theme } = useTheme();
  const activeView = useGenerationSettingsStore(state => state.activeView);
  const setActiveView = useGenerationSettingsStore(state => state.setActiveView);

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="touch-target-min">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
              {user?.isLoggedIn ? user.username : "Menu"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            
            {/* Mobile View Switcher */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Workspace Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={activeView === 'image' ? 'default' : 'outline'} 
                  className="justify-start h-12" 
                  onClick={() => setActiveView('image')}
                >
                  <ImageIcon className="mr-2 h-4 w-4" /> Image
                </Button>
                <Button 
                  variant={activeView === 'video' ? 'default' : 'outline'} 
                  className="justify-start h-12" 
                  onClick={() => setActiveView('video')}
                >
                  <Video className="mr-2 h-4 w-4" /> Video
                </Button>
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* Navigation */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Navigation</p>
              <Button asChild variant="ghost" className="w-full justify-start h-12 text-base">
                <Link href="/history"><History className="mr-3 h-5 w-5" /> Full History</Link>
              </Button>
              {user?.role === 'admin' && (
                <Button asChild variant="outline" className="justify-start h-12 text-base">
                  <Link href="/admin">
                    <ShieldCheck className="mr-3 h-5 w-5" /> Admin Console
                  </Link>
                </Button>
              )}
            </div>

            <Separator className="bg-white/5" />

            {/* Theme */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Appearance</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('light')}>
                  <Sun className="h-4 w-4" />
                </Button>
                <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>
                  <Moon className="h-4 w-4" />
                </Button>
                <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('system')}>
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* FIX: Footer area with safe area padding */}
          <div className="mt-auto pb-safe pt-4 border-t border-border/40">
            {user?.isLoggedIn ? (
              <form action={logoutUser} className="w-full">
                <Button type="submit" variant="destructive" className="w-full justify-start h-12 text-base">
                  <LogOut className="mr-3 h-5 w-5" /> Logout
                </Button>
              </form>
            ) : (
              <Button asChild className="w-full justify-start h-12 text-base">
                <Link href="/login"><LogIn className="mr-3 h-5 w-5" /> Login</Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
