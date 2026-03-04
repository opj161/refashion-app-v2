## 2024-03-05 - [SQLite N+1 Subquery Indexes]
**Learning:** SQLite does not automatically index foreign keys. Correlated subqueries (like `SELECT ... FROM history_images WHERE history_id = h.id`) and filtered sorts (`WHERE username = ? ORDER BY timestamp DESC`) will result in massive O(N) full table scans without explicit indexes.
**Action:** When working with SQLite schemas, always explicitly define indexes for foreign key lookups and commonly filtered/sorted columns, and ensure these indexes are replicated in the `database.migration.test.ts` mock schemas to keep test environments accurate.
