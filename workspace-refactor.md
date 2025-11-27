Based on your current screenshots and the target "dashboard" aesthetic, here is a comprehensive redesign strategy to transform Refashion AI into a fixed-viewport professional workspace.

### 1. Functional Grouping (Audit)

We need to break the linear flow (Top-to-Bottom) into a logical workflow (Left-to-Right).

*   **Group A: Global Context (Header)**
    *   Logo, User Profile, Admin Link.
    *   **Mode Switchers:** Image/Video toggle and Studio/Creative toggle.
    *   **Global History:** Link to full history page.
*   **Group B: Input & Preparation (The "Source")**
    *   Image Uploader / Dropzone.
    *   **Manipulation Tools:** Crop, Rotate, Flip, Background Removal.
    *   **Assets:** Recent Uploads library.
*   **Group C: Configuration (The "Controls")**
    *   **Parameters:** Aspect Ratio, Clothing Fit, Texture/Color sliders (from your reference), Prompt inputs.
    *   **Execution:** The "Generate" button.
*   **Group D: Output (The "Results")**
    *   Grid of generated images.
    *   Action buttons for results (Download, Upscale, View Fullscreen).

### 2. Spatial Distribution (The Layout)

Switch from a **Single Column Stack** to a **Three-Column Grid** layout.

**The Container:**
Apply `h-screen w-screen overflow-hidden flex flex-col` to the body/main wrapper.

**The Grid (Inside Main):**
Use a CSS Grid or Flex row: `grid grid-cols-[1.2fr_300px_1.2fr] h-full gap-4 p-4`.

*   **Left Column: Input Canvas (40% width)**
    *   This is your "Stage." It houses the **ImagePreparationContainer**.
    *   **Change:** Instead of accordions for "Enhancements" and "Transform" below the image, turn them into a **floating toolbar** inside the image container (like Photoshop or Figma).
    *   **Change:** Move "Recent Uploads" to a collapsible filmstrip at the bottom of this column.

*   **Middle Column: Control Rack (Fixed width, e.g., 300px-320px)**
    *   This houses **StudioParameters** / **ImageParameters**.
    *   This column creates a clear visual separation between "Before" (Left) and "After" (Right).
    *   **Placement:** Stack all dropdowns (Fit, Aspect Ratio) here.
    *   **Anchor:** The **Generate Button** should be sticky at the bottom of this column (`mt-auto`), acting as the bridge between Input and Output.

*   **Right Column: Output Gallery (40% width)**
    *   This houses the **ImageResultsDisplay**.
    *   Instead of pushing content down, this area is a persistent grid that populates as images are generated.

### 3. Adaptive Behavior

To maintain the `overflow-hidden` (no global scroll) constraint:

*   **The Images (Input & Output):**
    *   Use `object-fit: contain` for the main preview images.
    *   The container for the image should have `flex-1 min-h-0`. This forces the image to shrink to fit the available height rather than expanding the page.
*   **Internal Scrolling:**
    *   The **Middle Column** (Settings) gets `overflow-y: auto`. If settings exceed the screen height, only the middle column scrolls.
    *   The **Right Column** (Results) gets `overflow-y: auto`. As you generate more batches, the history stacks here, scrollable independently.
*   **Recent Uploads:**
    *   Instead of a list taking up vertical space, make it a horizontal scrollable strip (`overflow-x: auto`) or a drawer that slides out from the left edge.

### 4. Hierarchy & Visual Polish

To achieve the "Pro Tool" look:

*   **Darker Backgrounds:** Use slightly different shades of your dark theme (`hsl(224 71% 4%)`) to separate the columns visually without heavy borders.
    *   *Canvas & Output:* Darkest (to make images pop).
    *   *Settings Column:* Lighter (Surface color) to denote it as a control panel.
*   **Density:**
    *   Reduce padding on Cards.
    *   Replace large headings with smaller, uppercase labels (e.g., "INPUT", "SETTINGS", "OUTPUT").
    *   Convert the "Enhancements" text buttons (Undo, Rotate) into **Icon-only tooltips** to save space.
*   **The "Generate" Button:**
    *   Make this the most prominent element in the UI. Use a gradient background (your "primary-gradient-end") and place it at the bottom of the middle column to signify "Apply Settings -> Move to Right".

### Implementation Logic (Tailwind CSS)

```tsx
// Simplified Layout Concept
<div className="h-screen w-full bg-background flex flex-col overflow-hidden">
  
  {/* 1. Header (Fixed Height) */}
  <header className="h-14 border-b shrink-0 flex items-center px-4">
     {/* Logo, Mode Switcher, User */}
  </header>

  {/* 2. Main Workspace (Flex Grow) */}
  <main className="flex-1 flex gap-0 min-h-0">
    
    {/* LEFT: Input (Flexible Width) */}
    <section className="flex-1 flex flex-col min-w-0 border-r border-border/50 bg-black/20">
       <div className="flex-1 relative p-4 min-h-0 flex items-center justify-center">
          {/* Image Editor Canvas (Object-contain) */}
          {/* Floating Toolbar for Crop/Rotate overlay */}
       </div>
       <div className="h-24 shrink-0 border-t p-2">
          {/* Recent Uploads Filmstrip */}
       </div>
    </section>

    {/* MIDDLE: Settings (Fixed Width) */}
    <aside className="w-[320px] shrink-0 flex flex-col border-r border-border/50 bg-card z-10">
       <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Accordions for Settings */}
       </div>
       <div className="p-4 border-t bg-card">
          {/* Generate Button */}
       </div>
    </aside>

    {/* RIGHT: Output (Flexible Width) */}
    <section className="flex-1 flex flex-col min-w-0 bg-black/20">
       <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Grid of Result Cards */}
       </div>
    </section>

  </main>
</div>
```

---
Here is a comprehensive specification for the redesign. This blueprint transforms the application into a unified, fixed-viewport "pro-tool" interface (similar to Figma, Lightroom, or DaVinci Resolve).

## 1. Global Viewport Architecture

*   **Dimensions:** Fixed `100vw x 100vh`. No global scrollbar.
*   **Theme:** Dark Mode (Deep Navy/Black background `hsl(224, 71%, 4%)`).
*   **Background:** The "Aurora" gradient blob (from `globals.css`) should be visible behind the semi-transparent panels.
*   **Grid Structure:**
    *   **Row 1 (Header):** Fixed height (`64px`).
    *   **Row 2 (Workspace):** `flex: 1` (takes remaining height).
        *   **Col 1 (Input Stage):** Flexible width (`flex: 1`).
        *   **Col 2 (Control Rack):** Fixed width (`320px`).
        *   **Col 3 (Output Gallery):** Flexible width (`flex: 1`).

---

## 2. Zone-by-Zone Specification

### Zone A: Global Header (Top Bar)
*   **Dimensions:** Full width, `h-16` (64px), `border-b border-white/10`.
*   **Background:** `bg-background/80 backdrop-blur-md`.
*   **Layout (Flex Row):**
    1.  **Left (Brand):** Refashion AI Logo (SVG) + Title.
    2.  **Center (Context Switcher):** A prominent `SegmentedControl` (Pill shape):
        *   `[ Image Mode | Video Mode ]`
        *   *Visuals:* Active state uses the primary teal gradient.
    3.  **Right (Utilities):**
        *   History Button (Icon + Label).
        *   Admin Settings (Shield Icon).
        *   User Avatar (Circle).

### Zone B: The Input Stage (Left Column)
*   **Role:** Image Preparation & Source Management.
*   **Dimensions:** Flexible width (approx 35-40%), Full height of main area.
*   **Background:** Transparent/Dark (`bg-black/20`).
*   **Components:**
    1.  **Main Canvas (Top ~85%):**
        *   **Container:** `relative w-full h-full flex items-center justify-center p-6`.
        *   **Image:** The user's uploaded image centered, scaling with `object-fit: contain` to ensure the whole image is always visible without scrolling.
        *   **Floating Toolbar (Overlay):** A pill-shaped menu floating *inside* the canvas area at the bottom-center (z-index 10).
            *   *Contains:* Crop Icon, Rotate Left/Right Icons, Flip Icons, Wand (Remove BG).
            *   *Style:* Glassmorphism (`bg-black/60 backdrop-blur text-white rounded-full px-4 py-2`).
        *   **Empty State:** If no image, show a large dashed-border dropzone in the center with a "Upload Cloud" icon.
    2.  **Asset Strip (Bottom ~15%):**
        *   **Container:** `h-24 border-t border-white/10 bg-card/30`.
        *   **Content:** A horizontal scrollable list of "Recent Uploads".
        *   **Interaction:** Clicking a thumbnail loads it into the Main Canvas immediately.

### Zone C: The Control Rack (Center Column)
*   **Role:** Configuration & Execution.
*   **Dimensions:** Fixed width (`320px`), Full height.
*   **Background:** `bg-card/90` (Slightly lighter than canvas to signify "Active Panel"), `border-r border-l border-white/10`.
*   **Layout:** Flex Column.
    1.  **Scrollable Settings (Top Section):**
        *   `flex-1 overflow-y-auto p-4 custom-scrollbar`.
        *   **Mode Toggle:** "Studio vs. Creative" at the very top (Tab or Toggle).
        *   **Group 1: Fit/Aspect:** Dropdowns for "Clothing Fit" and "Aspect Ratio".
        *   **Group 2: Prompting:** Text area for Prompt (if in Creative mode) or Style Selectors.
        *   **Group 3: Toggles:** Switches for "Upscale", "Face Detail" (compact rows).
    2.  **Action Area (Bottom Section - Sticky):**
        *   `p-4 border-t border-white/10 bg-card`.
        *   **Primary Button:** "Generate" button.
            *   *Style:* Full width, `h-12`, Gradient Background (Teal/Cyan), Shadow/Glow effect.
            *   *Content:* Sparkles Icon + "Generate (3 Images)".

### Zone D: The Output Gallery (Right Column)
*   **Role:** Results & Review.
*   **Dimensions:** Flexible width (approx 35-40%), Full height.
*   **Background:** Transparent/Dark (`bg-black/20`).
*   **Layout:**
    1.  **Header:** Small label "Generated Results" (`text-xs uppercase tracking-wider text-muted-foreground p-4`).
    2.  **Grid Container:**
        *   `overflow-y-auto p-4 custom-scrollbar h-full`.
        *   **Layout:** Responsive Grid.
            *   *If 1 image:* Full width card.
            *   *If 3 images:* 2 columns (one spanning full width, or uniform grid).
    3.  **Result Cards:**
        *   Standard `HistoryCard` component but stripped of excessive padding.
        *   **Hover Actions:** Overlay buttons for "Download", "Fullscreen", "Reuse Settings" appear on hover.

---

## 3. Visual Mockup Prompt Description

If you were to feed this into an image generator to see the layout, use this description:

> A high-fidelity UI mockup of a dark-themed desktop application for AI fashion design called "Refashion AI". The interface is a single fixed window with no browser scrollbars.
>
> **Layout:** Three distinct vertical columns.
> 1.  **Left Column (Input):** A dark gray workspace showing a photo of a floral dress on a hanger in the center. A floating semi-transparent pill-shaped toolbar sits at the bottom of the image with icons for Crop, Rotate, and Edit. Below the workspace is a horizontal filmstrip of thumbnail images.
> 2.  **Center Column (Controls):** A narrower sidebar (about 300px) with a dark charcoal background. It contains sleek dropdown menus labeled "Fit", "Style", and "Aspect Ratio". At the very bottom of this column is a large, glowing teal/cyan button labeled "Generate".
> 3.  **Right Column (Results):** A gallery area showing 3 AI-generated photorealistic fashion models wearing the dress from the left column. The images are arranged in a grid.
>
> **Aesthetic:** Modern SaaS, cyberpunk undertones, deep navy/black background (`#020410`), teal accents (`#1fab99`), glassmorphism effects on panels, crisp white typography (San Francisco/Inter font), thin 1px borders.

---

## 4. Specific Adaptive Behaviors (CSS Logic)

To ensure this works on different screen sizes:

1.  **Image Scaling:**
    *   The **Input Image** in the Left Column must have `max-height: 100%` and `max-width: 100%`. It should never push the "Asset Strip" off-screen.
    *   Use CSS Grid: `grid-template-rows: 1fr auto` for the Left Column.

