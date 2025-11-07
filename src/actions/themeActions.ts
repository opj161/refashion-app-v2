'use server';

import 'server-only';

import { cookies } from 'next/headers';

type Theme = 'light' | 'dark' | 'system';

export async function setThemeCookie(theme: Theme) {
  try {
    const cookieStore = await cookies();
    cookieStore.set('theme', theme, { path: '/', maxAge: 60 * 60 * 24 * 365 }); // Persist for 1 year
    return { success: true };
  } catch (error) {
    console.error('Failed to set theme cookie:', error);
    return { success: false, error: 'Failed to set theme cookie.' };
  }
}
