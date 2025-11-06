# Refashion AI - Copilot Instructions

## Project Overview
Next.js 15 AI-powered fashion image/video generation platform using Google Gemini 2.0 for image editing and Fal.ai for video generation. Users upload clothing images, specify model attributes, and generate photorealistic fashion photography.

## Architecture Patterns

### State Management Philosophy
- **Context for workflows**: `ImagePreparationContext` manages the multi-step image preparation pipeline (upload → crop → background removal → upscale → face detail). All processing state and version history lives here.
- **Zustand for global state**: `useImageStore` (formerly more complex) now dramatically simplified - only for truly cross-component global functionality.
- **Server Actions for mutations**: ALL data mutations go through server actions in `src/actions/`. Client components call these directly (no API routes for internal operations).

### Data Flow Architecture
1. **Client → Server Actions**: React Server Actions (`'use server'`) in `src/actions/{imageActions,historyActions,authActions,apiActions,adminActions,themeActions}.ts`
2. **Server Actions → Services**: Actions call `src/services/{database,storage,apiKey,encryption,systemPrompt,webhook}.service.ts`
3. **AI Workflows**: `src/ai/flows/generate-image-edit.ts` orchestrates multi-key Gemini API calls with retry logic
4. **External API Routes**: `src/app/api/v1/` for programmatic access with API key authentication

### Database & Storage
- **SQLite with better-sqlite3**: Single `user_data/history/history.db` file for users, history, settings, API keys
- **React cache() for reads**: Database read operations use React's `cache()` for request-level memoization (see `database.service.ts` lines 383+)
- **File storage**: `uploads/` with subfolders: `user_uploaded_clothing/`, `generated_images/`, `generated_videos/`, `processed_images/`
- **Image serving**: Local images proxied through `/api/images/*` route (see `getDisplayableImageUrl()` in `utils.ts`)

### Authentication System
- **iron-session**: Encrypted session cookies with 7-day TTL
- **bcrypt**: Password hashing (migrated from env-based config)
- **Dual auth modes**: 
  - Web UI: Session-based via `src/lib/session.ts`
  - API v1: Bearer token via `src/lib/api-auth.ts` and `apiKey.service.ts`

## Critical Development Workflows

### Running the Application
```bash
npm run dev              # Development mode with Turbopack on port 9002
npm run build           # Production build (creates standalone output)
npm start               # Production server

# Docker deployment
docker compose up --build  # Uses Dockerfile with multi-stage build
# Production uses PM2 via ecosystem.config.js pointing to .next/standalone
```

### Testing
```bash
npm test                # Run Jest tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```
Test config: `jest.config.js` uses ts-jest with jsdom environment. Path alias `@/*` maps to `src/*`.

### Database Migrations
```bash
npm run migrate:json-to-sqlite        # History data migration
npm run migrate:users-to-sqlite       # User migration from env
npm run migrate:granular-api-keys     # API key schema update
npm run migrate:add-image-model       # Image model choice column
```
Migrations compile TypeScript in `scripts/` directory first via `tsconfig.scripts.json`.

### Code Quality
- **Custom ESLint rule**: `enforce-fetch-caching` in `eslint-local-rules.js` - EVERY fetch() must have explicit cache control (`{ cache: 'force-cache' | 'no-store' }` or `{ next: { revalidate: N } }`)
- **TypeScript strict mode**: Enabled in `tsconfig.json`
- **Path aliases**: Use `@/` prefix for imports (maps to `src/`)

## Project-Specific Conventions

### File Naming & Organization
- **Server Actions**: Must have `'use server'` at top of file
- **Client Components**: Must have `'use client'` if using hooks/state
- **Services**: Always suffixed with `.service.ts`
- **AI workflows**: Separated into `actions/` (callable) and `flows/` (orchestration)

### Image Processing Pipeline
All image operations use Sharp (auto-orient with EXIF, max 2048px dimension):
1. `prepareInitialImage()`: Upload → auto-orient → resize → PNG conversion
2. `cropImage()`: Apply user crop with scaling calculations
3. `removeBackgroundAction()`: Fal.ai RMBG API
4. `upscaleImageAction()`: Fal.ai clarity upscaler
5. `faceDetailerAction()`: Fal.ai face enhancement

Each step creates a new version in `ImagePreparationContext` with hash-based deduplication.