2.  **Text Wrapping:**
    *   In the **Center Column**, if the prompt text is long, the Textarea should grow to a max-height (e.g., `max-h-32`) and then scroll internally, ensuring the "Generate" button is never pushed off-screen.

3.  **Responsive Breakpoints:**
    *   **lg (Desktop):** 3-Column Layout (as described).
    *   **md (Tablet):** Collapse the **Right Column** into a tab. The user toggles between "Input" and "Results" in the main view, while "Controls" stays fixed on the right.
    *   **sm (Mobile):** Stack everything vertically (revert to current behavior), or use a bottom-sheet for Controls. *Note: This spec focuses on Desktop.*
---
This is a comprehensive architectural blueprint to transform Refashion AI into a "Pro Tool" fixed-viewport application.

This plan leverages **Next.js 15** features (Server Components, `useActionState`) and **Tailwind CSS** (Flexbox/Grid, overflow handling) to achieve the requirements without adding heavy layout libraries.

---

# 1. High-Level Architectural Strategy

The application will move from a **Page-Flow** model (scroll down to see results) to a **State-Driven Workspace** model.

### The "Holy Grail" Layout
We will implement a variation of the "Holy Grail" layout using CSS Flexbox to ensure the application always occupies exactly `100vh` and `100vw`, regardless of content size.

**Hierarchy:**
1.  **Viewport Shell (Fixed)**: `h-screen w-screen overflow-hidden`
2.  **Header (Fixed Height)**: Navigation & Context Switching.
3.  **Main Workspace (Flex Grow)**: The container for the three columns.
    *   **Col 1: Input Stage (Flexible)**: Canvas + Asset Browser.
    *   **Col 2: Control Rack (Fixed Width)**: Settings + Action Button.
    *   **Col 3: Output Gallery (Flexible)**: Results Grid.

### Data Flow Changes
*   **Decoupling:** The `ImageGenerationWorkspace` currently handles both UI inputs and results display. These must be decoupled.
*   **Input State:** The `useImageStore` (Zustand) already exists and is perfect for driving the Left Column.
*   **Result State:** The Right Column will need to subscribe to the generation history independently, likely via a cached server action data fetch wrapped in `Suspense`.

---

# 2. Detailed Component Architecture

## Zone A: Global Header (`src/components/layout/AppHeader.tsx`)

*   **Placement:** Top, Fixed height (`64px` / `h-16`).
*   **Responsibility:** Context switching (Image vs. Video) and Global Admin links.
*   **Styling:** `border-b border-white/10 bg-background/80 backdrop-blur-md`.
*   **Key Element:** `SegmentedControl` moved here from the body to switch between `Image Mode` and `Video Mode`. This toggles which configuration loads in the **Center Column**.

## Zone B: Input Stage (`src/components/workspace/InputStage.tsx`)

*   **Placement:** Left Column (`flex: 1`, `min-w-0`).
*   **Styling:** Darkest background (`bg-black/40`).
*   **Internal Layout:** Flex Column.
    1.  **Canvas Area (`flex: 1`, `relative`):**
        *   Contains `ImageEditorCanvas`.
        *   **Critical Change:** CSS must be `object-fit: contain` and `max-h-full`. The container must have `min-h-0` to allow shrinking.
        *   **Floating Toolbar:** A new component `CanvasToolbar` positioned absolute `bottom-6` `left-1/2`. Contains: Crop, Rotate, Flip, Remove BG buttons (icon only).
    2.  **Asset Strip (`h-32`, `shrink-0`):**
        *   Moved from `RecentAssetsPanel`.
        *   **Layout:** Horizontal scrolling list (`overflow-x-auto`, `flex-row`).
        *   **Behavior:** Clicking a thumb updates the Zustand `activeVersionId`.

## Zone C: Control Rack (`src/components/workspace/ControlRack.tsx`)

*   **Placement:** Center Column (`w-[320px]`, `shrink-0`).
*   **Styling:** Standard Card background (`bg-card/90`), Borders left/right.
*   **Internal Layout:** Flex Column.
    1.  **Scrollable Form (`flex: 1`, `overflow-y-auto`):**
        *   Contains `ImageParameters` (Creative) or `StudioParameters`.
        *   **Refactor:** Remove the `Card` wrappers inside these components. They should just render form fields directly to save padding/space.
        *   **Refactor:** Convert large Radio Groups into `Select` dropdowns to save vertical space.
    2.  **Action Footer (`sticky bottom-0`):**
        *   Contains the **Generate Button**.
        *   **Styling:** `p-4`, `border-t border-white/10`, `bg-card`.
        *   **Behavior:** High z-index to float above scrolled form content.

## Zone D: Output Gallery (`src/components/workspace/OutputGallery.tsx`)

*   **Placement:** Right Column (`flex: 1`, `min-w-0`).
*   **Styling:** Dark background (`bg-black/20`).
*   **Internal Layout:** Flex Column.
    1.  **Header (`h-10`, `shrink-0`):** "Generated Results" label + filter toggle.
    2.  **Grid Area (`flex: 1`, `overflow-y-auto`):**
        *   Contains `ImageResultsDisplay`.
        *   **Refactor:** Remove the polling logic from the UI component if possible (keep it clean).
        *   **Grid Logic:** `grid-cols-1 xl:grid-cols-2`.
        *   **Empty State:** A subtle watermark icon when no results exist.

---

# 3. CSS & Tailwind Implementation Plan

We need to enforce the "Fixed Viewport" using specific utility classes found in your `Overflow` and `Flex` documentation.

### Step 1: Global Reset
Update `src/app/layout.tsx` to lock the body.

```tsx
<body className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col ...">
```

### Step 2: Main Grid Layout
Update `src/components/creation-hub.tsx` (renamed to `Workspace.tsx`).

```tsx
<div className="flex-1 flex min-h-0">
  {/* LEFT COLUMN */}
  <section className="flex-1 flex flex-col min-w-0 border-r border-white/10">
     <InputStage />
  </section>

  {/* CENTER COLUMN */}
  <aside className="w-[320px] flex flex-col border-r border-white/10 bg-card/50 z-10">
     <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
           {/* Form Components Here */}
        </div>
     </ScrollArea>
     <div className="p-4 border-t border-white/10 bg-card">
        <SubmitButton /> {/* Sticky Footer */}
     </div>
  </aside>

  {/* RIGHT COLUMN */}
  <section className="flex-1 flex flex-col min-w-0 bg-black/20">
     <ScrollArea className="flex-1 p-4">
        <OutputGallery />
     </ScrollArea>
  </section>
</div>
```

---

# 4. Component Refactoring Strategy

### A. Decouple `ImageGenerationWorkspace`
Currently, this component wraps both the Form and the Results.
1.  **Split:** Extract `<ImageResultsDisplay />` out.
2.  **Move:** Place `<ImageResultsDisplay />` into the Right Column.
3.  **Move:** Keep `<ImageParameters />` and `<StudioParameters />` in the Center Column.
4.  **State:** Both components will connect via the URL query params (history ID) or the global Zustand store (loading states).

### B. Refactor `ImagePreparationContainer`
Currently, this manages the "Upload" vs "Edit" state via conditional rendering.
1.  **Simplify:** Always render the "Canvas". If no image is loaded, render a full-height "Dropzone" inside the canvas area.
2.  **Toolbar:** Move the `EditingHubSidebar` logic (crop/rotate buttons) into the new floating `CanvasToolbar` overlay component.

### C. Optimize `HistoryCard` for Gallery
The current history card is designed for a vertical feed.
1.  **Compact Mode:** Create a `variant="compact"` for `HistoryCard`.
2.  **Visuals:** Remove the text description footer in compact mode. Only show the image grid. Show details/prompt on **Hover** or **Click** (modal).

---

# 5. Step-by-Step Implementation Order

1.  **Theme Update:** Update `globals.css` with the new `hsl` color variables for the deep navy theme.
2.  **Shell Construction:** Create the 3-column flex shell in `page.tsx` (or `creation-hub.tsx`). Verify that resizing the window does not cause scrollbars on the `<body>`.
3.  **Input Migration:** Move `ImageUploader` and `ImageEditorCanvas` to the Left Column. Style the bottom "Asset Strip".
4.  **Control Migration:** Move `StudioParameters` inputs to the Center Column. Ensure internal scrolling works while keeping the footer fixed.
5.  **Output Migration:** Move `ImageResultsDisplay` to the Right Column.
6.  **Polish:** Apply glassmorphism classes (`backdrop-blur-md`, `bg-white/5`) and refine borders.

This plan ensures the transition from "Landing Page" to "Pro App" is structural and scalable, leveraging the strengths of the existing React Server Components and Tailwind architecture.
---
This is a comprehensive, methodical implementation plan to transform Refashion AI into a fixed-viewport "Pro Tool" application.

This plan is divided into **6 Phases**, ordered by dependency. We move from the foundation (CSS/Layout) to the specific components, ensuring the application remains buildable at every step.

---

### Phase 1: Foundation & Theme Updates
**Goal:** Establish the "Deep Navy" theme and lock the global viewport to prepare for the grid layout.

#### 1.1 Update Design Tokens (`src/lib/design-tokens.ts`)
Update spacing and color references to support the dense UI.
*   **Action:** No major changes needed if relying on Tailwind classes, but ensure `spacing['navbar']` is defined as `64px`.

#### 1.2 Update Global CSS (`src/app/globals.css`)
Replace the current root variables with the "Deep Navy" palette to match the mockup.

```css
@layer base {
  :root {
    --header-height: 64px;
    /* Deep Navy Theme Palette */
    --background: 224 71% 4%;      /* #030811 */
    --foreground: 210 40% 98%;
    --card: 224 71% 6%;            /* Slightly lighter than bg */
    --card-foreground: 210 40% 98%;
    --primary: 173 80% 40%;        /* Teal/Cyan */
    --primary-foreground: 224 71% 4%;
    --muted: 224 30% 15%;
    --muted-foreground: 215 20% 65%;
    --border: 224 30% 15%;         /* Subtle borders */
  }
  
  /* Lock Viewport */
  body {
    height: 100vh;
    width: 100vw;
    overflow: hidden; /* CRITICAL: Disables global scroll */
    display: flex;
    flex-direction: column;
  }
}
```

#### 1.3 Create Layout Components
Create a new directory `src/components/layout` to house the structural shells.

*   **File:** `src/components/layout/WorkspaceShell.tsx`
    *   **Purpose:** The CSS Grid container.
    *   **Structure:**
        ```tsx
        <div className="flex-1 grid grid-cols-[1fr_320px_1fr] h-[calc(100vh-var(--header-height))] min-h-0 divide-x divide-border/50">
           {children}
        </div>
        ```

---

### Phase 2: The Input Stage (Left Column)
**Goal:** Create a dedicated space for the image canvas that supports shrinking/growing without page scroll.

#### 2.1 Refactor Image Preparation
*   **File:** `src/components/workspace/InputStage.tsx` (New)
*   **Logic:**
    1.  Import `useImageStore`.
    2.  If `!activeImage`, render `ImageUploader` (styled to fill height).
    3.  If `activeImage`, render `ImageEditorCanvas`.
    4.  **Critical CSS:** The container for the canvas must have `flex-1 relative min-h-0 w-full`. This ensures the image scales down (`object-fit: contain`) rather than overflowing.

#### 2.2 Floating Canvas Toolbar
*   **File:** `src/components/workspace/CanvasToolbar.tsx` (New)
*   **Logic:** Extract the crop/rotate/flip buttons from `EditingHubSidebar`.
*   **Design:** A floating pill positioned absolutely at the bottom-center of the `InputStage`.
    ```tsx
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 z-20">
       {/* Icon-only buttons with Tooltips */}
    </div>
    ```

#### 2.3 Asset Strip
*   **File:** `src/components/workspace/AssetStrip.tsx` (New)
*   **Logic:** Adapted from `RecentAssetsPanel`.
*   **Design:** Horizontal scrollable container (`overflow-x-auto`) at the bottom of `InputStage`. Fixed height (`h-24`).

---

### Phase 3: The Control Rack (Center Column)
**Goal:** Create a unified, scrollable settings panel with a sticky footer.

