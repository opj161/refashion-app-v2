# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- **Start development server**: `npm run dev` (runs on port 9002 with Turbopack)
- **Build application**: `npm run build` (includes TypeScript compilation and alias resolution)
- **Production server**: `npm run start`
- **Type checking**: `npm run typecheck`
- **Linting**: `npm run lint`
- **Script runner**: `npm run script` (uses tsx for TypeScript script execution)

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
- **Framework**: Next.js 15.4.4 with App Router and React Server Components
- **Runtime**: React 19.1.0 with concurrent features
- **Database**: SQLite with better-sqlite3 (WAL mode, prepared statements)
- **Authentication**: iron-session for secure session management
- **Styling**: Tailwind CSS with shadcn/ui design system
- **State Management**: Zustand for client-side state
- **AI Integration**: Direct Gemini 2.0 Flash API calls with multi-key rotation
- **Image/Video Processing**: Fal.ai for generation, Visionatrix for background removal
- **HTTP Client**: Axios with proxy support for AI API calls
- **File Processing**: Sharp for image optimization, Form Data for uploads
- **Form Handling**: React Hook Form with Zod validation
- **Motion**: Framer Motion (v12) for animations and transitions

### Project Structure
```
src/
├── app/                    # Next.js App Router (pages, layouts, API routes)
│   ├── admin/             # Admin panel pages and components
│   ├── api/               # API routes (v1 external API, webhooks, debug)
│   ├── history/           # User history page
│   ├── login/             # Authentication page
│   └── globals.css        # Global styles and CSS variables
├── components/            # React components
│   ├── ui/                # shadcn/ui components (buttons, dialogs, etc.)
│   ├── admin/             # Admin-specific components
│   └── *.tsx              # Feature components (image processing, history, etc.)
├── ai/                    # AI service integrations
│   ├── actions/           # AI-related server actions
│   └── flows/             # Image generation workflows
├── services/              # Business logic services
│   ├── fal-api/           # Fal.ai service modules
│   └── *.service.ts       # Core services (database, storage, encryption)
├── actions/               # Next.js server actions
├── contexts/              # React contexts (auth, theme)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and type definitions
├── stores/                # Zustand state stores
└── middleware.ts          # Next.js middleware for auth and CORS
```

### Key Services Architecture

#### Database Service (`src/services/database.service.ts`)
- SQLite with WAL mode for better concurrency
- Prepared statements for performance
- Atomic transactions for data integrity
- History pagination with filtering (image/video)
- User management with granular API key support

#### API Key Service (`src/services/apiKey.service.ts`)
- Multi-key rotation for Gemini API (3 keys supported)
- User-specific vs global key management
- Encrypted storage with fallback logic
- Supports both Gemini and Fal.ai keys

#### AI Image Generation (`src/ai/flows/generate-image-edit.ts`)
- Direct Gemini 2.0 Flash API integration
- Three parallel generation flows (flow1, flow2, flow3)
- Support for both text-to-image and image-to-image
- Retry logic with exponential backoff
- Data URI and URL input handling
- Proxy support for corporate networks

#### Fal.ai Integration (`src/services/fal-api/`)
- Background removal using rembg
- Image upscaling with sd-ultimateface
- Face enhancement with face-detailer
- Video generation with motion parameters
- Webhook handling for async video processing

### Authentication & Authorization
- **Session Management**: iron-session with 7-day TTL
- **User Roles**: 'admin' | 'user' with route-level protection
- **Middleware**: Route protection and CORS handling
- **Admin Panel**: User management, settings, and system monitoring
- **API Security**: API key authentication for external integrations

### AI Features & Workflows

#### Image Generation
- **Multiple Flows**: 3 parallel generations using different API keys
- **Input Flexibility**: Supports data URIs, URLs, and local file paths
- **Prompt Construction**: Dynamic prompt building from UI parameters
- **Error Handling**: Graceful degradation with partial results
- **Storage**: Local file storage with organized directory structure

#### Image Processing
- **Background Removal**: Automatic clothing image preprocessing
- **Upscaling**: High-quality image enhancement
- **Face Enhancement**: Specialized face detailing for fashion models
- **Format Support**: PNG, JPEG, WebP with automatic format detection