### Prompt Building System
`src/lib/prompt-builder.ts` provides:
- **Option constants**: `GENDER_OPTIONS`, `FASHION_STYLE_OPTIONS`, etc. with `{ value, displayLabel, promptSegment }` structure
- **buildAIPrompt()**: Constructs prompts for image/video generation based on selected attributes
- **Random parameter generation**: Tiered probability system (Background 100%, Ethnicity/Pose 50%, Hair 25%, Expression 15%)

### API Key Management
Multi-key rotation system in `apiKey.service.ts`:
- `getApiKeyForUser()`: Returns next key from 3 Gemini keys + 1 Fal key (encrypted in DB)
- Keys initialized from env vars (`GEMINI_API_KEY_{1,2,3}`, `FAL_KEY`) on first run
- Admin UI for key management at `/admin`

### Retry Logic
`src/lib/api-retry.ts` provides `withGeminiRetry()`:
- Exponential backoff for rate limits (429) and server errors (500-503)
- Max 3 retries with 2s base delay
- Used in all Gemini API calls

## Component Patterns

### Image Preparation Workflow
Central to the app - see `ImagePreparationContext`:
```typescript
// Access state and actions
const { versions, activeVersionId, setActiveVersion, applyCrop, removeBackground } = useImagePreparation();

// Get active image data
const activeImage = useActivePreparationImage(); // Custom hook for derived state
```

### History Items
`HistoryItem` type (see `src/lib/types.ts`) includes:
- `originalClothingUrl`: Initial upload
- `editedImageUrls`: Array of generated variations (3 per generation)
- `originalImageUrls`: Pre-face-detail versions for comparison
- `videoGenerationParams`: Structured video parameters
- `status`: 'processing' | 'completed' | 'failed'
- `imageGenerationModel`: 'google_gemini_2_0' | 'fal_gemini_2_5'

### Theme System
Dark mode by default with localStorage + server-side cookie sync:
- `ThemeContext` provides theme state
- Init script in `layout.tsx` prevents FOUC
- CSS variables in `globals.css` (HSL format via `hsl(var(--primary))`)

## External Integrations

### Google Gemini 2.0 Flash
- Direct API calls in `generate-image-edit.ts` (not SDK)
- Image input via base64 data URI
- Custom proxy support via `HttpsProxyAgent`
- Safety settings: Block only HIGH severity

### Fal.ai Services
- Background removal: `fal-api/image.service.ts`
- Upscaling/face detail: `src/ai/actions/upscale-image.action.ts`
- Video generation: `src/ai/actions/generate-video.action.ts`
- Webhook handling for async video completion

### MEGAcmd Backup
Optional backup service (`megaBackup.service.ts`) - triggered after file operations if configured.

## Deployment Considerations

### Docker Setup
- Multi-stage build with `node:24-alpine`
- vips-dev for Sharp image processing
- MEGAcmd for backups
- User/group ID args (`PUID`, `PGID`) for volume permissions
- Volume mounts: `./uploads`, `./user_data`
- `restart: unless-stopped` for persistence

### Environment Variables (Critical)
```bash
SESSION_SECRET="min-32-chars"           # Required for iron-session
GEMINI_API_KEY_1/2/3="gkey..."         # Google AI API keys (3 for rotation)
FAL_KEY="fal-key..."                   # Fal.ai API key
NEXT_PUBLIC_APP_URL="https://..."      # Used for CORS/webhooks
FORCE_HTTPS="true"                     # Enables secure cookies
```

### Performance Optimization
- Standalone output mode in `next.config.ts` for smaller Docker images
- Server actions with 50MB body limit for image uploads
- Turbopack in development (`--turbopack` flag)
- Next.js Image Optimizer configured for remote patterns (Fal.ai, local proxied images)

## Common Pitfalls

1. **Forgot `'use server'`**: Server actions won't work without directive
2. **Direct file access**: Always use `getDisplayableImageUrl()` for client-side image URLs
3. **Cache invalidation**: Database writes don't auto-invalidate React `cache()` - may need manual revalidation
4. **SVG imports**: Use `@svgr/webpack` for React components (configured in `next.config.ts`)
5. **Fetch caching**: ESLint will error if you forget explicit cache option
6. **File permissions**: Docker must run with correct PUID/PGID to write to volumes

## Testing Strategy
- Unit tests for utilities: `src/lib/*.test.ts`
- Mock external APIs in tests (see `server-fs.utils.test.ts`)
- Avoid testing server actions directly - test the underlying service logic instead
