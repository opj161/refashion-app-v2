# Refashion AI v2 — Comprehensive Refactoring Assessment

## Overview

This assessment covers the entire Refashion AI codebase after its upgrade to Next.js 16.1.6. The analysis examines every layer — server actions, services, AI integration, components, hooks, stores, contexts, configuration, and routing — against Next.js 16 best practices, React 19 patterns, and the project's own AGENTS.md conventions.

The codebase is **production-quality and well-architected overall** — security, API key management, type safety, and the service-repository pattern are strong. However, organic growth has created concentrated technical debt in a handful of files, inconsistent state management patterns, and missing UX infrastructure.

---

## Requirements

The assessment must identify and prioritize:
1. Architecture boundary violations (where code deviates from AGENTS.md)
2. Overgrown files ("god files") that impair maintainability
3. Missing Next.js 16 UX infrastructure (loading/error states)
4. State management inconsistencies (React Context vs Zustand, prop drilling vs store access)
5. Dead code and unused dependencies
6. Component complexity that makes changes risky
7. Performance anti-patterns

---

## Implementation Steps — Prioritized Refactoring Plan

### Phase 1: High-Impact, Low-Effort (Foundation)

#### 1.1 Add Route-Level `loading.tsx` and `error.tsx` Files

**Current:** No `loading.tsx` exists anywhere. Only error.tsx exists. Users see no feedback during navigation and uncaught errors show the generic Next.js error overlay.

**Why it matters:** Per [Next.js 16 docs](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming), `loading.tsx` creates instant loading states via `<Suspense>` boundaries automatically. `error.tsx` creates route-level error boundaries. Both are zero-config UX improvements.

**Action:**
- Create `src/app/loading.tsx` — skeleton for the main creation hub
- Create `src/app/error.tsx` — user-friendly error with retry button
- Create `src/app/history/loading.tsx` — skeleton for history gallery
- Create `src/app/history/error.tsx`
- Create `src/app/login/loading.tsx` — simple centered spinner
- Create `src/app/admin/loading.tsx` — dashboard skeleton

**Effort:** Low (6 small files) | **Impact:** High

---

#### 1.2 Add Zod Validation to Admin Mutators

**Current:** adminActions.ts — `createUser()`, `updateUserConfiguration()`, `deleteUser()`, and `updateSetting()` accept raw `FormData` without Zod schemas. Only manual `!username || !password` checks exist.

**Why it matters:** Every other server action in the codebase uses Zod validation. Admin actions handle the most sensitive operations (user creation, API key management, system settings) with the weakest validation.

**Action:**
- Add `createUserSchema`, `updateUserConfigSchema`, `deleteUserSchema`, `updateSettingSchema` Zod schemas
- Validate at the top of each action, return structured errors on failure
- Consistent with the `imageGenerationSchema` pattern in `imageActions.ts`

**Effort:** Low | **Impact:** High (security + consistency)

---

#### 1.3 Move Database Queries Out of Action Layer

**Current:** Database queries leak into the action layer in multiple places:

| File | Line(s) | Query |
|------|---------|-------|
| adminActions.ts | ~77 | `db.prepare('INSERT INTO users...')` |
| adminActions.ts | ~140-190 | Dynamic SQL `SET` clause construction |
| adminActions.ts | ~220 | `db.prepare('UPDATE settings...')` |
| historyActions.ts | ~202 | `db.prepare('DELETE FROM history...')` |

**Why it matters:** Violates the service-repository pattern stated in AGENTS.md: "Never write DB queries or business logic in components or Server Actions."

**Action:**
- Add `createUser()`, `updateUserConfig()`, `deleteUser()` to `database.service.ts`
- Add `deleteHistoryItem()`, `updateVideoHistoryItem()` to `database.service.ts`
- Actions should only call service methods

**Effort:** Medium | **Impact:** High (architecture integrity)

---

#### 1.4 Refactor `addHistoryItem` — 10 Positional Parameters

**Current:** historyActions.ts line ~69:
```typescript
export async function addHistoryItem(
  originalImageUrl, processedImageUrl, displayImageUrl,
  prompt, generatedImageUrls, modelAttributes,
  generationMode, originalImagePath, studioPrompt, imageModel
)
```

**Action:** Replace with an options object:
```typescript
export async function addHistoryItem(options: AddHistoryItemOptions)
```

**Effort:** Low | **Impact:** Medium (readability, fewer call-site bugs)

---

### Phase 2: High-Impact, Medium-Effort (Architecture)

#### 2.1 Split `adminActions.ts` (766 Lines)

**Current:** This single file handles user CRUD, API key management, settings, system prompts, data export, analytics, and studio prompt testing.

**Action:** Split into:
- `src/actions/adminUserActions.ts` — `createUser`, `deleteUser`, `updateUserConfiguration`, `getAllUsers`
- `src/actions/adminSettingsActions.ts` — `updateSetting`, `updateSystemPrompt`, `testStudioPrompt`
- `src/actions/adminAnalyticsActions.ts` — `getDashboardKpis`, `exportAllData`

**Effort:** Medium | **Impact:** High

---

