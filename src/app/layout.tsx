import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { getCurrentUser } from '@/actions/authActions';
import type { SessionUser } from '@/lib/types';
import { cookies } from 'next/headers';
import { AppBody } from '@/components/AppBody';

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

  // Server-side theme detection from cookie
  const themeCookie = (await cookies()).get('theme')?.value;
  const initialTheme = themeCookie === 'light' || themeCookie === 'dark' ? themeCookie : 'dark';

  // Fetch the initial user state on the server at request time
  const initialUser: SessionUser | null = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#020410" />
        <meta name="color-scheme" content="dark" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body { 
              background-color: hsl(224, 71%, 4%) !important; 
              margin: 0; 
              padding: 0; 
            }
          `
        }} />
        <Script id="theme-init-script" strategy="beforeInteractive">
          {`
            (function() {
              function setTheme() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = theme === 'dark' || (theme === 'system' && systemPrefersDark) || (!theme && true);
                  const root = document.documentElement;
                  
                  root.classList.remove('light', 'dark');
                  if (shouldBeDark) {
                    root.classList.add('dark');
                  } else {
                    root.classList.add('light');
                  }
                } catch (e) {
                  console.error("Error setting initial theme:", e);
                  document.documentElement.classList.add('dark');
                }
              }
              setTheme();
            })();
          `}
        </Script>
      </head>
      <body
        className={`antialiased bg-gradient-to-br from-background-accent to-background text-foreground flex flex-col min-h-screen ${initialTheme}`}
        style={{
          '--font-geist-sans': 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          '--font-geist-mono': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        } as React.CSSProperties}
      >
        {/* The entire body content is now a Client Component, receiving server data as props */}
        <AppBody initialUser={initialUser}>{children}</AppBody>
      </body>
    </html>
  );
}
