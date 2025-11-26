// src/services/settings.service.ts
import 'server-only';

import * as dbService from '@/services/database.service';

const STUDIO_MODE_PROMPT_TEMPLATE = `Create a high-quality fashion photograph featuring a realistic female model wearing this {clothingItem} in the provided image with a {fitDescription}. The model should have a modern, approachable look and stand in a relaxed, candid pose with a natural expression and subtle smile. Ensure the fabric weight, drape, and texture interact realistically with the model's body geometry and pose. The setting is a bright, daylight studio with a textured, neutral wall background that provides soft, complementary contrast. Use diffused natural lighting to highlight the material details of the clothing without harsh shadows. Frame the image as a full-body shot using a 50mm lens perspective for a natural, photorealistic result.`;

const DEFAULTS = {
  'feature_video_generation': 'true',
  'feature_background_removal': 'true',
  'feature_image_upscaling': 'true',
  'feature_face_detailer': 'true',
  // New global API key settings
  'global_gemini_api_key_1': '',
  'global_gemini_api_key_2': '',
  'global_gemini_api_key_3': '',
  'global_fal_api_key': '',
  // AI System Prompts
  'ai_prompt_engineer_system': '',
  'ai_studio_mode_prompt_template': STUDIO_MODE_PROMPT_TEMPLATE.trim(),
};

// Type for keys to ensure type safety
export type SettingKey = keyof typeof DEFAULTS;

/**
 * Gets the value of a specific setting key from the database.
 * If the key doesn't exist, it returns the default value.
 * @param key The key of the setting to retrieve.
 * @returns The value of the setting as a string.
 */
export function getSetting(key: SettingKey): string {
  const db = dbService.getDb();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  return result?.value ?? DEFAULTS[key];
}

/**
 * Gets a boolean representation of a setting.
 * @param key The key of the setting to retrieve.
 * @returns True if the setting value is 'true', otherwise false.
 */
export function getBooleanSetting(key: SettingKey): boolean {
  return getSetting(key) === 'true';
}

/**
 * Sets the value for a specific setting key in the database.
 * @param key The key of the setting to update.
 * @param value The new value for the setting.
 */
export function setSetting(key: SettingKey, value: string): void {
  const db = dbService.getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
}

/**
 * Gets all settings from the database.
 * @returns A record of all settings.
 */
export function getAllSettings(): Record<SettingKey, string> {
    const db = dbService.getDb();
    const stmt = db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all() as { key: SettingKey, value: string }[];
    
    // Start with all defaults
    const allSettings: Record<string, string> = { ...DEFAULTS };
    
    // Override with values from DB
    for (const row of rows) {
        if (Object.keys(DEFAULTS).includes(row.key)) {
            allSettings[row.key] = row.value;
        }
    }
    
    return allSettings as Record<SettingKey, string>;
}