#### 2.2 Split `database.service.ts` (589 Lines)

**Current:** Handles DB connection, history CRUD, user CRUD, pagination, and caching all in one file.

**Action:** Split into:
- `src/services/db/connection.ts` — singleton connection, pragma setup
- `src/services/db/history.repository.ts` — all history queries
- `src/services/db/user.repository.ts` — user queries, caching
- `src/services/db/index.ts` — re-export barrel

**Effort:** Medium | **Impact:** Medium (maintainability, testability)

---

#### 2.3 Split `generate-image-edit.ts` (562 Lines)

**Current:** The AI orchestration flow handles both Studio and Creative mode workflows, background removal pipeline, randomization, AI prompt enhancement, multi-image generation, and history management — all in one `after()` callback.

**Action:**
- Extract `executeStudioWorkflow()` and `executeCreativeWorkflow()` into separate functions
- Extract `generateRandomBasicParameters()` magic numbers into named constants
- Extract history-saving into a service method

**Effort:** Medium | **Impact:** High (readability, testability)

---

#### 2.4 Refactor `image-parameters.tsx` (500 Lines) — Biggest Component

**Current:** Mixes localStorage persistence, service availability checks, prompt management, parameter randomization, save/clear defaults, and deeply nested accordion UI. Has 5 `useEffect` hooks and direct `localStorage` access.

**Action:**
- Extract `useLocalStorageDefaults()` hook → or better, move to Zustand `persist` middleware on `generationSettingsStore`
- Extract `useServiceAvailability()` hook (also reused by `ImageProcessingTools.tsx`)
- Extract `ProcessingPipelineSection` sub-component
- Extract `ParameterAccordion` sub-component with grouped controls
- Main component becomes ~150 lines of composition

**Effort:** Medium-High | **Impact:** High

---

#### 2.5 Refactor `creation-hub.tsx` — 7 useEffect Hooks

**Current:** Manages URL↔store bidirectional sync with 7 `useEffect` hooks, initialization from query params, `React.cloneElement` with `as any` cast.

**Action:**
- Extract `useTabSync(searchParams, router)` hook for URL↔store sync
- Extract `useHistoryInitialization()` hook
- Replace `React.cloneElement` with a Zustand-based slot pattern or render prop
- Remove dead `handleFilterChange`

**Effort:** Medium | **Impact:** High

---

### Phase 3: Medium-Impact (Consistency & DX)

#### 3.1 Resolve Store-vs-Props Inconsistency

**Current:** Multiple components receive data as props that they could read directly from Zustand stores:
- ImageVersionStack.tsx — receives `versions` and `activeVersionId` as props but imports `useImageStore`
- ImageEditorCanvas.tsx — receives `image` as prop, reads `scale` from store
- EditingHubSidebar.tsx — passes through 9 props, several redundant since children already access the store

**Action:** Choose one pattern per component:
- Store-driven (preferred for shared state): children read from store directly, no prop drilling
- Prop-driven (for reusable/generic components): fully controlled, no store imports

**Effort:** Low | **Impact:** Medium

---

#### 3.2 Migrate AuthContext to Zustand Store

**Current:** AuthContext.tsx uses `createContext`/`useState` for auth state. AGENTS.md says "Zustand over React Context for complex mutable state."

**What's fragile:** The `useEffect` that syncs `initialUser` does `JSON.stringify(user) !== JSON.stringify(initialUser)` on every render.

**Action:**
- Create `src/stores/authStore.ts` with `create<AuthState>()` — `user`, `setUser`, `clearUser`
- Initialize from server props in `AppBody`
- Replace `useAuth()` hook callers with `useAuthStore()`

**Effort:** Medium | **Impact:** Medium (consistency, perf)

---

#### 3.3 Extract `useServiceAvailability` Shared Hook

**Current:** Both image-parameters.tsx and ImageProcessingTools.tsx independently check service availability (background removal, upscale, face retouch) with nearly identical async effect patterns.

**Action:** Create `src/hooks/useServiceAvailability.ts` returning `{ bgRemovalAvailable, upscaleAvailable, faceRetouchAvailable }`.

**Effort:** Low | **Impact:** Medium (DRY)

---

#### 3.4 Clean Up `ImageViewerModal.tsx` — 11-Prop API

**Current:** Receives 11 props including interleaved handlers and state flags:
```typescript
onUpscale?, isUpscaling?, onRemoveBackground?, isRemovingBackground?,
onFaceDetailRetouch?, isFaceRetouching?, onSendToVideo?, ...
```

**Action:**
- Group action props: `actions: { upscale, removeBackground, faceRetouch, sendToVideo }`
- Group state props: `processingState: { isUpscaling, isRemovingBg, isFaceRetouching }`
- Consider a Zustand "viewer" slice for modal state

**Effort:** Low-Medium | **Impact:** Medium (API clarity)

---

#### 3.5 Add Zustand Persistence to `generationSettingsStore`

**Current:** User generation preferences (mode, model, prompt style, etc.) are lost on page refresh. Some preferences are manually saved to `localStorage` inside `image-parameters.tsx`.

