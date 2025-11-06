import { cache } from 'react';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { encrypt } from './encryption.service';
import type { HistoryItem, ModelAttributes, SessionUser } from '@/lib/types';

// Video status payload type for efficient polling
export interface VideoStatusPayload {
  status: 'processing' | 'completed' | 'failed' | 'unknown';
  videoUrl?: string | null;
  localVideoUrl?: string | null;
  error?: string;
  seed?: number;
}

const DB_DIR = path.join(process.cwd(), 'user_data', 'history');
const DB_PATH = path.join(DB_DIR, 'history.db');

let db: Database.Database;

// Singleton pattern to ensure only one DB connection
export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure directory exists
  fs.mkdirSync(DB_DIR, { recursive: true });

  db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
  console.log('SQLite database connected at', DB_PATH);
  
  // Enable Write-Ahead Logging for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  // Initialize schema on first connect
  initSchema(db);

  return db;
}

// Load environment variables into database settings if they exist and database values are empty
function initializeApiKeysFromEnv(db: Database.Database) {
  const envKeys = [
    { env: 'GEMINI_API_KEY_1', db: 'global_gemini_api_key_1' },
    { env: 'GEMINI_API_KEY_2', db: 'global_gemini_api_key_2' }, 
    { env: 'GEMINI_API_KEY_3', db: 'global_gemini_api_key_3' },
    { env: 'FAL_KEY', db: 'global_fal_api_key' }
  ];

  for (const { env, db: dbKey } of envKeys) {
    const envValue = process.env[env];
    if (envValue) {
      // Check if database value is empty
      const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
      const result = stmt.get(dbKey) as { value: string } | undefined;
      
      if (!result?.value) {
        // Encrypt and store the environment variable value
        const encryptedValue = encrypt(envValue);
        const updateStmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
        updateStmt.run(encryptedValue, dbKey);
        console.log(`Initialized ${dbKey} from environment variable ${env}`);
      }
    }
  }
}

// Initialize system prompt from file if database is empty
function initializeSystemPromptFromFile(db: Database.Database) {
  try {
    // Check if system prompt already exists and has content
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get('ai_prompt_engineer_system') as { value: string } | undefined;
    
    if (!result?.value) {
      // Try to read from file and populate database
      const promptPath = path.join(process.cwd(), 'src/ai/prompts/prompt-engineer-system.txt');
      try {
        const fileContent = fs.readFileSync(promptPath, 'utf8');
        if (fileContent.trim()) {
          const updateStmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
          updateStmt.run(fileContent, 'ai_prompt_engineer_system');
          console.log('Initialized system prompt from file');
        }
      } catch (fileError) {
        // File doesn't exist or can't be read - this is fine
        console.log('System prompt file not found - using empty default');
      }
    }
  } catch (error) {
    console.error('Error initializing system prompt:', error);
  }
}

function initSchema(db: Database.Database) {
  db.exec(`

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      constructedPrompt TEXT,
      originalClothingUrl TEXT,
      settingsMode TEXT,
      attributes TEXT,
      videoGenerationParams TEXT,
      webhook_url TEXT,
      status TEXT DEFAULT 'completed', -- ADDED
      error TEXT, -- ADDED
      image_generation_model TEXT -- ADD THIS
    );

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      gemini_api_key_1 TEXT,
      gemini_api_key_1_mode TEXT NOT NULL DEFAULT 'global' CHECK (gemini_api_key_1_mode IN ('global', 'user_specific')),
      gemini_api_key_2 TEXT,
      gemini_api_key_2_mode TEXT NOT NULL DEFAULT 'global' CHECK (gemini_api_key_2_mode IN ('global', 'user_specific')),
      gemini_api_key_3 TEXT,
      gemini_api_key_3_mode TEXT NOT NULL DEFAULT 'global' CHECK (gemini_api_key_3_mode IN ('global', 'user_specific')),
      fal_api_key TEXT,
      fal_api_key_mode TEXT NOT NULL DEFAULT 'global' CHECK (fal_api_key_mode IN ('global', 'user_specific')),
      image_generation_model TEXT NOT NULL DEFAULT 'google_gemini_2_0' CHECK (image_generation_model IN ('google_gemini_2_0', 'fal_gemini_2_5'))
    );
    
    CREATE TABLE IF NOT EXISTS history_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      history_id TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('edited', 'original_for_comparison', 'generated_video')),
      slot_index INTEGER NOT NULL,
      FOREIGN KEY (history_id) REFERENCES history (id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Composite index for efficient username + timestamp queries (pagination)
    CREATE INDEX IF NOT EXISTS idx_history_username_timestamp ON history (username, timestamp DESC);
    -- Individual indexes for flexible query optimization
    CREATE INDEX IF NOT EXISTS idx_history_username ON history (username);
    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_history_status ON history (status);
    -- Foreign key index for image lookups
    CREATE INDEX IF NOT EXISTS idx_history_images_history_id ON history_images (history_id);
    CREATE INDEX IF NOT EXISTS idx_history_images_type ON history_images (type);
    -- User table indexes
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);
  `);

  // Insert default values for feature flags if they don't exist
  db.exec(`
    INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('feature_video_generation', 'true'),
      ('feature_background_removal', 'true'),
      ('feature_image_upscaling', 'true'),
      ('feature_face_detailer', 'true'),
      ('global_gemini_api_key_1', ''),
      ('global_gemini_api_key_2', ''),
      ('global_gemini_api_key_3', ''),
      ('global_fal_api_key', ''),
      ('ai_prompt_engineer_system', '')
  `);

  // Load environment variables into database settings if they exist and database values are empty
  initializeApiKeysFromEnv(db);
  
  // Initialize system prompt from file if database is empty
  initializeSystemPromptFromFile(db);
  
  console.log('Database schema initialized.');
}

