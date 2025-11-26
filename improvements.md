Here is a comprehensive technical overview of the Refashion AI codebase.

## Executive Summary

**Refashion AI** is a self-hostable, full-stack web application designed for AI-driven fashion image editing and video generation. It leverages a hybrid AI approach, utilizing **Google Gemini 2.0** for prompt engineering and image generation, and **Fal.ai** for specialized image processing (background removal, upscaling, face detailing) and video generation.

The architecture is built on **Next.js 15 (App Router)**, prioritizing React Server Components (RSC), Server Actions, and a robust Service-Repository pattern for backend logic. It features a local-first data strategy using SQLite and the local filesystem, making it ideal for privacy-conscious deployment via Docker.

---

## 1. Technology Stack

### Core Application
*   **Framework:** Next.js 15.5 (App Router, TurboPack)
*   **Language:** TypeScript 5.9
*   **Runtime:** Node.js 24 (Alpine-based Docker image)

### Frontend & UI
*   **Styling:** Tailwind CSS 3.4 with CSS Variables
*   **Components:** Shadcn/UI (Radix Primitives) + Lucide Icons
*   **State Management:**
    *   **Zustand:** Global settings (generation modes, parameter stores).
    *   **React Context:** Complex workflow state (Image Preparation pipeline).
    *   **React Server Actions:** Data mutations and form handling.
*   **Animation:** `motion/react` (Framer Motion) for micro-interactions and layout transitions.

### Backend & Data
*   **Database:** SQLite (`better-sqlite3`) with WAL mode for concurrency.
*   **ORM/Querying:** Raw SQL with a custom Service abstraction layer.
*   **Storage:** Local filesystem (`/uploads`) with secure path traversal protection.
*   **Caching:** Next.js `unstable_cache` (via `cache()` wrapper) and filesystem-based caching for AI assets.

### AI & Processing
*   **Image Generation:** Google Gemini 2.0 Flash / Pro, Fal.ai (Gemini 2.5).
*   **Video Generation:** Fal.ai (Seedance/Minimax/Kling models via proxy).
*   **Image Manipulation:** `jimp` & `sharp` (via `vips-dev`) for cropping/resizing; Fal.ai for heavy lifting (Upscaling, RMBG).

---

## 2. System Architecture

The application follows a strictly layered architecture to separate concerns and ensure security.

### A. Data Flow Pattern
1.  **Client Component:** Triggers a user event (e.g., "Generate Image").
2.  **Server Action (`src/actions`):** Authenticates the session, validates input via Zod, and calls the Service Layer.
3.  **Service Layer (`src/services`):** Contains business logic (Database operations, Encryption, API Key management).
4.  **AI Flow (`src/ai/flows`):** Orchestrates the multi-step generation pipeline (Prompting -> Generation -> Post-processing).
5.  **Database/Storage:** Persists the result to SQLite and the local filesystem.
6.  **Client Update:** The Server Action returns the result (or optimistic UI updates via `useOptimistic`).

### B. Security Boundaries
The codebase rigorously enforces boundaries between client and server code:
*   **`server-only` package:** Imported in all Service and Action files to prevent secrets (API keys, DB logic) from leaking into client bundles at build time.
*   **Encryption:** API keys stored in the database are encrypted using `aes-256-gcm` (`encryption.service.ts`).
*   **API Proxy:** Fal.ai client requests are proxied through a Next.js Route Handler to keep the `FAL_KEY` hidden from the browser.

---

## 3. Key Subsystems

### 1. Image Generation Pipeline
Located in `src/ai/flows/generate-image-edit.ts`, this is the core "God Function" of the app (though refactoring is planned).
*   **Modes:**
    *   **Creative Mode:** Uses a sophisticated `prompt-builder.ts` to construct prompts based on ~15 parameters (lighting, lens, pose, etc.). Can optionally use LLM (Gemini) to "imagine" a prompt.
    *   **Studio Mode:** Uses a strict template for consistent product photography, ensuring the clothing item remains the focus.
