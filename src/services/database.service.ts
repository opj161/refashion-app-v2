import 'server-only';

import { cache } from 'react';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
const globalForDb = global as unknown as { db: Database.Database };

export function getDb(): Database.Database {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  if (db) {
    return db;
  }

  // Ensure directory exists
  fs.mkdirSync(DB_DIR, { recursive: true });

  const newDb = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
  console.log('SQLite database connected at', DB_PATH);
  
  // Enable Write-Ahead Logging for better concurrency
  newDb.pragma('journal_mode = WAL');
  newDb.pragma('synchronous = NORMAL');
  newDb.pragma('foreign_keys = ON');

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = newDb;
  } else {
    db = newDb;
  }

  return newDb;
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
      (id, username, timestamp, constructedPrompt, originalClothingUrl, settingsMode, attributes, videoGenerationParams, status, error, webhook_url, image_generation_model, generation_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

// Helper function to safely parse JSON with minimal overhead
function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

export function rowToHistoryItem(row: any): HistoryItem { // Export for use in actions
  // Do NOT filter(Boolean) -- preserve nulls for correct slot mapping
  // Optimized: Use single helper function instead of multiple try-catch blocks
  const editedImageUrls = safeJsonParse<any[]>(row.edited_images, []);
  const originalImageUrls = safeJsonParse<any[] | undefined>(row.original_images, undefined);
  const generatedVideoUrls = safeJsonParse<any[] | undefined>(row.video_urls, undefined);
  const attributes = safeJsonParse<ModelAttributes>(row.attributes, {} as ModelAttributes);
  const videoGenerationParams = safeJsonParse<any>(row.videoGenerationParams, undefined);

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
    generation_mode: row.generation_mode as 'creative' | 'studio' || 'creative', // ADD THIS
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
      item.imageGenerationModel || 'google_gemini_2_0', // ADD THIS
      item.generation_mode || 'creative' // ADD THIS
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
 * Atomically updates a single image slot for a history item.
 * Uses the normalized history_images table to avoid race conditions.
 */
export const updateHistoryImageSlot = (historyId: string, slotIndex: number, url: string): void => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO history_images (history_id, url, type, slot_index)
    VALUES (?, ?, 'edited', ?)
  `);
  stmt.run(historyId, url, slotIndex);
};


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

// Extended status payload for both video and image polling
export interface HistoryStatusPayload {
  status: 'processing' | 'completed' | 'failed' | 'unknown';
  videoUrl?: string | null;
  localVideoUrl?: string | null;
  error?: string;
  seed?: number;
  editedImageUrls?: (string | null)[];
}

export const getHistoryItemStatus = cache((id: string, username: string): HistoryStatusPayload | null => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT h.status, h.error, h.videoGenerationParams,
           (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' LIMIT 1) as video_url,
           (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'edited' ORDER BY slot_index)) as edited_images
    FROM history h
    WHERE h.id = ? AND h.username = ?
  `);

  const row: any = stmt.get(id, username);

  if (!row) {
    return null; // Item not found or does not belong to the user
  }
  
  // Parse edited images
  const editedImageUrls = safeJsonParse<any[]>(row.edited_images, []);

  // If video params exist, it's a video generation
  if (row.videoGenerationParams) {
    const params = safeJsonParse<any>(row.videoGenerationParams, null);
    if (params) {
        return {
            status: params.status || row.status || 'processing',
            videoUrl: row.video_url || null,
            localVideoUrl: params.localVideoUrl || null,
            error: params.error || row.error,
            seed: params.seed,
            editedImageUrls,
        };
    }
  }

  // Default to main record status (for image generation)
  return {
    status: row.status as 'processing' | 'completed' | 'failed',
    error: row.error,
    editedImageUrls,
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
