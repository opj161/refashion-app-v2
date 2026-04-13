## 2024-05-24 - Missing Database Index Causes Full Table Scans
**Learning:** SQLite's `JSON_GROUP_ARRAY` correlated subqueries rely heavily on indexes. Without an index on `history_images(history_id, type)`, fetching paginated history triggers full table scans on `history_images` for every row retrieved. This O(N) penalty becomes a severe backend bottleneck as the number of generated images grows.
**Action:** Always verify that foreign keys and fields heavily queried inside `SELECT` subqueries or joins have proper compound indexes defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-24 - Missing Database Index Causes Full Table Scans for History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` combined with filtering by `username` triggers a full table scan and a temporary B-Tree for sorting without a composite index on `(username, timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck as user history grows.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding composite index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2026-03-11 - Missing Database Index Causes Full Table Scans for Global History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` triggers a full table scan and a temporary B-Tree for sorting without an index on `(timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck when paginating through all users' history globally.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.
## 2024-05-24 - Database Upgrades Need Dynamic Column Checking for Partial Indexes
**Learning:** When adding partial indexes that reference new columns (like `videoGenerationParams`) in `scripts/migrate.ts`, if the column is added dynamically on upgrade, SQLite will throw `SqliteError: no such column` when parsing the index creation if the column doesn't exist yet on older databases.
**Action:** Always check `PRAGMA table_info` and use `ALTER TABLE ADD COLUMN` to dynamically create missing columns *before* executing partial index creation statements that depend on those columns.
