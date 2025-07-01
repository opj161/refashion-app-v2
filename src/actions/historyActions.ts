'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { getCurrentUser } from './authActions';
import type { HistoryItem, ModelAttributes } from '@/lib/types';

const HISTORY_DIR = path.join(process.cwd(), 'user_data', 'history');

async function ensureHistoryDir() {
  try {
    await fs.access(HISTORY_DIR);
  } catch {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
  }
}

export async function updateHistoryItem(
  historyItemId: string,
  updates: Partial<Pick<HistoryItem, 'editedImageUrls' | 'constructedPrompt'>>
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const history = await readUserHistory(user.username);
    const itemIndex = history.findIndex(item => item.id === historyItemId);

    if (itemIndex === -1) {
      return { success: false, error: 'History item not found' };
    }

    // Atomically apply the updates to the found item
    const originalItem = history[itemIndex];
    history[itemIndex] = { ...originalItem, ...updates };

    // Write the entire history file back. While still a full rewrite,
    // the read-modify-write logic is now a single, atomic server-side operation,
    // which is much safer than a client-driven fetch-modify-push.
    await writeUserHistory(user.username, history);

    return { success: true };
  } catch (error) {
    console.error(`Error updating history for user ${user.username}:`, error);
    return { success: false, error: 'Failed to update history file.' };
  }
}

async function getUserHistoryFile(username: string): Promise<string> {
  await ensureHistoryDir();
  return path.join(HISTORY_DIR, `${username}.json`);
}

async function readUserHistory(username: string): Promise<HistoryItem[]> {
  const filePath = await getUserHistoryFile(username);
  
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    return [];
  }
}

async function writeUserHistory(username: string, history: HistoryItem[]): Promise<void> {
  const filePath = await getUserHistoryFile(username);
  await fs.writeFile(filePath, JSON.stringify(history, null, 2));
}

export async function getUserHistory(): Promise<HistoryItem[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return await readUserHistory(user.username);
}

export async function getUserHistoryPaginated(page: number = 1, limit: number = 10): Promise<{
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const allHistory = await readUserHistory(user.username);
  const totalCount = allHistory.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = allHistory.slice(startIndex, endIndex);
  const hasMore = endIndex < totalCount;
  
  return {
    items,
    totalCount,
    hasMore,
    currentPage: page
  };
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
  
  const history = await readUserHistory(user.username);
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
    history.unshift(newItem); // Add to beginning of array
    // No limit on history items - keep all items
  await writeUserHistory(user.username, history);
}

export async function addVideoToHistoryItem(
  historyItemId: string,
  videoUrls: (string | null)[],
  videoGenerationParams: HistoryItem['videoGenerationParams'] // Use the type from HistoryItem
): Promise<void> {
  if (!videoGenerationParams) { // Type guard
    throw new Error("videoGenerationParams are required");
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const history = await readUserHistory(user.username);
  const itemIndex = history.findIndex(item => item.id === historyItemId);
  
  if (itemIndex === -1) {
    throw new Error('History item not found');
  }
  
  // Update the history item with video information
  history[itemIndex].generatedVideoUrls = videoUrls;
  history[itemIndex].videoGenerationParams = videoGenerationParams;
  
  await writeUserHistory(user.username, history);
}

export async function addStandaloneVideoHistoryItem(
  videoUrls: (string | null)[],
  videoGenerationParams: HistoryItem['videoGenerationParams'] // Use the type from HistoryItem
): Promise<string> { // Now returns the history item ID
  if (!videoGenerationParams) { // Type guard
    throw new Error("videoGenerationParams are required for standalone video history.");
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const history = await readUserHistory(user.username);
  const newItem: HistoryItem = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    attributes: {} as ModelAttributes, // Empty attributes for video-only items
    constructedPrompt: videoGenerationParams.prompt,
    originalClothingUrl: videoGenerationParams.sourceImageUrl,
    editedImageUrls: [videoGenerationParams.sourceImageUrl],
    username: user.username,
    settingsMode: 'basic',
    generatedVideoUrls: videoUrls,
    videoGenerationParams // Directly assign the passed object. Assumes it's complete.
  };

  history.unshift(newItem); // Add to beginning of array
  await writeUserHistory(user.username, history);
  return newItem.id; // Return the new item's ID
}

export async function getAllUsersHistoryForAdmin(): Promise<{ [username: string]: HistoryItem[] }> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  await ensureHistoryDir();
  
  try {
    const files = await fs.readdir(HISTORY_DIR);
    const historyFiles = files.filter(file => file.endsWith('.json'));
    
    const allHistory: { [username: string]: HistoryItem[] } = {};
    
    for (const file of historyFiles) {
      const username = file.replace('.json', '');
      try {
        allHistory[username] = await readUserHistory(username);
      } catch (error) {
        console.error(`Error reading history for user ${username}:`, error);
        allHistory[username] = [];
      }
    }
    
    return allHistory;
  } catch (error) {
    console.error('Error reading history directory:', error);
    return {};
  }
}

export async function getAllUsersHistoryPaginatedForAdmin(page: number = 1, limit: number = 10): Promise<{
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  await ensureHistoryDir();
  
  try {
    const files = await fs.readdir(HISTORY_DIR);
    const historyFiles = files.filter(file => file.endsWith('.json'));
    
    // Collect all history items from all users
    const allItems: HistoryItem[] = [];
    
    for (const file of historyFiles) {
      const username = file.replace('.json', '');
      try {
        const userHistory = await readUserHistory(username);
        allItems.push(...userHistory);
      } catch (error) {
        console.error(`Error reading history for user ${username}:`, error);
      }
    }
    
    // Sort by timestamp (newest first)
    allItems.sort((a, b) => b.timestamp - a.timestamp);
    
    const totalCount = allItems.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = allItems.slice(startIndex, endIndex);
    const hasMore = endIndex < totalCount;
    
    return {
      items,
      totalCount,
      hasMore,
      currentPage: page
    };
  } catch (error) {
    console.error('Error reading all users history:', error);
    return {
      items: [],
      totalCount: 0,
      hasMore: false,
      currentPage: page
    };
  }
}

