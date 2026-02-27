import 'server-only';

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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

// Cleanup function for graceful shutdown
export function closeDb(): void {
  if (globalForDb.db) {
    globalForDb.db.close();
  }
  if (db) {
    db.close();
  }
}

// Handle process termination — guard against duplicate registration during HMR
const SHUTDOWN_REGISTERED = '__db_shutdown_handlers_registered__' as const;
if (!(globalThis as Record<string, unknown>)[SHUTDOWN_REGISTERED]) {
  (globalThis as Record<string, unknown>)[SHUTDOWN_REGISTERED] = true;
  process.on('exit', closeDb);
  process.on('SIGINT', closeDb);
  process.on('SIGTERM', closeDb);
}
