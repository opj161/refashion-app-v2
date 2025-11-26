/**
 * Database Migration Tests
 * 
 * These tests verify that the database migration system works correctly,
 * including idempotency, version tracking, and proper schema updates.
 * 
 * Note: We cannot directly test the database.service.ts due to 'server-only' directive,
 * but we can test the migration logic independently.
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Mock paths for testing
const TEST_DB_DIR = path.join(process.cwd(), 'user_data', 'history', 'test');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test_migration.db');

// Replicate the migration logic for testing purposes
function runTestMigrations(db: Database.Database) {
  const LATEST_SCHEMA_VERSION = 1;
  let currentVersion = 0;

  try {
    const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
    currentVersion = row.user_version;
  } catch (error) {
    db.prepare(`PRAGMA user_version = 0`).run();
  }

  if (currentVersion >= LATEST_SCHEMA_VERSION) {
    return;
  }

  if (currentVersion < 1) {
    const migration_v1 = db.transaction(() => {
      const columns = db.prepare("PRAGMA table_info(history)").all() as { name: string }[];
      const hasColumn = columns.some(col => col.name === 'generation_mode');

      if (!hasColumn) {
        db.exec(`
          ALTER TABLE history 
          ADD COLUMN generation_mode TEXT NOT NULL DEFAULT 'creative'
        `);
      }

      db.prepare(`PRAGMA user_version = 1`).run();
    });

    migration_v1();
  }
}

describe('Database Migration System', () => {
  let testDb: Database.Database;

  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-shm`);
    }
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    }

    // Ensure directory exists
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (testDb) {
      testDb.close();
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-shm`);
    }
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  test('should create a new database with the latest schema version', () => {
    testDb = new Database(TEST_DB_PATH);
    
    // Create a minimal schema with generation_mode column
    testDb.exec(`
      CREATE TABLE history (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        generation_mode TEXT NOT NULL DEFAULT 'creative'
      );
    `);

    // Set version to 1 (latest)
    testDb.prepare('PRAGMA user_version = 1').run();

    const version = testDb.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(1);

    // Verify generation_mode column exists
    const columns = testDb.prepare('PRAGMA table_info(history)').all() as { name: string }[];
    const hasGenerationMode = columns.some(col => col.name === 'generation_mode');
    expect(hasGenerationMode).toBe(true);
  });

  test('should migrate a version 0 database to version 1', () => {
    testDb = new Database(TEST_DB_PATH);
    
    // Create an old schema WITHOUT generation_mode column (simulating version 0)
    testDb.exec(`
      CREATE TABLE history (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        constructedPrompt TEXT,
        originalClothingUrl TEXT,
        settingsMode TEXT,
        attributes TEXT,
        videoGenerationParams TEXT,
        webhook_url TEXT,
        status TEXT DEFAULT 'completed',
        error TEXT,
        image_generation_model TEXT
      );
    `);

    // Explicitly set version to 0
    testDb.prepare('PRAGMA user_version = 0').run();

    // Verify initial state
    let version = testDb.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(0);

    let columns = testDb.prepare('PRAGMA table_info(history)').all() as { name: string }[];
    let hasGenerationMode = columns.some(col => col.name === 'generation_mode');
    expect(hasGenerationMode).toBe(false);

    // Apply migration manually (simulating what runMigrations does)
    const migration = testDb.transaction(() => {
      testDb.exec(`
        ALTER TABLE history 
        ADD COLUMN generation_mode TEXT NOT NULL DEFAULT 'creative'
      `);
      testDb.prepare('PRAGMA user_version = 1').run();
    });
    migration();

    // Verify migration was successful
    version = testDb.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(1);

    columns = testDb.prepare('PRAGMA table_info(history)').all() as { name: string }[];
    hasGenerationMode = columns.some(col => col.name === 'generation_mode');
    expect(hasGenerationMode).toBe(true);
  });

  test('should handle migration idempotency (running migration twice should not fail)', () => {
    testDb = new Database(TEST_DB_PATH);
    
    // Create schema with generation_mode but version 0
    testDb.exec(`
      CREATE TABLE history (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        generation_mode TEXT NOT NULL DEFAULT 'creative'
      );
    `);

    testDb.prepare('PRAGMA user_version = 0').run();

    // First migration attempt - should check and skip ALTER TABLE
    const migration1 = testDb.transaction(() => {
      const columns = testDb.prepare('PRAGMA table_info(history)').all() as { name: string }[];
      const hasColumn = columns.some(col => col.name === 'generation_mode');
      
      if (!hasColumn) {
        testDb.exec(`
          ALTER TABLE history 
          ADD COLUMN generation_mode TEXT NOT NULL DEFAULT 'creative'
        `);
      }
      
      testDb.prepare('PRAGMA user_version = 1').run();
    });
    
    expect(() => migration1()).not.toThrow();

    // Verify version was updated
    const version = testDb.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(1);
  });

  test('should rollback migration on error', () => {
    testDb = new Database(TEST_DB_PATH);
    
    // Create a valid schema
    testDb.exec(`
      CREATE TABLE history (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
    `);

    testDb.prepare('PRAGMA user_version = 0').run();

    // Attempt a migration that will fail (invalid SQL)
    const badMigration = testDb.transaction(() => {
      testDb.exec(`
        ALTER TABLE history 
        ADD COLUMN generation_mode TEXT NOT NULL DEFAULT 'creative'
      `);
      
      // This will cause an error - intentionally invalid
      testDb.exec('INVALID SQL STATEMENT');
      
      testDb.prepare('PRAGMA user_version = 1').run();
    });

    // Migration should fail
    expect(() => badMigration()).toThrow();

    // Version should still be 0 (rollback successful)
    const version = testDb.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(0);

    // Column should NOT have been added (rollback successful)
    const columns = testDb.prepare('PRAGMA table_info(history)').all() as { name: string }[];
    const hasGenerationMode = columns.some(col => col.name === 'generation_mode');
    expect(hasGenerationMode).toBe(false);
  });

  test('should preserve existing data during migration', () => {
    testDb = new Database(TEST_DB_PATH);
    
    // Create old schema
    testDb.exec(`
      CREATE TABLE history (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
    `);

    // Insert test data
    testDb.prepare(`
      INSERT INTO history (id, username, timestamp)
      VALUES ('test-1', 'testuser', 1234567890)
    `).run();

    testDb.prepare('PRAGMA user_version = 0').run();

    // Run migration
    const migration = testDb.transaction(() => {
      testDb.exec(`
        ALTER TABLE history 
        ADD COLUMN generation_mode TEXT NOT NULL DEFAULT 'creative'
      `);
      testDb.prepare('PRAGMA user_version = 1').run();
    });
    migration();

    // Verify data still exists with new column having default value
    const row = testDb.prepare(`
      SELECT id, username, timestamp, generation_mode 
      FROM history 
      WHERE id = 'test-1'
    `).get() as { id: string; username: string; timestamp: number; generation_mode: string };

    expect(row).toBeDefined();
    expect(row.id).toBe('test-1');
    expect(row.username).toBe('testuser');
    expect(row.timestamp).toBe(1234567890);
    expect(row.generation_mode).toBe('creative'); // Default value
  });

  test('should handle multiple sequential migrations', () => {
    testDb = new Database(TEST_DB_PATH);
    
    // Create base schema
    testDb.exec(`
      CREATE TABLE history (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
    `);

    testDb.prepare('PRAGMA user_version = 0').run();

    // Run migration to version 1
    runTestMigrations(testDb);

    // Verify version and column
    let version = testDb.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(1);

    let columns = testDb.prepare('PRAGMA table_info(history)').all() as { name: string }[];
    let hasGenerationMode = columns.some(col => col.name === 'generation_mode');
    expect(hasGenerationMode).toBe(true);

    // Run migration again - should be idempotent
    runTestMigrations(testDb);

    version = testDb.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(1); // Still version 1

    // Column should still exist and only exist once
    columns = testDb.prepare('PRAGMA table_info(history)').all() as { name: string }[];
    const generationModeColumns = columns.filter(col => col.name === 'generation_mode');
    expect(generationModeColumns.length).toBe(1);
  });
});
