import 'server-only';

import { cache } from 'react';
import Database from 'better-sqlite3';

import type { HistoryItem, ModelAttributes } from '@/lib/types';
import { getDb } from './connection';

// Video status payload type for efficient polling
export interface VideoStatusPayload {
  status: 'processing' | 'completed' | 'failed' | 'unknown';
  videoUrl?: string | null;
  localVideoUrl?: string | null;
  error?: string;
  seed?: number;
}

export interface PaginationResult {
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

// Extended status payload for both video and image polling
export interface HistoryStatusPayload {
  status: 'processing' | 'completed' | 'failed' | 'unknown';
  videoUrl?: string | null;
  localVideoUrl?: string | null;
  error?: string;
  seed?: number;
  editedImageUrls?: (string | null)[];
}

// --- Internal helpers ---

interface PaginationOptions {
  username: string;
  page: number;
  limit: number;
  filter?: 'video' | 'image';
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

// Prepared statements
let preparedStatements: {
  insertHistory?: Database.Statement;
  insertImage?: Database.Statement;
  findHistoryById?: Database.Statement;
  deleteImagesByHistoryId?: Database.Statement;
  findHistoryByUsername?: Database.Statement;
  countHistoryByUsername?: Database.Statement;
  findHistoryPaginated?: Database.Statement;
  findHistoryPaginatedWithVideoFilter?: Database.Statement;
  findHistoryPaginatedWithImageFilter?: Database.Statement;
  findRecentUploads?: Database.Statement;
  trackUpload?: Database.Statement;
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

    preparedStatements.findRecentUploads = db.prepare(`
      SELECT file_url as originalClothingUrl
      FROM user_uploads 
      WHERE username = ? 
        AND file_url LIKE '/uploads/%'
      ORDER BY timestamp DESC 
      LIMIT 12
    `);

    preparedStatements.trackUpload = db.prepare(`
      INSERT OR REPLACE INTO user_uploads (username, file_url, timestamp)
      VALUES (?, ?, ?)
    `);
  }
  
  return preparedStatements;
}

// --- Public API ---

export function rowToHistoryItem(row: any): HistoryItem { // Export for use in actions
  // Do NOT filter(Boolean) -- preserve nulls for correct slot mapping
  // Optimized: Use single helper function instead of multiple try-catch blocks
  const editedImageUrls = safeJsonParse<any[]>(row.edited_images, []);
  const originalImageUrls = safeJsonParse<any[] | undefined>(row.original_images, undefined);
  const generatedVideoUrls = safeJsonParse<any[] | undefined>(row.video_urls, undefined);
  const attributes = safeJsonParse<ModelAttributes>(row.attributes, {} as ModelAttributes);
  const videoGenerationParams = safeJsonParse<any>(row.videoGenerationParams, undefined);

  // Helper to safely cast or fallback legacy models
  let imageGenerationModel = row.image_generation_model;
  if (imageGenerationModel === 'google_gemini_2_0') {
    imageGenerationModel = 'fal_gemini_2_5'; // Fallback for legacy data reading
  }

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
    imageGenerationModel: (imageGenerationModel as 'fal_nano_banana_pro' | 'fal_gemini_2_5') || 'fal_gemini_2_5',
    generation_mode: row.generation_mode as 'creative' | 'studio' || 'creative',
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
      item.imageGenerationModel || 'fal_gemini_2_5',
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

export const deleteHistoryItemById = (id: string): void => {
  const db = getDb();
  db.prepare('DELETE FROM history WHERE id = ?').run(id);
};

/**
 * Retrieves the most recent unique source images uploaded by a specific user.
 */
export const getRecentUploadsForUser = cache((username: string): string[] => {
  const statements = getPreparedStatements();
  const rows = statements.findRecentUploads?.all(username) as { originalClothingUrl: string }[];
  return rows.map(row => row.originalClothingUrl);
});

export const trackUserUpload = (username: string, fileUrl: string) => {
  const stmt = getPreparedStatements().trackUpload;
  stmt?.run(username, fileUrl, Date.now());
};
