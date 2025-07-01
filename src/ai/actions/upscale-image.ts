/**
 * @fileOverview Server action for image upscaling using Visionatrix API.
 *
 * This file provides server-side actions to handle image upscaling requests,
 * interact with the Visionatrix API service, and save the processed images.
 */
'use server';

import { upscaleImage, checkUpscalingAvailability } from '@/ai/services/visionatrix-api';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { getCachedImagePath, setCachedImagePath } from './cache-manager';

/**
 * Save the upscaled image locally.
 * This function is similar to saveBackgroundRemovedImage but adapted for upscaled images.
 * @param imageDataUri The processed image as a data URI.
 * @param originalFileName Optional original filename for reference.
 * @returns Promise<string> The local relative path of the saved image.
 */
async function saveUpscaledImage(
  imageDataUri: string,
  originalFileName?: string
): Promise<string> {
  const match = imageDataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URI format for upscaled image save');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  // Assuming upscaled images are PNG, or detecting from mimeType
  const extension = mimeType.split('/')[1] || 'png';

  // Create filename with upscaling indicator - simplified naming
  const uniqueFileName = `RefashionAI_upscaled_${uuidv4()}.${extension}`;

  const subfolder = 'processed_images'; // Updated to use dedicated subfolder
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder);

  // Ensure the directory exists
  if (!fs.existsSync(uploadDir)) {
    // Create directory with appropriate permissions if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
    console.log(`Created directory: ${uploadDir} with 777 permissions`);
  }

  const filePath = path.join(uploadDir, uniqueFileName);

  // Write the file with proper permissions
  fs.writeFileSync(filePath, buffer, { mode: 0o777 });
  console.log(`Upscaled image saved to: ${filePath} with 777 permissions`);

  // Explicitly set permissions again, as writeFileSync mode might be affected by umask
  try {
    fs.chmodSync(filePath, 0o777);
    console.log(`Set file permissions to 777 for: ${filePath}`);
  } catch (chmodError) {
    console.warn(`Warning: Could not set file permissions for ${filePath}:`, chmodError);
  }

  // Set proper ownership using PUID/PGID if available (for Docker environments)
  const puid = process.env.PUID;
  const pgid = process.env.PGID;
  if (puid && pgid) {
    try {
      fs.chownSync(filePath, parseInt(puid, 10), parseInt(pgid, 10));
      console.log(`Set file ownership to ${puid}:${pgid} for: ${filePath}`);
    } catch (chownError) {
      console.warn(`Warning: Could not set file ownership for ${filePath}:`, chownError);
    }
  }

  const relativeUrl = `/uploads/${subfolder}/${uniqueFileName}`;
  console.log(`Upscaled image saved locally to: ${filePath}, accessible at: ${relativeUrl}`);
  return relativeUrl;
}

/**
 * Upscales an image using the Visionatrix API and saves it locally.
 * @param imageDataUri The original image as a data URI.
 * @param imageHash Optional hash of the original image for caching.
 * @param originalFileName Optional original filename for reference in saving.
 * @returns Promise an object containing the local relative path of the upscaled image and the scenario used.
 */
export async function upscaleImageAction(
  imageDataUri: string,
  imageHash?: string,
  originalFileName?: string
): Promise<{ savedPath: string; scenarioUsed: 'primary' | 'fallback' }> {
  if (!imageDataUri) {
    throw new Error('Image data URI is required for upscaling.');
  }

  // Check cache first if hash is provided
  if (imageHash) {
    const cachedPath = await getCachedImagePath(imageHash, 'upscaled');
    if (cachedPath) {
      console.log(`[Cache] HIT: Found upscaled image for hash ${imageHash}`);
      return { savedPath: cachedPath, scenarioUsed: 'primary' }; // Return primary as default for cached
    }
    console.log(`[Cache] MISS: No cached upscaled image for hash ${imageHash}`);
  }

  try {
    // Check if Visionatrix upscaling service is available
    const isAvailable = await checkUpscalingAvailability();
    if (!isAvailable) {
      throw new Error('Visionatrix upscaling service is not available. Please check configuration or service status.');
    }

    console.log('Starting upscaling process via server action...');

    // Upscale image using Visionatrix API service
    const { imageDataUri: processedImageDataUri, scenarioUsed } = await upscaleImage(imageDataUri);

    // Save the processed (upscaled) image locally
    const savedPath = await saveUpscaledImage(processedImageDataUri, originalFileName);

    // Cache the result if hash is provided
    if (imageHash) {
      await setCachedImagePath(imageHash, 'upscaled', savedPath);
      console.log(`[Cache] SET: Stored upscaled image for hash ${imageHash}`);
    }

    console.log(`Image upscaling completed successfully using ${scenarioUsed} scenario. Saved to: ${savedPath}`);
    return { savedPath, scenarioUsed };

  } catch (error) {
    console.error('Error in upscale image action:', error);
    // Ensure the error message is propagated
    throw new Error(`Image upscaling failed: ${(error as Error).message}`);
  }
}

/**
 * Checks if the image upscaling feature is available.
 * @returns Promise<boolean> True if the upscaling service is available, false otherwise.
 */
export async function isUpscalingAvailable(): Promise<boolean> {
  try {
    return await checkUpscalingAvailability();
  } catch (error) {
    console.warn('Failed to check Visionatrix upscaling availability in action:', error);
    return false;
  }
}
