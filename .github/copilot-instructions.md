# Refashion AI - Copilot Instructions

## Project Architecture & Core Patterns

### 1. Service-Repository Pattern
Logic is strictly separated. **Never** write database queries or complex business logic directly inside UI components or Server Actions.
- **Server Actions** (`src/actions/*.ts`): Entry points for mutations. Authenticate, validate input (Zod), call Services, and handle revalidation.
- **Services** (`src/services/*.ts`): Pure business logic and database access.
  - Database: `src/services/database.service.ts` (Raw SQLite with `better-sqlite3`).
  - Storage: `src/services/storage.service.ts` (Local filesystem + Mega backup).
  - API Keys: `src/services/apiKey.service.ts` (Key rotation logic).
- **AI Flows** (`src/ai/flows/*.ts`): Orchestration logic for complex, multi-step AI operations (e.g., chaining prompt generation with image generation).

### 2. Data Flow & Mutations
- **Forms**: Use `useActionState` (React 19) for form submissions. Return structured objects `{ success: boolean, message?: string, errors?: ... }`.
- **Optimistic UI**: Use `useOptimistic` in client components (e.g., `src/components/history-gallery.tsx`) for immediate feedback on deletes/updates.
- **Background Tasks**: Use Next.js `after()` for fire-and-forget tasks within Server Actions (see `src/ai/flows/generate-image-edit.ts`).

### 3. File Handling & Images
**Critical**: Local files are stored outside the `public` folder in `/uploads` (Docker volume).
- **Serving Images**: Never reference `/uploads/` directly in `src` attributes.
  - Use `getDisplayableImageUrl()` from `@/lib/utils` to generate the correct proxy URL.
  - The proxy route is handled in `src/app/api/images/[...filePath]/route.ts`.
- **Streaming**: Large files (videos/images) must be streamed using `createReadStream` to avoid OOM errors.

## Next.js 15 & React 19 Conventions

- **Async Request APIs**: `params`, `searchParams`, `cookies()`, and `headers()` are asynchronous. Always `await` them.
- **Caching**:
  - **Strict Rule**: Every `fetch()` call must have an explicit `cache:` option or `next: { revalidate: N }`. This is enforced by a custom ESLint rule (`eslint-local-rules.js`).
  - Use `connection()` in Layouts/Pages to explicitly opt-out of static rendering when necessary.
- **Components**:
  - Use `server-only` at the top of all Service and Action files.
  - Client Components must explicitly use `'use client'`.

## State Management

- **Global UI State**: Use **Zustand** (`src/stores/`).
  - `generationSettingsStore.ts`: User preferences and UI toggles.
  - `imageStore.ts`: Complex client-side image manipulation state (crop, resize, versions).
- **Avoid Context**: Prefer Zustand over React Context for complex mutable state to prevent unnecessary re-renders.

## Database & Migrations

- **Engine**: `better-sqlite3` in WAL mode.
- **Migrations**: Manual SQL scripts in `scripts/migrate.ts`.
  - Run `npm run migrate` to apply changes.
  - Always use `PRAGMA user_version` to version-control schema changes.
- **Security**:
  - **Encryption**: All API keys in the DB must be encrypted/decrypted using `src/services/encryption.service.ts`.
  - **Prepared Statements**: Use `db.prepare().run/get/all()` for all queries to prevent SQL injection.

## AI Integration (Fal.ai & Gemini)

- **Fal.ai**: Use `fal-client` via the proxy route (`/api/fal/proxy`).
  - Video generation uses a **Webhook pattern** (`src/app/api/video/webhook/route.ts`).
  - Webhook signatures must be verified using `src/lib/webhook-verification.ts`.
- **Gemini**: Used via `GoogleGenAI` SDK or direct REST calls with retry logic (`src/lib/api-retry.ts`).

## Testing

- **Unit Tests**: `npm test`. Focus on Services and Utils.
- **Mocking**: Mock `server-only` modules in Jest configurations.

## Common Tasks

- **Adding a new Setting**: Update `src/services/settings.service.ts` (add to `DEFAULTS` and export type) -> Update Admin UI.
- **New AI Model**: Add to `src/lib/types.ts` (ModelAttributes) -> Update `prompt-builder.ts` -> Update Flow logic.