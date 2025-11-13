# Refashion AI - Copilot Instructions

## Project Overview
Next.js 15 AI-powered fashion image/video generation platform. Users upload clothing images, customize model attributes through a multi-parameter UI, and generate photorealistic fashion photography using Google Gemini 2.0 Flash or Fal.ai's Gemini 2.5 model. Videos generated via Fal.ai with webhook-based async processing.

## Core Architecture

### Data Flow: Server Actions → Services Pattern
**ALL mutations** go through server actions—no direct database/API calls from components:
```typescript
// Client Component
import { generateImageEdit } from '@/actions/imageActions';
const result = await generateImageEdit(params); // ❌ Never fetch('/api/...') for internal ops

// Server Action (src/actions/*.ts)
'use server';
export async function generateImageEdit() {
  const user = await getCurrentUser(); // Session check
  const result = await generateImageEditFlow(params); // Call service/flow
  return result;
}
```
File structure: `src/actions/{imageActions,historyActions,authActions,apiActions,adminActions,themeActions}.ts` → `src/services/*.service.ts` → `src/ai/flows/*.ts`

### State Management: Context for Workflows, Zustand for Global
- **`ImagePreparationContext`** (src/contexts/): Manages ENTIRE image preparation pipeline state:
  - Multi-step workflow: upload → crop → background removal → upscale → face detail
  - Version history with undo/redo (array-based with `historyIndex`)
  - Hash-based deduplication prevents duplicate processing
  - Each step creates new `ImageVersion` record in state
- **`generationSettingsStore`** (Zustand): Cross-component generation parameters (image/video settings, generation mode: creative/studio, history filter)
- Anti-pattern: Don't duplicate workflow state—use context's `useActivePreparationImage()` derived hook

### Database: SQLite with React cache()
- Single `user_data/history/history.db` file (better-sqlite3 synchronous API)
- **Critical**: All read functions wrapped with React's `cache()` for request-level memoization (see `database.service.ts` line 383+)
- Schema migrations via `PRAGMA user_version` in `runMigrations()` function
- Example: `findUserByUsername()`, `findHistoryItemById()`, `getHistoryForUser()` all use `cache()`

### File Storage & Image Serving
Local files NEVER served directly—always proxied:
```typescript
// ❌ WRONG: <img src="/uploads/generated_images/image.png" />
// ✅ CORRECT: Use helper function
import { getDisplayableImageUrl } from '@/lib/utils';
const displayUrl = getDisplayableImageUrl('/uploads/generated_images/image.png');
// Returns: '/api/images/generated_images/image.png' (proxied route)
```
Folders: `uploads/{user_uploaded_clothing,generated_images,generated_videos,processed_images}/`

## Authentication & API Access

### Dual Authentication System
1. **Web UI**: iron-session with encrypted cookies (7-day TTL)
   - `getCurrentUser()` in server actions/components checks session
   - Cookie options: `secure` only if `FORCE_HTTPS=true` or HTTPS URL detected
2. **Programmatic API** (`/api/v1/*`): Bearer token authentication
   - `Authorization: Bearer <encrypted_user_api_key>` header
   - Keys managed in `apiKey.service.ts` with encryption
   - User-specific OR global fallback key support

### API Key Rotation System
Multi-key system for rate limit management (`apiKey.service.ts`):
```typescript
// 3 Gemini keys rotate per user (env: GEMINI_API_KEY_1/2/3)
const geminiKey = await getApiKeyForUser(username, 'gemini', 1); // index: 1-3
// 1 Fal key (env: FAL_KEY)
const falKey = await getApiKeyForUser(username, 'fal');
```
Admin UI at `/admin` allows per-user key overrides with encryption.

## Critical Development Workflows

