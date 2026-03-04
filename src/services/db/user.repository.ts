import 'server-only';

import { cache } from 'react';

import type { SessionUser } from '@/lib/types';
import { hashApiKey } from './hash';
import { getDb } from './connection';

export type FullUser = SessionUser & {
  passwordHash: string;
  gemini_api_key_1?: string; gemini_api_key_1_mode: 'global' | 'user_specific';
  gemini_api_key_2?: string; gemini_api_key_2_mode: 'global' | 'user_specific';
  gemini_api_key_3?: string; gemini_api_key_3_mode: 'global' | 'user_specific';
  fal_api_key?: string; fal_api_key_mode: 'global' | 'user_specific';
  image_generation_model: 'fal_nano_banana_pro' | 'fal_gemini_2_5';
};

export const findUserByUsername = cache((username: string): FullUser | null => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const row: any = stmt.get(username);

  if (!row) {
    return null;
  }
  return {
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    isLoggedIn: true, // This is for session compatibility, not stored in DB
    gemini_api_key_1: row.gemini_api_key_1,
    gemini_api_key_1_mode: row.gemini_api_key_1_mode,
    gemini_api_key_2: row.gemini_api_key_2,
    gemini_api_key_2_mode: row.gemini_api_key_2_mode,
    gemini_api_key_3: row.gemini_api_key_3,
    gemini_api_key_3_mode: row.gemini_api_key_3_mode,
    fal_api_key: row.fal_api_key,
    fal_api_key_mode: row.fal_api_key_mode,
    image_generation_model: row.image_generation_model === 'google_gemini_2_0' ? 'fal_gemini_2_5' : row.image_generation_model,
  };
});

export { hashApiKey } from './hash';

export const findUserByApiKey = cache((apiKey: string): FullUser | null => {
  const db = getDb();
  const hashedKey = hashApiKey(apiKey);
  const stmt = db.prepare('SELECT * FROM users WHERE app_api_key = ?');
  const row: any = stmt.get(hashedKey);

  if (!row) {
    return null;
  }
  return {
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    isLoggedIn: true, // For session compatibility
    gemini_api_key_1: row.gemini_api_key_1,
    gemini_api_key_1_mode: row.gemini_api_key_1_mode,
    gemini_api_key_2: row.gemini_api_key_2,
    gemini_api_key_2_mode: row.gemini_api_key_2_mode,
    gemini_api_key_3: row.gemini_api_key_3,
    gemini_api_key_3_mode: row.gemini_api_key_3_mode,
    fal_api_key: row.fal_api_key,
    fal_api_key_mode: row.fal_api_key_mode,
    image_generation_model: row.image_generation_model === 'google_gemini_2_0' ? 'fal_gemini_2_5' : row.image_generation_model,
  };
});

// --- Admin User DB Operations ---

/**
 * Fetches all users with their relevant configuration fields.
 */
export function getAllUsersFromDb(): any[] {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT username, role, gemini_api_key_1_mode, gemini_api_key_2_mode, gemini_api_key_3_mode, fal_api_key_mode, image_generation_model FROM users ORDER BY username'
  );
  return stmt.all() as any[];
}

/**
 * Inserts a new user row into the users table.
 */
export function createUserInDb(username: string, hashedPassword: string, role: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
  stmt.run(username, hashedPassword, role);
}

/**
 * Deletes a user by username. Returns the number of rows affected.
 */
export function deleteUserFromDb(username: string): number {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM users WHERE username = ?');
  const result = stmt.run(username);
  return result.changes;
}

/**
 * Dynamically updates user configuration columns.
 * @param username - The user whose record to update.
 * @param setClauses - SQL SET clause fragments (e.g. ['role = ?', 'fal_api_key_mode = ?']).
 * @param params - Ordered parameter values matching the setClauses placeholders.
 */
export function updateUserConfigInDb(username: string, setClauses: string[], params: unknown[]): void {
  const db = getDb();
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE username = ?`;
  const stmt = db.prepare(sql);
  stmt.run(...params, username);
}

/**
 * Sets the hashed API key for a user. Returns the number of rows affected.
 */
export function setApiKeyForUserInDb(username: string, hashedKey: string): number {
  const db = getDb();
  const stmt = db.prepare('UPDATE users SET app_api_key = ? WHERE username = ?');
  const result = stmt.run(hashedKey, username);
  return result.changes;
}
