# RefashionAI Naming Scheme Standardization

## Changes Implemented

This document summarizes the naming scheme improvements implemented to create a more consistent and maintainable file naming system across the RefashionAI application.

## Updated Naming Conventions

| File Type | Previous Scheme | New Scheme | Directory |
| :--- | :--- | :--- | :--- |
| **User Uploads** | `RefashionAI_userclothing_{UUID}.{ext}` | `RefashionAI_userclothing_{UUID}.{ext}` | `/user_uploaded_clothing/` |
| **AI-Generated Images** | `RefashionAI_generated_{flowId}_{UUID}.{ext}` | `RefashionAI_generated_{flowId}_{UUID}.{ext}` | `/generated_images/` |
| **Background Removed** | `RefashionAI_bg_removed_{baseName}_{UUID}.{ext}` | `RefashionAI_bg_removed_{UUID}.{ext}` | `/processed_images/` |
| **Upscaled Images** | `RefashionAI_upscaled_{baseName}_{UUID}.{ext}` | `RefashionAI_upscaled_{UUID}.{ext}` | `/processed_images/` |
| **Generated Videos (All)** | Mixed: `RefashionAI_video_` and `RefashionAI_generated_video_` | `RefashionAI_video_{UUID}.mp4` | `/generated_videos/` |
| **Client Downloads (Video)** | `refashion-video-${item.id}.mp4` | `RefashionAI_video_${item.id}.mp4` | - |

## Key Improvements

### 1. Simplified Processed Image Names
- **Background Removed**: Removed redundant base filename inclusion to prevent excessively long filenames
- **Upscaled Images**: Simplified to avoid filename complexity when processing images multiple times
- **Benefit**: Cleaner, more predictable filenames and avoids potential length issues

### 2. Unified Video Naming
- **Standardized**: All video files now use `RefashionAI_video_{UUID}.mp4` regardless of generation method
- **Consistency**: Webhook and polling methods now produce identically named files
- **Benefit**: Unified naming scheme across all video generation approaches

### 3. Improved Directory Structure
- **New Directory**: Created `/public/uploads/processed_images/` for intermediate processed files
- **Separation**: Background-removed and upscaled images moved from `/user_uploaded_clothing/` to `/processed_images/`
- **Benefit**: Better organization, separating raw user content from application-generated derivatives

### 4. Brand Consistency
- **Client Downloads**: Updated video download names to use `RefashionAI_video_` prefix instead of `refashion-video-`
- **Alignment**: All user-facing filenames now consistently use the RefashionAI branding
- **Benefit**: Reinforced brand consistency across all user interactions

## Files Modified

### Server Actions
1. **`src/ai/actions/remove-background.ts`**
   - Simplified filename generation
   - Updated directory to `processed_images`

2. **`src/ai/actions/upscale-image.ts`**
   - Simplified filename generation
   - Updated directory to `processed_images`

3. **`src/ai/actions/generate-video.ts`**
   - Updated prefix from `RefashionAI_generated_video` to `RefashionAI_video`

### Client Components
4. **`src/components/VideoPlaybackModal.tsx`**
   - Updated download filename to use `RefashionAI_video_` prefix

5. **`src/app/video-generation/page.tsx`**
   - Updated download filename to use consistent `RefashionAI_video_` prefix

6. **`src/components/image-forge-page-client.tsx`**
   - Updated download filename to use consistent `RefashionAI_video_` prefix

### Directory Structure
7. **Created**: `/public/uploads/processed_images/` directory for intermediate processed files

## Benefits

- **Maintainability**: Simplified naming logic reduces complexity in filename generation
- **Consistency**: All files follow predictable naming patterns
- **Organization**: Better file organization with dedicated directories for different file types
- **Branding**: Consistent RefashionAI branding across all user-facing files
- **Scalability**: Cleaner scheme that won't create overly long filenames during multiple processing steps

## Backward Compatibility

These changes are backward compatible as:
- Existing files retain their current names and remain accessible
- The application can handle both old and new naming schemes
- File relationships are maintained through the history data structure, not filename dependencies

## Future Considerations

- The existing files in `/user_uploaded_clothing/` with old naming patterns will continue to work
- New processed images will be stored in the dedicated `/processed_images/` directory
- Consider implementing a cleanup utility to migrate old processed files if desired
