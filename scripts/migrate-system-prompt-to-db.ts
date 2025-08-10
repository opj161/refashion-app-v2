// scripts/migrate-system-prompt-to-db.ts
import { getDb } from '@/services/database.service';
import * as fs from 'fs/promises';
import path from 'path';

async function runSystemPromptMigration() {
  const db = getDb();
  console.log('Running system prompt migration...');

  try {
    // Check if ai_prompt_engineer_system setting already exists and has content
    const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get('ai_prompt_engineer_system') as { value: string } | undefined;
    
    if (existing && existing.value.trim()) {
      console.log('System prompt already exists in database. Migration not needed.');
      return;
    }

    // Read the prompt from file
    const promptPath = path.join(process.cwd(), 'src/ai/prompts/prompt-engineer-system.txt');
    try {
      const fileContent = await fs.readFile(promptPath, 'utf8');
      
      if (fileContent.trim()) {
        // Insert the prompt into database
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        stmt.run('ai_prompt_engineer_system', fileContent);
        console.log('Successfully migrated system prompt from file to database.');
      } else {
        console.log('Prompt file is empty. Skipping migration.');
      }
    } catch (fileError) {
      console.log('Prompt file not found. This is normal for new installations.');
      // Create default setting entry
      const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
      stmt.run('ai_prompt_engineer_system', '');
      console.log('Created empty system prompt setting in database.');
    }

  } catch (error) {
    console.error('System prompt migration failed:', error);
    throw error;
  }
}

// This construct ensures the script can be run directly
if (require.main === module) {
  runSystemPromptMigration().then(() => {
    console.log('System prompt migration completed.');
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { runSystemPromptMigration };