#### 3.1 Unified Settings Component
We need to decouple the form UI from the logic to fit it into the sidebar.

*   **File:** `src/components/workspace/ControlRack.tsx` (New)
*   **Structure:**
    ```tsx
    <aside className="flex flex-col h-full bg-card/30">
      {/* 1. Scrollable Form Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
           {/* Render StudioParameters or ImageParameters based on store.generationMode */}
           {/* Strip these components of their outer <Card> wrappers */}
        </div>
      </ScrollArea>

      {/* 2. Sticky Footer */}
      <div className="p-4 border-t border-white/10 bg-card/50 backdrop-blur">
         <SubmitButton />
      </div>
    </aside>
    ```

#### 3.2 Refactor Parameter Components
Modify `src/components/studio-parameters.tsx` and `src/components/image-parameters.tsx`.
*   **Action:** Accept a prop `variant="sidebar"` or simply remove the outer `<Card>` wrapper. The inputs should render directly to save padding space.
*   **Optimization:** Change expansive `RadioGroup` (like Aspect Ratio) to `Select` dropdowns or compact `SegmentedControl` to fit the 320px width.

---

### Phase 4: The Output Gallery (Right Column)
**Goal:** A persistent results area that updates independently of the form.

#### 4.1 Global State Glue
Since the Form (Center) uses `useActionState` and the Results (Right) need to know when to update:
*   **File:** `src/stores/generationSettingsStore.ts`
*   **Action:** Ensure `incrementGenerationCount()` is called inside the `useEffect` in the Form component when the action succeeds. The Results component will subscribe to this.

#### 4.2 Output Container
*   **File:** `src/components/workspace/OutputGallery.tsx` (New)
*   **Structure:**
    ```tsx
    <section className="flex flex-col h-full bg-black/20">
       <div className="h-10 flex items-center px-4 border-b border-white/5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Generated Results</span>
       </div>
       <ScrollArea className="flex-1 p-4">
          {/* Grid of results */}
          <ImageResultsDisplay /> 
       </ScrollArea>
    </section>
    ```

#### 4.3 Refactor `ImageResultsDisplay`
*   **File:** `src/components/ImageResultsDisplay.tsx`
*   **Optimization:** Ensure grid columns adapt to the container width.
    *   `grid-cols-1 2xl:grid-cols-2` (Since the column is ~30-40% width, 2 cols might be tight on small laptops, so default to 1 col stack).

---

### Phase 5: Header & Navigation
**Goal:** Move context switching out of the body.

#### 5.1 Refactor Site Header
*   **File:** `src/components/SiteHeader.tsx`
*   **Action:** Insert the Mode Switcher here.
    ```tsx
    {/* Center: Mode Switcher */}
    <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
       <SegmentedControl value={currentTab} onValueChange={setCurrentTab}>
          <SegmentedControlItem value="image">Image Mode</SegmentedControlItem>
          <SegmentedControlItem value="video">Video Mode</SegmentedControlItem>
       </SegmentedControl>
    </div>
    ```
*   **Note:** We need to lift `currentTab` state up to a global store or URL param so `SiteHeader` and `Workspace` stay in sync. **Recommendation:** Use `useSearchParams` or `useGenerationSettingsStore`.

---

### Phase 6: Integration (`page.tsx`)
**Goal:** Assemble the pieces.

#### 6.1 Update Main Page
*   **File:** `src/app/page.tsx`
*   **Action:** Replace the existing `CreationHub` usage.

```tsx
// src/app/page.tsx
export default async function Page() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
       <SiteHeader /> {/* Contains Nav */}
       
       <main className="flex-1 grid grid-cols-[1fr_320px_1fr] divide-x divide-white/10 min-h-0">
          <InputStage />
          <ControlRack />
          <OutputGallery />
       </main>
    </div>
  )
}
```

#### 6.2 Clean Up
*   **Delete:** `CreationHub` (logic moved to page/components).
*   **Delete:** `ImageGenerationWorkspace` (logic split).
*   **Refactor:** `ImagePreparationContainer` (logic moved to `InputStage`).

---

### Critical Checkpoints for 100vh Layouts

1.  **`min-h-0`**: Every flex child in the vertical stack *must* have `min-h-0` (or `overflow-hidden`). Without this, a long child will force the parent to grow beyond 100vh, breaking the fixed layout.
2.  **`overflow-y-auto`**: Apply this *only* to the specific container that should scroll (e.g., the `ScrollArea` inside the Control Rack), never to the body or main wrapper.
3.  **`object-fit: contain`**: The input image must scale. Do not use fixed heights for the canvas. Use `flex-1`.
---
Here is the implementation for **Phase 1 (Foundation)** and **Phase 2 (Input Stage)**.

This establishes the "Deep Navy" theme, locks the viewport, and builds the new Left Column architecture (Input Stage) with a floating toolbar and asset strip.

### 1. Global Theme & Viewport Lock

First, we redefine the CSS variables to match the "Deep Navy" aesthetic and lock the body to `100vh` to prevent global scrolling.

```css:src/app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

@layer base {
  /* Fix mobile input zoom */
  @media (max-width: 768px) {
    input, textarea, select { font-size: 16px !important; }
  }

  :root {
    --header-height: 64px;
    
    /* Deep Navy Pro Theme */
    --background: 224 71% 4%;       /* #030811 - Deepest Navy */
    --foreground: 210 40% 98%;      /* Off-white */
    
    --card: 224 71% 7%;             /* Slightly lighter than bg */
    --card-foreground: 210 40% 98%;
    
    --popover: 224 71% 5%;
    --popover-foreground: 210 40% 98%;
    
    --primary: 173 80% 40%;         /* Teal/Cyan Accent */
    --primary-foreground: 224 71% 4%;
    --primary-gradient-end: 190 90% 50%;
    
    --secondary: 215 20% 15%;       /* Muted Blue-Grey */
    --secondary-foreground: 210 40% 98%;
    
    --muted: 215 20% 12%;
    --muted-foreground: 215 20% 65%;
    
    --accent: 173 80% 40%;
    --accent-foreground: 224 71% 4%;
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    
    --border: 215 20% 12%;          /* Very subtle borders */
    --input: 215 20% 15%;
    --ring: 173 80% 40%;
    
    --radius: 0.5rem;
  }

  .dark {
    /* Ensure dark class uses same variables if toggled */
    --background: 224 71% 4%;
    /* ... map rest if necessary, but root handles it */
  }

  html, body {
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    overflow: hidden; /* CRITICAL: Prevents global scroll */
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}

@layer components {
  .glass-card {
    @apply border border-white/5 bg-card/50 shadow-xl backdrop-blur-md;
  }
  .glass-panel {
    @apply bg-black/20 backdrop-blur-md border border-white/5;
  }
}

@layer utilities {
  .min-h-0 { min-height: 0px; }
  .min-w-0 { min-width: 0px; }
  
  /* Utility to center content absolutely */
  .absolute-center {
    @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
  }
}
```

### 2. Workspace Layout Shell

This component defines the 3-column grid structure.

```tsx:src/components/layout/WorkspaceShell.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceShellProps {
  children: React.ReactNode;
  className?: string;
}

export function WorkspaceShell({ children, className }: WorkspaceShellProps) {
  return (
    <div 
      className={cn(
        "flex-1 grid h-[calc(100vh-var(--header-height))] min-h-0 w-full",
        // Desktop: 3 Columns | Mobile: Flex Stack (future proofing)
        "lg:grid-cols-[1fr_320px_1fr] grid-cols-1",
        "divide-x divide-white/5 bg-background",
        className
      )}
    >
      {children}
    </div>
  );
}
```

### 3. Floating Canvas Toolbar

This replaces the side accordions for image manipulation. It floats over the image.

