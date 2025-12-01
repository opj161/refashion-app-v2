# Refashion AI

![Refashion AI Banner](/public/refashion.webp)

**Refashion AI** is a specialized Creative Studio for fashion visualization. It leverages a multimodal AI pipeline to transform static garment photos into professional model photography and cinematic videos.

Built on **Next.js 15** and **React 19**, it orchestrates complex workflows between **Google Gemini (Vision/Text)** and **Fal.ai (Image/Video Generation)**, wrapping them in a secure, production-ready application with local asset management.

---

## ✨ Core Features

### 📸 Creative Studio
*   **Studio Mode (Multimodal):** Uses **Gemini 2.5 Vision** to analyze your uploaded garment (texture, silhouette, fit) and dynamically constructs a prompt to generate a high-fidelity model shot using **Fal.ai (Nano Banana Pro / Gemini 2.5)**.
*   **Creative Mode:** Parametric generation allowing fine-tuned control over model ethnicity, lighting, environment, and camera angles.
*   **Non-Destructive Editing:** Integrated tools for:
    *   **Background Removal** (`rembg`)
    *   **4K Upscaling** (`sd-ultimateface`)
    *   **Face Restoration** (`face-detailer`)
*   **Smart Cropping:** Integrated `react-image-crop` with aspect ratio locking.

### 🎥 Cinematic Video
*   **Image-to-Video:** Animates static fashion photos using the **Fal.ai Seedance** model.
*   **Director Controls:** Granular control over camera movement (Pan, Zoom, Static), model motion, and fabric physics.
*   **Async Processing:** Robust webhook architecture verifies cryptographic signatures to handle long-running video generation tasks securely.

### ⚙️ Enterprise-Grade Admin
*   **Analytics Dashboard:** Tracks KPIs, storage usage, and generation failure rates.
*   **User Management:** Role-based access control (RBAC) with encrypted, per-user API key storage.
*   **Feature Flags:** Toggle specific AI capabilities (e.g., disable Video Gen globally) via the admin panel.
*   **Data Governance:** Full system export (Database + Media) and automated offsite backups via MEGA.

---

## 🏗️ Architecture & Tech Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Typed Routes).
*   **UI Library:** [React 19](https://react.dev/), Tailwind CSS v4, Shadcn/UI, Framer Motion.
*   **State Management:** Zustand (Client), Iron Session (Encrypted Cookies).
*   **Database:** SQLite (`better-sqlite3`) running in WAL mode for high concurrency.
*   **Asset Storage:** Local filesystem (`/uploads`) with streaming support for video range requests.

### The AI Pipeline
1.  **Ingestion:** User uploads raw image -> Processed via Sharp (resize/orient).
2.  **Vision Analysis:** Gemini 2.5 Pro classifies the garment.
3.  **Prompt Engineering:** System prompts (customizable in DB) construct the perfect generation string.
4.  **Generation:** Request proxied to Fal.ai infrastructure.
5.  **Refinement:** Post-processing (Upscale/Face Fix) applied on demand.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 20+ or Docker Desktop.
*   **Fal.ai Key:** Required for all image/video generation.
*   **Gemini API Key:** Required for Studio Mode vision capabilities.

### 1. Installation
```bash
git clone https://github.com/yourusername/refashion-ai.git
cd refashion-ai
npm install
```

### 2. Environment Setup
Create a `.env` file (see `Configuration` below).

### 3. Database Initialization
Set up the SQLite database and apply migrations.
```bash
npm run migrate
```

### 4. Run Development
```bash
npm run dev
```
Access the studio at `http://localhost:3000`.

---

## 🐳 Docker Deployment

This project includes a production-optimized `Dockerfile` and `entrypoint.sh` handling permission mapping and migrations.

```bash
# Build and run in background
docker-compose up -d --build
```

**Persistent Volumes:**
*   `./user_data`: Stores the SQLite database (`history.db`).
*   `./uploads`: Stores generated images and videos.

---

## ⚙️ Configuration (.env)

| Variable | Description | Required |
| :--- | :--- | :--- |
| `FAL_KEY` | Master API key for Fal.ai services. | **Yes** |
| `GEMINI_API_KEY` | Master API key for Google Gemini. | **Yes** |
| `SESSION_SECRET` | 32+ char string for encrypting session cookies. | **Yes** |
| `ENCRYPTION_SECRET`| 32 char string for encrypting user API keys in DB. | **Yes** |
| `WEBHOOK_SECRET` | Secret for verifying Fal.ai webhooks. | **Yes** |
| `NEXT_PUBLIC_APP_URL`| URL where the app is hosted (for webhooks). | **Yes** |
| `MEGA_BACKUP_ENABLED`| Set `true` to enable offsite backups. | No |
| `MEGA_EMAIL` | MEGA account email. | No |
| `MEGA_PASSWORD` | MEGA account password. | No |

---

## 🛡️ Security Features

1.  **API Key Encryption:** User-provided API keys are stored in the database encrypted using AES-256-GCM (`src/services/encryption.service.ts`).
2.  **Webhook Verification:** The application uses `libsodium` to cryptographically verify the signature headers of incoming webhooks from Fal.ai, preventing spoofing attacks (`src/lib/webhook-verification.ts`).
3.  **Path Traversal Protection:** The filesystem utility (`src/lib/server-fs.utils.ts`) enforces strict checks to ensure files can only be read from or written to the isolated `/uploads` directory.
4.  **Fetch Caching Rules:** A custom ESLint rule (`eslint-local-rules.js`) enforces explicit caching strategies on all `fetch` calls to prevent accidental data leakage or stale data in Next.js 15.

---

## 🤖 AI Models Referenced

| Feature | Underlying Model Endpoint |
| :--- | :--- |
| **Studio Gen** | `fal-ai/nano-banana-pro/edit` or `fal-ai/gemini-25-flash-image/edit` |
| **Video Gen** | `fal-ai/bytedance/seedance/v1/pro/fast` |
| **Vision** | `gemini-2.5-pro` |
| **Upscaling** | `comfy/opj161/sd-ultimateface` |
| **Face Detail** | `comfy/opj161/face-detailer` |
| **Bg Removal** | `fal-ai/rembg` |

---

## 📦 Maintenance Scripts

The `scripts/` folder contains utilities for database management:

*   `npm run migrate`: Runs pending migrations.
*   `npm run migrate:prod`: Production migration runner.
*   `tsx scripts/fix-schema.ts`: Emergency script to patch database schema issues.
*   `tsx scripts/inspect-db.ts`: Utility to view table structures during debugging.

---

## ☁️ Offsite Backup (MEGA)

This application includes a built-in integration with **MEGAcmd**. If `MEGA_BACKUP_ENABLED=true`:
1.  The container initializes a MEGA session on startup (`entrypoint.sh`).
2.  Every time a file is saved locally (`src/services/storage.service.ts`), a background process asynchronously uploads the file to your configured MEGA remote path.
3.  This ensures that even if the container volume is lost, media assets are preserved in the cloud.

