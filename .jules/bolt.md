## 2024-05-20 - [SQLite Conditional Aggregations]
**Learning:** Combining multiple `COUNT` operations into a single query using conditional aggregation (e.g., `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`) works to reduce query execution overhead, but SQLite's `SUM()` returns `NULL` on an empty dataset, which is different from `COUNT()` which returns `0`.
**Action:** Always wrap `SUM` with `COALESCE` (e.g., `COALESCE(SUM(...), 0)`) when expecting a numerical count from conditional aggregations in SQLite to prevent unexpected `NULL` values.