interface PaginationOptions {
  username: string;
  page: number;
  limit: number;
  filter?: 'video' | 'image';
}

export interface PaginationResult {
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

// Prepared statements
let preparedStatements: {
  insertHistory?: Database.Statement;
  insertImage?: Database.Statement;
  findHistoryById?: Database.Statement;
  updateHistory?: Database.Statement;
  deleteImagesByHistoryId?: Database.Statement;
  findHistoryByUsername?: Database.Statement;
  countHistoryByUsername?: Database.Statement;
  findHistoryPaginated?: Database.Statement;
  findHistoryPaginatedWithVideoFilter?: Database.Statement;
  findHistoryPaginatedWithImageFilter?: Database.Statement;
} = {};

function getPreparedStatements() {
  if (!preparedStatements.insertHistory) {
    const db = getDb();
    
    // Removed stray SQL code
  preparedStatements.insertHistory = db.prepare( `
      INSERT OR REPLACE INTO history 
      (id, username, timestamp, constructedPrompt, originalClothingUrl, settingsMode, attributes, videoGenerationParams, status, error, webhook_url, image_generation_model)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    preparedStatements.insertImage = db.prepare(`
      INSERT INTO history_images (history_id, url, type, slot_index)
      VALUES (?, ?, ?, ?)
    `);
    
    preparedStatements.findHistoryById = db.prepare(`
      SELECT h.*, 
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'edited' ORDER BY slot_index)) as edited_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'original_for_comparison' ORDER BY slot_index)) as original_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' ORDER BY slot_index)) as video_urls
      FROM history h
      WHERE h.id = ?
    `);
    
    preparedStatements.updateHistory = db.prepare(`
      UPDATE history 
      SET constructedPrompt = COALESCE(?, constructedPrompt),
          videoGenerationParams = COALESCE(?, videoGenerationParams)
      WHERE id = ?
    `);
    
    preparedStatements.deleteImagesByHistoryId = db.prepare(`
      DELETE FROM history_images WHERE history_id = ?
    `);
    
    preparedStatements.findHistoryByUsername = db.prepare(`
      SELECT h.*, 
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'edited' ORDER BY slot_index)) as edited_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'original_for_comparison' ORDER BY slot_index)) as original_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' ORDER BY slot_index)) as video_urls
      FROM history h
      WHERE h.username = ?
      ORDER BY h.timestamp DESC
    `);
    
    preparedStatements.countHistoryByUsername = db.prepare(`
      SELECT COUNT(*) as count FROM history WHERE username = ?
    `);
    
    preparedStatements.findHistoryPaginated = db.prepare(`
      SELECT h.*, 
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'edited' ORDER BY slot_index)) as edited_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'original_for_comparison' ORDER BY slot_index)) as original_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' ORDER BY slot_index)) as video_urls
      FROM history h
      WHERE h.username = ?
      ORDER BY h.timestamp DESC
      LIMIT ? OFFSET ?
    `);
    
    preparedStatements.findHistoryPaginatedWithVideoFilter = db.prepare(`
      SELECT h.*, 
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'edited' ORDER BY slot_index)) as edited_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'original_for_comparison' ORDER BY slot_index)) as original_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' ORDER BY slot_index)) as video_urls
      FROM history h
      WHERE h.username = ? AND h.videoGenerationParams IS NOT NULL
      ORDER BY h.timestamp DESC
      LIMIT ? OFFSET ?
    `);
    
    preparedStatements.findHistoryPaginatedWithImageFilter = db.prepare(`
      SELECT h.*, 
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'edited' ORDER BY slot_index)) as edited_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'original_for_comparison' ORDER BY slot_index)) as original_images,
             (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' ORDER BY slot_index)) as video_urls
      FROM history h
      WHERE h.username = ? AND h.videoGenerationParams IS NULL
      ORDER BY h.timestamp DESC
      LIMIT ? OFFSET ?
    `);
  }
  
  return preparedStatements;
}

export function rowToHistoryItem(row: any): HistoryItem { // Export for use in actions
  // Do NOT filter(Boolean) -- preserve nulls for correct slot mapping
  let editedImageUrls: any[] = [];
  let originalImageUrls: any[] | undefined = undefined;
  let generatedVideoUrls: any[] | undefined = undefined;
  let attributes: ModelAttributes = {} as ModelAttributes;
  let videoGenerationParams: any = undefined;

  try {
    editedImageUrls = row.edited_images ? JSON.parse(row.edited_images) : [];
  } catch (e) { editedImageUrls = []; }
  try {
    originalImageUrls = row.original_images ? JSON.parse(row.original_images) : undefined;
  } catch (e) { originalImageUrls = undefined; }
  try {
    generatedVideoUrls = row.video_urls ? JSON.parse(row.video_urls) : undefined;
  } catch (e) { generatedVideoUrls = undefined; }
  try {
    attributes = row.attributes ? JSON.parse(row.attributes) : {} as ModelAttributes;
  } catch (e) { attributes = {} as ModelAttributes; }
  try {
    videoGenerationParams = row.videoGenerationParams ? JSON.parse(row.videoGenerationParams) : undefined;
  } catch (e) { videoGenerationParams = undefined; }

  // removed malformed object literal
  return {
    id: row.id,
    username: row.username,
    timestamp: row.timestamp,
    constructedPrompt: row.constructedPrompt,
    originalClothingUrl: row.originalClothingUrl,
    settingsMode: row.settingsMode as 'basic' | 'advanced',
    attributes,
    editedImageUrls: editedImageUrls || [], // Return arrays as-is
    originalImageUrls,
    generatedVideoUrls,
    videoGenerationParams,
    status: row.status as 'processing' | 'completed' | 'failed',
    error: row.error || undefined,
    webhookUrl: row.webhook_url || undefined,
    imageGenerationModel: row.image_generation_model || 'google_gemini_2_0', // ADD THIS
  };
}

export const insertHistoryItem = (item: HistoryItem): void => {
  const db = getDb();
  const statements = getPreparedStatements();
  
  const insertTransaction = db.transaction(() => {
    // Insert main history record
  statements.insertHistory?.run(
      item.id,
      item.username,
      item.timestamp,
      item.constructedPrompt,
      item.originalClothingUrl,
      item.settingsMode,
      JSON.stringify(item.attributes),
      item.videoGenerationParams ? JSON.stringify(item.videoGenerationParams) : null,
      item.status || 'completed',
      item.error || null,
      item.webhookUrl || null,
      item.imageGenerationModel || 'google_gemini_2_0' // ADD THIS
    );
    
    // Insert edited images
    item.editedImageUrls.forEach((url, index) => {
      if (url) {
        statements.insertImage?.run(item.id, url, 'edited', index);
      }
    });
    
    // Insert original images if they exist
    if (item.originalImageUrls) {
      item.originalImageUrls.forEach((url, index) => {
        if (url) {
          statements.insertImage?.run(item.id, url, 'original_for_comparison', index);
        }
      });
    }
    
    // Insert video URLs if they exist
    if (item.generatedVideoUrls) {
      item.generatedVideoUrls.forEach((url, index) => {
        if (url) {
          statements.insertImage?.run(item.id, url, 'generated_video', index);
        }
      });
    }
  });
  
  insertTransaction();
};

export const findHistoryItemById = cache((id: string): HistoryItem | null => {
  const statements = getPreparedStatements();
  const row = statements.findHistoryById?.get(id);
  return row ? rowToHistoryItem(row) : null;
});

/**
 * Atomically updates a history item and its related images/videos.
 * This function is safe from race conditions.
 * @param id The ID of the history item to update.
 * @param updates A partial HistoryItem object. For arrays, you can provide the full array to replace it.
 */
export const updateHistoryItem = (id: string, updates: Partial<HistoryItem>): void => {
  const db = getDb();

  const updateTransaction = db.transaction(() => {
    // Update simple text fields if provided
    if (updates.constructedPrompt !== undefined || updates.settingsMode !== undefined || updates.status !== undefined || updates.error !== undefined) {
      const updateMainStmt = db.prepare(`
        UPDATE history
        SET constructedPrompt = COALESCE(?, constructedPrompt),
            settingsMode = COALESCE(?, settingsMode),
            status = COALESCE(?, status),
            error = COALESCE(?, error)
        WHERE id = ?
      `);
      updateMainStmt.run(
        updates.constructedPrompt,
        updates.settingsMode,
        updates.status,
        updates.error,
        id
      );
    }

    // Atomically patch JSON fields
    if (updates.attributes) {
      db.prepare(`UPDATE history SET attributes = json_patch(attributes, ?) WHERE id = ?`)
        .run(JSON.stringify(updates.attributes), id);
    }
    if (updates.videoGenerationParams) {
      db.prepare(`UPDATE history SET videoGenerationParams = json_patch(COALESCE(videoGenerationParams, '{}'), ?) WHERE id = ?`)
        .run(JSON.stringify(updates.videoGenerationParams), id);
    }

    // Helper to replace an image/video array
    const replaceUrls = (urls: (string | null)[] | undefined, type: 'edited' | 'original_for_comparison' | 'generated_video') => {
      if (!urls) return;
      const deleteStmt = db.prepare(`DELETE FROM history_images WHERE history_id = ? AND type = ?`);
      const insertStmt = db.prepare(`INSERT INTO history_images (history_id, url, type, slot_index) VALUES (?, ?, ?, ?)`);

      deleteStmt.run(id, type);
      urls.forEach((url, index) => {
        if (url) {
          insertStmt.run(id, url, type, index);
        }
      });
    };

    // Replace image/video arrays if they are provided in the updates
    replaceUrls(updates.editedImageUrls, 'edited');
    replaceUrls(updates.originalImageUrls, 'original_for_comparison');
    replaceUrls(updates.generatedVideoUrls, 'generated_video');
  });

  updateTransaction();
};

/**
 * @deprecated Use the new atomic `updateHistoryItem` function instead. This function is not safe from race conditions.
 */
export function _dangerouslyUpdateHistoryItem(
  id: string,
  updates: Partial<Pick<HistoryItem, 'editedImageUrls' | 'originalImageUrls' | 'constructedPrompt' | 'generatedVideoUrls' | 'videoGenerationParams'>>
): void {
  // NOTE: updateHistoryItem is subject to race conditions if called concurrently for the same id.
  // For robust webhook handling, consider using an atomic SQL UPDATE with JSON patch/merge logic.
  const db = getDb();
  const statements = getPreparedStatements();
  
  const updateTransaction = db.transaction(() => {
    // Update main record
    statements.updateHistory?.run(
      updates.constructedPrompt || null,
      updates.videoGenerationParams ? JSON.stringify(updates.videoGenerationParams) : null,
      id
    );
    
    // If updating images/videos, delete existing and re-insert
    if (updates.editedImageUrls || updates.originalImageUrls || updates.generatedVideoUrls) {
      statements.deleteImagesByHistoryId?.run(id);
      
      if (updates.editedImageUrls) {
        updates.editedImageUrls.forEach((url, index) => {
          if (url) {
            statements.insertImage?.run(id, url, 'edited', index);
          }
        });
      }
      
      if (updates.originalImageUrls) {
        updates.originalImageUrls.forEach((url, index) => {
          if (url) {
            statements.insertImage?.run(id, url, 'original_for_comparison', index);
          }
        });
      }
      
      if (updates.generatedVideoUrls) {
        updates.generatedVideoUrls.forEach((url, index) => {
          if (url) {
            statements.insertImage?.run(id, url, 'generated_video', index);
          }
        });
      }
    }
  });
  
  updateTransaction();
}

export const findHistoryByUsername = cache((username: string): HistoryItem[] => {
  const statements = getPreparedStatements();
  const rows = statements.findHistoryByUsername?.all(username) as any[];
  return rows.map(rowToHistoryItem);
});

export const getPaginatedHistoryForUser = cache((
  username: string,
  page: number,
  limit: number,
  filter?: 'video' | 'image'
): PaginationResult => {
  const statements = getPreparedStatements();
  
  const offset = (page - 1) * limit;
  
  let countQuery: Database.Statement;
  let dataQuery: Database.Statement;
  
  if (filter === 'video') {
    countQuery = getDb().prepare('SELECT COUNT(*) as count FROM history WHERE username = ? AND videoGenerationParams IS NOT NULL');
    dataQuery = statements.findHistoryPaginatedWithVideoFilter!;
  } else if (filter === 'image') {
    countQuery = getDb().prepare('SELECT COUNT(*) as count FROM history WHERE username = ? AND videoGenerationParams IS NULL');
    dataQuery = statements.findHistoryPaginatedWithImageFilter!;
  } else {
    countQuery = statements.countHistoryByUsername!;
    dataQuery = statements.findHistoryPaginated!;
  }
  
  const countResult = countQuery.get(username) as { count: number };
  const totalCount = countResult.count;
  
  const rows = dataQuery.all(username, limit, offset) as any[];
  const items = rows.map(rowToHistoryItem);
  
  const hasMore = offset + limit < totalCount;
  
  return {
    items,
    totalCount,
    hasMore,
    currentPage: page
  };
});

export const getAllUsersHistoryPaginated = cache((page: number = 1, limit: number = 10): PaginationResult => {
  const db = getDb();
  
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM history').get() as { count: number };
  const offset = (page - 1) * limit;
  
  const rows = db.prepare(`
    SELECT h.*, 
           (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'edited' ORDER BY slot_index)) as edited_images,
           (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'original_for_comparison' ORDER BY slot_index)) as original_images,
           (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' ORDER BY slot_index)) as video_urls
    FROM history h
    GROUP BY h.id
    ORDER BY h.timestamp DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as any[];
  
  const items = rows.map(rowToHistoryItem);
  const hasMore = offset + limit < totalCount.count;
  
  return {
    items,
    totalCount: totalCount.count,
    hasMore,
    currentPage: page
  };
});

