'use server';

import fs from 'fs/promises';
import path from 'path';

const cacheFilePath = path.join(process.cwd(), '.cache', 'image-processing-cache.json');

type CacheData = {
  [key: string]: {
    bgRemoved?: string;
    upscaled?: string;
    faceDetailed?: string;
    timestamp?: number;
  };
};

async function readCache(): Promise<CacheData> {
  try {
    await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
    const data = await fs.readFile(cacheFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {}; // Cache file doesn't exist, return empty object
    }
    console.error('Error reading cache:', error);
    return {};
  }
}

async function writeCache(data: CacheData): Promise<void> {
  try {
    await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
    await fs.writeFile(cacheFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

export async function getCachedImagePath(hash: string, type: 'bgRemoved' | 'upscaled' | 'faceDetailed'): Promise<string | null> {
  const cache = await readCache();
  const cachedPath = cache[hash]?.[type];
  
  if (cachedPath) {
    // Check if the cached file still exists
    try {
      const fullPath = path.join(process.cwd(), 'public', cachedPath);
      await fs.access(fullPath);
      return cachedPath;
    } catch {
      // File doesn't exist, remove from cache
      delete cache[hash]?.[type];
      if (cache[hash] && Object.keys(cache[hash]).length === 0) {
        delete cache[hash];
      }
      await writeCache(cache);
      return null;
    }
  }
  
  return null;
}

export async function setCachedImagePath(hash: string, type: 'bgRemoved' | 'upscaled' | 'faceDetailed', imagePath: string): Promise<void> {
  const cache = await readCache();
  if (!cache[hash]) {
    cache[hash] = {};
  }
  cache[hash][type] = imagePath;
  cache[hash].timestamp = Date.now();
  await writeCache(cache);
}

export async function cleanupOldCacheEntries(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  const cache = await readCache();
  const now = Date.now();
  let hasChanges = false;

  for (const [hash, entry] of Object.entries(cache)) {
    if (entry.timestamp && (now - entry.timestamp) > maxAgeMs) {
      delete cache[hash];
      hasChanges = true;
    }
  }

  if (hasChanges) {
    await writeCache(cache);
  }
}