*   **Parallel Execution:** Generates 3 image variations in parallel to maximize throughput.
*   **Post-Processing:** Supports non-destructive optional steps like Background Removal, Face Detailing, and Upscaling (via `src/services/fal-api`).

### 2. Video Generation (Async Webhook Pattern)
Unlike image generation which is awaited, video generation is asynchronous:
1.  **Submission:** `generateVideoAction` submits a job to Fal.ai via `video.service.ts`.
2.  **Persistence:** A placeholder History Item is created with `status: 'processing'`.
3.  **Callback:** Fal.ai hits the `/api/video/webhook` route upon completion.
4.  **Verification:** The webhook verifies the signature (`libsodium`) to ensure authenticity.
5.  **Completion:** The webhook downloads the video, saves it locally, and updates the database.

### 3. Image Preparation Context
A complex client-side state machine (`ImagePreparationContext.tsx`) manages the "pre-generation" workflow:
*   Handles Upload -> Crop -> Rotate -> Flip.
*   Maintains an Undo/Redo stack for edits.
*   Uses **Optimistic UI** to show processing states immediately while server actions run in the background.

### 4. Database & Migrations
*   **Schema:** Managed in `database.service.ts`. Tables include `users`, `history`, `history_images`, and `settings`.
*   **Migrations:** A custom migration runner checks `PRAGMA user_version` on startup and applies schema changes transactionally.
*   **Performance:** Uses Prepared Statements for all queries to prevent SQL injection and improve speed.

---

## 4. Infrastructure & Deployment

### Docker Strategy
The project is fully containerized for production:
*   **Multi-stage Build:** Reduces image size by separating build dependencies (`vips-dev`, `python3`) from the runtime.
*   **Standalone Mode:** Uses Next.js `output: 'standalone'` to copy only necessary files.
*   **Permissions:** Accepts `PUID` and `PGID` build args to ensure the container can write to host volumes (critical for unraid/NAS setups).
*   **Backups:** Includes `megacmd` in the container for optional offsite backups to MEGA.

### Configuration
*   **Admin Panel:** A dedicated `/admin` route allows configuration of Global API keys, System Prompts, and Feature Flags without restarting the container.
*   **Environment Variables:** Critical secrets (`SESSION_SECRET`, `ENCRYPTION_SECRET`) are strictly env-based.

---

## 5. Code Quality & Modernization

The codebase exhibits very modern Next.js 15 practices:
*   **Fetch Caching:** Custom ESLint rule (`eslint-local-rules.js`) enforces explicit cache policies on all `fetch` calls.
*   **Turbopack:** Configured for rapid development.
*   **React 19:** Utilizes `useActionState` (formerly `useFormState`), `useOptimistic`, and `useTransition` for responsive forms.
*   **Type Safety:** Comprehensive TypeScript definitions (`types.ts`) shared across frontend and backend.

## 6. Areas of Note / Complexity

*   **Prompt Builder:** `src/lib/prompt-builder.ts` is a massive logic file that maps UI selections (e.g., "Cinematic Lighting") into specific prompt tokens.
*   **API Key Rotation:** The `apiKey.service.ts` implements logic to rotate between multiple Google Gemini API keys to handle rate limits.
*   **Local File Proxying:** Images are not served via `public/`. They are served via `/api/images/[...filePath]` which reads from the protected `uploads/` directory, checking permissions before streaming the file buffer.

This codebase represents a mature, production-ready "AI Wrapper" application that balances the ease of managed AI services (Fal.ai) with the privacy and control of self-hosting.


Based on a comprehensive review of the codebase (`refashion-vps.xml`) against the Next.js 15 and React 19 documentation (`next.js-v15.5.6-docs_relevant.xml`), here is a methodical analysis of improvement potentials.

The analysis focuses on **architecture, performance optimization, and leveraging modern Next.js 15 primitives** for a personal-use application.

---

