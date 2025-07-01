# Webhook-based Video Generation Setup

This document describes the new webhook-based video generation system that allows users to safely navigate away from the page while videos are being generated.

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Existing variables
FAL_KEY=your_fal_ai_api_key_here
NEXT_PUBLIC_FAL_KEY=your_fal_ai_api_key_here

# New webhook-related variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variable Details

1. **NEXT_PUBLIC_APP_URL**: The base URL of your application. This is used to construct the webhook URL that fal.ai will call when video generation completes.
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

## How It Works

1. **Client Request**: User starts video generation on `/video-generation` page
2. **Server Action**: Creates placeholder history item and submits job to fal.ai with webhook URL
3. **User Freedom**: User can safely leave the page - generation continues on fal.ai servers
4. **Webhook Completion**: When complete, fal.ai calls our `/api/video/webhook` endpoint
5. **Video Storage**: Server downloads video and updates the history item
6. **User Retrieval**: Video appears in user's history when they return

## Benefits

- **Resilient**: Videos are generated even if user closes browser
- **Efficient**: No constant polling required
- **Modern**: Event-driven architecture following best practices
- **Scalable**: Works well with multiple concurrent users

## API Endpoints

- **POST /api/video/start**: Starts video generation with webhook
- **POST /api/video/webhook**: Receives completion notification from fal.ai

## Security

The webhook endpoint processes requests from fal.ai. For production deployments, consider implementing additional security measures such as IP whitelisting or request signature verification as recommended in fal.ai's documentation.
