'use server';

import { getCurrentUser } from './authActions';
import type { HistoryItem, ModelAttributes } from '@/lib/types';
import * as dbService from '@/services/database.service';

export async function updateHistoryItem(
  historyItemId: string,
  updates: Partial<Pick<HistoryItem, 'editedImageUrls' | 'originalImageUrls' | 'constructedPrompt' | 'generatedVideoUrls' | 'videoGenerationParams'>>
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Verify the item exists and belongs to the user
    const existingItem = dbService.findHistoryItemById(historyItemId);
    if (!existingItem) {
      return { success: false, error: 'History item not found' };
    }
    
    if (existingItem.username !== user.username) {
      return { success: false, error: 'Unauthorized access to history item' };
    }

    // Perform the atomic update
    dbService.updateHistoryItem(historyItemId, updates);

    return { success: true };
  } catch (error) {
    console.error(`Error updating history item ${historyItemId} for user ${user.username}:`, error);
    return { success: false, error: 'Failed to update history item.' };
  }
}

export async function getUserHistory(): Promise<HistoryItem[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return dbService.findHistoryByUsername(user.username);
}

export async function getUserHistoryPaginated(
  page: number = 1, 
  limit: number = 10,
  filter?: 'video' | 'image'
): Promise<{
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return dbService.getPaginatedHistoryForUser({
    username: user.username,
    page,
    limit,
    filter
  });
}

export async function addHistoryItem(
  attributes: ModelAttributes,
  constructedPrompt: string,
  originalClothingUrl: string,
  editedImageUrls: (string | null)[],
  settingsMode: 'basic' | 'advanced'
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const newItem: HistoryItem = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    attributes,
    constructedPrompt,
    originalClothingUrl,
    editedImageUrls,
    username: user.username,
    settingsMode
  };
  
  dbService.insertHistoryItem(newItem);
}

export async function addVideoToHistoryItem(
  historyItemId: string,
  videoUrls: (string | null)[],
  videoGenerationParams: HistoryItem['videoGenerationParams']
): Promise<void> {
  if (!videoGenerationParams) {
    throw new Error("videoGenerationParams are required");
  }
  
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Verify the item exists and belongs to the user
  const existingItem = dbService.findHistoryItemById(historyItemId);
  if (!existingItem) {
    throw new Error('History item not found');
  }
  
  if (existingItem.username !== user.username) {
    throw new Error('Unauthorized access to history item');
  }

  // Update the history item with video information
  dbService.updateHistoryItem(historyItemId, {
    generatedVideoUrls: videoUrls,
    videoGenerationParams
  });
}

export async function addStandaloneVideoHistoryItem(
  videoUrls: (string | null)[],
  videoGenerationParams: HistoryItem['videoGenerationParams']
): Promise<string> {
  if (!videoGenerationParams) {
    throw new Error("videoGenerationParams are required for standalone video history.");
  }
  
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // For standalone video, store the source image in originalImageUrls, not editedImageUrls
  const newItem: HistoryItem = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    attributes: {} as ModelAttributes, // Empty attributes for video-only items
    constructedPrompt: videoGenerationParams.prompt,
    originalClothingUrl: videoGenerationParams.sourceImageUrl,
    editedImageUrls: [null, null, null, null], // No generated images for standalone video
    originalImageUrls: [videoGenerationParams.sourceImageUrl, null, null, null],
    username: user.username,
    settingsMode: 'basic',
    generatedVideoUrls: videoUrls,
    videoGenerationParams
  };

  dbService.insertHistoryItem(newItem);
  return newItem.id;
}

export async function getAllUsersHistoryPaginatedForAdmin(
  page: number = 1, 
  limit: number = 10
): Promise<{
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return dbService.getAllUsersHistoryPaginated(page, limit);
}

export async function deleteHistoryItem(historyItemId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Verify the item exists and belongs to the user
    const existingItem = dbService.findHistoryItemById(historyItemId);
    if (!existingItem) {
      return { success: false, error: 'History item not found' };
    }
    
    if (existingItem.username !== user.username) {
      return { success: false, error: 'Unauthorized access to history item' };
    }

    // Delete the item (CASCADE will handle related images)
    const db = dbService.getDb();
    const deleteStmt = db.prepare('DELETE FROM history WHERE id = ?');
    deleteStmt.run(historyItemId);

    return { success: true };
  } catch (error) {
    console.error(`Error deleting history item ${historyItemId} for user ${user.username}:`, error);
    return { success: false, error: 'Failed to delete history item.' };
  }
}

export async function getHistoryItem(historyItemId: string): Promise<HistoryItem | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const item = dbService.findHistoryItemById(historyItemId);
  
  // Verify the item belongs to the user (or user is admin)
  if (item && item.username !== user.username && user.role !== 'admin') {
    throw new Error('Unauthorized access to history item');
  }

  return item;
}

