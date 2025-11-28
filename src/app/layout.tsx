import { satoshi } from '@/lib/fonts';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getCurrentUser } from '@/actions/authActions';
import type { SessionUser } from '@/lib/types';
import { connection } from 'next/server';
import { AppBody } from '@/components/AppBody';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#030811',
};

export const metadata: Metadata = {
  title: 'Refashion AI',
  description: 'Professional AI Fashion Studio',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const initialUser: SessionUser | null = await getCurrentUser();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`antialiased font-sans ${satoshi.variable}`}>
        <div className="aurora-bg" />
        <AppBody initialUser={initialUser}>{children}</AppBody>
      </body>
    </html>
  );
}
