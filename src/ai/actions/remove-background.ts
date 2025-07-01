'use server';

/**
 * @fileOverview Server action for background removal using Visionatrix API
 * 
 * This action handles background removal for user-uploaded clothing images
 * and integrates with the existing image upload workflow.
 */

import { removeBackgroundFromImage } from '@/ai/services/visionatrix-api'; // Removed checkVisionatrixAvailability
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
// Import fetch if not globally available, or use a library like axios if already in project
// For Node.js environment, 'node-fetch' might be needed if using CommonJS, but Next.js server actions run in a Node.js env that supports fetch
import fs from 'fs';
import path from 'path';
import { getCachedImagePath, setCachedImagePath } from './cache-manager';

/**
 * Save the background-removed image locally
 * @param imageDataUri The processed image as a data URI
 * @param originalFileName Optional original filename for reference
 * @returns Promise<string> The local relative path of the saved image
 */
async function saveBackgroundRemovedImage(
  imageDataUri: string, 
  originalFileName?: string
): Promise<string> {
  const match = imageDataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URI format for background-removed image save');
  }
  
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = mimeType.split('/')[1] || 'png';
  
  // Create filename with background removal indicator - simplified naming
  const uniqueFileName = `RefashionAI_bg_removed_${uuidv4()}.${extension}`;
  
  const subfolder = 'processed_images';
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
  
  // Ensure the directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
  }
  
  const filePath = path.join(uploadDir, uniqueFileName);
  
  // Write the file with proper permissions
  fs.writeFileSync(filePath, buffer, { mode: 0o777 });
  
  // Set proper permissions and ownership
  try {
    fs.chmodSync(filePath, 0o777);
    console.log(`Set file permissions to 777 for: ${filePath}`);
  } catch (chmodError) {
    console.warn(`Warning: Could not set file permissions for ${filePath}:`, chmodError);
  }
  
  // Set proper ownership using PUID/PGID if available
  const puid = process.env.PUID;
  const pgid = process.env.PGID;
  if (puid && pgid) {
    try {
      fs.chownSync(filePath, parseInt(puid), parseInt(pgid));
      console.log(`Set file ownership to ${puid}:${pgid} for: ${filePath}`);
    } catch (chownError) {
      console.warn(`Warning: Could not set file ownership for ${filePath}:`, chownError);
    }
  }
  
  const relativeUrl = `/uploads/${subfolder}/${uniqueFileName}`;
  console.log(`Background-removed image saved locally to: ${filePath}, accessible at: ${relativeUrl}`);
  return relativeUrl;
}

/**
 * Remove background from a user-uploaded image
 * @param imageDataUri The original image as a data URI or public URL
 * @param imageHash Optional hash of the original image for caching
 * @param originalFileName Optional original filename for reference
 * @returns Promise an object containing the local relative path of the background-removed image
 */
export async function removeBackgroundAction(
  imageDataUri: string,
  imageHash?: string,
  originalFileName?: string
): Promise<{ savedPath: string }> { // scenarioUsed removed
  if (!imageDataUri) {
    throw new Error('Image data URI or URL is required for background removal');
  }

  // Check cache first if hash is provided
  if (imageHash) {
    const cachedPath = await getCachedImagePath(imageHash, 'bgRemoved');
    if (cachedPath) {
      console.log(`[Cache] HIT: Found background-removed image for hash ${imageHash}`);
      return { savedPath: cachedPath };
    }
    console.log(`[Cache] MISS: No cached background-removed image for hash ${imageHash}`);
  }
  
  try {
    console.log('Starting background removal process with Fal.ai...');

    // Remove background using Fal.ai (via visionatrix-api.ts)
    // This now returns an object like { outputImageUrl: string }
    const { outputImageUrl } = await removeBackgroundFromImage(imageDataUri);
    
    if (!outputImageUrl) {
      throw new Error('Fal.ai did not return an output image URL.');
    }

    console.log(`Fal.ai processed image URL: ${outputImageUrl}`);

    // Fetch the image from the URL returned by Fal.ai
    const imageResponse = await fetch(outputImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch processed image from Fal.ai: ${imageResponse.statusText}`);
    }
    
    // Convert the image to a buffer, then to a data URI
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get('content-type') || 'image/png'; // Default to png if not specified
    const base64ImageData = imageBuffer.toString('base64');
    const processedImageDataUri = `data:${contentType};base64,${base64ImageData}`;
    
    // Save the processed image locally
    const savedPath = await saveBackgroundRemovedImage(processedImageDataUri, originalFileName);
    
    // Cache the result if hash is provided
    if (imageHash) {
      await setCachedImagePath(imageHash, 'bgRemoved', savedPath);
      console.log(`[Cache] SET: Stored background-removed image for hash ${imageHash}`);
    }
    
    console.log('Background removal completed successfully using Fal.ai.');
    return { savedPath }; // scenarioUsed removed
    
  } catch (error) {
    console.error('Error in background removal action (Fal.ai):', error);
    throw new Error(`Background removal with Fal.ai failed: ${(error as Error).message}`);
  }
}

/**
 * Checks if the background removal service is configured and available.
 * @returns {Promise<boolean>} True if the service is available, otherwise false.
 */
export async function isBackgroundRemovalAvailable(): Promise<boolean> {
  // Availability is determined by the presence of the FAL_KEY in the environment variables.
  // Fal.ai client availability is determined by the API call success and FAL_KEY presence.
  return !!process.env.FAL_KEY;
}
