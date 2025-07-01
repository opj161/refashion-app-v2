# Image Processing Cache Implementation

## Overview

This implementation adds an intelligent caching system to remember previously processed images, significantly improving efficiency by avoiding redundant processing operations.

## How It Works

### 1. Image Hashing
- When a user uploads an image, the system calculates a SHA-256 hash of the original file
- This hash serves as a unique identifier for the image content
- The hash is stored in the component state as `originalImageHash`

### 2. Cache Storage
- Cache data is stored in `.cache/image-processing-cache.json`
- Each cache entry contains:
  ```json
  {
    "image_hash": {
      "bgRemoved": "/uploads/processed_images/filename.png",
      "upscaled": "/uploads/processed_images/filename.png",
      "faceDetailed": "/uploads/processed_images/filename.png",
      "timestamp": 1672531200000
    }
  }
  ```

### 3. Cache Lookup
- Before processing, the system checks if a cached result exists for the image hash
- If found and the file still exists, it returns the cached path immediately
- This provides instant results for previously processed images

### 4. Cache Storage
- After successful processing, the result path is stored in the cache
- The timestamp tracks when the entry was created for cleanup purposes

## Key Benefits

- **Instant Results**: Previously processed images load immediately
- **Resource Savings**: Avoids redundant API calls and processing
- **User Experience**: No waiting time for repeated operations
- **Cost Efficiency**: Reduces API usage and server load

## Cache Management

### Automatic Cleanup
- The cache includes file existence verification
- Invalid entries (where files no longer exist) are automatically removed

### Manual Cleanup
- Run the cleanup script to remove old entries:
  ```bash
  # Remove entries older than 30 days (default)
  node scripts/cleanup-cache.js
  
  # Remove entries older than 7 days
  node scripts/cleanup-cache.js --max-age-days=7
  ```

## Important Notes

### Hash Reset on Crop
- When an image is cropped, the hash is reset to `null`
- This is because cropping creates a fundamentally different image
- The system will treat cropped images as new images requiring fresh processing

### Cache Invalidation
- Cache entries are automatically validated on lookup
- If the cached file doesn't exist, the entry is removed from cache
- This prevents stale cache entries from causing errors

## Files Modified

1. **src/ai/actions/cache-manager.ts** - Updated cache management utilities to support face detailing
2. **src/ai/actions/remove-background.ts** - Updated to support caching
3. **src/ai/actions/upscale-image.ts** - Updated to support caching
4. **src/ai/actions/face-detailer.ts** - New face detailing action with caching support
5. **src/components/image-preparation.tsx** - Updated to calculate hashes and pass to actions, plus Face Detailer UI
6. **scripts/cleanup-cache.js** - Cache cleanup utility
7. **scripts/README.md** - Updated documentation

## Usage Examples

### First Time Processing
1. User uploads image → Hash calculated
2. Face detailing requested → Cache miss → Process via Fal.ai API → Cache result
3. Result displayed to user

### Repeat Processing
1. User uploads same image → Same hash calculated
2. Face detailing requested → Cache hit → Return cached result immediately
3. Result displayed instantly

This implementation provides a seamless experience where users get instant results for images they've processed before, while maintaining the full functionality for new images. The Face Detailer feature uses the same robust caching system as background removal and upscaling.
