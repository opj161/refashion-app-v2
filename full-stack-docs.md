# RefashionAI: Full-Stack Documentation

## 1. Overview

RefashionAI is a web application built with Next.js that empowers users to generate photorealistic fashion model images. Users can upload an image of a clothing item, and the application uses Generative AI to create images of models wearing that item.

The application is designed with a multi-user system, robust history tracking, an administrative console for user and system management, and a flexible API for programmatic access.

### Key Features

#### AI Core Features
*   **AI-Powered Image Generation:** Utilizes Google's Gemini Pro Vision model to generate three unique model images from a single clothing image and user-defined parameters.
*   **AI-Powered Video Generation:** Uses Fal.ai's Seedance model to animate a still image of a model, creating short video clips.

#### Image Preparation Suite
*   **Background Removal:** Isolates the clothing item from its original background using Fal.ai.
*   **Image Upscaling & Face Detailing:** Enhances the resolution and facial details of generated or uploaded images.
*   **Advanced Cropping & Versioning:** Provides an intuitive cropping tool with fixed aspect ratios and a version history for all processing steps.

#### Platform & User Management
*   **Multi-User System:** Secure login system with role-based access control (Admin, User).
*   **Per-User & Global API Key Management:** Admins can set global API keys, while individual users can be configured to use their own, providing cost-tracking and flexibility.
*   **Comprehensive Generation History:** Automatically saves every generation (images and videos) with its full configuration, allowing users to review, re-load, or delete past work.
*   **Secure Admin Console:** A dedicated section for administrators to manage users, system settings, feature flags, and API keys.

#### Integration & Deployment
*   **REST API for Programmatic Access:** A versioned REST API (`/api/v1`) allows for programmatic image generation and status checks.
*   **Containerized Docker Deployment:** Fully containerized with Docker for easy and consistent deployment.

---

## 2. System Architecture

The application follows a modern full-stack JavaScript architecture using the Next.js App Router.

```mermaid
graph TD
    subgraph User Browser
        A[React Frontend]
    end

    subgraph "Next.js Server (Vercel/Node.js)"
        B[Server Actions]
        C[API Routes]
        D[Middleware]
        E[SQLite Database]
    end

    subgraph "External AI Services"
        F[Google Gemini API]
        G[Fal.ai API]
    end

    A -- "Calls (e.g., login, generate)" --> B;
    A -- "Fetches (e.g., history)" --> B;
    A -- "Navigates" --> D;

    B -- "CRUD Operations" --> E;
    B -- "Manages Auth" --> D;
    B -- "Calls AI" --> F;
    B -- "Calls AI" --> G;
    
    C -- "Webhook callback" --> B;

    subgraph "External Integrations (e.g., WordPress)"
        H[3rd Party App]
    end
    
    H -- "REST API Calls" --> C;
    C -- "Authenticates via API Key" --> E;
    C -- "Triggers Jobs" --> B;

    G -- "Video Webhook" --> C;
```

#### Architectural Flow:

1.  **Frontend:** The user interacts with a React-based frontend built with `shadcn/ui` components. Client-side state for the image creation process is managed by a `Zustand` store (`imageStore`).
2.  **Backend Logic:** User actions (like generating an image or logging in) trigger Next.js **Server Actions**. These server-side functions contain the core business logic.
3.  **Authentication:** `iron-session` is used to manage user sessions via encrypted cookies. The `middleware.ts` file protects routes, redirecting unauthenticated users and blocking non-admins from the `/admin` section.
4.  **Database:** All application data (users, history, settings) is stored in a **SQLite** database (`user_data/history/history.db`), managed by the `better-sqlite3` library. The `database.service.ts` abstracts all database interactions.
5.  **AI Integration:**
    *   **Image Generation:** The `generateImageEdit` server action calls the **Google Gemini API** directly using `axios`. It uses one of three configured API keys for parallel generation.
    *   **Image/Video Processing:** The application calls the **Fal.ai API** for background removal, upscaling, and video generation. The video generation flow is asynchronous, using a webhook to receive the result.
6.  **API Keys:** The `apiKey.service.ts` and `encryption.service.ts` work together to securely retrieve the correct API key (either user-specific or global) for each AI service call.
7.  **External API:** The `/api/v1` routes provide a stable, key-authenticated interface for external services to use the image generation capabilities.

