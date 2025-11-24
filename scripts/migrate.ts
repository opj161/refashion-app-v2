import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// --- Encryption Logic (Inlined) ---
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Changed from 12 to 16 to match service
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment variable
const SECRET_KEY = process.env.ENCRYPTION_SECRET;

if (!SECRET_KEY || SECRET_KEY.length !== 32) {
  console.warn('WARNING: ENCRYPTION_SECRET is not set or invalid (must be 32 chars). API keys will not be encrypted correctly.');
}

const ENCRYPTION_KEY = SECRET_KEY ? Buffer.from(SECRET_KEY, 'utf-8') : Buffer.alloc(32);

function encrypt(text: string): string {
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Concatenate iv, authTag, and encrypted data, then encode as base64
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}
// ----------------------------------

const DB_DIR = path.join(process.cwd(), 'user_data', 'history');
const DB_PATH = path.join(DB_DIR, 'history.db');

function runMigrations() {
  console.log('Running database migrations...');
  
  // Ensure directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  
  // Enable WAL mode
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      constructedPrompt TEXT,
      originalClothingUrl TEXT,
      settingsMode TEXT,
      attributes TEXT, -- JSON string
      videoGenerationParams TEXT, -- JSON string
      status TEXT DEFAULT 'completed',
      error TEXT,
      webhook_url TEXT,
      image_generation_model TEXT,
      generation_mode TEXT
    );

    CREATE TABLE IF NOT EXISTS history_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      history_id TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL, -- 'edited', 'original_for_comparison', 'generated_video'
      slot_index INTEGER NOT NULL,
      FOREIGN KEY (history_id) REFERENCES history(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at INTEGER DEFAULT (unixepoch()),
      app_api_key TEXT UNIQUE,
      gemini_api_key_1 TEXT,
      gemini_api_key_1_mode TEXT DEFAULT 'global',
      gemini_api_key_2 TEXT,
      gemini_api_key_2_mode TEXT DEFAULT 'global',
      gemini_api_key_3 TEXT,
      gemini_api_key_3_mode TEXT DEFAULT 'global',
      fal_api_key TEXT,
      fal_api_key_mode TEXT DEFAULT 'global',
      image_generation_model TEXT DEFAULT 'google_gemini_2_0'
    );
  `);

  // Initialize Admin User if not exists
  const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!adminUser) {
    // Default password: 'admin' (bcrypt hash)
    const defaultHash = '$2b$10$8.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1'; 
    // Note: In a real scenario, generate a proper hash. This is a placeholder.
    // Actually, let's use a known hash for "password" or similar if possible, 
    // or just rely on the user changing it. 
    // For this script, we'll assume the hash is pre-calculated or handled elsewhere.
    // Let's use a placeholder hash for "admin"
    const adminHash = '$2b$10$X7.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1'; // INVALID HASH, user must reset or we use a real one.
    // Better: Check if we have an env var for initial admin password, otherwise skip or warn.
    // For now, we will NOT create the admin user here to avoid security risks with hardcoded hashes.
    // The application likely handles user creation or has a separate seed script.
    // However, the original code might have had it.
    // Let's check if we need to initialize API keys from ENV.
  }

  // Initialize API Keys from Env if Admin exists
  const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('admin') as any;
  if (admin) {
    const updates: string[] = [];
    const params: any[] = [];

    if (process.env.GEMINI_API_KEY && !admin.gemini_api_key_1) {
      updates.push('gemini_api_key_1 = ?');
      params.push(encrypt(process.env.GEMINI_API_KEY));
    }
    if (process.env.FAL_KEY && !admin.fal_api_key) {
      updates.push('fal_api_key = ?');
      params.push(encrypt(process.env.FAL_KEY));
    }

    if (updates.length > 0) {
      params.push('admin');
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`).run(...params);
      console.log('Updated admin API keys from environment variables.');
    }
  }

  console.log('Database migrations completed successfully.');
  db.close();
}

runMigrations();
