// src/actions/adminActions.ts
'use server';

import 'server-only';

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
import { constructStudioPrompt, compareClothingDescriptions } from '@/ai/domain/studio-prompt';

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

export async function getSystemPromptsForAdmin() {
  await verifyAdmin();
  try {
    const engineerPrompt = await systemPromptService.getSystemPrompt();
    const engineerSource = await systemPromptService.getSystemPromptSource();
    
    // Fetch the new studio prompt directly from settings service
    const studioPrompt = settingsService.getSetting('ai_studio_mode_prompt_template');
    
    // Define the fallback template that matches the one used in generate-image-edit.ts
    const studioFallbackTemplate = `Create a high-quality, full-body fashion photograph of a realistic female model wearing the {clothingItem} from the provided image. The model should wear the item with a {fitDescription}, posing in a relaxed, candid manner with a natural expression and subtle smile. The setting should be simple and well-suited to the clothing. To perfectly replicate the reference garment, ensure high fidelity to the original fabric texture, color, pattern, and specific design details.`;

    // Use the database template if available; otherwise, use the fallback
    const studioPromptToShow = studioPrompt && studioPrompt.trim() ? studioPrompt : studioFallbackTemplate;

    return { 
      success: true, 
      prompts: {
        engineer: engineerPrompt,
        studio: studioPromptToShow
      },
      sources: {
        engineer: engineerSource,
      } 
    };
  } catch (error) {
    console.error('Error getting system prompts:', error);
    return { success: false, error: 'Failed to get system prompts.' };
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

// --- Studio Prompt Testing Action ---

// ... (existing code)

export async function testStudioPrompt(formData: FormData): Promise<{
  success: boolean;
  classification?: string;
  prompt?: string;
  comparisons?: Record<string, string>;
  error?: string;
}> {
  // 1. Security Check
  const admin = await verifyAdmin();

  // 2. Extract Data
  const file = formData.get('image') as File | null;
  const fit = formData.get('fit') as string;
  const model = formData.get('model') as string;
  const template = formData.get('template') as string;
  const compareAll = formData.get('compareAll') === 'true';

  if (!file || file.size === 0) {
    return { success: false, error: "No test image provided." };
  }

  if (!fit || !['slim', 'regular', 'relaxed'].includes(fit)) {
    return { success: false, error: "Invalid fit parameter." };
  }

  try {
    // 3. Convert File to Data URI
    // The domain service expects a Data URI for direct API transmission
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/png';
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // 4. Execute Domain Logic
    if (compareAll) {
      const comparisons = await compareClothingDescriptions(dataUri, admin.username);
      return {
        success: true,
        comparisons
      };
    } else {
      // We pass the template explicitly to override the database setting
      const result = await constructStudioPrompt(
        dataUri,
        fit as 'slim' | 'regular' | 'relaxed',
        admin.username,
        template, // <--- The override from the UI
        model // <--- The selected model
      );

      return {
        success: true,
        classification: result.classification,
        prompt: result.finalPrompt,
      };
    }

  } catch (error) {
    console.error("Studio Prompt Dry Run Failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred during test." 
    };
  }
}

// --- Form State Types for useActionState ---

export type ApiKeysFormState = {
  message: string;
  success?: boolean;
  error?: string;
};

export type SystemPromptsFormState = {
  message: string;
  success?: boolean;
  error?: string;
};

export type CacheCleanupFormState = {
  message: string;
  success?: boolean;
  error?: string;
};

export type UserFormState = {
  message: string;
  success?: boolean;
  error?: string;
  user?: {
    username: string;
    role: 'admin' | 'user';
    gemini_api_key_1_mode: 'global' | 'user_specific';
    gemini_api_key_2_mode: 'global' | 'user_specific';
    gemini_api_key_3_mode: 'global' | 'user_specific';
    fal_api_key_mode: 'global' | 'user_specific';
    image_generation_model: 'fal_nano_banana_pro' | 'fal_gemini_2_5';
  };
};

// --- useActionState-compatible Server Actions ---

/**
 * Server Action for updating API keys, compatible with useActionState.
 * @param previousState The previous form state (unused but required by useActionState signature)
 * @param formData The form data containing API key values
 * @returns A FormState object with success/error status
 */
export async function handleApiKeysUpdate(
  previousState: ApiKeysFormState | null,
  formData: FormData
): Promise<ApiKeysFormState> {
  await verifyAdmin();
  
  try {
    // Create an array of update promises
    const updatePromises = [];
    
    // Only add an update promise if the user has entered a new value
    const gemini1 = formData.get('gemini1') as string;
    const gemini2 = formData.get('gemini2') as string;
    const gemini3 = formData.get('gemini3') as string;
    const fal = formData.get('fal') as string;
    
    if (gemini1) {
      updatePromises.push(updateEncryptedSetting('global_gemini_api_key_1', gemini1));
    }
    if (gemini2) {
      updatePromises.push(updateEncryptedSetting('global_gemini_api_key_2', gemini2));
    }
    if (gemini3) {
      updatePromises.push(updateEncryptedSetting('global_gemini_api_key_3', gemini3));
    }
    if (fal) {
      updatePromises.push(updateEncryptedSetting('global_fal_api_key', fal));
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      return { 
        success: true, 
        message: 'Global API keys have been saved.' 
      };
    } else {
      return { 
        success: false, 
        message: 'No new API keys were entered.' 
      };
    }

  } catch (error) {
    console.error('Error updating API keys:', error);
    return { 
      success: false,
      error: 'Failed to update API keys.',
      message: 'An error occurred while updating the API keys.'
    };
  }
}

/**
 * Server Action for updating system prompts, compatible with useActionState.
 * @param previousState The previous form state (unused but required by useActionState signature)
 * @param formData The form data containing the system prompts
 * @returns A FormState object with success/error status
 */
export async function handleSystemPromptUpdate(
  previousState: SystemPromptsFormState | null,
  formData: FormData
): Promise<SystemPromptsFormState> {
  await verifyAdmin();
  
  const engineerPrompt = formData.get('systemPrompt') as string;
  const studioPrompt = formData.get('studioPromptTemplate') as string;
  
  try {
    const updatedFields: string[] = [];

    if (engineerPrompt && engineerPrompt.trim() !== '') {
      systemPromptService.updateSystemPrompt(engineerPrompt);
      updatedFields.push('Prompt Engineer instruction');
    }

    if (studioPrompt && studioPrompt.trim() !== '') {
      settingsService.setSetting('ai_studio_mode_prompt_template', studioPrompt);
      updatedFields.push('Studio Mode template');
    }

    if (updatedFields.length === 0) {
        return { message: "No changes submitted.", success: true };
    }

    revalidatePath('/admin/settings');
    return { 
      success: true, 
      message: `${updatedFields.join(' and ')} saved successfully.` 
    };
  } catch (error) {
    console.error('Error updating system prompts:', error);
    return { 
      success: false,
      error: 'Failed to update system prompts.',
      message: 'An error occurred while updating the system prompts.'
    };
  }
}

/**
 * Server Action for cache cleanup, compatible with useActionState.
 * @param previousState The previous form state (unused but required by useActionState signature)
 * @param formData The form data (empty for this action)
 * @returns A FormState object with success/error status
 */
export async function handleCacheCleanup(
  previousState: CacheCleanupFormState | null,
  formData: FormData
): Promise<CacheCleanupFormState> {
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
        return { 
          success: true, 
          message: 'Cache file does not exist. Nothing to clean up.' 
        };
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
      return { 
        success: true, 
        message: `Cache cleanup complete. Removed ${removedCount} of ${initialCount} entries.` 
      };
    } else {
      return { 
        success: true, 
        message: `Cache is clean. No entries were old enough to remove (${initialCount} entries remain).` 
      };
    }
  } catch (error) {
    console.error('Error during cache cleanup from admin panel:', error);
    return { 
      success: false,
      error: 'Cache cleanup failed.',
      message: 'An error occurred during cache cleanup.'
    };
  }
}