// Migration utility functions
export async function getAllHistoryItemsForMigration(): Promise<{ [username: string]: HistoryItem[] }> {
  await ensureHistoryDir();
  
  try {
    const files = await fs.readdir(HISTORY_DIR);
    const historyFiles = files.filter(file => file.endsWith('.json'));
    
    const allHistory: { [username: string]: HistoryItem[] } = {};
    
    for (const file of historyFiles) {
      const username = file.replace('.json', '');
      try {
        allHistory[username] = await readUserHistory(username);
      } catch (error) {
        console.error(`Error reading history for user ${username}:`, error);
        allHistory[username] = [];
      }
    }
    
    return allHistory;
  } catch (error) {
    console.error('Error reading history directory:', error);
    return {};
  }
}

export async function updateHistoryItemPaths(
  username: string, 
  oldPath: string, 
  newPath: string, 
  pathType: 'originalClothingUrl' | 'editedImageUrls'
): Promise<boolean> {
  try {
    const history = await readUserHistory(username);
    let updated = false;
    
    for (const item of history) {
      if (pathType === 'originalClothingUrl' && item.originalClothingUrl === oldPath) {
        item.originalClothingUrl = newPath;
        updated = true;
      } else if (pathType === 'editedImageUrls') {
        for (let i = 0; i < item.editedImageUrls.length; i++) {
          if (item.editedImageUrls[i] === oldPath) {
            item.editedImageUrls[i] = newPath;
            updated = true;
          }
        }
      }
    }
    
    if (updated) {
      await writeUserHistory(username, history);
    }
    
    return updated;
  } catch (error) {
    console.error(`Error updating history paths for user ${username}:`, error);
    return false;
  }
}

export async function getVideoHistoryPaginated(page: number = 1, limit: number = 9): Promise<{
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const allHistory = await readUserHistory(user.username);
  
  // Filter for items that have video generation parameters (includes processing, completed, and failed)
  const videoHistoryItems = allHistory.filter(
    item => item.videoGenerationParams || (item.generatedVideoUrls && item.generatedVideoUrls.some(url => url))
  );

  const totalCount = videoHistoryItems.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = videoHistoryItems.slice(startIndex, endIndex);
  const hasMore = endIndex < totalCount;
  
  return {
    items,
    totalCount,
    hasMore,
    currentPage: page
  };
}

export async function updateVideoHistoryItem(params: {
  username: string;
  historyItemId: string;
  videoUrls: (string | null)[];
  localVideoUrl: string | null;
  seedUsed: number | null;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}): Promise<void> {
  const { username, historyItemId, videoUrls, localVideoUrl, seedUsed, status, error } = params;
  
  const history = await readUserHistory(username);
  const itemIndex = history.findIndex(item => item.id === historyItemId);

  if (itemIndex === -1) {
    console.warn(`History item ${historyItemId} not found for user ${username}.`);
    return;
  }
  
  // Update the item
  history[itemIndex].generatedVideoUrls = videoUrls;
  // Update the videoGenerationParams with new fields
  if (history[itemIndex].videoGenerationParams) {
    history[itemIndex].videoGenerationParams = {
      ...history[itemIndex].videoGenerationParams!,
      seed: seedUsed ?? -1,
      localVideoUrl: localVideoUrl,
      status: status, 
      error: error
    };
  }

  await writeUserHistory(username, history);
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

  let allUserHistoryItems: HistoryItem[] = [];

  if (user.role === 'admin') {
    await ensureHistoryDir();
    try {
      const files = await fs.readdir(HISTORY_DIR);
      const historyFiles = files.filter(file => file.endsWith('.json'));
      for (const file of historyFiles) {
        const username = file.replace('.json', '');
        try {
          const userHistory = await readUserHistory(username);
          allUserHistoryItems.push(...userHistory);
        } catch (error) {
          console.error(`Error reading history for user ${username} in getHistoryPaginated:`, error);
        }
      }
    } catch (error) {
      console.error('Error reading all users history in getHistoryPaginated:', error);
      // Continue with empty allUserHistoryItems if directory reading fails
    }
  } else {
    allUserHistoryItems = await readUserHistory(user.username);
  }

  // Sort all items by timestamp (newest first) before filtering and pagination
  allUserHistoryItems.sort((a, b) => b.timestamp - a.timestamp);

  let filteredItems: HistoryItem[] = [];
  if (filter === 'all') {
    filteredItems = allUserHistoryItems;
  } else if (filter === 'image') {
    filteredItems = allUserHistoryItems.filter(item => {
      const isLikelyVideo = (item.generatedVideoUrls && item.generatedVideoUrls.some(url => !!url)) ||
                             item.videoGenerationParams; // An item with videoGenerationParams is a video job
      return !isLikelyVideo;
    });
  } else if (filter === 'video') {
    filteredItems = allUserHistoryItems.filter(item =>
      (item.generatedVideoUrls && item.generatedVideoUrls.some(url => !!url)) ||
      item.videoGenerationParams // An item with videoGenerationParams is a video job
    );
  }

  const totalCount = filteredItems.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = filteredItems.slice(startIndex, endIndex);
  const hasMore = endIndex < totalCount;

  return {
    items,
    totalCount,
    hasMore,
    currentPage: page,
  };
}