### Running & Building
```bash
npm run dev              # Turbopack dev server on port 9002
npm run build            # Next.js build + compile migration scripts (tsconfig.scripts.json)
npm start                # Production server (standalone mode)

# Docker (production deployment)
docker compose up --build  # Multi-stage build with node:24-alpine
# Uses PM2 via ecosystem.config.js → .next/standalone/server.js
# Volumes: ./uploads, ./user_data (MUST set PUID/PGID for permissions)
```

### Testing
```bash
npm test                # Jest with ts-jest + jsdom
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```
**Testing philosophy**: Test service logic, NOT server actions directly (see `src/lib/*.test.ts` for examples).

### Database Migrations
```bash
npm run migrate:json-to-sqlite        # Legacy JSON → SQLite
npm run migrate:granular-api-keys     # Add per-key user overrides
npm run migrate:add-image-model       # Add model choice column
```
Migrations in `dist/scripts/` (compiled from TypeScript). Schema version tracked via `PRAGMA user_version`.

### Custom ESLint Rule: Enforce Fetch Caching
**Every** `fetch()` MUST have explicit cache control (enforced by `eslint-local-rules.js`):
```typescript
// ❌ FAILS LINT
const res = await fetch('https://api.example.com/data');

// ✅ PASSES LINT
const res1 = await fetch(url, { cache: 'no-store' }); // Force fresh
const res2 = await fetch(url, { cache: 'force-cache' }); // Cache indefinitely  
const res3 = await fetch(url, { next: { revalidate: 3600 } }); // Revalidate every hour
```
Rule: `enforce-fetch-caching` in `.eslintrc.json` → `eslint-plugin-local-rules`

## AI Integration Patterns

### Image Generation Flow
`src/ai/flows/generate-image-edit.ts` orchestrates multi-key generation:
1. Constructs prompt via `buildAIPrompt()` from `prompt-builder.ts`
2. Converts image to base64 data URI (or accepts HTTPS URL)
3. Calls Gemini 2.0 Flash API directly (NO SDK—uses axios + HttpsProxyAgent for proxy support)
4. **Parallel generation**: 3 variations using different API keys
5. Retry logic via `withGeminiRetry()`: exponential backoff for 429/500-503 errors (max 3 retries, 2s base delay)
6. Downloads results → saves locally → returns file paths

### Video Generation (Webhook-Based)
Fal.ai video generation is **async** with webhook completion:
```typescript
// 1. Start generation (returns immediately with task ID)
const taskId = await videoService.startVideoGenerationWithWebhook(input, webhookUrl, username);

// 2. Webhook receives completion (src/app/api/video/webhook/route.ts)
// - Verifies signature via verifyWebhookSignature()
// - Downloads video from Fal.ai URL
// - Saves locally via saveFileFromUrl()
// - Updates history item status to 'completed'
```
History item `status` field: `'processing'` → `'completed'` | `'failed'`

### Prompt Building System
`src/lib/prompt-builder.ts` provides structured attribute system:
- Constants like `GENDER_OPTIONS`, `BACKGROUND_OPTIONS` with `{ value, displayLabel, promptSegment }` structure
- `buildAIPrompt({ type: 'image' | 'video', params })` constructs final prompts
- Random parameter generation with tiered probabilities (Background 100%, Ethnicity/Pose 50%, Hair 25%)

## Component & File Conventions

### File Organization Rules
- **Server Actions**: MUST start with `'use server'` directive (all files in `src/actions/`)
- **Client Components**: MUST start with `'use client'` if using hooks/state
- **Services**: Always suffix with `.service.ts` (all files in `src/services/`)
- **AI workflows**: `actions/` for callable functions, `flows/` for orchestration logic
- **Path aliases**: Use `@/` prefix (maps to `src/`)—configured in `tsconfig.json` and `jest.config.js`

