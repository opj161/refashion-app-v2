// src/actions/adminActions.ts
'use server';

import { revalidatePath } from 'next/cache';
import * as dbService from '@/services/database.service';
import { getCurrentUser } from './authActions';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import * as settingsService from '@/services/settings.service';

const SALT_ROUNDS = 12;

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.');
  }
  return user;
}

export async function getAllUsers() {
  await verifyAdmin();
  const db = dbService.getDb();
  const stmt = db.prepare('SELECT username, role FROM users ORDER BY username');
  return stmt.all() as { username: string; role: 'admin' | 'user' }[];
}

export async function createUser(formData: FormData) {
  const admin = await verifyAdmin();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as 'admin' | 'user';

  if (!username || !password || !role) {
    return { success: false, error: 'All fields are required.' };
  }

  if (admin.username === username) {
    return { success: false, error: "You cannot create a user with your own username." };
  }
  
  try {
    const db = dbService.getDb();
    const existingUser = dbService.findUserByUsername(username);
    if (existingUser) {
      return { success: false, error: 'Username already exists.' };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    stmt.run(username, passwordHash, role);

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Database error occurred.' };
  }
}

export async function deleteUser(username: string) {
  const admin = await verifyAdmin();
  
  if (admin.username === username) {
    return { success: false, error: "You cannot delete your own account." };
  }

  try {
    const db = dbService.getDb();
    const stmt = db.prepare('DELETE FROM users WHERE username = ?');
    const result = stmt.run(username);

    if (result.changes === 0) {
        return { success: false, error: "User not found." };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Database error occurred.' };
  }
}

export async function getAllSettings() {
  await verifyAdmin();
  return settingsService.getAllSettings();
}

export async function updateSetting(key: settingsService.SettingKey, value: boolean) {
  await verifyAdmin();
  try {
    settingsService.setSetting(key, value.toString());
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return { success: false, error: 'Failed to update setting.' };
  }
}

export async function triggerCacheCleanup() {
  await verifyAdmin();
  try {
    const cacheFilePath = path.join(process.cwd(), '.cache', 'image-processing-cache.json');
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    let cache: Record<string, any> = {};
    try {
      const data = await fs.readFile(cacheFilePath, 'utf-8');
      cache = JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return { success: true, message: 'Cache file does not exist. Nothing to clean up.' };
      }
      throw error;
    }

    const now = Date.now();
    let removedCount = 0;
    const initialCount = Object.keys(cache).length;

    for (const [hash, entry] of Object.entries(cache)) {
      if (entry.timestamp && (now - entry.timestamp) > maxAgeMs) {
        delete cache[hash];
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await fs.writeFile(cacheFilePath, JSON.stringify(cache, null, 2));
      return { success: true, message: `Cache cleanup complete. Removed ${removedCount} of ${initialCount} entries.` };
    } else {
      return { success: true, message: `Cache is clean. No entries were old enough to remove (${initialCount} entries remain).` };
    }
  } catch (error) {
    console.error('Error during cache cleanup from admin panel:', error);
    return { success: false, error: 'Cache cleanup failed.' };
  }
}