// Compatibility functions for backward compatibility
export async function updateVideoHistoryItem(params: {
  username: string;
  historyItemId: string;
  videoUrls: (string | null)[];
  localVideoUrl: string | null;
  seedUsed: number | null;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  videoModel?: 'lite' | 'pro';
}): Promise<void> {
  const { username, historyItemId, videoUrls, localVideoUrl, seedUsed, status, error } = params;
  
  // Verify the item exists and belongs to the user
  const existingItem = dbService.findHistoryItemById(historyItemId);
  if (!existingItem) {
    console.warn(`History item ${historyItemId} not found for user ${username}.`);
    return;
  }
  
  if (existingItem.username !== username) {
    console.warn(`History item ${historyItemId} does not belong to user ${username}.`);
    return;
  }

  // ATOMIC: Update videoGenerationParams JSON directly in the DB to avoid race conditions
  // This uses a single SQL statement to patch the JSON object
  const db = dbService.getDb();
  db.prepare(`
    UPDATE history
    SET videoGenerationParams = json_patch(
      COALESCE(videoGenerationParams, '{}'),
      json(?))
    WHERE id = ?
  `).run(
    JSON.stringify({
      videoModel: params.videoModel || 'lite',
      seed: seedUsed ?? -1,
      localVideoUrl: localVideoUrl,
      status: status,
      error: error
    }),
    historyItemId
  );

  // Update the video URLs as well (images are in a separate table)
  dbService.updateHistoryItem(historyItemId, {
    generatedVideoUrls: videoUrls
  });
}

export async function getHistoryPaginated(
  page: number = 1,
  limit: number = 10,
  filter: 'all' | 'image' | 'video' = 'all'
): Promise<{
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const filterParam = filter === 'all' ? undefined : filter;
  return dbService.getPaginatedHistoryForUser({
    username: user.username,
    page,
    limit,
    filter: filterParam
  });
}

export async function getVideoHistoryPaginated(
  page: number = 1,
  limit: number = 10
): Promise<{
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}> {
  return getHistoryPaginated(page, limit, 'video');
}

export async function getHistoryItemById(historyItemId: string): Promise<{ success: boolean; item?: HistoryItem; error?: string }> {
  try {
    const item = await getHistoryItem(historyItemId);
    if (item) {
      return { success: true, item };
    } else {
      return { success: false, error: 'History item not found.' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch history item.' };
  }
}

// Utility function for advanced filtering/searching
export async function searchUserHistory(
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const db = dbService.getDb();

  // Search in constructed prompts and original clothing URLs
  const searchQuery = `%${searchTerm.toLowerCase()}%`;
  const offset = (page - 1) * limit;

  const countStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM history 
    WHERE username = ? AND (
      LOWER(constructedPrompt) LIKE ? OR 
      LOWER(originalClothingUrl) LIKE ?
    )
  `);

  // Use robust JSON_GROUP_ARRAY for all image arrays
  const dataStmt = db.prepare(`
    SELECT h.*,
           (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'edited' ORDER BY slot_index)) as edited_images,
           (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'original_for_comparison' ORDER BY slot_index)) as original_images,
           (SELECT JSON_GROUP_ARRAY(url) FROM (SELECT url FROM history_images WHERE history_id = h.id AND type = 'generated_video' ORDER BY slot_index)) as video_urls
    FROM history h
    WHERE h.username = ? AND (
      LOWER(h.constructedPrompt) LIKE ? OR 
      LOWER(h.originalClothingUrl) LIKE ?
    )
    ORDER BY h.timestamp DESC
    LIMIT ? OFFSET ?
  `);

  const countResult = countStmt.get(user.username, searchQuery, searchQuery) as { count: number };
  const totalCount = countResult.count;

  const rows = dataStmt.all(user.username, searchQuery, searchQuery, limit, offset);

  // Use the same row mapping function from database service
  const items: HistoryItem[] = rows.map((row: any) => {
    // Use the same logic as rowToHistoryItem
    const editedImageUrls = row.edited_images ? JSON.parse(row.edited_images) : [];
    const originalImageUrls = row.original_images ? JSON.parse(row.original_images) : undefined;
    const generatedVideoUrls = row.video_urls ? JSON.parse(row.video_urls) : undefined;

    const paddedEditedUrls = new Array(4).fill(null);
    editedImageUrls.forEach((url: string | null, index: number) => {
      if (index < 4) paddedEditedUrls[index] = url;
    });

    const paddedOriginalUrls = originalImageUrls ? new Array(4).fill(null) : undefined;
    if (originalImageUrls && paddedOriginalUrls) {
      originalImageUrls.forEach((url: string | null, index: number) => {
        if (index < 4) paddedOriginalUrls[index] = url;
      });
    }

    const paddedVideoUrls = generatedVideoUrls ? new Array(4).fill(null) : undefined;
    if (generatedVideoUrls && paddedVideoUrls) {
      generatedVideoUrls.forEach((url: string | null, index: number) => {
        if (index < 4) paddedVideoUrls[index] = url;
      });
    }

    return {
      id: row.id,
      username: row.username,
      timestamp: row.timestamp,
      constructedPrompt: row.constructedPrompt,
      originalClothingUrl: row.originalClothingUrl,
      settingsMode: row.settingsMode as 'basic' | 'advanced',
      attributes: row.attributes ? JSON.parse(row.attributes) : {} as ModelAttributes,
      editedImageUrls: paddedEditedUrls,
      originalImageUrls: paddedOriginalUrls,
      generatedVideoUrls: paddedVideoUrls,
      videoGenerationParams: row.videoGenerationParams ? JSON.parse(row.videoGenerationParams) : undefined,
    };
  });

  const hasMore = offset + limit < totalCount;

  return {
    items,
    totalCount,
    hasMore,
    currentPage: page
  };
}