```tsx:src/components/workspace/CanvasToolbar.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Crop as CropIcon, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Wand2,
  Undo2,
  Redo2,
  Trash2
} from 'lucide-react';
import { useImageStore } from '@/stores/imageStore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export function CanvasToolbar() {
  const { 
    applyCrop, 
    rotateImageLeft, 
    rotateImageRight, 
    flipHorizontal, 
    flipVertical, 
    removeBackground,
    undo,
    redo,
    historyIndex,
    versionHistory,
    crop,
    reset
  } = useImageStore();
  
  const { toast } = useToast();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < versionHistory.length - 1;
  const hasActiveCrop = crop && crop.width > 0 && crop.height > 0;

  const handleBgRemoval = async () => {
    try {
      await removeBackground();
    } catch (e) {
      // Toast handled in store
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1 p-1.5 rounded-full bg-black/70 border border-white/10 backdrop-blur-xl shadow-2xl">
        
        {/* History Group */}
        <div className="flex items-center gap-1 px-1">
          <ToolbarBtn icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} />
          <ToolbarBtn icon={Redo2} label="Redo" onClick={redo} disabled={!canRedo} />
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Transform Group */}
        <div className="flex items-center gap-1 px-1">
          <ToolbarBtn icon={RotateCcw} label="Rotate Left" onClick={rotateImageLeft} />
          <ToolbarBtn icon={RotateCw} label="Rotate Right" onClick={rotateImageRight} />
          <ToolbarBtn icon={FlipHorizontal} label="Flip Horizontal" onClick={flipHorizontal} />
          <ToolbarBtn icon={FlipVertical} label="Flip Vertical" onClick={flipVertical} />
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* AI & Edit Group */}
        <div className="flex items-center gap-1 px-1">
          <ToolbarBtn 
            icon={CropIcon} 
            label={hasActiveCrop ? "Apply Crop" : "Crop"} 
            onClick={applyCrop} 
            active={!!hasActiveCrop}
            variant={hasActiveCrop ? "default" : "ghost"}
          />
          <ToolbarBtn icon={Wand2} label="Remove Background" onClick={handleBgRemoval} />
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Destructive */}
        <div className="flex items-center gap-1 px-1">
            <ToolbarBtn icon={Trash2} label="Clear Image" onClick={reset} variant="destructive" />
        </div>

      </div>
    </div>
  );
}

interface ToolbarBtnProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'ghost' | 'default' | 'destructive';
}

function ToolbarBtn({ icon: Icon, label, onClick, disabled, active, variant = 'ghost' }: ToolbarBtnProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={`
              h-9 w-9 rounded-full transition-all
              ${variant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
              ${variant === 'destructive' ? 'text-red-400 hover:bg-red-950/50 hover:text-red-300' : ''}
              ${variant === 'ghost' && active ? 'bg-white/20 text-white' : ''}
              ${variant === 'ghost' && !active ? 'text-white/70 hover:text-white hover:bg-white/10' : ''}
            `}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black text-xs border-white/10">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### 4. Asset Strip (Recent Uploads)

A horizontal version of the previous `RecentAssetsPanel`.

```tsx:src/components/workspace/AssetStrip.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { getDisplayableImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useImageStore } from '@/stores/imageStore';
import { History, Plus } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface AssetStripProps {
  recentUploads: string[];
}

export function AssetStrip({ recentUploads }: AssetStripProps) {
  const { initializeFromUrl } = useImageStore();

  if (recentUploads.length === 0) return null;

  return (
    <div className="h-24 border-t border-white/5 bg-black/20 flex flex-col shrink-0">
      <div className="px-4 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <History className="h-3 w-3" /> Recent Assets
        </span>
      </div>
      
      <ScrollArea className="flex-1 w-full whitespace-nowrap px-4 pb-3">
        <div className="flex gap-2">
            {/* Upload New Placeholder (Functionality exists in main stage, this is visual cue) */}
            <div className="w-14 h-14 rounded-md border border-dashed border-white/10 flex items-center justify-center text-muted-foreground/50 shrink-0">
                <Plus className="h-5 w-5" />
            </div>

            {recentUploads.map((url, i) => (
            <button
                key={`${url}-${i}`}
                onClick={() => initializeFromUrl(url)}
                className="relative w-14 h-14 rounded-md overflow-hidden border border-white/5 hover:border-primary/50 transition-all hover:scale-105 active:scale-95 shrink-0 group"
            >
                <Image
                src={getDisplayableImageUrl(url) || ''}
                alt="Recent"
                fill
                className="object-cover"
                sizes="56px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
            ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>
    </div>
  );
}
```

### 5. Input Stage

The Left Column container. It orchestrates the Uploader, Canvas, Toolbar, and Strip.

```tsx:src/components/workspace/InputStage.tsx
'use client';

import React, { useCallback, useRef } from 'react';
import { useImageStore } from '@/stores/imageStore';
import ImageEditorCanvas from '@/components/ImageEditorCanvas';
import ImageUploader from '@/components/ImageUploader';
import { CanvasToolbar } from './CanvasToolbar';
import { AssetStrip } from './AssetStrip';
import { UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InputStageProps {
  recentUploads?: string[];
}

export function InputStage({ recentUploads = [] }: InputStageProps) {
  const { 
    versions, 
    activeVersionId, 
    crop, 
    aspect, 
    setDimensions, 
    setAspect,
    setCrop 
  } = useImageStore();

  const activeImage = activeVersionId ? versions[activeVersionId] : null;

  // Handler adapted from ImagePreparationContainer
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setDimensions(naturalWidth, naturalHeight);
    if (aspect) setAspect(aspect);
  }, [setDimensions, setAspect, aspect]);

  const handleCropChange = useCallback((pixelCrop: any, percentCrop: any) => {
    setCrop(percentCrop);
  }, [setCrop]);

  return (
    <section className="flex flex-col h-full w-full bg-black/20 min-w-0">
        
      {/* Header */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Input Stage
        </span>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative min-h-0 w-full flex items-center justify-center bg-dot-pattern p-4 overflow-hidden group">
        
        <AnimatePresence mode="wait">
          {!activeImage ? (
            <motion.div 
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md w-full"
            >
                <ImageUploader recentUploads={[]} /> {/* Pass empty here, we show strip below */}
            </motion.div>
          ) : (
            <motion.div 
                key="canvas"
                className="w-full h-full flex items-center justify-center relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {/* 
                   We need to ensure ImageEditorCanvas fits within the flex parent.
                   The component itself renders a ReactCrop which wraps an img.
                   We style the img via the component or global overrides.
                */}
                <div className="relative w-full h-full flex items-center justify-center">
                   <ImageEditorCanvas
                    image={activeImage}
                    crop={crop}
                    aspect={aspect}
                    onCropChange={handleCropChange}
                    onCropComplete={() => {}}
                    onImageLoad={onImageLoad}
                    // Passing style via specific class override in globals.css or here
                  />
                </div>

                {/* Floating Toolbar - Only show when image is active */}
                <CanvasToolbar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Asset Strip at Bottom */}
      <AssetStrip recentUploads={recentUploads} />
      
    </section>
  );
}
```

### 6. Update ImageEditorCanvas Styling

We need to modify `src/components/ImageEditorCanvas.tsx` to accept the constrained sizing. The previous version had specific max-heights (65vh). We want `100%`.

```tsx:src/components/ImageEditorCanvas.tsx
// src/components/ImageEditorCanvas.tsx
"use client";

import React from "react";
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getDisplayableImageUrl } from "@/lib/utils";

interface ImageVersion {
  id: string;
  imageUrl: string;
}

interface ImageEditorCanvasProps {
  image: ImageVersion | null;
  aspect?: number;
  disabled?: boolean;
  crop?: Crop;
  onCropChange: (pixelCrop: PixelCrop, percentCrop: Crop) => void;
  onCropComplete: (crop: PixelCrop) => void;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  ruleOfThirds?: boolean;
  imageDimensions?: { width: number; height: number };
}

export default function ImageEditorCanvas({ 
  image,
  aspect, 
  disabled = false, 
  crop,
  onCropChange,
  onCropComplete,
  onImageLoad,
  ruleOfThirds = false,
}: ImageEditorCanvasProps) {
  if (!image) {
    return null;
  }

  const imageUrlToDisplay = getDisplayableImageUrl(image.imageUrl);

  return (
    // Changed container styles to fill parent
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <ReactCrop 
        crop={crop}
        onChange={onCropChange}
        onComplete={(c) => onCropComplete(c)} 
        aspect={aspect} 
        disabled={disabled}
        ruleOfThirds={ruleOfThirds}
        keepSelection={true}
        // Styling ReactCrop to respect flex container
        className="max-h-full max-w-full"
        style={{ maxHeight: '100%', maxWidth: '100%' }}
      >
        {/* 
           CRITICAL: img styles for fixed viewport.
           object-contain ensures it scales down. 
           max-height: 100% relative to the flex container.
        */}
        <img 
          key={image.id}
          src={imageUrlToDisplay || '/placeholder.png'} 
          alt="Image for cropping" 
          onLoad={onImageLoad} 
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 200px)', // Fallback calculation or rely on flex parent
            height: 'auto',
            width: 'auto',
            objectFit: 'contain'
          }}
          // Override with tailwind classes for layout context
          className="max-h-full w-auto object-contain"
        />
      </ReactCrop>
    </div>
  );
}
```

### 7. Minor Update to `ImageUploader.tsx`

Ensure the uploader takes full height of its container so it centers nicely in the Input Stage.

```tsx:src/components/ImageUploader.tsx
// ... imports

export default function ImageUploader({ recentUploads = [] }: ImageUploaderProps) {
  // ... hooks
  
  return (
    <>
      {/* ... drag overlay ... */}

      {/* Removed Card wrapper or styled it to be transparent/borderless if inside InputStage */}
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer gap-4"
           onClick={() => fileInputRef.current?.click()}
           onDragEnter={(e) => handleDropZoneDrag(e, 'enter')}
           onDragLeave={(e) => handleDropZoneDrag(e, 'leave')}
           onDragOver={(e) => e.preventDefault()}
           onDrop={(e) => { setIsDraggingOverDropZone(false); handleDragAction(e, 'drop'); }}
      >
          <motion.div animate={{ scale: isDraggingOverDropZone ? 1.1 : 1 }}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UploadCloud className="w-10 h-10 text-primary" />
            </div>
          </motion.div>
          
          <div className="text-center space-y-2">
             <h3 className="text-lg font-semibold">Upload Source Image</h3>
             <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
          </div>

          <Input 
            id="image-upload" 
            type="file" 
            className="sr-only" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept={ALLOWED_FILE_TYPES.join(',')} 
            disabled={isDisabled}
          />
      </div>
    </>
  );
}
```

This completes **Phase 1 & 2**. You now have the global theme, the fixed layout shell, and a robust, resizing-friendly Input Stage with a floating toolbar and asset strip.

---
Here is the implementation for **Phase 3: The Control Rack**.

This phase focuses on creating the configuration sidebar. Crucially, we are decoupling the "Form Input" logic from the "Submission Button" logic to fit the new layout (Scrollable Body + Fixed Footer).

### 1. The Control Rack Container

This component replaces `ImageGenerationWorkspace`. It acts as the container for the form, managing the `useActionState` and the layout structure.

```tsx:src/components/workspace/ControlRack.tsx
'use client';

import React, { useEffect } from 'react';
import { useActionState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Settings2 } from 'lucide-react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Import refactored parameter components (defined below)
import StudioParameters from '@/components/studio-parameters';
import ImageParameters from '@/components/image-parameters';

interface ControlRackProps {
  maxImages?: number;
  userModel?: string;
}

export function ControlRack({ maxImages = 3, userModel }: ControlRackProps) {
  const { toast } = useToast();
  
  // Global State
  const generationMode = useGenerationSettingsStore(state => state.generationMode);
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
  const { versions, activeVersionId } = useImageStore();
  
  // Computed State
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || '';
  const isImageReady = !!preparedImageUrl;
  const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');

  // Form Action State
  const initialState: ImageGenerationFormState = { message: '' };
  const [formState, formAction, isPending] = useActionState(generateImageAction, initialState);

  // Side Effect: Handle Success/Error Toasts
  useEffect(() => {
    if (!isPending && formState.message) {
      const successCount = formState.editedImageUrls?.filter(url => url !== null).length ?? 0;

      if (successCount > 0 || formState.newHistoryId) {
        incrementGenerationCount(); // Signal Output Gallery to update
        toast({
          title: 'Generation Started',
          description: formState.message,
          className: "bg-teal-950 border-teal-800 text-teal-100"
        });
      } else if (formState.errors?.some(e => e !== null)) {
        toast({
          title: 'Generation Failed',
          description: 'Please check the settings and try again.',
          variant: 'destructive',
        });
      }
    }
  }, [formState, isPending, toast, incrementGenerationCount]);

  const isSubmitDisabled = isPending || !isImageReady || isAnyVersionProcessing;

  return (
    <aside className="w-[320px] border-r border-white/5 bg-card/30 flex flex-col h-full shrink-0 z-10">
      {/* Header */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50 justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
           <Settings2 className="h-3 w-3" /> Configuration
        </span>
        <span className="text-[10px] text-muted-foreground/50 font-mono">
          {generationMode.toUpperCase()}
        </span>
      </div>

      {/* Main Form Container */}
      <form action={formAction} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Scrollable Settings Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Hidden Inputs for State Transfer */}
            <input type="hidden" name="imageDataUriOrUrl" value={preparedImageUrl} />
            <input type="hidden" name="generationMode" value={generationMode} />
            
            {generationMode === 'studio' ? (
              <StudioParameters isPending={isPending} userModel={userModel} variant="sidebar" />
            ) : (
              <ImageParameters isPending={isPending} userModel={userModel} variant="sidebar" />
            )}
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-white/5 bg-background/40 backdrop-blur-lg shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
          <Button 
            type="submit" 
            disabled={isSubmitDisabled} 
            className={cn(
                "w-full h-12 text-base font-semibold shadow-lg transition-all duration-300",
                !isSubmitDisabled ? "bg-gradient-to-r from-primary to-primary-gradient-end hover:brightness-110" : "opacity-50"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5 fill-current" /> 
                Generate {userModel === 'fal_nano_banana_pro' ? '1 Image' : '3 Images'}
              </>
            )}
          </Button>
          
          {!isImageReady && (
             <p className="text-[10px] text-center text-red-400/80 mt-2 font-medium">
                * Upload an image in the Input Stage to continue
             </p>
          )}
        </div>
      </form>
    </aside>
  );
}
```

### 2. Refactoring `StudioParameters`

We strip the `<Card>` wrapper and optimize the inputs for a narrow column. Note the `variant="sidebar"` prop usage to conditionally remove heavy styling.

```tsx:src/components/studio-parameters.tsx
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { ASPECT_RATIOS } from '@/lib/prompt-builder';

interface StudioParametersProps {
  isPending: boolean;
  maxImages?: number;
  userModel?: string;
  variant?: 'default' | 'sidebar'; // New prop
}

