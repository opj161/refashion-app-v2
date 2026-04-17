## 2024-05-24 - Missing Database Index Causes Full Table Scans
**Learning:** SQLite's `JSON_GROUP_ARRAY` correlated subqueries rely heavily on indexes. Without an index on `history_images(history_id, type)`, fetching paginated history triggers full table scans on `history_images` for every row retrieved. This O(N) penalty becomes a severe backend bottleneck as the number of generated images grows.
**Action:** Always verify that foreign keys and fields heavily queried inside `SELECT` subqueries or joins have proper compound indexes defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-24 - Missing Database Index Causes Full Table Scans for History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` combined with filtering by `username` triggers a full table scan and a temporary B-Tree for sorting without a composite index on `(username, timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck as user history grows.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding composite index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2026-03-11 - Missing Database Index Causes Full Table Scans for Global History Pagination
**Learning:** SQLite's `ORDER BY timestamp DESC` triggers a full table scan and a temporary B-Tree for sorting without an index on `(timestamp DESC)`. This O(N log N) penalty becomes a severe backend bottleneck when paginating through all users' history globally.
**Action:** Always ensure that frequently paginated or ordered queries have a corresponding index defined in both the migration scripts (`scripts/migrate.ts`) and replicated exactly in testing schema files.

## 2024-05-25 - Combined Aggregation Queries and COALESCE
**Learning:** When combining multiple `COUNT(*)` or `SUM()` aggregations into a single query in SQLite (like `getDashboardKpis`), SQLite's `SUM()` function returns `NULL` (unlike `COUNT()` which returns `0`) if the dataset is empty. This can cause unexpected `null` values where a number is expected in JavaScript logic.
**Action:** Always wrap `SUM(CASE WHEN ...)` in a `COALESCE(..., 0)` to guarantee a numeric return value and prevent potential `NaN` issues or type mismatches when no rows match the query criteria.

## 2024-05-25 - Using Temporary Scripts for Benchmarking
**Learning:** Creating scratchpad files in the repository root for benchmarking `better-sqlite3` performance requires native Node.js ES module parsing (`node --experimental-strip-types`) and explicit paths or packages. However, committing these files violates the cleanliness of the codebase and triggers review failures.
**Action:** Always delete any temporary script files (e.g., `test-explain.js`, `test-better-sqlite3.js`) and revert any unintended `package.json` updates before initiating a code review or submitting a PR.
