## 2024-05-24 - Missing Database Index Causes Full Table Scans
**Learning:** SQLite's `JSON_GROUP_ARRAY` correlated subqueries rely heavily on indexes. Without an index on `history_images(history_id, type)`, fetching paginated history triggers full table scans on `history_images` for every row retrieved. This O(N) penalty becomes a severe backend bottleneck as the number of generated images grows.
**Action:** Always verify that foreign keys and fields heavily queried inside `SELECT` subqueries or joins have proper compound indexes defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-24 - Missing Database Index Causes Full Table Scans for History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` combined with filtering by `username` triggers a full table scan and a temporary B-Tree for sorting without a composite index on `(username, timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck as user history grows.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding composite index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2026-03-11 - Missing Database Index Causes Full Table Scans for Global History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` triggers a full table scan and a temporary B-Tree for sorting without an index on `(timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck when paginating through all users' history globally.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2026-04-21 - Partial Indexes for JSON Conditional Filtering
**Learning:** When filtering paginated lists in SQLite with conditions that evaluate JSON columns or perform NULL checks (e.g., `IS NULL` or `IS NOT NULL`), avoiding full row evaluation is critical. Without partial indexes, filtering by `videoGenerationParams IS NULL` or `IS NOT NULL` forces SQLite to read each row's data. This causes severe backend bottlenecks when paginating.
**Action:** Use partial indexes (e.g., `CREATE INDEX ... WHERE condition`) for frequently queried nullable or JSON condition filters. Always ensure that the corresponding partial index is defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.
