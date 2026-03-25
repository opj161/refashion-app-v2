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

db.exec(`
    INSERT INTO history (id, username, timestamp, status) VALUES ('1', 'user1', 100, 'completed');
    INSERT INTO history (id, username, timestamp, status) VALUES ('2', 'user2', 200, 'failed');
    INSERT INTO history (id, username, timestamp, status) VALUES ('3', 'user1', 300, 'failed');
    INSERT INTO history (id, username, timestamp, status) VALUES ('4', 'user3', 400, 'completed');
`);

console.log(db.prepare(`
    SELECT
      COUNT(*) as count_generations,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as count_failed,
      COUNT(DISTINCT username) as count_active_users
    FROM history
    WHERE timestamp >= 150
`).get());
