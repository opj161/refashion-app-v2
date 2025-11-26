
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'user_data', 'history', 'history.db');

function migrate() {
  console.log('Starting migration...');
  console.log(`Database path: ${DB_PATH}`);

  if (!fs.existsSync(DB_PATH)) {
    console.error('Database file not found!');
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  try {
    // 1. Update Users
    const updateUsersStmt = db.prepare(`
      UPDATE users 
      SET image_generation_model = 'fal_gemini_2_5' 
      WHERE image_generation_model = 'google_gemini_2_0'
    `);
    
    const userResult = updateUsersStmt.run();
    console.log(`Updated ${userResult.changes} users from 'google_gemini_2_0' to 'fal_gemini_2_5'.`);

    // 2. Update History Items (Optional but good for consistency)
    // Note: The 'history' table might not have this column indexed or strictly typed in SQLite, 
    // but it's good to update if the column exists and stores this string.
    // Based on types.ts, HistoryItem has imageGenerationModel.
    // Let's check if the column exists first to be safe, or just try update.
    // SQLite allows adding columns dynamically, but let's assume it matches the type.
    
    // Check table info to see column name. It's likely snake_case in DB if mapped, or camelCase if JSON.
    // database.service.ts uses: 
    // image_generation_model: row.image_generation_model as ...
    // So the column name is image_generation_model.

    const updateHistoryStmt = db.prepare(`
      UPDATE history 
      SET image_generation_model = 'fal_gemini_2_5' 
      WHERE image_generation_model = 'google_gemini_2_0'
    `);

    const historyResult = updateHistoryStmt.run();
    console.log(`Updated ${historyResult.changes} history items from 'google_gemini_2_0' to 'fal_gemini_2_5'.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
    console.log('Migration complete.');
  }
}

migrate();