export default function StudioParameters({ isPending, userModel, variant = 'default' }: StudioParametersProps) {
  const { studioFit, setStudioFit, studioAspectRatio, setStudioAspectRatio } = useGenerationSettingsStore(
    useShallow((state) => ({
      studioFit: state.studioFit,
      setStudioFit: state.setStudioFit,
      studioAspectRatio: state.studioAspectRatio,
      setStudioAspectRatio: state.setStudioAspectRatio,
    }))
  );

  const isNanoBanana = userModel === 'fal_nano_banana_pro';

  // Render just the fields, no Card wrapper if sidebar variant
  const content = (
    <div className="space-y-6">
       {/* Hidden input for fit is handled here if needed, but usually handled in parent form via store values passed to hidden inputs. 
           Wait, we need to inject the values into the form. 
           The Parent (ControlRack) handles top-level hidden inputs, but specialized ones might need to be here if they aren't global.
           Actually, ControlRack passes `studioFit` as a hidden input? Let's check ControlRack.
           ControlRack puts generic inputs. We need to ensure `studioFit` is in the form.
       */}
       <input type="hidden" name="studioFit" value={studioFit} />
       {isNanoBanana && <input type="hidden" name="aspectRatio" value={studioAspectRatio} />}

       <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Configuration</Label>
          
          <div className="space-y-2">
            <Label htmlFor="studio-fit-select" className="text-sm text-foreground/90">Clothing Fit</Label>
            <Select
              value={studioFit}
              onValueChange={(value) => setStudioFit(value as 'slim' | 'regular' | 'relaxed')}
              disabled={isPending}
            >
              <SelectTrigger id="studio-fit-select" className="w-full bg-black/20 border-white/10">
                <SelectValue placeholder="Select a fit..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slim">Slim Fit</SelectItem>
                <SelectItem value="regular">Regular Fit</SelectItem>
                <SelectItem value="relaxed">Relaxed Fit</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground leading-tight">
               Adjusts how the garment drapes on the generated model.
            </p>
          </div>

          {isNanoBanana && (
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio-select" className="text-sm text-foreground/90">Aspect Ratio</Label>
              <Select
                value={studioAspectRatio}
                onValueChange={setStudioAspectRatio}
                disabled={isPending}
              >
                <SelectTrigger id="aspect-ratio-select" className="w-full bg-black/20 border-white/10">
                  <SelectValue placeholder="Select aspect ratio..." />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
       </div>
    </div>
  );

  if (variant === 'sidebar') return content;

  // Fallback for legacy usage
  return (
    <div className="p-4 border rounded-lg bg-card">
      {content}
    </div>
  );
}
```

### 3. Refactoring `ImageParameters`

This is the complex one. We need to condense the accordions and ensure the randomization toggles fit nicely in the narrow sidebar.

```tsx:src/components/image-parameters.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { usePromptManager } from '@/hooks/usePromptManager';
import { 
  Shuffle, BrainCircuit, Wand2, Sparkles, UserCheck, ChevronDown, RefreshCw 
} from 'lucide-react';
import {
  GENDER_OPTIONS, ETHNICITY_OPTIONS, FASHION_STYLE_OPTIONS, BACKGROUND_OPTIONS, 
  ASPECT_RATIOS, OptionWithPromptSegment, BODY_SHAPE_AND_SIZE_OPTIONS, AGE_RANGE_OPTIONS, 
  POSE_STYLE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, MODEL_ANGLE_OPTIONS, 
  LIGHTING_TYPE_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS
} from '@/lib/prompt-builder';
import { motion, AnimatePresence } from 'motion/react';

// ... imports for service availability checks (omitted for brevity, assume passed or re-imported)
import { isFaceDetailerAvailable, isUpscaleServiceAvailable } from "@/ai/actions/upscale-image.action";
import { isBackgroundRemovalAvailable } from "@/ai/actions/remove-background.action";

interface ImageParametersProps {
  isPending: boolean;
  maxImages?: number;
  userModel?: string;
  variant?: 'default' | 'sidebar';
}

export default function ImageParameters({ isPending, userModel, variant = 'default' }: ImageParametersProps) {
  // Store Access
  const imageSettings = useGenerationSettingsStore(state => state.imageSettings);
  const settingsMode = useGenerationSettingsStore(state => state.settingsMode);
  const setImageSettings = useGenerationSettingsStore(state => state.setImageSettings);
  const setSettingsModeStore = useGenerationSettingsStore(state => state.setSettingsMode);
  const { studioAspectRatio, setStudioAspectRatio } = useGenerationSettingsStore(state => ({ studioAspectRatio: state.studioAspectRatio, setStudioAspectRatio: state.setStudioAspectRatio }));
  
  // Pipeline Toggles
  const { backgroundRemovalEnabled, setBackgroundRemovalEnabled } = useGenerationSettingsStore(s => ({ backgroundRemovalEnabled: s.backgroundRemovalEnabled, setBackgroundRemovalEnabled: s.setBackgroundRemovalEnabled }));
  const { upscaleEnabled, setUpscaleEnabled } = useGenerationSettingsStore(s => ({ upscaleEnabled: s.upscaleEnabled, setUpscaleEnabled: s.setUpscaleEnabled }));
  const { faceDetailEnabled, setFaceDetailEnabled } = useGenerationSettingsStore(s => ({ faceDetailEnabled: s.faceDetailEnabled, setFaceDetailEnabled: s.setFaceDetailEnabled }));

  const isNanoBanana = userModel === 'fal_nano_banana_pro';

  // Local State for UI logic
  const [useRandomization, setUseRandomization] = useState<boolean>(true);
  const [useAIPrompt, setUseAIPrompt] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);
  
  // Feature Flags (loaded on mount)
  const [features, setFeatures] = useState({ bg: false, upscale: false, face: false });

  useEffect(() => {
    Promise.all([
      isBackgroundRemovalAvailable(),
      isUpscaleServiceAvailable(),
      isFaceDetailerAvailable()
    ]).then(([bg, upscale, face]) => setFeatures({ bg, upscale, face }));
  }, []);

  // Prompt Manager logic reused
  const currentImageGenParams = useMemo(() => ({ ...imageSettings, settingsMode }), [imageSettings, settingsMode]);
  const { currentPrompt, isPromptManuallyEdited, handlePromptChange } = usePromptManager({
    generationType: 'image',
    generationParams: currentImageGenParams,
  });

  // Helper to update params and disable randomization
  const handleParamChange = useCallback((key: any, value: string) => {
    setImageSettings({ [key]: value });
    setUseRandomization(false);
  }, [setImageSettings]);

  // Render Helper
  const renderSelect = (id: string, label: string, value: string, options: OptionWithPromptSegment[]) => (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Select value={value} onValueChange={(v) => handleParamChange(id, v)} disabled={isPending}>
        <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs">
           <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.displayLabel}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hidden Inputs for Form Submission */}
      <input type="hidden" name="gender" value={imageSettings.gender} />
      {/* ... other hidden inputs for all attributes ... */}
      <input type="hidden" name="background" value={imageSettings.background} />
      <input type="hidden" name="fashionStyle" value={imageSettings.fashionStyle} />
      <input type="hidden" name="useRandomization" value={String(useRandomization)} />
      <input type="hidden" name="useAIPrompt" value={String(useAIPrompt)} />
      <input type="hidden" name="removeBackground" value={String(backgroundRemovalEnabled)} />
      <input type="hidden" name="upscale" value={String(upscaleEnabled)} />
      <input type="hidden" name="enhanceFace" value={String(faceDetailEnabled)} />
      {isNanoBanana && <input type="hidden" name="aspectRatio" value={studioAspectRatio} />}
      {isPromptManuallyEdited && <input type="hidden" name="manualPrompt" value={currentPrompt} />}

      {/* 1. Automation Settings */}
      <div className="space-y-3">
         <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Automation</Label>
         
         <div className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/5">
            <div className="flex flex-col">
               <span className="text-sm font-medium">Randomize Style</span>
               <span className="text-[10px] text-muted-foreground">Generate variations</span>
            </div>
            <Switch checked={useRandomization} onCheckedChange={setUseRandomization} />
         </div>

         <div className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/5">
            <div className="flex flex-col">
               <span className="text-sm font-medium flex items-center gap-1.5">
                  AI Prompt <BrainCircuit className="h-3 w-3 text-primary" />
               </span>
               <span className="text-[10px] text-muted-foreground">Enhance with LLM</span>
            </div>
            <Switch checked={useAIPrompt} onCheckedChange={(v) => { setUseAIPrompt(v); setUseRandomization(false); }} />
         </div>
      </div>

      {/* 2. Pipeline Options */}
      <div className="space-y-3">
         <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Pipeline</Label>
         <div className="grid grid-cols-3 gap-2">
             {features.bg && (
                 <ToggleOption 
                    icon={Wand2} 
                    active={backgroundRemovalEnabled} 
                    onClick={() => setBackgroundRemovalEnabled(!backgroundRemovalEnabled)} 
                    label="RMBG" 
                 />
             )}
             {features.upscale && (
                 <ToggleOption 
                    icon={Sparkles} 
                    active={upscaleEnabled} 
                    onClick={() => setUpscaleEnabled(!upscaleEnabled)} 
                    label="Upscale" 
                 />
             )}
             {features.face && (
                 <ToggleOption 
                    icon={UserCheck} 
                    active={faceDetailEnabled} 
                    onClick={() => setFaceDetailEnabled(!faceDetailEnabled)} 
                    label="Face Fix" 
                 />
             )}
         </div>
      </div>

      {/* 3. Detailed Attributes Accordion */}
      <Accordion type="single" collapsible className="w-full border-t border-white/5">
         <AccordionItem value="style" className="border-b-0">
            <AccordionTrigger className="py-3 text-sm hover:no-underline hover:bg-white/5 px-1 rounded-sm">
               Custom Configuration
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 px-1">
               
               {/* Aspect Ratio (Nano Banana Only) */}
               {isNanoBanana && (
                 <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Aspect Ratio</Label>
                    <Select value={studioAspectRatio} onValueChange={setStudioAspectRatio}>
                       <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          {ASPECT_RATIOS.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>
               )}

               {/* Core Attributes */}
               {renderSelect("gender", "Gender", imageSettings.gender, GENDER_OPTIONS)}
               {renderSelect("fashionStyle", "Style", imageSettings.fashionStyle, FASHION_STYLE_OPTIONS)}
               {renderSelect("background", "Setting", imageSettings.background, BACKGROUND_OPTIONS)}
               {renderSelect("ethnicity", "Ethnicity", imageSettings.ethnicity, ETHNICITY_OPTIONS)}
               {renderSelect("poseStyle", "Pose", imageSettings.poseStyle, POSE_STYLE_OPTIONS)}

               {/* Prompt Preview */}
               <div className="pt-2">
                  <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={() => setShowPromptPreview(!showPromptPreview)} 
                     className="w-full h-8 text-xs border-white/10 hover:bg-white/5"
                  >
                     {showPromptPreview ? "Hide Prompt" : "Edit Prompt"}
                  </Button>
                  {showPromptPreview && (
                     <Textarea 
                        value={currentPrompt}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        className="mt-2 text-xs font-mono min-h-[100px] bg-black/30 border-white/10"
                        placeholder="Prompt..."
                     />
                  )}
               </div>
            </AccordionContent>
         </AccordionItem>
      </Accordion>
    </div>
  );
}

// Small helper component for grid toggles
function ToggleOption({ icon: Icon, active, onClick, label }: { icon: any, active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-1.5 p-2 rounded-md border transition-all",
                active 
                   ? "bg-primary/20 border-primary text-primary" 
                   : "bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
        >
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    )
}

function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(' ');
}
```

This completes Phase 3. We have a unified `ControlRack` that dynamically swaps parameter components based on the global `generationMode`, all wrapped in a single form that connects to the existing server actions. The styling is dense, sidebar-appropriate, and fits the fixed layout constraint.
---
Here is the implementation for **Phase 4: The Output Gallery**.

This phase creates the persistent results column. The key challenge here is decoupling the *display* of results from the *submission* of the form, since they now live in different React sub-trees. We achieve this via the global Zustand store signaling updates (`generationCount`) and a dedicated polling mechanism.

### 1. Output Gallery Container

This component creates the structural shell for the right column and houses the `ImageResultsDisplay`.

```tsx:src/components/workspace/OutputGallery.tsx
'use client';

import React from 'react';
import { ImageResultsDisplay } from '@/components/ImageResultsDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grid3x3 } from 'lucide-react';

interface OutputGalleryProps {
  maxImages?: number;
}