#### Video Generation
- **Professional Parameters**: Model movement, fabric motion, camera actions
- **Async Processing**: Webhook-based completion notifications
- **Status Tracking**: Real-time progress monitoring
- **Local Storage**: Automatic download and local file management

### Environment Configuration

#### Required Variables
```env
# Core Application
SESSION_SECRET=your_session_secret_here

# Gemini API (at least one required)
GEMINI_API_KEY_1=your_gemini_key_1
GEMINI_API_KEY_2=your_gemini_key_2
GEMINI_API_KEY_3=your_gemini_key_3

# Fal.ai Integration
FAL_API_KEY=your_fal_api_key
```

#### Optional Variables
```env
# Background Removal (Visionatrix)
VISIONATRIX_API_URL=http://localhost:8288
VISIONATRIX_USERNAME=admin
VISIONATRIX_PASSWORD=admin

# Proxy Support
HTTPS_PROXY=http://proxy:port
https_proxy=http://proxy:port

# Production Settings
NODE_ENV=production
FORCE_HTTPS=true
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Database Schema
```sql
-- Core tables
history              # User generation history with metadata
├── id (TEXT PRIMARY KEY)
├── username, timestamp
├── constructedPrompt, originalClothingUrl
├── settingsMode, attributes (JSON)
├── videoGenerationParams (JSON)
├── status, error, webhook_url

users                # User accounts and authentication
├── username (PRIMARY KEY)
├── password_hash, role
├── gemini_api_key_{1,2,3} + modes
├── fal_api_key + mode

history_images       # Normalized image storage
├── history_id (FK), url, type
├── slot_index for ordering
├── types: 'edited', 'original_for_comparison', 'generated_video'

settings            # System configuration
├── key (PRIMARY KEY)
├── value (encrypted sensitive data)
```

### File Organization & Storage
```
public/uploads/
├── generated_images/           # AI-generated fashion images
├── user_uploaded_clothing/     # Original user uploads
├── processed_images/           # Background removed, upscaled images
└── generated_videos/           # AI-generated fashion videos

user_data/
└── history/                    # SQLite database files
    ├── history.db
    ├── history.db-wal
    └── history.db-shm
```

### Testing & Development

#### Testing Setup
- **Framework**: Jest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **TypeScript**: ts-jest with separate tsconfig
- **Coverage**: Built-in Jest coverage reporting
- **Component Testing**: shadcn/ui component integration testing

#### Development Tools
- **TypeScript**: Strict mode with path aliases (@/*)
- **ESLint**: Next.js recommended configuration
- **Tailwind**: JIT compilation with custom animations
- **Hot Reload**: Turbopack for fast development iterations

### Configuration Files

#### Next.js Configuration (`next.config.ts`)
- SVG handling with @svgr/webpack
- Standalone output for Docker deployment
- Increased server action body size limit (50MB)
- Image optimization with remote pattern allowlist
- Proxy-aware image handling

#### Tailwind Configuration (`tailwind.config.ts`)
- Custom color system with CSS variables
- Extended animations for progress and motion
- shadcn/ui integration with custom design tokens
- Dark/light theme support

### Deployment & Production

#### Docker Support
- Multi-stage build with Node.js Alpine
- Proper file permissions for unRAID/NAS systems
- Environment variable injection
- Health checks and graceful shutdown

#### Security Considerations
- Encrypted sensitive data storage
- CORS configuration for API endpoints
- Content Security Policy headers
- Rate limiting considerations for AI API usage

### Development Patterns & Conventions

#### Code Organization
- Server actions for data mutations
- React Server Components for server-side rendering
- Client components marked with 'use client'
- Typed API responses with Zod schemas

#### Error Handling
- Graceful degradation for AI service failures
- User-friendly error messages
- Comprehensive logging for debugging
- Retry mechanisms for transient failures

#### Performance Optimizations
- Prepared SQL statements for database queries
- Image caching and optimization
- Lazy loading for large components
- Efficient re-rendering with React 19 features