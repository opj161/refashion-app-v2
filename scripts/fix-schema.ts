import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'user_data', 'history', 'history.db');

function fixSchema() {
  console.log('Starting schema fix for users table...');
  console.log(`Database path: ${DB_PATH}`);

  if (!fs.existsSync(DB_PATH)) {
    console.error('Database file not found!');
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  try {
    // Check if we can access the table
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as { sql: string };
    
    if (!tableInfo || !tableInfo.sql) {
        console.error("Could not retrieve users table definition.");
        return;
    }

    console.log("Current table definition found. Proceeding with migration...");

    const transaction = db.transaction(() => {
      // 1. Disable foreign keys temporarily
      db.pragma('foreign_keys = OFF');

      console.log("Creating users_new table without constraints...");
      
      // 2. Create new table without the CHECK constraint and with updated default
      db.exec(`
        CREATE TABLE users_new (
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
          image_generation_model TEXT DEFAULT 'fal_nano_banana_pro'
        );
      `);

      console.log("Copying existing user data...");
      
      // 3. Copy data from old table to new table
      // Note: 'created_at' is missing in the old table, so we let it default to unixepoch()
      // Note: We ignore 'api_key_mode' and 'gemini_api_key' from the old table as they are legacy.
      db.exec(`
        INSERT INTO users_new (
          username, password_hash, role, app_api_key,
          gemini_api_key_1, gemini_api_key_1_mode,
          gemini_api_key_2, gemini_api_key_2_mode,
          gemini_api_key_3, gemini_api_key_3_mode,
          fal_api_key, fal_api_key_mode,
          image_generation_model
        )
        SELECT 
          username, password_hash, role, app_api_key,
          gemini_api_key_1, gemini_api_key_1_mode,
          gemini_api_key_2, gemini_api_key_2_mode,
          gemini_api_key_3, gemini_api_key_3_mode,
          fal_api_key, fal_api_key_mode,
          image_generation_model
        FROM users;
      `);

      console.log("Swapping tables...");
      
      // 4. Drop old table and rename new one
      db.exec(`DROP TABLE users;`);
      db.exec(`ALTER TABLE users_new RENAME TO users;`);
      
      // 5. Re-enable foreign keys
      db.pragma('foreign_keys = ON');
    });

    transaction();
    console.log('✅ Schema fix executed successfully. CHECK constraint removed.');

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
  } finally {
    db.close();
  }
}

fixSchema();