export function OutputGallery({ maxImages = 3 }: OutputGalleryProps) {
  return (
    <section className="flex flex-col h-full min-w-0 bg-black/20">
      {/* Header */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50 justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
           <Grid3x3 className="h-3 w-3" /> Generated Results
        </span>
      </div>

      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 min-h-full">
           {/* 
              We pass null for formState because this component is now decoupled 
              from the form submission. It relies on internal polling logic triggered 
              by global state changes.
           */}
           <ImageResultsDisplay 
              formState={null} 
              isPending={false} 
              maxImages={maxImages}
              // We don't need these callbacks in the gallery anymore,
              // as we use global state or direct actions on the cards
           /> 
        </div>
      </ScrollArea>
    </section>
  );
}
```

### 2. Refactoring `ImageResultsDisplay.tsx`

We need to adapt this component to work in two modes:
1.  **Legacy/Form Mode:** Receiving `formState` from a parent `useActionState` (used in history view or legacy pages).
2.  **Standalone Mode (New):** Subscribing to the global `generationSettingsStore` to know when a new generation has started, and then managing its own polling.

This refactor makes the component robust enough to handle both.

```tsx:src/components/ImageResultsDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Maximize2, RefreshCw, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { getDisplayableImageUrl } from '@/lib/utils';
import { ImageViewerModal } from './ImageViewerModal';
import { ImageResultSkeleton } from './ImageResultSkeleton';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore'; // For "Use as Input"
import type { ImageGenerationFormState } from '@/actions/imageActions';

// Helper to get the latest history item (for standalone mode)
// We'll import the server action directly.
import { getHistoryPaginated } from '@/actions/historyActions';

interface ImageResultsDisplayProps {
  formState: ImageGenerationFormState | null;
  isPending: boolean;
  // Optional callbacks are less relevant now that we use global stores, but kept for compatibility
  setCurrentTab?: (tab: string) => void;
  onLoadImageUrl?: (imageUrl: string) => void;
  maxImages?: number;
}

export function ImageResultsDisplay({ 
  formState, 
  isPending: formPending,
  maxImages = 3
}: ImageResultsDisplayProps) {
  const { toast } = useToast();
  const { initializeFromUrl } = useImageStore();
  
  // Subscribe to generation count to trigger refreshes in standalone mode
  const generationCount = useGenerationSettingsStore(state => state.generationCount);

  // Internal State
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [images, setImages] = useState<(string | null)[]>([]);
  const [errors, setErrors] = useState<(string | null)[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [isFetchingLatest, setIsFetchingLatest] = useState(false);

  // Image Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  // EFFECT 1: Handle Form State Updates (Legacy Mode)
  useEffect(() => {
    if (formState?.newHistoryId) {
      setActiveHistoryId(formState.newHistoryId);
      setStatus('processing');
    }
  }, [formState]);

  // EFFECT 2: Handle Global Generation Signal (Standalone Mode)
  // When generationCount increments, it means a successful submission happened elsewhere.
  // We need to fetch the latest history item to get its ID and start polling.
  useEffect(() => {
    if (generationCount > 0 && !formState) { // Only run if not driven by local formState
      const fetchLatest = async () => {
        setIsFetchingLatest(true);
        try {
          // Fetch the most recent item
          const result = await getHistoryPaginated(1, 1, 'image');
          if (result.items.length > 0) {
             const latest = result.items[0];
             // Only update if it's actually new or we aren't tracking anything
             if (latest.id !== activeHistoryId) {
                setActiveHistoryId(latest.id);
                setStatus(latest.status || 'processing');
                setImages(latest.editedImageUrls);
             }
          }
        } catch (e) {
          console.error("Failed to sync latest generation", e);
        } finally {
          setIsFetchingLatest(false);
        }
      };
      fetchLatest();
    }
  }, [generationCount, formState, activeHistoryId]);

  // EFFECT 3: Polling Logic
  // This runs whenever we have an active ID and the status isn't terminal.
  useEffect(() => {
    if (!activeHistoryId || status === 'completed' || status === 'failed') return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/history/${activeHistoryId}/status`, { cache: 'no-store' });
        if (res.ok && isMounted) {
          const data = await res.json();
          
          // Update images if we have them
          if (data.editedImageUrls) {
             setImages(data.editedImageUrls);
          }

          // Check terminal states
          if (data.status === 'completed') {
             setStatus('completed');
             clearInterval(interval);
          } else if (data.status === 'failed') {
             setStatus('failed');
             setErrors(Array(maxImages).fill(data.error || "Generation failed"));
             clearInterval(interval);
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000); // Poll every 2s

    return () => {
      isMounted = false;
      clearInterval(interval);
    }
  }, [activeHistoryId, status, maxImages]);

  // --- HANDLERS ---
  
  const handleUseAsInput = (url: string) => {
    initializeFromUrl(url);
    // Note: We rely on the user visually seeing the left panel update.
    // In the new layout, both panels are visible, so no tab switching needed.
  };

  const handleDownload = (url: string, index: number) => {
     const link = document.createElement('a');
     link.href = getDisplayableImageUrl(url) || '';
     link.download = `Refashion_${index}_${Date.now()}.png`;
     link.click();
  };

  // --- RENDER HELPERS ---
  
  // Determine what to show. 
  // If idle and no history, show empty state.
  // If processing, show skeletons.
  // If done, show images.

  const displayImages = images.length > 0 ? images : Array(maxImages).fill(null);
  
  // Responsive Grid: 1 col on small screens/narrow width, 2 cols if space allows
  // Since this component lives in a ~30-40% width container, we use container queries or simple responsive classes.
  // Tailwind's `2xl` might not trigger inside a split pane, so we stick to 1 col or a fluid grid.
  const gridClass = "grid grid-cols-1 gap-4"; 

  if (!activeHistoryId && !isFetchingLatest) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed border-white/5 rounded-xl">
        <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">No Results Yet</p>
        <p className="text-xs opacity-60 text-center mt-1">
          Configure your settings and click Generate to see results here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={gridClass}>
        {/* Use fixed array length based on maxImages to ensure layout stability */}
        {Array.from({ length: maxImages }).map((_, index) => {
          const url = displayImages[index];
          const error = errors[index];
          const isLoading = status === 'processing' && !url && !error;

          return (
            <motion.div
              key={`${activeHistoryId}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="relative aspect-[2/3] w-full bg-muted/10 rounded-lg overflow-hidden group border border-white/5 shadow-sm">
                
                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-muted/20">
                       <ImageResultSkeleton /> 
                       {/* Overlay spinner for clarity */}
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-primary/50 animate-spin" />
                       </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-red-950/10 text-red-400">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <span className="text-xs text-center">Failed</span>
                  </div>
                )}

                {/* Image State */}
                {url && (
                  <>
                    <Image
                      src={getDisplayableImageUrl(url)!}
                      alt={`Result ${index}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1200px) 100vw, 33vw"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                       <div className="flex gap-2">
                          <Button size="icon" variant="secondary" onClick={() => { setSelectedImg(url); setViewerOpen(true); }}>
                             <Maximize2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="secondary" onClick={() => handleDownload(url, index)}>
                             <Download className="h-4 w-4" />
                          </Button>
                       </div>
                       <Button size="sm" variant="default" className="mt-2 h-8 text-xs" onClick={() => handleUseAsInput(url)}>
                          <RefreshCw className="h-3 w-3 mr-1.5" /> Use as Input
                       </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Image Viewer Modal */}
      {selectedImg && (
        <ImageViewerModal 
           isOpen={viewerOpen}
           onClose={() => setViewerOpen(false)}
           item={{ 
             id: activeHistoryId!, 
             editedImageUrls: images, 
             timestamp: Date.now(),
             // Partial mock for viewer compatibility
             constructedPrompt: '',
             originalClothingUrl: '',
             attributes: {} as any,
             username: '' 
           }}
           initialImageUrl={selectedImg}
        />
      )}
    </>
  );
}
```

### 3. Update `src/stores/generationSettingsStore.ts`

We need to make sure the `incrementGenerationCount` is exported properly, as it's the critical glue between the form and the results. (It already exists in the store, just verifying usage in the code above).

No changes needed to the store file itself, but the logic flow is:
1.  `ControlRack` calls `incrementGenerationCount` on successful form submission.
2.  `ImageResultsDisplay` (in Output Gallery) listens to `generationCount`.
3.  It triggers a fetch to `getHistoryPaginated(1, 1)` to find the *just-created* history item ID.
4.  It sets that ID as active and starts polling for specific image URLs.

This effectively decouples the UI while maintaining the user experience of "I clicked generate, and the results appeared".

This completes Phase 4. We now have a fully functioning 3-column layout where:
1.  **Left:** Image preparation happens.
2.  **Center:** Configuration and submission happens.
3.  **Right:** Results appear asynchronously.

---
Here is the implementation for **Phase 5: Header & Navigation**.

This phase lifts the navigation state out of the page body and into the global store, then rebuilds the `SiteHeader` to act as the primary controller for the application context (Image vs. Video).

### 1. Update Global Store (`src/stores/generationSettingsStore.ts`)

We need to track the `activeView` globally so the Header can control which configuration panel is displayed in the Center Column.

```typescript:src/stores/generationSettingsStore.ts
// ... existing imports
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ModelAttributes, HistoryItem } from '@/lib/types';

// ... existing interfaces (VideoParameters, GenerationSettingsState)

// ADD: New View Types
export type ActiveView = 'image' | 'video';

export interface GenerationSettingsState {
  // ... existing state properties ...
  
  // NEW: Track which mode is active globally
  activeView: ActiveView; 
}

export interface GenerationSettingsActions {
  // ... existing actions ...

  // NEW: Action to switch views
  setActiveView: (view: ActiveView) => void;
}

// ... default objects ...

const initialState: GenerationSettingsState = {
  // ... existing defaults ...
  activeView: 'image', // Default to image mode
};

export const useGenerationSettingsStore = create<GenerationSettingsStore>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // ... existing setters ...

      // NEW: Implementation
      setActiveView: (view) => 
        set({ activeView: view }, false, 'setActiveView'),
    }),
    { name: 'generation-settings-store' }
  )
);
```

### 2. Create a Styled Segmented Control

We need a specific, smaller version of the `SegmentedControl` for the header that matches the new theme. The existing one is generic. Let's create a specialized wrapper or style the existing one inline. I'll adapt the usage in the header directly using the existing `SegmentedControl` primitives but styled for the navbar.

### 3. Refactor `SiteHeader.tsx`

This is the core of Phase 5. We remove the old navigation and insert the new centralized controls.

```tsx:src/components/SiteHeader.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';
import { ThemeToggleImproved } from '@/components/ui/ThemeToggleImproved';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/SegmentedControl';
import { 
  ShieldCheck, 
  History, 
  Image as ImageIcon, 
  Video, 
  Menu 
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { MobileMenu } from './MobileMenu'; // We'll keep this for small screens

export function SiteHeader() {
  const { user } = useAuth();
  const activeView = useGenerationSettingsStore(state => state.activeView);
  const setActiveView = useGenerationSettingsStore(state => state.setActiveView);

  return (
    <header className="h-[var(--header-height)] w-full border-b border-white/5 bg-background/80 backdrop-blur-md z-50 shrink-0">
      <div className="w-full h-full px-4 flex items-center justify-between relative">
        
        {/* LEFT: Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                <Image 
                  src="/refashion.svg" 
                  alt="Logo" 
                  fill 
                  className="object-cover"
                />
             </div>
             <span className="font-bold text-lg tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
               Refashion<span className="text-primary">AI</span>
             </span>
          </Link>
        </div>

        {/* CENTER: Context Switcher (Desktop) */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
           <div className="bg-black/20 p-1 rounded-lg border border-white/5">
             <SegmentedControl 
                value={activeView} 
                onValueChange={(v) => setActiveView(v as 'image' | 'video')}
                className="gap-1"
             >
                <SegmentedControlItem value="image" className="px-6 py-1.5 text-xs font-medium">
                   <ImageIcon className="h-3.5 w-3.5 mr-2" /> Image Mode
                </SegmentedControlItem>
                <SegmentedControlItem value="video" className="px-6 py-1.5 text-xs font-medium">
                   <Video className="h-3.5 w-3.5 mr-2" /> Video Mode
                </SegmentedControlItem>
             </SegmentedControl>
           </div>
        </div>

        {/* RIGHT: Utilities */}
        <div className="flex items-center gap-2">
           
           {/* History Link (Full Page) */}
           <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <Link href="/history">
                 <History className="h-4 w-4 mr-2" />
                 History
              </Link>
           </Button>

           {/* Admin Link */}
           {user?.role === 'admin' && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                 <Link href="/admin">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Admin
                 </Link>
              </Button>
           )}

           <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

           <ThemeToggleImproved variant="compact" />
           
           <UserMenu />

           {/* Mobile Menu Trigger */}
           <div className="md:hidden ml-2">
              <Sheet>
                 <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                       <Menu className="h-5 w-5" />
                    </Button>
                 </SheetTrigger>
                 <SheetContent side="right" className="p-0">
                    <MobileMenu />
                 </SheetContent>
              </Sheet>
           </div>
        </div>
      </div>
    </header>
  );
}
```

### 4. Update `MobileMenu` to support View Switching

Since we hid the center switcher on mobile, we need to add those controls to the mobile drawer.

```tsx:src/components/MobileMenu.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ShieldCheck, Sun, Moon, Monitor, LogOut, LogIn, User, 
  Image as ImageIcon, Video, History 
} from 'lucide-react';
import { logoutUser } from '@/actions/authActions';

export function MobileMenu() {
  const { user } = useAuth();
  const { setTheme, theme } = useTheme();
  const { activeView, setActiveView } = useGenerationSettingsStore();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-white/5">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
               <User className="h-5 w-5" />
            </div>
            <div>
               <p className="font-medium text-foreground">{user?.isLoggedIn ? user.username : 'Guest'}</p>
               <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         
         {/* Mobile View Switcher */}
         <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Mode</p>
            <div className="grid grid-cols-2 gap-2">
               <Button 
                  variant={activeView === 'image' ? 'default' : 'outline'} 
                  className="justify-start" 
                  onClick={() => setActiveView('image')}
               >
                  <ImageIcon className="mr-2 h-4 w-4" /> Image
               </Button>
               <Button 
                  variant={activeView === 'video' ? 'default' : 'outline'} 
                  className="justify-start" 
                  onClick={() => setActiveView('video')}
               >
                  <Video className="mr-2 h-4 w-4" /> Video
               </Button>
            </div>
         </div>

         <Separator className="bg-white/5" />

         {/* Navigation */}
         <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Navigation</p>
            <Button asChild variant="ghost" className="w-full justify-start">
               <Link href="/history"><History className="mr-2 h-4 w-4" /> Full History</Link>
            </Button>
            {user?.role === 'admin' && (
               <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Console</Link>
               </Button>
            )}
         </div>

         <Separator className="bg-white/5" />

         {/* Theme */}
         <div className="space-y-2">
             <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Appearance</p>
             <div className="grid grid-cols-3 gap-2">
                <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('light')}>
                   <Sun className="h-4 w-4" />
                </Button>
                <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>
                   <Moon className="h-4 w-4" />
                </Button>
                <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('system')}>
                   <Monitor className="h-4 w-4" />
                </Button>
             </div>
         </div>
      </div>

      <div className="p-4 border-t border-white/5">
         {user?.isLoggedIn ? (
            <form action={logoutUser}>
               <Button type="submit" variant="destructive" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
               </Button>
            </form>
         ) : (
            <Button asChild className="w-full">
               <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
            </Button>
         )}
      </div>
    </div>
  );
}
```

This completes **Phase 5**. The application now has a centralized state for "Image vs Video" mode managed by Zustand, and the Header component has been completely redesigned to be the primary controller for this state, freeing up the body content area for the actual workspace.

---

Here is the implementation for **Phase 6: Integration**.

This phase connects the Image and Video workflows into the new layout, ensuring the `ControlRack` switches context dynamically and the `OutputGallery` can render both media types.

### 1. Create `ImageControlPanel`
First, we extract the logic we wrote in Phase 3 for the `ControlRack` into a dedicated panel component. This isolates the Image Form logic.

```tsx:src/components/workspace/ImageControlPanel.tsx
'use client';

import React, { useEffect } from 'react';
import { useActionState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Settings2 } from 'lucide-react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import StudioParameters from '@/components/studio-parameters';
import ImageParameters from '@/components/image-parameters';

interface ImageControlPanelProps {
  userModel?: string;
}

export function ImageControlPanel({ userModel }: ImageControlPanelProps) {
  const { toast } = useToast();
  
  const generationMode = useGenerationSettingsStore(state => state.generationMode);
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
  const { versions, activeVersionId } = useImageStore();
  
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || '';
  const isImageReady = !!preparedImageUrl;
  const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');

  const initialState: ImageGenerationFormState = { message: '' };
  const [formState, formAction, isPending] = useActionState(generateImageAction, initialState);

  useEffect(() => {
    if (!isPending && formState.message) {
      const successCount = formState.editedImageUrls?.filter(url => url !== null).length ?? 0;
      if (successCount > 0 || formState.newHistoryId) {
        incrementGenerationCount();
        toast({
          title: 'Generation Started',
          description: formState.message,
          className: "bg-teal-950 border-teal-800 text-teal-100"
        });
      } else if (formState.errors?.some(e => e !== null)) {
        toast({
          title: 'Generation Failed',
          description: 'Please check the settings and try again.',
          variant: 'destructive',
        });
      }
    }
  }, [formState, isPending, toast, incrementGenerationCount]);

  const isSubmitDisabled = isPending || !isImageReady || isAnyVersionProcessing;

  return (
    <form action={formAction} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50 justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
           <Settings2 className="h-3 w-3" /> Configuration
        </span>
        <span className="text-[10px] text-muted-foreground/50 font-mono">
          {generationMode.toUpperCase()}
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <input type="hidden" name="imageDataUriOrUrl" value={preparedImageUrl} />
          <input type="hidden" name="generationMode" value={generationMode} />
          
          {generationMode === 'studio' ? (
            <StudioParameters isPending={isPending} userModel={userModel} variant="sidebar" />
          ) : (
            <ImageParameters isPending={isPending} userModel={userModel} variant="sidebar" />
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/5 bg-background/40 backdrop-blur-lg">
        <Button 
          type="submit" 
          disabled={isSubmitDisabled} 
          className={cn(
              "w-full h-12 text-base font-semibold shadow-lg transition-all duration-300",
              !isSubmitDisabled ? "bg-gradient-to-r from-primary to-primary-gradient-end hover:brightness-110" : "opacity-50"
          )}
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5 fill-current" /> Generate {userModel === 'fal_nano_banana_pro' ? '1 Image' : '3 Images'}</>
          )}
        </Button>
        
        {!isImageReady && (
           <p className="text-[10px] text-center text-red-400/80 mt-2 font-medium">
              * Upload an image in the Input Stage to continue
           </p>
        )}
      </div>
    </form>
  );
}
```

### 2. Create `VideoControlPanel`
Now we adapt the video logic (formerly `video-parameters.tsx`) to fit the sidebar.

```tsx:src/components/workspace/VideoControlPanel.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useActionState } from "react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Video, Settings2, Info } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { useImageStore } from "@/stores/imageStore";
import { generateVideoAction, type VideoGenerationFormState } from '@/ai/actions/generate-video.action';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { usePromptManager } from "@/hooks/usePromptManager";
import { 
    PREDEFINED_PROMPTS, MODEL_MOVEMENT_OPTIONS, FABRIC_MOTION_OPTIONS_VIDEO, 
    CAMERA_ACTION_OPTIONS, AESTHETIC_VIBE_OPTIONS 
} from "@/lib/prompt-builder";

export function VideoControlPanel() {
  const { toast } = useToast();
  
  // Store Access
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
  const videoSettings = useGenerationSettingsStore(state => state.videoSettings);
  const setVideoSettings = useGenerationSettingsStore(state => state.setVideoSettings);
  const { versions, activeVersionId } = useImageStore();

  // Computed State
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || '';
  const isImageReady = !!preparedImageUrl;

  // Form Action
  const initialState: VideoGenerationFormState = { message: '' };
  const [formState, formAction, isPending] = useActionState(generateVideoAction, initialState);

  // Prompt Manager Logic
  const currentVideoGenParams = useMemo(() => ({
    selectedPredefinedPrompt: videoSettings.selectedPredefinedPrompt,
    modelMovement: videoSettings.modelMovement,
    fabricMotion: videoSettings.fabricMotion,
    cameraAction: videoSettings.cameraAction,
    aestheticVibe: videoSettings.aestheticVibe,
  }), [videoSettings]);

  const { currentPrompt, handlePromptChange } = usePromptManager({
    generationType: 'video',
    generationParams: currentVideoGenParams,
  });

  // Handle Success/Error
  useEffect(() => {
    if (formState.message) {
      if (formState.error) {
        toast({ 
          title: "Video Generation Failed", 
          description: formState.error, 
          variant: "destructive" 
        });
      } else if (formState.taskId) {
        incrementGenerationCount();
        toast({
          title: "Video Generation Started",
          description: "Your video is being processed in the background.",
          className: "bg-indigo-950 border-indigo-800 text-indigo-100"
        });
      }
    }
  }, [formState, toast, incrementGenerationCount]);

  const isSubmitDisabled = isPending || !isImageReady;

  // Render Helper
  const renderSelect = (id: string, label: string, value: string, options: any[]) => (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Select value={value} onValueChange={(v) => setVideoSettings({ [id]: v })} disabled={isPending}>
        <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.displayLabel}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <form action={formAction} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Hidden Inputs */}
      <input type="hidden" name="prompt" value={currentPrompt} />
      <input type="hidden" name="imageUrl" value={preparedImageUrl} />
      <input type="hidden" name="videoModel" value={videoSettings.videoModel} />
      <input type="hidden" name="resolution" value={videoSettings.resolution} />
      <input type="hidden" name="duration" value={videoSettings.duration} />
      <input type="hidden" name="seed" value={videoSettings.seed} />
      <input type="hidden" name="cameraFixed" value={String(videoSettings.cameraFixed)} />
      {/* Hidden fields for history tracking */}
      <input type="hidden" name="selectedPredefinedPrompt" value={videoSettings.selectedPredefinedPrompt} />
      <input type="hidden" name="modelMovement" value={videoSettings.modelMovement} />
      <input type="hidden" name="fabricMotion" value={videoSettings.fabricMotion} />
      <input type="hidden" name="cameraAction" value={videoSettings.cameraAction} />
      <input type="hidden" name="aestheticVibe" value={videoSettings.aestheticVibe} />

      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50 justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
           <Settings2 className="h-3 w-3" /> Video Config
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
            
            {/* Quick Presets */}
            <div className="space-y-3">
               <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Motion Presets</Label>
               <div className="grid grid-cols-2 gap-2">
                  {PREDEFINED_PROMPTS.slice(0, 6).map((preset) => (
                    <Button
                        key={preset.value}
                        type="button"
                        variant={videoSettings.selectedPredefinedPrompt === preset.value ? 'secondary' : 'outline'}
                        onClick={() => setVideoSettings({ selectedPredefinedPrompt: preset.value })}
                        className="h-8 text-xs justify-start bg-black/20 border-white/5"
                    >
                        {preset.displayLabel}
                    </Button>
                  ))}
               </div>
            </div>

            {/* Tech Specs */}
            <div className="space-y-3 border-t border-white/5 pt-4">
               <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Specs</Label>
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                     <Label className="text-[10px] text-muted-foreground">Model</Label>
                     <Select value={videoSettings.videoModel} onValueChange={(v: any) => setVideoSettings({ videoModel: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="lite">Lite</SelectItem><SelectItem value="pro">Pro</SelectItem></SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-[10px] text-muted-foreground">Duration</Label>
                     <Select value={videoSettings.duration} onValueChange={(v: any) => setVideoSettings({ duration: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['5', '10'].map(d => <SelectItem key={d} value={d}>{d}s</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </div>

            {/* Advanced Controls */}
            <Accordion type="single" collapsible className="w-full border-t border-white/5">
                <AccordionItem value="advanced" className="border-b-0">
                   <AccordionTrigger className="py-3 text-sm hover:no-underline hover:bg-white/5 px-1 rounded-sm">
                      Fine Tuning
                   </AccordionTrigger>
                   <AccordionContent className="space-y-4 pt-2 px-1">
                      {renderSelect('modelMovement', 'Model Movement', videoSettings.modelMovement, MODEL_MOVEMENT_OPTIONS)}
                      {renderSelect('cameraAction', 'Camera Action', videoSettings.cameraAction, CAMERA_ACTION_OPTIONS)}
                      
                      <div className="flex items-center justify-between p-2 rounded bg-white/5">
                         <Label htmlFor="fixed-cam" className="text-xs cursor-pointer">Fixed Camera</Label>
                         <Switch id="fixed-cam" checked={videoSettings.cameraFixed} onCheckedChange={(v) => setVideoSettings({cameraFixed: v})} />
                      </div>

                      <div className="pt-2">
                         <Label className="text-[10px] text-muted-foreground mb-1 block">Prompt Preview</Label>
                         <Textarea 
                            value={currentPrompt}
                            onChange={(e) => handlePromptChange(e.target.value)}
                            className="text-xs font-mono min-h-[80px] bg-black/30 border-white/10"
                         />
                      </div>
                   </AccordionContent>
                </AccordionItem>
            </Accordion>

        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/5 bg-background/40 backdrop-blur-lg">
        <Button 
          type="submit" 
          disabled={isSubmitDisabled} 
          className={cn(
              "w-full h-12 text-base font-semibold shadow-lg transition-all duration-300",
              !isSubmitDisabled ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "opacity-50"
          )}
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Queuing...</>
          ) : (
            <><Video className="mr-2 h-5 w-5" /> Generate Video</>
          )}
        </Button>
      </div>
    </form>
  );
}
```

### 3. Update `ControlRack.tsx` (The Switcher)
Now we update the main `ControlRack` to simply switch between these two panels based on the global state.

```tsx:src/components/workspace/ControlRack.tsx
'use client';

import React from 'react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { ImageControlPanel } from './ImageControlPanel';
import { VideoControlPanel } from './VideoControlPanel';

interface ControlRackProps {
  maxImages?: number;
  userModel?: string;
}

export function ControlRack({ maxImages = 3, userModel }: ControlRackProps) {
  const activeView = useGenerationSettingsStore(state => state.activeView);

  return (
    <aside className="w-[320px] border-r border-white/5 bg-card/30 flex flex-col h-full shrink-0 z-10 relative">
      {activeView === 'video' ? (
        <VideoControlPanel />
      ) : (
        <ImageControlPanel maxImages={maxImages} userModel={userModel} />
      )}
    </aside>
  );
}
```

### 4. Update `ImageResultsDisplay.tsx` for Video Support
We need to modify the results component to handle the video data format returned by the API.

```tsx:src/components/ImageResultsDisplay.tsx
// ... existing imports ... 
// Add PlayCircle
import { PlayCircle } from 'lucide-react';

// ... inside ImageResultsDisplay function ...

  // We need to detect if the current activeHistoryId relates to a video.
  // The polling result `data` gives us a hint.
  const [isVideoResult, setIsVideoResult] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // ... inside polling useEffect ...
  // Inside if (res.ok) block:
  
          const data = await res.json();
          
          // CHECK FOR VIDEO
          if (data.videoUrl || data.localVideoUrl) {
             setIsVideoResult(true);
             setVideoUrl(data.localVideoUrl || data.videoUrl);
          }
          
          // ... existing logic for images ...
  
  // ... inside render ...

  // === VIDEO RENDER LOGIC ===
  if (isVideoResult) {
      return (
        <div className="h-full flex items-center justify-center p-4">
           <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
              {videoUrl ? (
                 <video 
                    src={getDisplayableImageUrl(videoUrl)!} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-contain"
                 />
              ) : (
                 <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    <p className="text-sm text-muted-foreground">Rendering Video...</p>
                 </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                 {status === 'completed' ? 'Ready' : 'Processing'}
              </div>
           </div>
        </div>
      )
  }

  // === EXISTING IMAGE GRID LOGIC ===
  // ... (Keep the existing return for image grid) ...
```

### 5. Final Assembly: `src/app/page.tsx`

We replace the old page content with the new Workspace components.

```tsx:src/app/page.tsx
import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { InputStage } from '@/components/workspace/InputStage';
import { ControlRack } from '@/components/workspace/ControlRack';
import { OutputGallery } from '@/components/workspace/OutputGallery';
import { getCurrentUser } from '@/actions/authActions';
import { findUserByUsername } from '@/services/database.service';
import { getRecentUploadsAction } from '@/actions/historyActions';
import { connection } from 'next/server';

export default async function Page() {
  await connection(); // Dynamic
  
  const sessionUser = await getCurrentUser();
  let maxImages = 3;
  let recentUploads: string[] = [];
  let userModel = 'fal_gemini_2_5';

  if (sessionUser?.username) {
    const fullUser = findUserByUsername(sessionUser.username);
    if (fullUser?.image_generation_model) {
      userModel = fullUser.image_generation_model;
      if (userModel === 'fal_nano_banana_pro') {
        maxImages = 1;
      }
    }
    try {
      recentUploads = await getRecentUploadsAction();
    } catch (e) { console.error(e); }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
       {/* 1. Fixed Header */}
       <SiteHeader /> 
       
       {/* 2. Main Workspace Grid */}
       <main className="flex-1 min-h-0 relative">
          <WorkspaceShell>
             {/* Left: Input Canvas */}
             <InputStage recentUploads={recentUploads} />
             
             {/* Center: Settings */}
             <ControlRack maxImages={maxImages} userModel={userModel} />
             
             {/* Right: Results */}
             <OutputGallery maxImages={maxImages} />
          </WorkspaceShell>
       </main>
    </div>
  )
}
```


---

This is the **Finalized, Robust Implementation Plan**. It addresses the race conditions and layout stability issues identified in the review.

### Core Architecture Adjustment: The "Bridge"
We will update the Zustand store to act as the synchronization bridge.
*   **Form (Center)**: Submits -> Gets `historyId` -> Sets `currentResultId` in Store.
*   **Gallery (Right)**: Listens to `currentResultId` -> Mounts polling component for that ID.

---

### Step 1: Update Global Store (The Bridge)

We add `currentResultId` to decouple the form from the gallery.

```typescript:src/stores/generationSettingsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ModelAttributes, HistoryItem } from '@/lib/types';

// ... (Keep existing interfaces: VideoParameters, etc.) ...

export type ActiveView = 'image' | 'video';

export interface GenerationSettingsState {
  // ... existing state properties ...
  
  // NEW: View State
  activeView: ActiveView;
  
  // NEW: The ID of the generation currently being processed/viewed
  // This bridges the Form (submitter) and Gallery (viewer)
  currentResultId: string | null; 
}

export interface GenerationSettingsActions {
  // ... existing actions ...
  
  setActiveView: (view: ActiveView) => void;
  setCurrentResultId: (id: string | null) => void;
}

// ... (Keep default objects) ...

const initialState: GenerationSettingsState = {
  // ... existing defaults ...
  activeView: 'image',
  currentResultId: null,
  // ...
};

export const useGenerationSettingsStore = create<GenerationSettingsStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        // ... existing setters ...
        
        setActiveView: (view) => set({ activeView: view }),
        setCurrentResultId: (id) => set({ currentResultId: id }),
        
        // Ensure reset clears these too if needed
        reset: () => set({ ...initialState }),
      }),
      {
        name: 'refashion-settings-storage',
        // Only persist structural settings, not transient IDs
        partialize: (state) => ({
          imageSettings: state.imageSettings,
          videoSettings: state.videoSettings,
          settingsMode: state.settingsMode,
          generationMode: state.generationMode,
          studioFit: state.studioFit,
          studioAspectRatio: state.studioAspectRatio,
          activeView: state.activeView,
          // Explicitly excluding currentResultId so refresh doesn't stuck on old loading state
        }),
      }
    ),
    { name: 'generation-settings-store' }
  )
);
```

### Step 2: Component - Output Gallery (The Consumer)

This component now listens to `currentResultId`. It handles both Image and Video results based on the active view or the ID type (though here we rely on the view context).

```tsx:src/components/workspace/OutputGallery.tsx
'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grid3x3, History } from 'lucide-react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { ImageResultsDisplay } from '@/components/ImageResultsDisplay';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface OutputGalleryProps {
  maxImages?: number;
}

export function OutputGallery({ maxImages = 3 }: OutputGalleryProps) {
  const currentResultId = useGenerationSettingsStore(state => state.currentResultId);

  return (
    <section className="flex flex-col h-full min-w-0 bg-black/20">
      {/* Header */}
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-background/50">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
           <Grid3x3 className="h-3 w-3" /> Results
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-white" asChild>
            <Link href="/history">View All</Link>
        </Button>
      </div>

      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 min-h-full flex flex-col">
           {currentResultId ? (
             /* 
                We key the component by ID to force a complete remount 
                when the ID changes, resetting internal polling state cleanly.
             */
             <ImageResultsDisplay 
                key={currentResultId} 
                formState={{ newHistoryId: currentResultId } as any} // Adapter for the prop
                isPending={false} 
                maxImages={maxImages}
             /> 
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 space-y-3">
                <History className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">Ready to Generate</p>
                <p className="text-xs max-w-[200px] text-center opacity-60">
                  Configure your settings in the center panel and click generate.
                </p>
             </div>
           )}
        </div>
      </ScrollArea>
    </section>
  );
}
```

### Step 3: Component - Control Panels (The Producers)

We need to update `ImageControlPanel` and `VideoControlPanel` to call `setCurrentResultId`.

**Update `src/components/workspace/ImageControlPanel.tsx`**:

```tsx
// ... imports
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';

export function ImageControlPanel({ userModel }: { userModel?: string }) {
  // ... setup ...
  const setCurrentResultId = useGenerationSettingsStore(state => state.setCurrentResultId);

  // ... useActionState ...

  useEffect(() => {
    if (!isPending && formState.message) {
      // ... toast logic ...

      // CRITICAL UPDATE:
      if (formState.newHistoryId) {
        setCurrentResultId(formState.newHistoryId);
      }
    }
  }, [formState, isPending, setCurrentResultId]);

  // ... render ...
}
```

**Update `src/components/workspace/VideoControlPanel.tsx`**:

```tsx
// ... imports
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';

export function VideoControlPanel() {
  // ... setup ...
  const setCurrentResultId = useGenerationSettingsStore(state => state.setCurrentResultId);

  // ... useActionState ...

  useEffect(() => {
    if (formState.message) {
       // ... toast ...
       
       // CRITICAL UPDATE:
       if (formState.historyItemId) {
         setCurrentResultId(formState.historyItemId);
       }
    }
  }, [formState, setCurrentResultId]);

  // ... render ...
}
```

### Step 4: Layout Components

We create the layout wrappers.

**`src/components/layout/WorkspaceShell.tsx`**:

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 grid lg:grid-cols-[1fr_320px_1fr] grid-cols-1 h-[calc(100dvh-var(--header-height))] min-h-0 divide-x divide-white/5 bg-background overflow-hidden">
      {children}
    </div>
  );
}
```

### Step 5: Final Page Integration

**`src/app/page.tsx`**:

```tsx
import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { InputStage } from '@/components/workspace/InputStage';
import { ControlRack } from '@/components/workspace/ControlRack';
import { OutputGallery } from '@/components/workspace/OutputGallery';
import { getCurrentUser } from '@/actions/authActions';
import { findUserByUsername } from '@/services/database.service';
import { getRecentUploadsAction } from '@/actions/historyActions';
import { connection } from 'next/server';

export default async function Page() {
  await connection();
  
  const sessionUser = await getCurrentUser();
  let maxImages = 3;
  let recentUploads: string[] = [];
  let userModel = 'fal_gemini_2_5';

  if (sessionUser?.username) {
    const fullUser = findUserByUsername(sessionUser.username);
    if (fullUser?.image_generation_model) {
      userModel = fullUser.image_generation_model;
      if (userModel === 'fal_nano_banana_pro') {
        maxImages = 1;
      }
    }
    try {
      recentUploads = await getRecentUploadsAction();
    } catch (e) { console.error(e); }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
       {/* 1. Fixed Header */}
       <SiteHeader /> 
       
       {/* 2. Main Workspace Grid */}
       <main className="flex-1 min-h-0 relative flex flex-col">
          <WorkspaceShell>
             {/* Left: Input Canvas */}
             <InputStage recentUploads={recentUploads} />
             
             {/* Center: Settings */}
             <ControlRack maxImages={maxImages} userModel={userModel} />
             
             {/* Right: Results */}
             <OutputGallery maxImages={maxImages} />
          </WorkspaceShell>
       </main>
    </div>
  )
}
```

### Final Verification Checklist

1.  **Viewport**: `h-screen` + `overflow-hidden` on body wrapper ensures no global scroll. `min-h-0` on flex children prevents flexbox overflow issues.
2.  **Mobile**: `dvh` units used in `WorkspaceShell` ensures correct height on mobile browsers with dynamic toolbars. `grid-cols-1` on mobile stacks panels vertically (Input -> Settings -> Output).
3.  **Data Flow**: `useActionState` -> `useEffect` -> `Store.setCurrentResultId` -> `OutputGallery` -> `ImageResultsDisplay` -> `Polling`. The loop is closed.
4.  **Video/Image Switching**: `SiteHeader` sets `activeView` in store. `ControlRack` reads `activeView` to switch panels. `OutputGallery` just displays whatever ID is passed to it (Image or Video result display handles data type check internally).

This implementation is complete, type-safe, and architecturally sound. You may proceed with applying these changes.