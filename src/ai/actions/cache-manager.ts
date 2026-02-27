import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import { getDb } from '@/services/db';

type CacheEntry = {
  path: string;
  hash: string;
};

/**
 * Ensures the image_processing_cache table exists.
 * Uses a module-level flag to avoid re-running on every call.
 */
let tableInitialized = false;
function ensureCacheTable(): void {
  if (tableInitialized) return;
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS image_processing_cache (
      source_hash TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('bgRemoved', 'upscaled', 'faceDetailed')),
      path TEXT NOT NULL,
      output_hash TEXT NOT NULL,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      PRIMARY KEY (source_hash, type)
    )
  `);
  tableInitialized = true;
}

export async function getCachedImage(hash: string, type: 'bgRemoved' | 'upscaled' | 'faceDetailed'): Promise<CacheEntry | null> {
  ensureCacheTable();
  const db = getDb();
  const row = db.prepare(
    'SELECT path, output_hash as hash FROM image_processing_cache WHERE source_hash = ? AND type = ?'
  ).get(hash, type) as CacheEntry | undefined;

  if (row) {
    try {
      const fullPath = path.join(process.cwd(), row.path);
      await fs.access(fullPath);
      return row;
    } catch {
      // File no longer exists on disk — remove stale cache entry
      db.prepare('DELETE FROM image_processing_cache WHERE source_hash = ? AND type = ?').run(hash, type);
      return null;
    }
  }
  return null;
}

export async function setCachedImage(hash: string, type: 'bgRemoved' | 'upscaled' | 'faceDetailed', imagePath: string, outputHash: string): Promise<void> {
  ensureCacheTable();
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO image_processing_cache (source_hash, type, path, output_hash, timestamp)
     VALUES (?, ?, ?, ?, ?)`
  ).run(hash, type, imagePath, outputHash, Date.now());
}

export async function cleanupOldCacheEntries(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
  ensureCacheTable();
  const db = getDb();
  const cutoff = Date.now() - maxAgeMs;
  const result = db.prepare('DELETE FROM image_processing_cache WHERE timestamp < ?').run(cutoff);
  return result.changes;
}
