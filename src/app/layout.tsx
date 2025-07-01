import type { Metadata } from 'next';
import Image from 'next/image';
import Script from 'next/script'; // Import next/script
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, UserAuthStatus } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { getCurrentUser } from '@/actions/authActions';
import type { SessionUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Home, Video, History as HistoryIcon } from 'lucide-react'; // Import Home and History icons
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { cookies } from 'next/headers';

// Force dynamic rendering to ensure authentication state is determined at request time
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Refashion AI',
  description: 'Edit images with the power of AI, powered by Google Gemini.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force dynamic rendering by accessing cookies
  // This ensures the layout is never statically generated at build time
  await cookies();
  
  // Fetch the initial user state on the server at request time
  const initialUser: SessionUser | null = await getCurrentUser();  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init-script" strategy="beforeInteractive">
          {`
            (function() {
              function setTheme() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  // Default to dark if no theme in localStorage or if theme is 'system' and system prefers dark
                  var shouldBeDark = theme === 'dark' || (theme === 'system' && systemPrefersDark) || (!theme && true);

                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  if (shouldBeDark) {
                    root.classList.add('dark');
                  } else {
                    root.classList.add('light');
                  }
                } catch (e) {
                  console.error("Error setting initial theme:", e);
                  document.documentElement.classList.add('dark'); // Default fallback
                }
              }
              setTheme();
            })();
          `}
        </Script>
      </head>
      <body
        className="antialiased bg-background text-foreground flex flex-col min-h-screen"
        style={{
          '--font-geist-sans': 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          '--font-geist-mono': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        } as React.CSSProperties}
      >
        {/* Pass initialUser to AuthProvider */}        <AuthProvider initialUser={initialUser}>
          <ThemeProvider
            defaultTheme="dark"
            storageKey="theme"
          >
            <header className="p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
              <div className="container mx-auto flex justify-between items-center max-w-5xl">
                {/* Make Logo and Title a link to the homepage */}
                <Link href="/create" className="flex items-center gap-2.5 sm:gap-3 text-foreground hover:text-primary transition-colors">
                  <Image
                    src="/refashion.webp"
                    alt="Refashion AI logo"
                    width={40} // Adjusted size for header
                    height={40}
                    className="w-8 h-8 sm:w-10 sm:h-10"
                  />
                  <span className="text-xl sm:text-2xl font-bold tracking-tight">
                    Refashion AI
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  {/* Add Navigation Links */}
                  <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm" className="px-2">
                      <Link href="/create">
                        <Home className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline">Create</span>
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="px-2">
                      <Link href="/history">
                        <HistoryIcon className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline">History</span>
                      </Link>
                    </Button>
                  </nav>
                  <Separator orientation="vertical" className="h-6 hidden md:block" />
                  <ThemeToggleImproved variant="compact" />
                  <UserAuthStatus />
                </div>
              </div>
            </header>
            <div className="flex-1 flex flex-col">{children}</div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