#### Component Breakdown
| Diagram Component | Primary Code Location(s) | Description |
| :--- | :--- | :--- |
| **React Frontend** | `src/app/`, `src/components/`, `src/stores/imageStore.ts` | The client-side UI, components, and image editing state. |
| **Server Actions** | `src/actions/*`, `src/ai/flows/*` | Core backend logic for auth, history, and AI orchestration. |
| **API Routes** | `src/app/api/*` | Endpoints for webhooks and the versioned REST API. |
| **Middleware** | `src/middleware.ts` | Handles authentication, authorization, and API CORS. |
| **SQLite Database** | `src/services/database.service.ts` | Manages all interaction with the `user_data/history.db` file. |
| **External AI Services** | `src/services/fal-api/*`, `src/ai/flows/generate-image-edit.ts` | Clients and logic for communicating with Google and Fal.ai. |

---

## 3. Technology Stack

| Category | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) | Full-stack web framework for React. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Static typing for JavaScript. |
| **UI** | [React 19](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/) | Component-based UI, pre-built accessible components, and utility-first CSS. |
| **Animation** | [motion/react](https://motion.dev/react) | Lightweight animation library for performant UI animations. |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) | Minimalist, unopinionated state management for React. Used for the image editor. |
| **Backend** | [Next.js Server Actions & API Routes](https://nextjs.org/docs/app/building-your-application/data-fetching) | Server-side logic, API endpoints, and webhook handling. |
| **Database** | [SQLite](https://www.sqlite.org/index.html) & [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Serverless, on-disk SQL database for storing user data, history, and settings. |
| **Auth** | [iron-session](https://github.com/vvo/iron-session) & [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Manages user sessions via encrypted cookies and securely hashes passwords. |
| **AI APIs** | [Google Gemini](https://ai.google.dev/), [@fal-ai/client](https://fal.ai/) | For image generation (Gemini) and image/video processing (Fal.ai). |
| **Deployment** | [Docker](https://www.docker.com/) | Containerization for consistent and portable deployment. |
| **Testing** | [Jest](https://jestjs.io/), [React Testing Library](https://testing-library.com/) | Unit and integration testing framework. |

---

## 4. Project Structure

The codebase is organized within the `src` directory, following Next.js App Router conventions.

```
/
├── public/                # Static assets (images, icons)
│   └── uploads/           # User-uploaded and AI-generated files (mounted volume)
├── user_data/             # Application data (mounted volume)
│   └── history/
│       └── history.db     # SQLite database file
├── scripts/               # Migration and utility scripts
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (main)/        # Main application routes (create, history, login)
│   │   ├── admin/         # Admin console routes and layout
│   │   └── api/           # API endpoints (webhooks, v1 REST API)
│   ├── actions/           # Server Actions (core backend logic)
│   ├── ai/                # AI-specific logic
│   │   ├── actions/       # Low-level AI action wrappers
│   │   └── flows/         # High-level AI workflows combining multiple actions
│   ├── components/        # Reusable React components
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React contexts (Auth, Theme)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities, types, and constants
│   ├── services/          # Backend service layer (database, API clients, etc.)
│   ├── stores/            # Zustand state management stores
│   └── middleware.ts      # Authentication and authorization middleware
├── Dockerfile             # Defines the Docker image for deployment
└── entrypoint.sh          # Script to run migrations and set permissions on container start
```
*   **`src/ai/`**: AI-specific logic.
    *   **`actions/`**: Contains low-level wrappers for specific AI tasks (e.g., `remove-background.action.ts`). These actions typically perform a single, atomic operation.
    *   **`flows/`**: Contains high-level orchestrators that combine multiple actions and business logic to achieve a complete user goal (e.g., `generate-image-edit.ts` calls the Gemini API three times and handles the results).

---

## 5. Backend Deep Dive

### 5.1. Server Actions

Server Actions are the primary mechanism for backend logic. They are defined in the `/src/actions` directory.

*   **`authActions.ts`**: Handles user login, logout, and retrieving the current session user.
*   **`adminActions.ts`**: Contains all logic for the admin console, such as creating/deleting users, managing settings, and viewing all user history. All actions are protected by an `verifyAdmin()` check.
*   **`historyActions.ts`**: Manages CRUD operations for user generation history, including adding new items, updating them with video results, and paginated fetching.
*   **`apiActions.ts`**: Specifically handles the logic for the `/api/v1` external API, creating and processing asynchronous generation jobs.

### 5.2. Database (`database.service.ts`)

*   **Technology**: Uses `better-sqlite3` for synchronous, high-performance access to a local SQLite file.
*   **Schema**: The schema is defined and initialized in `initSchema()`. It is versioned via migration scripts.
*   **Transactions**: Uses `db.transaction()` to ensure atomic operations, especially when creating a history item and its associated images.
*   **Migrations**: The project includes migration scripts in `/scripts` to handle schema changes. These are run automatically by `entrypoint.sh` when the Docker container starts.

<details>
<summary>Core Database Schema</summary>

```sql
-- Represents a single generation event (image or video)
CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  constructedPrompt TEXT,
  originalClothingUrl TEXT,
  settingsMode TEXT,
  attributes TEXT, -- JSON blob of ModelAttributes
  videoGenerationParams TEXT -- JSON blob of video parameters
);

-- Stores user accounts and their configuration
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  app_api_key TEXT, -- For external API access
  -- Granular API key columns for different services
  gemini_api_key_1 TEXT,
  gemini_api_key_1_mode TEXT NOT NULL DEFAULT 'global' CHECK (gemini_api_key_1_mode IN ('global', 'user_specific')),
  -- ... more key columns
);

-- Links multiple generated images/videos to a single history item
CREATE TABLE IF NOT EXISTS history_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  history_id TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('edited', 'original_for_comparison', 'generated_video')),
  slot_index INTEGER NOT NULL,
  FOREIGN KEY (history_id) REFERENCES history (id) ON DELETE CASCADE
);
```
</details>

### 5.3. AI Service Integration

#### Google Gemini (Image Generation)

*   **File**: `src/ai/flows/generate-image-edit.ts`
*   **Mechanism**: Uses `axios` to make direct REST API calls to the Gemini endpoint, allowing for fine-grained control and explicit proxy support.
*   **Flow**:
    1.  The `generateImageEdit` function is called with user parameters.
    2.  `buildAIPrompt` constructs a detailed, context-rich prompt.
    3.  Three parallel calls are made to `performSingleImageGeneration`. Each call uses a different Gemini API key (index 1, 2, or 3) retrieved via `getApiKeyForUser`.
    4.  The source image is converted to a base64 data URI and included in the request payload.
    5.  The flow includes a **retry mechanism**, attempting each API call up to 3 times on failure.
    6.  The response image is saved locally using `saveDataUriLocally`. The local paths of the three generated images are returned.

#### Fal.ai (Image/Video Processing)

*   **Files**: `src/services/fal-api/*`, `src/ai/actions/generate-video.action.ts`
*   **Mechanism**: Uses the official `@fal-ai/client` library.
*   **Flows**:
    *   **Image Processing (Sync):** A synchronous `fal.subscribe()` call is made for background removal and upscaling. The application waits for the result, downloads the processed image from the returned URL, and saves it locally.
    *   **Video Generation (Async):** A request is sent to Fal.ai with a unique webhook URL (`/api/video/webhook`). Fal.ai processes the video and sends a POST request to this webhook upon completion. The webhook handler then saves the video and updates the history item.

### 5.4. Authentication & API Keys

*   **Session Auth**: `iron-session` encrypts user session data into a cookie. `middleware.ts` reads this cookie on incoming requests to protect pages.
*   **API Key Auth**: The `/api/v1` routes are protected by a bearer token. `authenticateApiRequest` validates the token against the `app_api_key` in the `users` table.
*   **Key Service (`apiKey.service.ts`)**: Intelligently fetches the correct AI provider key by first checking for a user-specific key and falling back to the global key.
*   **Encryption (`encryption.service.ts`)**: All API keys stored in the database are encrypted using AES-256-GCM with the `ENCRYPTION_SECRET`.

---

## 6. Frontend Deep Dive

### 6.1. State Management (`imageStore.ts`)

The core of the interactive image preparation workflow is managed by a Zustand store.

*   **Purpose**: Provides a single source of truth for the user's uploaded image and its various processed versions.
*   **Key State**: `original`, `versions` (an object holding all processed versions), `activeVersionId`, and `isProcessing`.
*   **Key Actions**: `setOriginalImage`, `addVersion`, `removeBackground`, `upscaleImage`, and `reset`.

### 6.2. Key Components

*   **`CreationHub.tsx`**: The main parent component for the `/create` page, orchestrating the image preparation and parameter-setting UI.
*   **`ImagePreparationContainer.tsx`**: Manages the entire image upload and editing canvas, integrating the uploader, canvas, processing tools, and version stack.
*   **`ImageParameters.tsx` & `VideoParameters.tsx`**: Contain the forms for all AI generation settings. They use the `usePromptManager` hook to dynamically build the text prompt.
*   **`HistoryGallery.tsx`**: Displays a grid of past generations, featuring infinite scrolling (`IntersectionObserver`), filtering, and modal views for details.

### 6.3. Animation & Layout (`template.tsx`)

`src/app/template.tsx` wraps page content and uses `motion/react` to apply smooth transitions between pages. It also contains a crucial `useEffect` hook that automatically resets the `imageStore` when the user navigates away from the creation workflow, ensuring a clean state.

---

## 7. Configuration & Deployment

### 7.1. Environment Variables

| Variable | Description | Example | Required |
| :--- | :--- | :--- | :--- |
| `ENCRYPTION_SECRET` | A 32-character secret for encrypting API keys. | `a_very_random_and_secure_32_char_string` | **Yes** |
| `SESSION_SECRET` | A 32+ character secret for encrypting sessions. | `another_long_secure_random_string_for_sessions` | **Yes** |
| `NEXT_PUBLIC_APP_URL` | The public-facing URL of the application. | `https://app.refashion.cc` | **Yes** |
| `GEMINI_API_KEY_1` | A Google Gemini API Key. | `AIzaSy...` | No* |
| `GEMINI_API_KEY_2` | A second Gemini API Key. | `AIzaSy...` | No* |
| `GEMINI_API_KEY_3` | A third Gemini API Key. | `AIzaSy...` | No* |
| `NEXT_PUBLIC_FAL_KEY` | A Fal.ai API Key. | `fal-key-...` | No* |
| `FORCE_HTTPS` | Set to `true` if behind a reverse proxy with SSL. | `true` | No |
| `PUID` | Process User ID for file permissions in Docker. | `1000` | No |
| `PGID` | Process Group ID for file permissions in Docker. | `1000` | No |
| `HTTPS_PROXY` | URL for an HTTPS proxy if required. | `http://user:pass@proxy.example.com:8080` | No |

> **Note on API Keys**: While the application can run without AI provider keys, the core generation features will not function. Keys can be set either via environment variables or, for global keys, in the Admin Console. User-specific keys can only be set in the Admin Console.

### 7.2. Docker Deployment

The application is deployed as a Docker container using a multi-stage `Dockerfile` for an optimized production image.

The `entrypoint.sh` script orchestrates the container startup in the following order:
1.  **Database Migrations:** Runs all migration scripts (`migrate-*.js`) to ensure the SQLite schema is up-to-date.
2.  **Permission Handling:** Sets file ownership on critical directories based on `PUID`/`PGID` environment variables to prevent permission issues with mounted volumes.
3.  **Application Start:** Executes the main `node server.js` command under the specified non-root user (`su-exec`).

### 7.3. Local Development

To run the application locally for development:
1.  Create a `.env.local` file in the root directory and populate it with the required environment variables.
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`
4.  The application will be available at `http://localhost:9002`.

---

## 8. API Documentation (v1)

The application exposes a REST API for programmatic image generation.
> **Note:** The Base URL is relative to the application's host. For external calls, use the full URL, e.g., `https://{your-app-domain}/api/v1`.

**Authentication:** All endpoints require an `Authorization` header with a bearer token. The token is the API key generated for a user in the Admin Console.
`Authorization: Bearer rf_...`

---

### **POST** `/generate`

Starts a new asynchronous image generation job.

#### Request Body (`application/json`)

```json
{
  "imageDataUri": "data:image/png;base64,...", // Optional, if imageUrl is not present
  "imageUrl": "https://example.com/image.png", // Optional, if imageDataUri is not present
  "settingsMode": "basic", // "basic" or "advanced"
  "parameters": {
    "gender": "female",
    "bodyType": "default",
    // ... all other parameters from ModelAttributes type
  }
}
```

#### Responses

*   **`202 Accepted`**: The job was successfully created.
    ```json
    {
      "jobId": "a1b2c3d4-e5f6-...", // This is a history_id
      "status": "processing"
    }
    ```
*   **`400 Bad Request`**: Invalid request body.
*   **`401 Unauthorized`**: Invalid or missing API key.

---

### **GET** `/status/{jobId}`

Checks the status of a generation job.

#### URL Parameters

*   `jobId` (string, required): The ID returned from the `/generate` endpoint.

#### Responses

*   **`200 OK` (Processing)**
    ```json
    { "jobId": "...", "status": "processing" }
    ```
*   **`200 OK` (Completed)**
    ```json
    {
      "jobId": "...",
      "status": "completed",
      "generatedImageUrls": [
        "https://app.refashion.cc/api/image-proxy/generated_images/...",
        "https://app.refashion.cc/api/image-proxy/generated_images/...",
        "https://app.refashion.cc/api/image-proxy/generated_images/..."
      ]
    }
    ```
*   **`200 OK` (Failed)**
    ```json
    {
      "jobId": "...",
      "status": "failed",
      "error": "Image generation blocked by safety settings."
    }
    ```
*   **`401 Unauthorized`**: Key does not have permission for this job.
*   **`404 Not Found`**: The specified `jobId` does not exist.