# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev           # Start dev server with Turbopack on port 9002
npm run build         # Production build (Next.js + compile scripts)
npm run lint          # ESLint with custom fetch caching rule
npm run typecheck     # TypeScript type checking
npm test              # Run Jest tests
npm test -- --watch   # Watch mode for tests
npm run migrate       # Apply database migrations
npm run script <file> # Run TypeScript script with tsx
```

## Architecture Overview

This is a **Next.js 15 / React 19** fashion AI application using the **App Router**. It generates model photography from garment images using Gemini (vision analysis) and Fal.ai (image/video generation).

### Service-Repository Pattern

Logic is strictly separated—never write database queries or business logic directly in UI components or Server Actions.

- **Server Actions** (`src/actions/*.ts`): Entry points for mutations. Authenticate, validate with Zod, call Services, handle revalidation.
- **Services** (`src/services/*.ts`): Pure business logic and database access.
- **AI Flows** (`src/ai/flows/*.ts`): Multi-step AI orchestration (e.g., chaining prompt generation with image generation).

### Key Services

| Service | Purpose |
|---------|---------|
| `database.service.ts` | Raw SQLite with `better-sqlite3` in WAL mode |
| `storage.service.ts` | Local filesystem + MEGA backup |
| `encryption.service.ts` | AES-256-GCM for API keys stored in DB |
| `apiKey.service.ts` | Per-user API key rotation logic |

### Data Flow Patterns

- **Forms**: Use `useActionState` (React 19). Return structured objects `{ success, message?, errors? }`.
- **Optimistic UI**: Use `useOptimistic` for immediate feedback (see `history-gallery.tsx`).
- **Background Tasks**: Use Next.js `after()` for fire-and-forget work within Server Actions.

### State Management

- **Zustand stores** (`src/stores/`): Client-side state (generation settings, image manipulation).
- **Iron Session**: Encrypted server-side sessions via cookies.
- Prefer Zustand over React Context for complex mutable state.

## Critical Conventions

### File Handling

Local files are stored in `/uploads` (Docker volume), NOT in `public/`.

- **Serving images**: Use `getDisplayableImageUrl()` from `@/lib/utils` to generate proxy URLs.
- **Proxy route**: `src/app/api/images/[...filePath]/route.ts`
- **Large files**: Stream using `createReadStream` to avoid OOM errors.

### Next.js 15 / React 19 Requirements

- `params`, `searchParams`, `cookies()`, `headers()` are **async**—always `await` them.
- Every `fetch()` must have explicit `cache:` option or `next: { revalidate: N }`. Enforced by custom ESLint rule.
- Use `server-only` import at top of Service and Action files.
- Client Components must use `'use client'` directive.

### Database Migrations

- Manual SQL scripts in `scripts/migrate.ts`
- Use `PRAGMA user_version` for schema versioning
- Always use prepared statements: `db.prepare().run/get/all()`

### AI Integration

- **Fal.ai**: Via proxy route `/api/fal/proxy`. Video uses webhook pattern with signature verification (`src/lib/webhook-verification.ts`).
- **Gemini**: Via `@google/genai` SDK with retry logic (`src/lib/api-retry.ts`).

## Path Aliases

Uses `@/*` → `./src/*` (configured in tsconfig.json).

## Testing

Jest with `ts-jest` and `@testing-library/react`. Tests located alongside source files or in `__tests__` directories.