### Image Processing Pipeline
Multi-step Sharp-based workflow in `ImagePreparationContext`:
```typescript
// 1. Upload & normalize
prepareInitialImage(file) → { auto-orient via EXIF, max 2048px, convert to PNG }

// 2. User crop
cropImage(crop) → applies PixelCrop with scaling calculations

// 3. Background removal (optional)
removeBackgroundAction() → Fal.ai RMBG-1.4 API

// 4. Upscaling (optional)  
upscaleImageAction() → Fal.ai clarity upscaler

// 5. Face detailing (optional)
faceDetailerAction() → Fal.ai face enhancement
```
Each step creates new `ImageVersion` with hash—duplicate hashes skip reprocessing.

## Type System Essentials

### HistoryItem Structure
Core data model (see `src/lib/types.ts`):
```typescript
interface HistoryItem {
  id: string;
  timestamp: number;
  originalClothingUrl: string;        // Initial upload
  editedImageUrls: (string | null)[]; // Generated variations (3 per run)
  originalImageUrls?: (string | null)[]; // Pre-face-detail for comparison
  attributes: ModelAttributes;        // All generation parameters
  constructedPrompt: string;          // Final prompt sent to AI
  status?: 'processing' | 'completed' | 'failed';
  generation_mode?: 'creative' | 'studio';
  imageGenerationModel?: 'google_gemini_2_0' | 'fal_gemini_2_5';
  videoGenerationParams?: {           // Video-specific fields
    modelMovement, fabricMotion, cameraAction, aestheticVibe,
    cameraFixed, resolution, videoModel, duration, seed,
    sourceImageUrl, localVideoUrl
  };
  generatedVideoUrls?: (string | null)[];
  webhookUrl?: string;
}
```

### ModelAttributes
Image generation parameters (17 fields):
`gender`, `bodyShapeAndSize`, `ageRange`, `ethnicity`, `poseStyle`, `background`, `fashionStyle`, `hairStyle`, `modelExpression`, `lightingType`, `lightQuality`, `modelAngle`, `lensEffect`, `depthOfField`, `timeOfDay`, `overallMood`

## Deployment & Environment

### Critical Environment Variables
```bash
SESSION_SECRET="min-32-chars-strong-password"  # iron-session encryption
GEMINI_API_KEY_1/2/3="gkey_..."               # Google AI keys (3 for rotation)
FAL_KEY="fal-api-key"                         # Fal.ai API key
NEXT_PUBLIC_APP_URL="https://domain.com"      # CORS/webhooks/public URLs
FORCE_HTTPS="true"                            # Secure cookies (if behind proxy)
```

### Docker Production Setup
- Multi-stage build: `deps` → `prod-deps` → `builder` → `runner`
- Alpine base with vips-dev (Sharp), MEGAcmd (backups)
- **User permissions critical**: `PUID`/`PGID` args MUST match host for volume writes
- Standalone output mode reduces image size (~300MB vs ~1.2GB)
- PM2 process manager with fork mode (not cluster—Next.js handles concurrency)

### Performance Optimizations
- Turbopack in dev mode (40-70% faster HMR)
- Server actions: 50MB body size limit for image uploads
- Package import optimization for Radix UI/Lucide (see `next.config.ts`)
- Next.js Image Optimizer: Remote patterns for Fal.ai + local proxy

## Common Pitfalls

1. **Missing `'use server'` directive**: Server actions silently fail without it
2. **Direct file URLs**: ALWAYS use `getDisplayableImageUrl()` for client-side rendering
3. **Cache invalidation**: Database writes don't auto-invalidate React `cache()`—may need manual `revalidatePath()`
4. **Fetch without cache option**: ESLint will error (custom rule)
5. **SVG imports**: Configured via `@svgr/webpack`—import as React components
6. **Docker volume permissions**: Container must run with host's PUID/PGID to write files
7. **Webhook verification**: `verifyWebhookSignature()` is CRITICAL—never skip for Fal.ai webhooks

## Theme System
Dark mode default with zero-flicker initialization:
- Init script in `layout.tsx` runs **before hydration** (sets `data-theme` attribute)
- Cookie sync: `ThemeContext` writes to cookie via server action
- CSS variables: `hsl(var(--primary))` pattern in `globals.css`
- System preference detection only on first visit
