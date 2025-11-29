import { satoshi } from '@/lib/fonts';
import type { Metadata, Viewport } from 'next';
import 'react-image-crop/dist/ReactCrop.css';
import './globals.css';
import { getCurrentUser } from '@/actions/authActions';
import type { SessionUser } from '@/lib/types';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { AppBody } from '@/components/AppBody';

// Removed force-dynamic from root - moved to per-page basis for better performance
// Only pages requiring auth should use force-dynamic

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming issues on input focus on iOS
};

export const metadata: Metadata = {
  title: 'Refashion AI',
  description: 'Edit images with the power of AI, powered by Google Gemini.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force dynamic rendering by accessing connection
  // This ensures the layout is never statically generated at build time
  await connection();

  // Server-side theme detection from cookie
  const themeCookie = (await cookies()).get('theme')?.value;
  const initialTheme = themeCookie === 'light' || themeCookie === 'dark' ? themeCookie : 'dark';

  // Fetch the initial user state on the server at request time
  const initialUser: SessionUser | null = await getCurrentUser();

  return (
    <html lang="en" className={`${initialTheme} ${satoshi.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-gradient-to-br from-background-accent to-background text-foreground flex flex-col min-h-screen" suppressHydrationWarning>
        <AppBody initialUser={initialUser}>{children}</AppBody>
      </body>
    </html>
  );
}
