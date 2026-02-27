// src/actions/adminSettingsActions.ts
'use server';

import 'server-only';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './authActions';
import * as settingsService from '@/services/settings.service';
import { encrypt, decrypt } from '@/services/encryption.service';
import * as systemPromptService from '@/services/systemPrompt.service';
import { constructStudioPrompt, compareClothingDescriptions } from '@/ai/domain/studio-prompt';
import { z } from 'zod';

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.');
  }
  return user;
}

// --- Zod Schemas ---

const updateSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required.'),
  value: z.boolean(),
});

const updateEncryptedSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required.'),
  value: z.string(),
});

const updateSystemPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt content is required.'),
});

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

// --- Actions ---

export async function getAllSettings() {
  await verifyAdmin();
  return settingsService.getAllSettings();
}

export async function updateSetting(key: settingsService.SettingKey, value: boolean) {
  await verifyAdmin();

  const parsed = updateSettingSchema.safeParse({ key, value });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed.';
    return { success: false, error: firstError };
  }

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

export async function updateEncryptedSetting(key: settingsService.SettingKey, value: string) {
  await verifyAdmin();

  const parsed = updateEncryptedSettingSchema.safeParse({ key, value });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed.';
    return { success: false, error: firstError };
  }

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
  await verifyAdmin();
  const settings = settingsService.getAllSettings();
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

  const parsed = updateSystemPromptSchema.safeParse({ prompt });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed.';
    return { success: false, error: firstError };
  }

  try {
    systemPromptService.updateSystemPrompt(prompt);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return { success: false, error: 'Failed to update system prompt.' };
  }
}

export async function triggerCacheCleanup() {
  await verifyAdmin();
  try {
    const { cleanupOldCacheEntries } = await import('@/ai/actions/cache-manager');
    const removedCount = await cleanupOldCacheEntries();
    if (removedCount > 0) {
      return { success: true, message: `Cache cleanup complete. Removed ${removedCount} stale entries.` };
    } else {
      return { success: true, message: 'Cache is clean. No entries were old enough to remove.' };
    }
  } catch (error) {
    console.error('Error during cache cleanup from admin panel:', error);
    return { success: false, error: 'Cache cleanup failed.' };
  }
}

// --- Studio Prompt Testing Action ---

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

// --- useActionState-compatible Server Actions ---

/**
 * Server Action for updating API keys, compatible with useActionState.
 */
export async function handleApiKeysUpdate(
  previousState: ApiKeysFormState | null,
  formData: FormData
): Promise<ApiKeysFormState> {
  await verifyAdmin();

  try {
    const updatePromises = [];

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
 */
export async function handleCacheCleanup(
  previousState: CacheCleanupFormState | null,
  formData: FormData
): Promise<CacheCleanupFormState> {
  await verifyAdmin();

  try {
    const result = await triggerCacheCleanup();
    return {
      success: result.success,
      message: result.message || result.error || 'Cache cleanup completed.',
      error: result.error,
    };
  } catch (error) {
    console.error('Error during cache cleanup from admin panel:', error);
    return {
      success: false,
      error: 'Cache cleanup failed.',
      message: 'An error occurred during cache cleanup.'
    };
  }
}
