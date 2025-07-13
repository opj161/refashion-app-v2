"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { UserAuthStatus, useAuth } from '@/contexts/AuthContext';
import { Home, History as HistoryIcon, ShieldCheck, Loader2 } from 'lucide-react';
import type { SessionUser } from '@/lib/types';
import React, { useState, useEffect, useTransition } from 'react';

const NAV_ITEMS = [
	{
		href: '/admin',
		label: 'Admin',
		icon: ShieldCheck,
		// Logic is correct: only show for admin users.
		visible: (user: SessionUser | null, pathname: string) => user?.role === 'admin',
		active: (pathname: string) => pathname.startsWith('/admin'),
	},
	{
		href: '/create',
		label: 'Create',
		icon: Home,
		// FIX: Show if the user is logged in, regardless of the current page.
		visible: (user: SessionUser | null, pathname: string) => !!user?.isLoggedIn,
		active: (pathname: string) => pathname.startsWith('/create'),
	},
	{
		href: '/history',
		label: 'History',
		icon: HistoryIcon,
		// FIX: Show if the user is logged in, regardless of the current page.
		visible: (user: SessionUser | null, pathname: string) => !!user?.isLoggedIn,
		active: (pathname: string) => pathname.startsWith('/history'),
	},
];

export function SiteHeader() {
	const pathname = usePathname();
	const { user, isHydrated } = useAuth();
	const [isPending, startTransition] = useTransition();

	return (
		<header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
			<div className="container mx-auto flex items-center justify-between max-w-7xl h-20 px-4">
				{/* LEFT SIDE: Logo and Navigation */}
				<div className="flex items-center gap-4">
					<Link href="/create" className="flex items-center gap-2.5 sm:gap-3 text-foreground hover:text-primary transition-colors">
						<Image
							src="/refashion.webp"
							alt="Refashion AI logo"
							width={40}
							height={60}
							className="h-12 w-auto sm:h-14 sm:w-auto"
						/>
						<span className="text-xl sm:text-3xl font-bold">
							Refashion AI
						</span>
					</Link>
					<nav className="flex items-center gap-1">
						{/* Render nav items only when the auth context is hydrated */}
						{isHydrated &&
							NAV_ITEMS.filter(item => item.visible(user, pathname)).map(item => {
								const isActive = item.active(pathname);
								return (
									<Button
										key={item.href}
										asChild
										variant={isActive ? 'active' : 'ghost'}
										size="sm"
										className="px-2"
										// ENHANCEMENT: Disable the active button to prevent redundant navigation.
										disabled={isActive || isPending}
										onClick={() => !isActive && startTransition(() => {})}
									>
										<Link href={item.href}>
											<item.icon className="h-5 w-5 md:mr-2" />
											<span className="hidden md:inline">{item.label}</span>
										</Link>
									</Button>
								);
							})}
						{isPending && (
							<div className="px-2">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						)}
					</nav>
				</div>
				{/* RIGHT SIDE: Theme Toggle and User Status */}
				<div className="flex items-center gap-2">
					<ThemeToggleImproved />
					<Separator orientation="vertical" className="h-8" />
					<UserAuthStatus />
				</div>
			</div>
		</header>
	);
}