### 1. Server-Side Task Management & `after()`

**Location:** `src/ai/flows/generate-image-edit.ts`

**Current Architecture:**
The function `generateImageEdit` uses a "Fire and Forget" pattern using a self-executing async function `(async () => { ... })()` to trigger image generation without blocking the UI response.

```typescript
// src/ai/flows/generate-image-edit.ts
(async () => {
    try {
      // ... expensive generation logic ...
    } catch (err) { ... }
})();
```

**Problem:**
While this works in Node.js, it is unmanaged. If the runtime environment (e.g., a container update or server restart) kills the process, this background task terminates immediately. It also breaks the request context association.

**Improvement (Next.js 15):**
Utilize the **`after()`** function (stable in v15.1+). This API allows you to schedule work to run *after* a response has been streamed to the client, ensuring the server keeps the process alive until the task completes.

**Implementation:**
```typescript
import { after } from 'next/server';

// Inside generateImageEdit
after(async () => {
    try {
        // Run pipeline logic here
        const results = await Promise.all(promises);
        // Update DB
    } catch (error) {
        // Log error
    }
});
```

---

### 2. Video & Large File Serving Performance

**Location:** `src/app/api/images/[...filePath]/route.ts` and `src/app/api/admin/download-export/route.ts`

**Current Architecture:**
The API routes load the entire file into memory before serving it.
```typescript
// src/app/api/images/[...filePath]/route.ts
const fileBuffer = await getBufferFromLocalPath(uploadsPath); // Reads full file into RAM
const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
return new NextResponse(blob, ...);
```

**Problem:**
For generated videos (which can be large), this causes memory spikes and potential Out-Of-Memory (OOM) crashes on a VPS. `fs.readFile` reads the entire content into the Node.js heap.

**Improvement:**
Use **Streams** to pipe data directly from the filesystem to the response without loading it all into RAM. Next.js `NextResponse` supports standard Web Streams.

**Implementation:**
```typescript
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

// Inside GET
const stats = await stat(absolutePath);
const stream = createReadStream(absolutePath);
// Convert node stream to web stream
const readable = new ReadableStream({
  start(controller) {
    stream.on('data', chunk => controller.enqueue(chunk));
    stream.on('end', () => controller.close());
    stream.on('error', err => controller.error(err));
  }
});

return new NextResponse(readable, {
    headers: {
        'Content-Length': stats.size.toString(),
        'Content-Type': mimeType,
    }
});
```

---

### 3. Optimizing Route Cache & Dynamic Rendering

**Location:** `src/app/layout.tsx`, `src/app/history/page.tsx`, `src/app/page.tsx`

**Current Architecture:**
The app relies heavily on `export const dynamic = 'force-dynamic'` and `await cookies()` to opt out of static rendering.
```typescript
// src/app/history/page.tsx
export const dynamic = 'force-dynamic';
```

**Problem:**
`force-dynamic` is a "sledgehammer" approach that disables all caching optimizations for the route.

**Improvement:**
Next.js 15 introduces the **`connection()`** function. It explicitly indicates that a component expects to rely on request-time information (headers/cookies) without needing to export config constants.

