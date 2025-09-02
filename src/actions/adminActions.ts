// src/actions/adminActions.ts
'use server';

import { revalidatePath } from 'next/cache';
import * as dbService from '@/services/database.service';
import { getCurrentUser } from './authActions';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import * as settingsService from '@/services/settings.service';
import { encrypt, decrypt } from '@/services/encryption.service';
import * as systemPromptService from '@/services/systemPrompt.service';
import crypto from 'crypto';
import archiver from 'archiver';
import os from 'os';
import * as analyticsService from '@/services/analytics.service';
import type {
  KpiData,
  GenerationActivityData,
  TopParameterUsageData,
  UserActivityData,
} from '@/services/analytics.service';

const SALT_ROUNDS = 12;

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.');
  }
  return user;
}

// --- Dashboard Analytics Action ---

export interface DashboardAnalyticsData {
  kpis: KpiData;
  activity: GenerationActivityData[];
  userStats: UserActivityData[];
  topStyles: TopParameterUsageData[];
  topBackgrounds: TopParameterUsageData[];
}

export async function getAllUsers() {
  await verifyAdmin();
  const db = dbService.getDb();
  const stmt = db.prepare('SELECT username, role, gemini_api_key_1_mode, gemini_api_key_2_mode, gemini_api_key_3_mode, fal_api_key_mode, image_generation_model FROM users ORDER BY username');
  return stmt.all() as any[]; // Simplified for brevity, define a proper type
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

export async function updateUserConfiguration(formData: FormData) {
  await verifyAdmin();
  const username = formData.get('username') as string;
  if (!username) {
    return { success: false, error: 'Username is required.' };
  }

  // Dynamically build the update statement only from present fields
  const setClauses: string[] = [];
  const params: any[] = [];

  const role = formData.get('role');
  if (role) { setClauses.push('role = ?'); params.push(role); }

  const gemini1Mode = formData.get('gemini_api_key_1_mode');
  if (gemini1Mode) { setClauses.push('gemini_api_key_1_mode = ?'); params.push(gemini1Mode); }
  const gemini2Mode = formData.get('gemini_api_key_2_mode');
  if (gemini2Mode) { setClauses.push('gemini_api_key_2_mode = ?'); params.push(gemini2Mode); }
  const gemini3Mode = formData.get('gemini_api_key_3_mode');
  if (gemini3Mode) { setClauses.push('gemini_api_key_3_mode = ?'); params.push(gemini3Mode); }
  const falMode = formData.get('fal_api_key_mode');
  if (falMode) { setClauses.push('fal_api_key_mode = ?'); params.push(falMode); }
  const imageModel = formData.get('image_generation_model');
  if (imageModel) { setClauses.push('image_generation_model = ?'); params.push(imageModel); }

  // --- START OF FIX ---
  // Helper function to handle key updates.
  // This will only update the key if a NEW, NON-EMPTY value is provided.
  // It also handles clearing the key if an empty string is explicitly submitted.
  const handleKeyUpdate = (keyName: string) => {
    const key_value = formData.get(keyName);
    
    // The key exists in the form data, meaning the input was enabled.
    if (key_value !== null) {
      setClauses.push(`${keyName} = ?`);
      params.push(encrypt(key_value as string));
    }
  };

  // Replace the old logic with the new helper
  handleKeyUpdate('gemini_api_key_1');
  handleKeyUpdate('gemini_api_key_2');
  handleKeyUpdate('gemini_api_key_3');
  handleKeyUpdate('fal_api_key');
  // --- END OF FIX ---

  if (setClauses.length === 0) {
    return { success: true, message: 'No changes submitted.' };
  }

  try {
    const db = dbService.getDb();
    params.push(username); // For the WHERE clause
    const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE username = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...params);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error(`Error updating configuration for user ${username}:`, error);
    return { success: false, error: 'Database error occurred during update.' };
  }
}

export async function updateEncryptedSetting(key: settingsService.SettingKey, value: string) {
  await verifyAdmin();
  try {
    const encryptedValue = value ? encrypt(value) : '';
    settingsService.setSetting(key, encryptedValue);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error(`Error updating encrypted setting ${key}:`, error);
    return { success: false, error: 'Failed to update setting.' };
  }
}

export async function getGlobalApiKeysForDisplay() {
  const settings = settingsService.getAllSettings();
  const { decrypt } = await import('@/services/encryption.service');
  const mask = (key: string) => key ? `••••••••••••${key.slice(-4)}` : 'Not Set';
  return {
    gemini1: mask(decrypt(settings.global_gemini_api_key_1)),
    gemini2: mask(decrypt(settings.global_gemini_api_key_2)),
    gemini3: mask(decrypt(settings.global_gemini_api_key_3)),
    fal: mask(decrypt(settings.global_fal_api_key)),
  };
}

