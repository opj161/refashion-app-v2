import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'user_data', 'history', 'history.db');
const db = new Database(DB_PATH);

const columns = db.pragma('table_info(users)');
console.log('Columns in users table:', columns);
