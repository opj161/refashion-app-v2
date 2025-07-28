# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- **Start development server**: `npm run dev` (runs on port 9002 with Turbopack)
- **Build application**: `npm run build` (includes TypeScript compilation and alias resolution)
- **Production server**: `npm run start`
- **Type checking**: `npm run typecheck`
- **Linting**: `npm run lint`

### Testing
- **Run tests**: `npm test`
- **Watch mode**: `npm run test:watch`
- **Coverage report**: `npm run test:coverage`

### Database Operations
- **Migrate JSON to SQLite**: `npm run migrate:json-to-sqlite`
- **Migrate users to SQLite**: `npm run migrate:users-to-sqlite`
- **Add granular API key columns**: `npm run migrate:granular-api-keys`

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15.4.4 with App Router
- **Runtime**: React 19.1.0 
- **Database**: SQLite with better-sqlite3
- **Authentication**: iron-session for session management
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand for client-side state
- **AI Integration**: Gemini API (multi-key rotation), Fal.ai for image/video generation
- **Image Processing**: Visionatrix API for background removal

### Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (includes shadcn/ui components in `ui/`)
- `src/services/` - Business logic services (database, API, encryption, storage)
- `src/ai/` - AI-related actions and flows
- `src/actions/` - Server actions
- `src/stores/` - Zustand state stores
- `src/contexts/` - React contexts for auth and theme
- `public/uploads/` - File storage for user uploads and generated content
- `user_data/history/` - SQLite database storage

### Key Services
- **Database Service** (`src/services/database.service.ts`): SQLite operations with WAL mode
- **API Key Service** (`src/services/apiKey.service.ts`): Manages multi-key rotation for Gemini
- **Storage Service** (`src/services/storage.service.ts`): File upload and management
- **Webhook Service** (`src/services/webhook.service.ts`): Handles video generation webhooks

### Authentication & Authorization
- Session-based auth using iron-session
- User roles: 'admin' | 'user'
- Admin routes protected in `src/app/admin/`
- Middleware handles route protection

### AI Features
- **Image Generation**: Multiple flows (flow1, flow2, flow3, flux) via Fal.ai
- **Video Generation**: Professional video creation with motion parameters
- **Background Removal**: Visionatrix integration for clothing image preprocessing
- **Face Enhancement**: Image upscaling and detail enhancement

### Environment Variables
Required for development:
- `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` (at least one)
- Firebase configuration variables for frontend
- Optional: Visionatrix API settings for background removal

### Database Schema
SQLite database with tables for:
- `history` - User generation history with metadata
- `users` - User accounts and authentication
- `api_keys` - API key management and usage tracking

### File Organization
- Generated images stored in `public/uploads/generated_images/`
- User uploads in `public/uploads/user_uploaded_clothing/`
- Processed images in `public/uploads/processed_images/`
- Generated videos in `public/uploads/generated_videos/`

### Testing Setup
- Jest with React Testing Library
- TypeScript support via ts-jest
- Component testing configured for Next.js environment
- Test files use `.test.ts` or `.test.tsx` extensions