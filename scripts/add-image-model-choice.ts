// scripts/add-image-model-choice.ts
import { getDb } from '@/services/database.service';

function columnExists(db: ReturnType<typeof getDb>, tableName: string, columnName: string): boolean {
  try {
    const columns = db.pragma(`table_info(${tableName})`) as { name: string }[];
    return columns.some(col => col.name === columnName);
  } catch (error) {
    return false;
  }
}

function runMigration() {
  const db = getDb();
  console.log('Running image generation model choice migration...');

  try {
    db.exec('BEGIN TRANSACTION;');

    // Add column to users table
    if (!columnExists(db, 'users', 'image_generation_model')) {
      db.exec(`
        ALTER TABLE users ADD COLUMN image_generation_model TEXT NOT NULL DEFAULT 'google_gemini_2_0'
        CHECK (image_generation_model IN ('google_gemini_2_0', 'fal_gemini_2_5'));
      `);
      console.log('Successfully added image_generation_model column to users table.');
    } else {
      console.log('image_generation_model column already exists in users table. Skipping.');
    }

    // Add column to history table
    if (!columnExists(db, 'history', 'image_generation_model')) {
      db.exec(`
        ALTER TABLE history ADD COLUMN image_generation_model TEXT;
      `);
      console.log('Successfully added image_generation_model column to history table.');
    } else {
      console.log('image_generation_model column already exists in history table. Skipping.');
    }
    
    db.exec('COMMIT;');
    console.log('Migration completed successfully.');

  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
    runMigration();
}

export { runMigration };
