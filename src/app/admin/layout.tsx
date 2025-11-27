// src/app/admin/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { Home, ShieldCheck, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminNav } from './_components/AdminNav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { connection } from 'next/server';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await connection();
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    return notFound(); // Or redirect('/login') if you prefer
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="border-b border-border shrink-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto flex justify-between items-center max-w-7xl h-16 px-4">
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="pr-0 pt-12"><AdminNav /></SheetContent>
                  </Sheet>
                </div>
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span className="text-base sm:text-lg font-semibold tracking-tight">Admin Console</span>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/"><Home className="mr-2 h-4 w-4" />Back to App</Link>
                </Button>
            </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 py-10 px-4">
          <aside className="hidden md:block sticky top-0 h-fit">
            <AdminNav />
          </aside>
          <main className="w-full">{children}</main>
        </div>
      </div>
    </div>
  );
}
