// authActions.ts
'use server';

import 'server-only';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sessionOptions } from '@/lib/session';
import type { SessionUser, SessionData } from '@/lib/types';
import * as dbService from '@/services/database.service';
import bcrypt from 'bcrypt';
// ... other imports

export async function loginUser(formData: FormData): Promise<{ error: string } | undefined> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const username = formData.get('username') as string;
  const submittedPassword = formData.get('password') as string;

  let user;
  try {
    user = dbService.findUserByUsername(username);

    // --- FIX: Check for invalid user or password inside the try block and return early ---
    if (!user || !(await bcrypt.compare(submittedPassword, user.passwordHash))) {
      return { error: 'Invalid username or password.' };
    }
  } catch (error) {
    // --- FIX: Simplified catch block for unexpected server errors ---
    console.error("Login action error:", error instanceof Error ? error.message : String(error));
    return { error: 'An unexpected server error occurred.' };
  }

  // --- FIX: Success path is now outside the try...catch block ---
  // This code only runs if authentication was successful and no exceptions were thrown.
  session.user = {
    username: user.username,
    role: user.role,
    isLoggedIn: true,
  };
  await session.save();
  revalidatePath('/', 'layout');
  
  // The redirect call is now safe and won't be caught by our logic.
  redirect('/');
}

export async function logoutUser() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.destroy();
  revalidatePath('/', 'layout'); // CHANGED: Also revalidate layout on logout
  redirect('/login');
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    // Added logging to see what getCurrentUser sees
    console.log("[getCurrentUser] Attempting to fetch current user session.");
    
    // Ensure we have access to cookies (this forces dynamic rendering)
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (session.user?.isLoggedIn) {
      console.log("[getCurrentUser] User found in session:", session.user.username);
      return session.user;
    }
    console.log("[getCurrentUser] No logged-in user found in session.");
    return null;
  } catch (error) {
    // Handle cases where cookies might not be available (e.g., during build)
    console.warn("[getCurrentUser] Failed to access session:", error instanceof Error ? error.message : String(error));
    return null;
  }
}