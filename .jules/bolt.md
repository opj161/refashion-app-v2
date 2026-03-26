## 2024-05-24 - Missing Database Index Causes Full Table Scans
**Learning:** SQLite's `JSON_GROUP_ARRAY` correlated subqueries rely heavily on indexes. Without an index on `history_images(history_id, type)`, fetching paginated history triggers full table scans on `history_images` for every row retrieved. This O(N) penalty becomes a severe backend bottleneck as the number of generated images grows.
**Action:** Always verify that foreign keys and fields heavily queried inside `SELECT` subqueries or joins have proper compound indexes defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-24 - Missing Database Index Causes Full Table Scans for History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` combined with filtering by `username` triggers a full table scan and a temporary B-Tree for sorting without a composite index on `(username, timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck as user history grows.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding composite index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2026-03-11 - Missing Database Index Causes Full Table Scans for Global History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` triggers a full table scan and a temporary B-Tree for sorting without an index on `(timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck when paginating through all users' history globally.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2025-01-01 - [Conditional Aggregation using COALESCE with SUM in SQLite]
**Learning:** SQLite's `SUM()` returns `NULL` on an empty dataset, unlike `COUNT()` which returns `0`. When converting separate `COUNT(*)` queries into a combined query using conditional aggregation like `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`, it can result in `NULL` being returned when 0 is expected.
**Action:** Always wrap `SUM(CASE WHEN ...)` with `COALESCE` (e.g. `COALESCE(SUM(CASE WHEN ... THEN 1 ELSE 0 END), 0)`) when expecting numerical zero instead of `NULL` in the results.