**Action:** Add Zustand `persist` middleware to `generationSettingsStore` with `partialize` to persist only user-controlled settings (not transient state like `isGenerating`).

**Effort:** Low | **Impact:** Medium (UX)

---

### Phase 4: Low-Impact Cleanup

#### 4.1 Extract Prompt Options Constants

**Current:** prompt-builder.ts (651 lines) contains both option constant arrays AND prompt building logic.

**Action:** Move all option arrays (`GENDER_OPTIONS`, `AGE_RANGE_OPTIONS`, etc.) to `src/lib/prompt-options.ts`.

**Effort:** Low | **Impact:** Low-Medium

---

#### 4.2 Type `ModelAttributes` Fields as Unions

**Current:** types.ts uses `string` for every `ModelAttributes` field.

**Action:** Change to discriminated union types: `gender: 'female' | 'male' | 'non_binary'`, etc. Derive from the option constant arrays.

**Effort:** Low | **Impact:** Low-Medium (compile-time safety)

---

#### 4.3 Dead Code Removal

| Item | Location |
|------|----------|
| `SplashScreen.tsx` — unused component | SplashScreen.tsx |
| `fal-client.ts` — all calls now use per-user `createFalClient()` | fal-client.ts |
| `handleFilterChange` — dead function | history-gallery.tsx |
| `session.ts` — redundant re-export of `session-config.ts` | session.ts |
| `FAL_KEY` module-level check — obsolete since per-user keys | generate-video.action.ts |
| `formState`/`isPending` props — unused deprecated props | ImageResultsDisplay.tsx |
| `MediaSlot`/`SidebarSlot` exports — never imported | UnifiedMediaModal.tsx |

**Effort:** Low | **Impact:** Low

---

#### 4.4 Miscellaneous Fixes

| Issue | Location | Fix |
|-------|----------|-----|
| `use-mobile.tsx` has `.tsx` extension but no JSX | use-mobile.tsx | Rename to `.ts` |
| Dev image patterns in production config | next.config.ts L105 | Gate `localhost`/`192.168.x` patterns behind `NODE_ENV` |
| `dangerouslyAllowSVG: true` — security surface | next.config.ts L110 | Document justification or restrict |
| `TOAST_REMOVE_DELAY = 1000000` — effectively infinite | use-toast.ts | Set to a reasonable auto-dismiss (e.g., 5000ms) |
| `@svgr/webpack` dual config for 2 SVGs | next.config.ts L10-45 | Consider inlining SVGs as React components |
| `storage.service.ts` chmod/chown duplication | storage.service.ts | Extract `writeFileWithPermissions()` helper |

---

## Testing

### For Phase 1 (Foundation)
- Verify `loading.tsx` files render skeletons during navigation (Playwright test)
- Verify `error.tsx` files catch and display errors (throw in a test page, verify boundary)
- Verify Zod schemas reject invalid admin input (unit tests)
- Verify DB queries moved to services still function correctly (existing test coverage)

### For Phase 2 (Architecture)
- Verify split admin actions still pass all existing tests
- Verify image generation flow works after `generate-image-edit.ts` refactoring (E2E test)
- Verify `image-parameters.tsx` refactoring preserves all user interactions (Playwright)
- Verify URL sync still works after `creation-hub.tsx` hook extraction

### For Phase 3 (Consistency)
- Verify store-driven components render correctly without previously-drilled props
- Verify auth state persists correctly after AuthContext → Zustand migration
- Verify settings persist across page refreshes after Zustand persist middleware

### For Phase 4 (Cleanup)
- Verify build succeeds after dead code removal
- Verify no runtime references to removed files
- Typecheck (`npx tsc --noEmit`) must pass after all changes

---

## Summary: Effort-Impact Matrix

```
                    LOW EFFORT          MEDIUM EFFORT        HIGH EFFORT
                ┌──────────────────┬──────────────────┬──────────────────┐
   HIGH IMPACT  │ 1.1 loading/error│ 2.1 Split admin  │                  │
                │ 1.2 Zod on admin │ 2.3 Split AI flow│                  │
                │ 1.4 Options obj  │ 2.5 creation-hub │                  │
                │                  │ 1.3 DB→services  │ 2.4 image-params │
                ├──────────────────┼──────────────────┼──────────────────┤
 MEDIUM IMPACT  │ 3.1 Store vs prop│ 3.2 Auth→Zustand │                  │
                │ 3.3 Shared hook  │ 2.2 Split DB svc │                  │
                │ 3.5 Persist store│ 3.4 Modal props  │                  │
                ├──────────────────┼──────────────────┼──────────────────┤
    LOW IMPACT  │ 4.1 Extract opts │                  │                  │
                │ 4.2 Union types  │                  │                  │
                │ 4.3 Dead code    │                  │                  │
                │ 4.4 Misc fixes   │                  │                  │
                └──────────────────┴──────────────────┴──────────────────┘
```

**Recommended execution order:** Start top-left (high impact, low effort), move right, then down. Phase 1 can be completed in a single session. Phase 2 items are the true debt-payoff investments. Phases 3-4 can be done incrementally alongside feature work.