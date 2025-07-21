// scripts/ensure-schema-integrity.ts
import { getDb } from '@/services/database.service';

/**
 * Checks if a specific column exists in a table.
 * @returns boolean
 */
function columnExists(db: ReturnType<typeof getDb>, tableName: string, columnName: string): boolean {
  try {
    const columns = db.pragma(`table_info(${tableName})`) as { name: string }[];
    return columns.some(col => col.name === columnName);
  } catch (error) {
    // This can happen if the table itself doesn't exist yet, which is fine.
    return false;
  }
}

function ensureHistoryTable(db: ReturnType<typeof getDb>) {
  console.log('Ensuring `history` table integrity...');
  if (!columnExists(db, 'history', 'status')) {
    console.log('-> Adding `status` column to `history` table.');
    db.exec(`ALTER TABLE history ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';`);
  }
  if (!columnExists(db, 'history', 'error')) {
    console.log('-> Adding `error` column to `history` table.');
    db.exec(`ALTER TABLE history ADD COLUMN error TEXT;`);
  }
  if (!columnExists(db, 'history', 'webhook_url')) {
    console.log('-> Adding `webhook_url` column to `history` table.');
    db.exec(`ALTER TABLE history ADD COLUMN webhook_url TEXT;`);
  }
  console.log('`history` table is up to date.');
}

function ensureUsersTable(db: ReturnType<typeof getDb>) {
  console.log('Ensuring `users` table integrity...');
  if (!columnExists(db, 'users', 'app_api_key')) {
    console.log('-> Adding `app_api_key` column to `users` table.');
    db.exec(`ALTER TABLE users ADD COLUMN app_api_key TEXT;`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_app_api_key ON users(app_api_key) WHERE app_api_key IS NOT NULL;`);
  }
  // Note: The granular API key migration was complex (table rename) and is assumed
  // to have run. This script focuses on simple ALTER TABLE additions.
  console.log('`users` table is up to date.');
}

function runSchemaIntegrityCheck() {
  console.log('--- Running Schema Integrity Check ---');
  try {
    const db = getDb();
    ensureHistoryTable(db);
    ensureUsersTable(db);
    console.log('--- Schema Integrity Check Finished Successfully ---');
  } catch (error) {
    console.error('💥 Schema Integrity Check Failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runSchemaIntegrityCheck();
}