/**
 * Server Action for creating a user, compatible with useActionState.
 * @param previousState The previous form state (unused but required by useActionState signature)
 * @param formData The form data containing user details
 * @returns A FormState object with success/error status
 */
export async function handleCreateUser(
  previousState: UserFormState | null,
  formData: FormData
): Promise<UserFormState> {
  const result = await createUser(formData);
  
  if (result.success) {
    const username = formData.get('username') as string;
    const user = dbService.findUserByUsername(username);
    return {
      success: true,
      message: `User '${username}' has been successfully created.`,
      user: user ? {
        username: user.username,
        role: user.role as 'admin' | 'user',
        gemini_api_key_1_mode: (user.gemini_api_key_1_mode || 'global') as 'global' | 'user_specific',
        gemini_api_key_2_mode: (user.gemini_api_key_2_mode || 'global') as 'global' | 'user_specific',
        gemini_api_key_3_mode: (user.gemini_api_key_3_mode || 'global') as 'global' | 'user_specific',
        fal_api_key_mode: (user.fal_api_key_mode || 'global') as 'global' | 'user_specific',
        image_generation_model: (user.image_generation_model || 'fal_gemini_2_5') as 'fal_nano_banana_pro' | 'fal_gemini_2_5',
      } : undefined
    };
  } else {
    return {
      success: false,
      error: result.error || 'Failed to create user.',
      message: result.error || 'An error occurred while creating the user.'
    };
  }
}

/**
 * Server Action for updating user configuration, compatible with useActionState.
 * @param previousState The previous form state (unused but required by useActionState signature)
 * @param formData The form data containing user configuration
 * @returns A FormState object with success/error status
 */
export async function handleUpdateUserConfiguration(
  previousState: UserFormState | null,
  formData: FormData
): Promise<UserFormState> {
  const result = await updateUserConfiguration(formData);
  
  if (result.success) {
    const username = formData.get('username') as string;
    const user = dbService.findUserByUsername(username);
    return {
      success: true,
      message: `User '${username}' has been updated.`,
      user: user ? {
        username: user.username,
        role: user.role as 'admin' | 'user',
        gemini_api_key_1_mode: (user.gemini_api_key_1_mode || 'global') as 'global' | 'user_specific',
        gemini_api_key_2_mode: (user.gemini_api_key_2_mode || 'global') as 'global' | 'user_specific',
        gemini_api_key_3_mode: (user.gemini_api_key_3_mode || 'global') as 'global' | 'user_specific',
        fal_api_key_mode: (user.fal_api_key_mode || 'global') as 'global' | 'user_specific',
        image_generation_model: (user.image_generation_model || 'fal_gemini_2_5') as 'fal_nano_banana_pro' | 'fal_gemini_2_5',
      } : undefined
    };
  } else {
    return {
      success: false,
      error: result.error || 'Failed to update user.',
      message: result.error || 'An error occurred while updating the user.'
    };
  }
}

