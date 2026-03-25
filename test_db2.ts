import Database from 'better-sqlite3';

const db = new Database(':memory:');

db.exec(`
    CREATE TABLE history (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      status TEXT DEFAULT 'completed'
    );
`);

console.log(db.prepare(`
    SELECT
      COUNT(*) as count_generations,
      COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as count_failed,
      COUNT(DISTINCT username) as count_active_users
    FROM history
    WHERE timestamp >= 150
`).get());