Furthermore, for the `CreationHub` (the main page), significant parts of the UI are static (the layout, the tabs). You should move the data fetching (`getHistoryPaginated`) into a specific [Suspense](https://react.dev/reference/react/Suspense) boundary rather than making the whole page dynamic.

**Implementation:**
1. Remove `export const dynamic = 'force-dynamic'`.
2. Wrap the history gallery component in `<Suspense fallback={<Skeleton />}>`.
3. Let Next.js statically render the shell of the page and stream in the dynamic history data.

---

### 4. Data Mutation & Form State Modernization

**Location:** `src/components/ImageGenerationWorkspace.tsx` & `src/actions/imageActions.ts`

**Current Architecture:**
The app uses `useActionState` (React 19), which is correct. However, the error handling in `imageActions.ts` returns a generic array of strings `[errorMessage, errorMessage, errorMessage]` mapped to the 3 image slots.

**Problem:**
The validation logic inside `generateImageAction` is manual and imperative (`formData.get(...)`).

**Improvement:**
1.  **Zod for FormData:** Use `zod-form-data` to parse and validate the `formData` object automatically in the Server Action. This removes the manual type casting and validation checks.
2.  **Structured Return Types:** Instead of returning a flat error message, return a structured state object that aligns with the form fields (e.g., `errors: { prompt: "Required", image: "Invalid type" }`).

---

### 5. Image Processing Pipeline Architecture

**Location:** `src/services/generation/pipeline.service.ts`

**Current Architecture:**
The pipeline performs sequential operations or simple `Promise.all` calls.
```typescript
// src/ai/flows/generate-image-edit.ts
const promises = [1, 2, 3].map(...)
const results = await Promise.all(promises);
```

**Problem:**
If the user requests 3 variations, the UI waits for the *slowest* generation to finish before showing *any* result because the Server Action waits for `Promise.all`.

**Improvement:**
**Stream partial results.** Since Server Actions can't easily stream partial JSON updates (unlike `GET` requests), you should adopt a **polling pattern with granular status**:

1.  `generateImageEdit` creates 3 DB rows immediately (status: `pending`).
2.  It kicks off 3 independent `after()` tasks.
3.  The Client Component (`ImageResultsDisplay`) receives the 3 IDs immediately.
4.  The Client Component polls `/api/history/[id]/status` for *each* image independently.
5.  **Result:** Image 1 appears as soon as it's done, even if Image 3 is still processing.

---

### 6. Database Connection Management

**Location:** `src/services/database.service.ts`

**Current Architecture:**
Migrations run on every application startup inside `getDb()`.
```typescript
// src/services/database.service.ts
function initSchema(db: Database.Database) { ... }
// Called every time getDb() is invoked if db instance is null
```

**Problem:**
In a development environment with Fast Refresh or HMR, or in production if the container restarts frequently, this adds unnecessary overhead and risk of race conditions on the SQLite file `history.db`.

**Improvement:**
Decouple migrations from the runtime application.
1.  Create a separate script `scripts/migrate.ts`.
2.  Run this script only during the `npm run build` phase or via an explicit `npm run migrate` command in the `Dockerfile` entrypoint.
3.  Remove `initSchema` and `runMigrations` from the runtime `getDb()` call.

---

### 7. Client-Side State Management (Zustand vs. Context)

**Location:** `src/contexts/ImagePreparationContext.tsx` vs `src/stores/generationSettingsStore.ts`

**Analysis:**
The app splits state between React Context (for image blobs/versions) and Zustand (for settings).
*   **Context:** Used for `versions`, `original`, `crop`. This causes re-renders of the entire `ImagePreparationContainer` whenever a crop changes (high frequency).
*   **Zustand:** Used for `generationSettings`.

**Improvement:**
Move the Image Preparation state to **Zustand**.
*   Zustand allows for transient updates (like dragging a crop handle) without triggering React commit phases for the whole tree.
*   It eliminates the need for the complex `useReducer` + `useOptimistic` boilerplate currently found in `ImagePreparationContext`.
*   You can keep `File` objects in Zustand stores (unlike Redux).

---


### 8. React Compiler Optimization

**Observation:**
The project uses Next.js 15.5.6. React 19 introduces the **React Compiler** (experimental in Next.js 15).

**Improvement:**
Enable the React Compiler to reduce manual memoization (`useMemo`, `useCallback`, `React.memo`).
1.  Install `babel-plugin-react-compiler`.
2.  Update `next.config.ts`:
    ```typescript
    const nextConfig = {
      experimental: {
        reactCompiler: true,
      },
    };
    ```
3.  This will automatically optimize the heavy UI components like `ImageParameters.tsx` and `HistoryGallery.tsx` which currently have many props and re-renders.

### 9. Font Optimization

**Location:** `src/app/layout.tsx`

**Current Architecture:**
Loads a font via CDN link:
```tsx
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap" rel="stylesheet" />
```

**Improvement:**
Use **`next/font`** (specifically `next/font/local` if you have the files, or `next/font/google` if available). If sticking with Fontshare, download the WOFF2 files and use `next/font/local`.
*   **Why:** This eliminates the external network request to Fontshare, improves privacy (local hosting), and allows Next.js to optimize font loading (zero layout shift).


This implementation plan is structured into **four distinct phases**, ordered by dependency and impact. We start with foundational stability (Database/Fonts), move to Next.js 15 specific modernizations (`after`, `connection`), tackle the major architectural refactor (Streaming/Polling), and finish with optimization and cleanup.

### Phase 1: Foundations & Stability
**Goal:** Decouple runtime logic from infrastructure and fix asset loading.

#### 1.1. Decouple Database Migrations
**Objective:** Stop running migrations on every server request/startup to prevent race conditions in production containers.
*   **Files:** `src/services/database.service.ts`, `package.json`, new file `scripts/migrate.ts`
*   **Implementation:**
    1.  Create `scripts/migrate.ts`: Copy the `runMigrations` logic from `database.service.ts` into this standalone script.
    2.  **Modify `database.service.ts`:** Remove the call to `runMigrations()` inside the `getDb()` singleton pattern.
    3.  **Update `package.json`:** Add `"migrate": "tsx scripts/migrate.ts"`.
    4.  **Update `Dockerfile`:** Add `RUN npm run migrate` (or `npm run script scripts/migrate.ts`) *before* the start command, or add it to `entrypoint.sh` to run before the app starts.

#### 1.2. Local Font Optimization
**Objective:** Remove external CDN dependency (privacy/performance) and use Next.js font optimization.
*   **Files:** `src/app/layout.tsx`, `src/lib/fonts.ts` (new)
*   **Implementation:**
    1.  Download the **Satoshi** font files (WOFF2) and place them in `src/app/fonts/`.
    2.  Create `src/lib/fonts.ts`:
        ```typescript
        import localFont from 'next/font/local';
        export const satoshi = localFont({
          src: [
            { path: '../app/fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
            { path: '../app/fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
          ],
          variable: '--font-satoshi',
        });
        ```
    3.  **Update `src/app/layout.tsx`:** Remove the `<link>` tag. Import `satoshi` and add `satoshi.variable` to the `<body>` class list. Update `tailwind.config.ts` to use `var(--font-satoshi)`.

---

### Phase 2: Next.js 15 Modernization
**Objective:** Leverage new primitives for reliability and memory efficiency.

#### 2.1. Implement `after()` for Background Tasks
**Objective:** Ensure image generation continues even if the HTTP response closes early.
*   **Files:** `src/ai/flows/generate-image-edit.ts`
*   **Implementation:**
    1.  Import `import { after } from 'next/server';`.
    2.  Refactor `generateImageEdit`. Instead of the IIFE `(async () => { ... })()`, wrap the logic:
        ```typescript
        export async function generateImageEdit(...) {
           // 1. Create initial DB rows (processing state)
           // ...
           // 2. Schedule background work
           after(async () => {
              // Perform expensive AI API calls
              // Update DB with results
           });
           // 3. Return history ID immediately
        }
        ```

#### 2.2. Efficient File Streaming
**Objective:** Prevent OOM errors when serving large generated videos.
*   **Files:** `src/app/api/images/[...filePath]/route.ts`
*   **Implementation:**
    1.  Replace `fs.readFile` (which buffers to RAM) with `fs.createReadStream`.
    2.  Use `WebStreams` compliant response:
        ```typescript
        import { createReadStream } from 'fs';
        import { stat } from 'fs/promises';
        // ... inside GET ...
        const stats = await stat(absolutePath);
        const nodeStream = createReadStream(absolutePath);
        const stream = new ReadableStream({
            start(controller) {
                nodeStream.on('data', chunk => controller.enqueue(chunk));
                nodeStream.on('end', () => controller.close());
                nodeStream.on('error', err => controller.error(err));
            }
        });
        return new NextResponse(stream, {
            headers: { 'Content-Length': stats.size.toString(), 'Content-Type': mimeType }
        });
        ```

#### 2.3. Optimize Route Caching
**Objective:** Remove `force-dynamic` to allow static shell rendering.
*   **Files:** `src/app/layout.tsx`, `src/app/history/page.tsx`, `src/app/page.tsx`
*   **Implementation:**
    1.  Remove `export const dynamic = 'force-dynamic'`.
    2.  In `layout.tsx`, replace `await cookies()` with `import { connection } from 'next/server'; await connection();` to signal dynamic requirements explicitly without de-optimizing the whole tree.
    3.  Wrap the `HistoryGallery` component in `src/app/page.tsx` with `<Suspense fallback={<HistoryGallerySkeleton />}>`. This allows the "Creation Hub" UI to load instantly while history fetches.

---

### Phase 3: Architecture Overhaul (The "Editor" Feel)
**Objective:** Fix the "15-second spinner" UX and optimize heavy client state.

#### 3.1. Migrate State to Zustand
**Objective:** Fix performance issues in the Image Preparation context (preventing re-renders on crop drag).
*   **Files:** `src/stores/imageStore.ts` (new), `src/contexts/ImagePreparationContext.tsx` (delete)
*   **Implementation:**
    1.  Create `useImageStore` using Zustand.
    2.  Move `original`, `versions`, `crop`, `aspect` into the store.
    3.  Use `useShallow` in `ImageEditorCanvas` to only listen to `crop` changes, preventing the Sidebar from re-rendering when dragging handles.
    4.  Refactor components consuming the Context to use the Store hooks.

#### 3.2. Implement Polling Architecture
**Objective:** Show images one-by-one as they finish, rather than waiting for the batch.
*   **Files:** `src/actions/imageActions.ts`, `src/components/ImageResultsDisplay.tsx`, `src/app/api/history/[itemId]/status/route.ts`
*   **Implementation:**
    1.  **Server Action:** Modify `generateImageAction`. It should no longer wait for generation. It returns `{ success: true, historyId: '...' }`.
    2.  **API Route:** Ensure `src/app/api/history/[itemId]/status/route.ts` returns the *array* of `editedImageUrls` even if incomplete (e.g., `[url, null, null]`).
    3.  **Client Component:**
        *   In `ImageResultsDisplay`, if `status === 'processing'`, set up a `setInterval` (e.g., 2000ms).
        *   Fetch status endpoint.
        *   Update local state. If an image slot changes from `null` to `url`, render it immediately with an animation.
        *   Clear interval when status is `completed` or `failed`.

---

### Phase 4: Refinement & Code Quality
**Objective:** Type safety and cleaner logic.

#### 4.1. Enable React Compiler
**Objective:** Automatic memoization.
*   **Files:** `package.json`, `next.config.ts`
*   **Implementation:**
    1.  `npm install babel-plugin-react-compiler`.
    2.  Update `next.config.ts`:
        ```typescript
        experimental: { reactCompiler: true }
        ```
    3.  Remove `useMemo` and `useCallback` from `HistoryGallery.tsx` and `ImageParameters.tsx` (optional, but good for cleanup).

#### 4.2. Zod Validation for Actions
**Objective:** Remove manual `formData` parsing.
*   **Files:** `src/actions/imageActions.ts`
*   **Implementation:**
    1.  `npm install zod-form-data`.
    2.  Define schema:
        ```typescript
        const schema = zfd.formData({
            prompt: zfd.text(),
            gender: zfd.text(z.enum(['male', 'female'])),
            // ...
        });
        ```
    3.  In the action: `const { prompt, gender } = schema.parse(formData);`.


