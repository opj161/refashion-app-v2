// scripts/seed-admin.ts
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'user_data', 'history', 'history.db');

async function seedAdmin() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found. Run "npm run migrate" first.');
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  const username = 'admin';
  const password = 'admin'; // Default password
  const saltRounds = 12;

  try {
    // Check if admin exists
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (existing) {
      console.log('Admin user already exists.');
      return;
    }

    console.log('Creating admin user...');
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert admin user
    const stmt = db.prepare(`
      INSERT INTO users (
        username, 
        password_hash, 
        role, 
        created_at,
        gemini_api_key_1_mode,
        fal_api_key_mode,
        image_generation_model
      ) VALUES (?, ?, ?, ?, 'global', 'global', 'fal_gemini_2_5')
    `);
    
    stmt.run(username, passwordHash, 'admin', Math.floor(Date.now() / 1000));
    
    console.log('✅ Admin user created successfully.');
    console.log('Username: admin');
    console.log('Password: admin');
    
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    db.close();
  }
}

seedAdmin();