export async function getSystemPromptForAdmin() {
  await verifyAdmin();
  try {
    const prompt = await systemPromptService.getSystemPrompt();
    const source = await systemPromptService.getSystemPromptSource();
    return { success: true, prompt, source };
  } catch (error) {
    console.error('Error getting system prompt:', error);
    return { success: false, error: 'Failed to get system prompt.' };
  }
}

export async function updateSystemPrompt(prompt: string) {
  await verifyAdmin();
  try {
    systemPromptService.updateSystemPrompt(prompt);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return { success: false, error: 'Failed to update system prompt.' };
  }
}

export async function generateApiKeyForUser(username: string): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  await verifyAdmin();

  try {
    const db = dbService.getDb();
    const apiKey = `rf_${crypto.randomBytes(24).toString('hex')}`;
    
    const stmt = db.prepare('UPDATE users SET app_api_key = ? WHERE username = ?');
    const result = stmt.run(apiKey, username);

    if (result.changes === 0) {
      return { success: false, error: 'User not found.' };
    }
    
    revalidatePath('/admin/users');
    return { success: true, apiKey };

  } catch (error) {
    console.error(`Error generating API key for ${username}:`, error);
    return { success: false, error: 'Database error occurred.' };
  }
}

export async function exportAllData(): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  await verifyAdmin();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const zipFileName = `refashion-export-${timestamp}.zip`;
  // Use OS-appropriate temporary directory
  const zipFilePath = path.join(os.tmpdir(), zipFileName);

  try {
    const fsSync = await import('fs');
    
    await new Promise<void>((resolve, reject) => {
      const output = fsSync.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Set the compression level
      });

      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
        resolve();
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archiver warning:', err);
        } else {
          reject(err);
        }
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add database files
      const dbPath = path.join(process.cwd(), 'user_data', 'history');
      if (fsSync.existsSync(dbPath)) {
        console.log('Adding database directory to archive...');
        archive.directory(dbPath, 'database');
      } else {
        console.warn('Database directory not found, skipping.');
      }
      
      // Add all media files
      const uploadsPath = path.join(process.cwd(), 'uploads');
      if (fsSync.existsSync(uploadsPath)) {
        console.log('Adding media uploads directory to archive...');
        archive.directory(uploadsPath, 'media');
      } else {
        console.warn('Uploads directory not found, skipping.');
      }

      // Add cache file for completeness
      const cachePath = path.join(process.cwd(), '.cache');
      if (fsSync.existsSync(cachePath)) {
        console.log('Adding cache directory to archive...');
        archive.directory(cachePath, 'cache');
      }

      archive.finalize();
    });

    const downloadUrl = `/api/admin/download-export?file=${zipFileName}`;
    return { success: true, downloadUrl };

  } catch (error) {
    console.error('Failed to create data export archive:', error);
    // Clean up partial file on error
    try {
      const fsSync = await import('fs');
      if (fsSync.existsSync(zipFilePath)) {
        fsSync.unlinkSync(zipFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up partial export file:', cleanupError);
    }
    return { success: false, error: (error as Error).message };
  }
}

export async function getDashboardAnalytics(
  activityDays: 7 | 30 = 7
): Promise<{ success: boolean; data?: DashboardAnalyticsData; error?: string }> {
  await verifyAdmin();

  try {
    // Fetch all data points in parallel for maximum performance
    const [kpiData, storageUsed, activity, userStats, topStyles, topBackgrounds] = await Promise.all([
      analyticsService.getDashboardKpis(),
      analyticsService.getTotalMediaStorage(),
      analyticsService.getGenerationActivity(activityDays),
      analyticsService.getUserActivity(),
      analyticsService.getTopParameterUsage('fashionStyle'),
      analyticsService.getTopParameterUsage('background'),
    ]);

    return {
      success: true,
      data: {
        kpis: { ...kpiData, totalStorageUsed: storageUsed },
        activity, userStats, topStyles, topBackgrounds
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return { success: false, error: "Failed to load dashboard analytics data." };
  }
}

export async function getGenerationActivityAction(
  days: 7 | 30
): Promise<{ success: boolean; data?: GenerationActivityData[]; error?: string }> {
  await verifyAdmin();
  try {
    const activityData = await analyticsService.getGenerationActivity(days);
    return { success: true, data: activityData };
  } catch (error) {
    console.error(`Error fetching activity for ${days} days:`, error);
    return { success: false, error: 'Failed to fetch activity data.' };
  }
}

