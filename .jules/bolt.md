## 2024-05-24 - Missing Database Index Causes Full Table Scans
**Learning:** SQLite's `JSON_GROUP_ARRAY` correlated subqueries rely heavily on indexes. Without an index on `history_images(history_id, type)`, fetching paginated history triggers full table scans on `history_images` for every row retrieved. This O(N) penalty becomes a severe backend bottleneck as the number of generated images grows.
**Action:** Always verify that foreign keys and fields heavily queried inside `SELECT` subqueries or joins have proper compound indexes defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-24 - Missing Database Index Causes Full Table Scans for History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` combined with filtering by `username` triggers a full table scan and a temporary B-Tree for sorting without a composite index on `(username, timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck as user history grows.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding composite index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-25 - Expensive Repeated DB Prepares Unnecessarily Slow Down Server
**Learning:** In the `getAllUsersHistoryPaginated` function located in `src/services/db/history.repository.ts`, complex raw SQLite query operations containing `JSON_GROUP_ARRAY` correlated subqueries were being compiled inline via `db.prepare().all()` on every invocation. This caused an unnecessary recompilation penalty when paginating through admin user history. By leveraging caching through moving these query statements directly into the `preparedStatements` object initialized during the database connection startup, this expensive operation is optimized to effectively run directly off memory.
**Action:** When working with queries in a caching environment, explicitly move recurrent statements and count lookups into an initialized `preparedStatements` variable to avoid inline SQLite `db.prepare()` recompilations.