export const getHistoryItemStatus = cache((id: string, username: string): VideoStatusPayload | null => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT videoGenerationParams, 
           (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' LIMIT 1) as video_url
    FROM history h
    WHERE h.id = ? AND h.username = ?
  `);

  const row: any = stmt.get(id, username);

  if (!row) {
    return null; // Item not found or does not belong to the user
  }
  
  if (!row.videoGenerationParams) {
    // This is an image-only item or something is wrong
    return { status: 'unknown' };
  }

  let params: any = {};
  try {
    params = JSON.parse(row.videoGenerationParams);
  } catch (e) {
    console.error('Failed to parse videoGenerationParams JSON for history item', id, e);
    return { status: 'unknown' };
  }

  return {
    status: params.status || 'processing', // Default to processing if status not set
    videoUrl: row.video_url || null, // Remote Fal.ai URL
    localVideoUrl: params.localVideoUrl || null, // Local URL for downloads
    error: params.error,
    seed: params.seed,
  };
});

export type FullUser = SessionUser & {
  passwordHash: string;
  gemini_api_key_1?: string; gemini_api_key_1_mode: 'global' | 'user_specific';
  gemini_api_key_2?: string; gemini_api_key_2_mode: 'global' | 'user_specific';
  gemini_api_key_3?: string; gemini_api_key_3_mode: 'global' | 'user_specific';
  fal_api_key?: string; fal_api_key_mode: 'global' | 'user_specific';
  image_generation_model: 'google_gemini_2_0' | 'fal_gemini_2_5';
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
    image_generation_model: row.image_generation_model,
  };
});

export const findUserByApiKey = cache((apiKey: string): FullUser | null => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE app_api_key = ?');
  const row: any = stmt.get(apiKey);

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
    image_generation_model: row.image_generation_model,
  };
});

// Cleanup function for graceful shutdown
export function closeDb(): void {
  if (db) {
    db.close();
  }
}

// Handle process termination
process.on('exit', closeDb);
process.on('SIGINT', closeDb);
process.on('SIGTERM', closeDb);

// TODO: For standalone video history items, ensure the source image is not placed in editedImageUrls.
// Instead, store it in a dedicated field or originalImageUrls. See addStandaloneVideoHistoryItem in actions.
