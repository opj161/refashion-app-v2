'use server';

/**
 * @fileOverview Server action for image upscaling and face enhancement using Fal.ai API
 * 
 * This action orchestrates the image upscaling process by calling the Fal.ai
 * service and saving the result locally using the storage service.
 */

import * as falImageService from '@/services/fal-api/image.service';
import { saveFileFromUrl } from '@/services/storage.service';
import { getCachedImage, setCachedImage } from './cache-manager';
import { getCurrentUser } from '@/actions/authActions';
import mime from 'mime-types';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';

/**
 * Upscale and enhance a user-uploaded image
 * @param imageUrl The original image as a server-relative URL path
 * @param imageHash Optional hash of the original image for caching
 * @param originalFileName Optional original filename for reference
 * @returns Promise an object containing the local relative path of the upscaled image
 */
export async function upscaleImageAction(
  imageUrl: string,
  imageHash?: string
): Promise<{ savedPath: string; outputHash: string }> {
  if (!imageUrl) {
    throw new Error('Image URL is required for upscaling');
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required for upscaling.');
  }

  // Check cache first if hash is provided
  if (imageHash) {
    const cachedEntry = await getCachedImage(imageHash, 'upscaled');
    if (cachedEntry) {
      console.log(`[Cache] HIT: Found upscaled image for hash ${imageHash} at path ${cachedEntry.path}`);
      return { savedPath: cachedEntry.path, outputHash: cachedEntry.hash };
    }
    console.log(`[Cache] MISS: No cached upscaled image for hash ${imageHash}`);
  }
  
  try {
    console.log('Starting image upscaling process with Fal.ai...');

    // Read the local file and convert it to a data URI
    // This ensures Fal.ai receives the image data directly, avoiding localhost access issues.
    const buffer = await getBufferFromLocalPath(imageUrl);
    const mimeType = mime.lookup(imageUrl) || 'image/png';
    const imageDataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Process image using Fal.ai service
    const outputImageUrl = await falImageService.upscaleAndEnhance(imageDataUri, user.username);
    
    console.log(`Fal.ai processed image URL: ${outputImageUrl}`);

    // Save the processed image locally using the storage service
    const { relativeUrl, hash: outputHash } = await saveFileFromUrl(
      outputImageUrl, 
      'RefashionAI_upscaled', 
      'processed_images', 
      'png'
    );
    
    // Cache the result if hash is provided
    if (imageHash) {
      await setCachedImage(imageHash, 'upscaled', relativeUrl, outputHash);
      console.log(`[Cache] SET: Stored upscaled image for hash ${imageHash}`);
    }
    
    console.log('Image upscaling completed successfully using Fal.ai.');
    return { savedPath: relativeUrl, outputHash };
    
  } catch (error) {
    console.error('Error in upscale image action (Fal.ai):', error);
    throw new Error(`Image upscaling with Fal.ai failed: ${(error as Error).message}`);
  }
}

/**
 * Face detailer action - now calls the dedicated face-detailer API
 * @param imageUrl The original image as a server-relative URL path
 * @param imageHash Optional hash of the original image for caching
 * @param originalFileName Optional original filename for reference
 * @returns Promise an object containing the local relative path of the processed image
 */
export async function faceDetailerAction(
  imageUrl: string,
  imageHash?: string
): Promise<{ savedPath: string; outputHash: string }> {
  if (!imageUrl) {
    throw new Error('Image URL is required for face detailing');
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required for face detailing.');
  }

  // Check cache first if hash is provided
  if (imageHash) {
    const cachedEntry = await getCachedImage(imageHash, 'faceDetailed');
    if (cachedEntry) {
      console.log(`[Cache] HIT: Found face-enhanced image for hash ${imageHash} at path ${cachedEntry.path}`);
      return { savedPath: cachedEntry.path, outputHash: cachedEntry.hash };
    }
    console.log(`[Cache] MISS: No cached face-enhanced image for hash ${imageHash}`);
  }

  try {
    console.log('Starting face enhancement process with Fal.ai...');

    // Read the local file and convert it to a data URI
    // This ensures Fal.ai receives the image data directly, avoiding localhost access issues.
    const buffer = await getBufferFromLocalPath(imageUrl);
    const mimeType = mime.lookup(imageUrl) || 'image/png';
    const imageDataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Call the new, specific service function
    const outputImageUrl = await falImageService.detailFaces(imageDataUri, user.username);

    console.log(`Fal.ai face-detailer processed image URL: ${outputImageUrl}`);

    // Save the processed image locally
    const { relativeUrl, hash: outputHash } = await saveFileFromUrl(
      outputImageUrl, 
      'RefashionAI_face_enhanced', // Use a different prefix
      'processed_images', 
      'png'
    );

    // Cache the result if hash is provided
    if (imageHash) {
      await setCachedImage(imageHash, 'faceDetailed', relativeUrl, outputHash);
      console.log(`[Cache] SET: Stored face-enhanced image for hash ${imageHash}`);
    }

    console.log('Face enhancement completed successfully using Fal.ai.');
    return { savedPath: relativeUrl, outputHash };

  } catch (error) {
    console.error('Error in face detailer action (Fal.ai):', error);
    throw new Error(`Face enhancement with Fal.ai failed: ${(error as Error).message}`);
  }
}

/**
 * Checks if the image upscaling service is configured and available.
 * @returns {Promise<boolean>} True if the service is available, otherwise false.
 */
export async function isUpscaleServiceAvailable(): Promise<boolean> {
  return await falImageService.isServiceAvailable();
}

/**
 * Checks if the face detailing service is configured and available.
 * @returns {Promise<boolean>} True if the service is available, otherwise false.
 */
export async function isFaceDetailerAvailable(): Promise<boolean> {
  // Both services rely on the same FAL_KEY, so the availability check is the same.
  return isUpscaleServiceAvailable();
}
