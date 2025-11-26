'use server';

import 'server-only';

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
import { createApiLogger } from '@/lib/api-logger';

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

  const logger = createApiLogger('FAL_IMAGE', 'Image Upscaling', {
    username: user.username,
    endpoint: 'fal-ai/sd-ultimateface',
  });

  // Check cache first if hash is provided
  if (imageHash) {
    const cachedEntry = await getCachedImage(imageHash, 'upscaled');
    if (cachedEntry) {
      logger.warning('Using cached result', {
        hash: imageHash,
        path: cachedEntry.path,
      });
      return { savedPath: cachedEntry.path, outputHash: cachedEntry.hash };
    }
  }
  
  logger.start({
    imageUrl: imageUrl.substring(0, 100),
    hasCache: !!imageHash,
  });

  try {
    logger.progress('Reading local file and converting to data URI');
    
    const buffer = await getBufferFromLocalPath(imageUrl);
    const mimeType = mime.lookup(imageUrl) || 'image/png';
    const imageDataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

    logger.progress('Calling Fal.ai API');
    
    const outputImageUrl = await falImageService.upscaleAndEnhance(imageDataUri, user.username);
    
    logger.progress('Saving processed image locally');

    const { relativeUrl, hash: outputHash } = await saveFileFromUrl(
      outputImageUrl, 
      'RefashionAI_upscaled', 
      'processed_images', 
      'png'
    );
    
    // Cache the result if hash is provided
    if (imageHash) {
      await setCachedImage(imageHash, 'upscaled', relativeUrl, outputHash);
      logger.progress('Result cached');
    }
    
    logger.success({
      savedPath: relativeUrl,
      outputHash,
    });
    
    return { savedPath: relativeUrl, outputHash };
    
  } catch (error) {
    logger.error(error);
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

  const logger = createApiLogger('FAL_IMAGE', 'Face Enhancement', {
    username: user.username,
    endpoint: 'fal-ai/face-detailer',
  });

  // Check cache first if hash is provided
  if (imageHash) {
    const cachedEntry = await getCachedImage(imageHash, 'faceDetailed');
    if (cachedEntry) {
      logger.warning('Using cached result', {
        hash: imageHash,
        path: cachedEntry.path,
      });
      return { savedPath: cachedEntry.path, outputHash: cachedEntry.hash };
    }
  }

  logger.start({
    imageUrl: imageUrl.substring(0, 100),
    hasCache: !!imageHash,
  });

  try {
    logger.progress('Reading local file and converting to data URI');
    
    const buffer = await getBufferFromLocalPath(imageUrl);
    const mimeType = mime.lookup(imageUrl) || 'image/png';
    const imageDataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

    logger.progress('Calling Fal.ai face detailer API');

    const outputImageUrl = await falImageService.detailFaces(imageDataUri, user.username);

    logger.progress('Saving processed image locally');

    const { relativeUrl, hash: outputHash } = await saveFileFromUrl(
      outputImageUrl, 
      'RefashionAI_face_enhanced',
      'processed_images', 
      'png'
    );

    // Cache the result if hash is provided
    if (imageHash) {
      await setCachedImage(imageHash, 'faceDetailed', relativeUrl, outputHash);
      logger.progress('Result cached');
    }

    logger.success({
      savedPath: relativeUrl,
      outputHash,
    });
    
    return { savedPath: relativeUrl, outputHash };

  } catch (error) {
    logger.error(error);
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
