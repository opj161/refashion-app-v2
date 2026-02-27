// src/actions/adminUserActions.ts
'use server';

import 'server-only';

import { revalidatePath } from 'next/cache';
import * as dbService from '@/services/db';
import { getCurrentUser } from './authActions';
import bcrypt from 'bcrypt';
import { encrypt } from '@/services/encryption.service';
import crypto from 'crypto';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

const SALT_ROUNDS = 12;

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.');
  }
  return user;
}

// --- Zod Schemas ---

const createUserSchema = zfd.formData({
  username: zfd.text(z.string().min(3, 'Username must be at least 3 characters.')),
  password: zfd.text(z.string().min(6, 'Password must be at least 6 characters.')),
  role: zfd.text(z.enum(['admin', 'user'])),
});

const updateUserConfigSchema = zfd.formData({
  username: zfd.text(z.string().min(1, 'Username is required.')),
  role: zfd.text(z.enum(['admin', 'user']).optional()),
  gemini_api_key_1_mode: zfd.text(z.string().optional()),
  gemini_api_key_2_mode: zfd.text(z.string().optional()),
  gemini_api_key_3_mode: zfd.text(z.string().optional()),
  fal_api_key_mode: zfd.text(z.string().optional()),
  image_generation_model: zfd.text(z.string().optional()),
  gemini_api_key_1: zfd.text(z.string().optional()),
  gemini_api_key_2: zfd.text(z.string().optional()),
  gemini_api_key_3: zfd.text(z.string().optional()),
  fal_api_key: zfd.text(z.string().optional()),
});

const deleteUserSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
});

// --- Form State Types for useActionState ---

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

// --- Actions ---

export async function getAllUsers() {
  await verifyAdmin();
  return dbService.getAllUsersFromDb();
}

export async function createUser(formData: FormData) {
  const admin = await verifyAdmin();

  const parsed = createUserSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed.';
    return { success: false, error: firstError };
  }

  const { username, password, role } = parsed.data;

  if (admin.username === username) {
    return { success: false, error: "You cannot create a user with your own username." };
  }

  try {
    const existingUser = dbService.findUserByUsername(username);
    if (existingUser) {
      return { success: false, error: 'Username already exists.' };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    dbService.createUserInDb(username, passwordHash, role);

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Database error occurred.' };
  }
}

export async function deleteUser(username: string) {
  const admin = await verifyAdmin();

  const parsed = deleteUserSchema.safeParse({ username });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed.';
    return { success: false, error: firstError };
  }

  if (admin.username === username) {
    return { success: false, error: "You cannot delete your own account." };
  }

  try {
    const changes = dbService.deleteUserFromDb(username);

    if (changes === 0) {
      return { success: false, error: "User not found." };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Database error occurred.' };
  }
}

export async function updateUserConfiguration(formData: FormData) {
  await verifyAdmin();

  const parsed = updateUserConfigSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed.';
    return { success: false, error: firstError };
  }

  const { username } = parsed.data;

  // Dynamically build the update statement only from present fields
  const setClauses: string[] = [];
  const params: unknown[] = [];

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

  // Helper function to handle key updates.
  // Only updates the key if a NEW, NON-EMPTY value is provided.
  // Handles clearing the key if an empty string is explicitly submitted.
  const handleKeyUpdate = (keyName: string) => {
    const key_value = formData.get(keyName);

    // The key exists in the form data, meaning the input was enabled.
    if (key_value !== null) {
      if ((key_value as string).trim() === '') {
        // Empty string means "clear the key" — store null instead of encrypting empty
        setClauses.push(`${keyName} = ?`);
        params.push(null);
      } else {
        setClauses.push(`${keyName} = ?`);
        params.push(encrypt(key_value as string));
      }
    }
  };

  handleKeyUpdate('gemini_api_key_1');
  handleKeyUpdate('gemini_api_key_2');
  handleKeyUpdate('gemini_api_key_3');
  handleKeyUpdate('fal_api_key');

  if (setClauses.length === 0) {
    return { success: true, message: 'No changes submitted.' };
  }

  try {
    dbService.updateUserConfigInDb(username, setClauses, params);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error(`Error updating configuration for user ${username}:`, error);
    return { success: false, error: 'Database error occurred during update.' };
  }
}

export async function generateApiKeyForUser(username: string): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  await verifyAdmin();

  try {
    // The plaintext key is returned to the caller exactly once.
    // Only the SHA-256 hash is stored — the key cannot be retrieved later.
    const apiKey = `rf_${crypto.randomBytes(24).toString('hex')}`;
    const hashedKey = dbService.hashApiKey(apiKey);

    const changes = dbService.setApiKeyForUserInDb(username, hashedKey);

    if (changes === 0) {
      return { success: false, error: 'User not found.' };
    }

    revalidatePath('/admin/users');
    return { success: true, apiKey };

  } catch (error) {
    console.error(`Error generating API key for ${username}:`, error);
    return { success: false, error: 'Database error occurred.' };
  }
}

// --- useActionState-compatible Server Actions ---

/**
 * Server Action for creating a user, compatible with useActionState.
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
