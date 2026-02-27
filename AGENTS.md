# AGENTS.md — Refashion AI

Fashion AI photography app: upload a garment image → Gemini analyzes it → Fal.ai generates model photography and video.

## Stack

- **TypeScript 5.9** — all source code
- **Next.js 15 (App Router)** — full-stack framework with Turbopack
- **React 19** — UI with `useActionState`, `useOptimistic`, React Compiler
- **better-sqlite3** — SQLite in WAL mode (no ORM)
- **Tailwind CSS 4 + Radix UI** — styling and primitives
- **Zustand** — client state management
- **iron-session** — encrypted cookie sessions
- **Fal.ai** — image/video generation (via proxy route)
- **Gemini (@google/genai)** — vision analysis and prompt engineering
- **Zod 4** — input validation in Server Actions

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 9002, Turbopack) |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Format | `npm run format` |
| Test | `npm test` |
| Migrate DB | `npm run migrate` |
| Run script | `npm run script <file>` |

## Safety & Permissions

**Allowed without asking:** read files, search codebase, format, lint, run tests.

**Ask first:** adding dependencies, schema migrations, CI/workflow changes, deleting files.

## Documentation & Dependencies

### Live doc lookup (MCP context7)

For any library question, use MCP context7:
1. `resolve-library-id` → find the library
2. `query-docs` → ask a specific question

Priority libraries: `next.js`, `react`, `better-sqlite3`, `@fal-ai/client`, `@google/genai`, `zustand`, `zod`, `iron-session`, `radix-ui`.

## Architecture

### Service-Repository Pattern

Logic is strictly separated — never write DB queries or business logic in components or Server Actions.

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Server Actions** | `src/actions/*.ts` | Entry points for mutations. Auth → Zod validate → call Service → revalidate. |
| **Services** | `src/services/*.ts` | Business logic + database access. Import `server-only`. |
| **AI Flows** | `src/ai/flows/*.ts` | Multi-step AI orchestration (prompt gen → image gen → post-processing). |
| **AI Actions** | `src/ai/actions/*.ts` | Single AI operations (generate prompt, remove bg, upscale). |
| **AI Domain** | `src/ai/domain/*.ts` | Pure domain logic for prompt construction. |
| **Components** | `src/components/*.tsx` | UI. Client components use `'use client'`. |
| **Stores** | `src/stores/*.ts` | Zustand stores for client-side state. |
| **API Routes** | `src/app/api/` | REST endpoints: image proxy, fal proxy, video webhook, v1 API. |

### Exemplar files

| Pattern | Example file |
|---------|-------------|
| Server Action | `src/actions/imageActions.ts` |
| Service | `src/services/database.service.ts` |
| AI Flow | `src/ai/flows/generate-image-edit.ts` |
| Zustand store | `src/stores/generationSettingsStore.ts` |
| API route | `src/app/api/images/[...filePath]/route.ts` |

## Key Invariants

1. **File storage:** Files live in `/uploads/` (Docker volume), never in `public/`. Serve images through `getDisplayableImageUrl()` from `@/lib/utils` — Next.js rewrites `/uploads/*` → `/api/images/*`.

2. **Streaming large files:** Use `createReadStream` for images/videos in API routes to prevent OOM.

3. **Async request APIs:** `params`, `searchParams`, `cookies()`, `headers()` are async in Next.js 15 — always `await` them.

4. **Fetch caching:** Every `fetch()` must have an explicit `cache:` or `next: { revalidate: N }`. Enforced by custom ESLint rule in `eslint-local-rules.js`.

5. **Server-only imports:** All Service and Action files must import `server-only` at the top. Client Components must use `'use client'`.

6. **Prepared statements:** All DB queries use `db.prepare().run/get/all()`. No raw string concatenation.

7. **API key encryption:** Keys stored in DB are encrypted via `src/services/encryption.service.ts` (AES-256-GCM). Use `getApiKeyForUser()` from `apiKey.service.ts` — never read keys directly.

8. **Form pattern (React 19):** Use `useActionState` for form submissions. Return `{ success: boolean, message?: string, errors?: ... }`.

9. **Background tasks:** Use Next.js `after()` for fire-and-forget work inside Server Actions.

## Code Style

- **Path alias:** `@/*` → `./src/*`
- **CSS:** Tailwind CSS 4 utility classes. Use `cn()` from `@/lib/utils` for conditional classes.
- **UI primitives:** Radix UI via shadcn/ui components in `src/components/ui/`.
- **State:** Zustand over React Context for complex mutable state.
- **Validation:** Zod schemas in Server Actions for all user input.
- **Icons:** `lucide-react`.

## Database

- **Engine:** `better-sqlite3`, WAL mode, foreign keys ON.
- **Location:** `user_data/history/history.db`
- **Migrations:** Manual SQL in `scripts/migrate.ts`. Uses `PRAGMA user_version` for versioning. Run `npm run migrate`.
- **Settings:** `src/services/settings.service.ts` — key-value store with typed `DEFAULTS` object. Add new settings there.

## AI Integration

- **Fal.ai:** Client via `@fal-ai/client` through proxy route `/api/fal/proxy`. Video uses webhook pattern (`src/app/api/video/webhook/route.ts`) with signature verification (`src/lib/webhook-verification.ts`).
- **Gemini:** Via `@google/genai` SDK with retry logic (`src/lib/api-retry.ts`). Three API keys rotate per user via `apiKey.service.ts`.
- **Prompt building:** `src/lib/prompt-builder.ts` constructs image/video prompts from `ModelAttributes`. Studio mode uses `src/ai/domain/studio-prompt.ts`.

## Common Tasks

- **New setting:** Add key + default to `DEFAULTS` in `src/services/settings.service.ts` → update Admin UI.
- **New AI model:** Add to `ModelAttributes` in `src/lib/types.ts` → update `prompt-builder.ts` → update flow logic.
- **New API route:** Create route handler in `src/app/api/` → add CORS if external.

## Project Structure

```
src/
├── actions/          # Server Actions (auth, image, history, admin, API, theme)
├── ai/
│   ├── actions/      # Single AI operations (prompt gen, bg removal, upscale)
│   ├── domain/       # Pure prompt domain logic (studio-prompt)
│   ├── flows/        # Multi-step orchestration (generate-image-edit)
│   └── prompts/      # System prompt templates
├── app/
│   ├── api/          # Route handlers (images proxy, fal proxy, video webhook, v1 API)
│   ├── admin/        # Admin dashboard (settings, users, history)
│   ├── history/      # History pages
│   └── login/        # Auth pages
├── components/       # React components (ui/ = shadcn primitives)
├── contexts/         # Auth + Theme context providers
├── hooks/            # Custom hooks (polling, prompt manager, mobile)
├── lib/              # Utilities (types, utils, prompt-builder, session, api-retry)
├── services/         # Business logic (database, storage, encryption, apiKey, settings)
├── stores/           # Zustand stores (generationSettings, image)
└── types/            # Type declarations
scripts/              # DB migrations and admin scripts
```

## Codebase Health Alerts

If you encounter genuinely surprising, architecturally inconsistent, or confusing code that is not trivially fixable within your current task:
1. Surface it — tell the developer what is confusing and where
2. Explain why — describe the inconsistency or risk
3. Do not attempt large-scope refactors without approval

## When Stuck

1. Search the codebase — existing patterns are the best guide
2. Use MCP context7 for library documentation
3. Check exemplar files listed above
4. Ask the developer — propose a plan, don't guess on important decisions
