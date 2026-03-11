## 2024-05-24 - Missing Database Index Causes Full Table Scans
**Learning:** SQLite's `JSON_GROUP_ARRAY` correlated subqueries rely heavily on indexes. Without an index on `history_images(history_id, type)`, fetching paginated history triggers full table scans on `history_images` for every row retrieved. This O(N) penalty becomes a severe backend bottleneck as the number of generated images grows.
**Action:** Always verify that foreign keys and fields heavily queried inside `SELECT` subqueries or joins have proper compound indexes defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-24 - Missing Database Index Causes Full Table Scans for History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` combined with filtering by `username` triggers a full table scan and a temporary B-Tree for sorting without a composite index on `(username, timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck as user history grows.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding composite index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-25 - Cache Database Prepared Statements
**Learning:** better-sqlite3 requires explicit caching to avoid the overhead of continuous inline query recompilation. Re-running `db.prepare(sql)` inline, particularly on high frequency functions like those related to user querying and fetching, becomes a bottleneck over time.
**Action:** Consistently create a module-level `preparedStatements` object and construct cached queries during initialization to minimize DB latency.

## 2024-05-25 - Missing Index Causes Full Table Scans for Admin History Pagination
**Learning:** `getAllUsersHistoryPaginated` uses `ORDER BY h.timestamp DESC` without an index on `timestamp`. This causes SQLite to perform a full table scan and a temporary B-Tree sort before applying limits and offsets, resulting in O(N log N) performance degradation as the total history grows.
**Action:** Added `idx_history_timestamp ON history(timestamp DESC)` to optimize admin-level queries across all users and mirrored it in migration tests. Avoid caching `better-sqlite3` `prepare()` statements manually in a module-level variable because it is natively handled and risks tying statements to specific closed/recreated database connection instances.
