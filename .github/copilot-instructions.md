# GitHub Copilot Instructions

All development guidelines live in `AGENTS.md` at the repo root.
Read it as your primary instruction source.

Quick reference — key invariants:
- Service-Repository pattern: Actions → Services → Database. No DB queries in components.
- Files in `/uploads/`, served via `getDisplayableImageUrl()`. Never reference `/uploads/` in `src` attributes.
- `params`, `searchParams`, `cookies()`, `headers()` are async — always `await`.
- Every `fetch()` needs explicit `cache:` option (enforced by ESLint).
- Import `server-only` in all Service and Action files.
- Use `useActionState` for forms, `useOptimistic` for immediate UI feedback.
- Zustand for client state, not React Context.