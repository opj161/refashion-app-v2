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
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Menu, Sun, Moon, Monitor, LogOut, LogIn, User, LayoutGrid, Film } from 'lucide-react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useShallow } from 'zustand/react/shallow';

export function MobileMenu() {
  const { user } = useAuth();
  const { setTheme, theme } = useTheme();
  const { activeView, setActiveView } = useGenerationSettingsStore(
    useShallow(state => ({
      activeView: state.activeView,
      setActiveView: state.setActiveView
    }))
  );

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="touch-target-min">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col bg-background/95 backdrop-blur-xl border-l border-white/10">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
              {user?.isLoggedIn ? user.username : "Menu"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-6 flex-1 overflow-y-auto">

            {/* Mode Switcher for Mobile */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Mode</p>
              <SegmentedControl
                value={activeView}
                onValueChange={(v) => setActiveView(v as 'image' | 'video')}
                options={[
                  { value: 'image', label: 'Studio', icon: LayoutGrid },
                  { value: 'video', label: 'Motion', icon: Film },
                ]}
              />
            </div>

            <Separator className="bg-white/5" />

            {user?.role === 'admin' && (
              <Button asChild variant="outline" className="justify-start h-12 text-base border-white/10 bg-white/5">
                <Link href="/admin">
                  <ShieldCheck className="mr-3 h-5 w-5" /> Admin Console
                </Link>
              </Button>
            )}

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Appearance</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')} className="border-white/10">
                  <Sun className="h-4 w-4 mr-2" /> Light
                </Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')} className="border-white/10">
                  <Moon className="h-4 w-4 mr-2" /> Dark
                </Button>
                <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')} className="border-white/10">
                  <Monitor className="h-4 w-4 mr-2" /> Auto
                </Button>
              </div>
            </div>
          </div>

          {/* Footer area with safe area padding */}
          <div className="mt-auto pb-safe pt-4 border-t border-white/10">
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
