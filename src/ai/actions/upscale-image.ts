'use server';

/**
 * @fileOverview Server action for image upscaling and face enhancement using Fal.ai API
 * 
 * This action handles both image upscaling and face detail enhancement for user-uploaded clothing images
 * and integrates with the existing image upload workflow.
 */

import { fal } from '@fal-ai/client';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { getCachedImagePath, setCachedImagePath } from './cache-manager';

const UPSCALE_PROMPT = "high quality photography, detailed natural skin, high-quality clothing";
const NEGATIVE_UPSCALE_PROMPT = "low quality, ugly";
const FACE_PROMPT = "photorealistic, detailed natural skin, relatable fashion model, Genuine beauty, high quality, 8k, sharp";
const NEGATIVE_FACE_PROMPT = "weird, ugly, make-up, cartoon, anime";

/**
 * Save the upscaled image locally
 * @param imageDataUri The processed image as a data URI
 * @param originalFileName Optional original filename for reference
 * @returns Promise<string> The local relative path of the saved image
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
  const extension = mimeType.split('/')[1] || 'png';
  
  // Create filename with upscaling indicator
  const uniqueFileName = `RefashionAI_upscaled_${uuidv4()}.${extension}`;
  
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
  console.log(`Upscaled image saved locally to: ${filePath}, accessible at: ${relativeUrl}`);
  return relativeUrl;
}

/**
 * Upscale and enhance a user-uploaded image
 * @param imageDataUri The original image as a data URI or public URL
 * @param imageHash Optional hash of the original image for caching
 * @param originalFileName Optional original filename for reference
 * @returns Promise an object containing the local relative path of the upscaled image
 */
export async function upscaleImageAction(
  imageDataUri: string,
  imageHash?: string,
  originalFileName?: string
): Promise<{ savedPath: string }> {
  if (!imageDataUri) {
    throw new Error('Image data URI or URL is required for upscaling');
  }

  // Check cache first if hash is provided
  if (imageHash) {
    const cachedPath = await getCachedImagePath(imageHash, 'upscaled');
    if (cachedPath) {
      console.log(`[Cache] HIT: Found upscaled image for hash ${imageHash}`);
      return { savedPath: cachedPath };
    }
    console.log(`[Cache] MISS: No cached upscaled image for hash ${imageHash}`);
  }
  
  try {
    console.log('Starting image upscaling process with Fal.ai...');

    // Process image using Fal.ai upscaler
    const result: any = await fal.subscribe("comfy/opj161/sd-ultimateface", {
      input: {
        loadimage_1: imageDataUri,
        prompt_upscale: UPSCALE_PROMPT,
        negative_upscale: NEGATIVE_UPSCALE_PROMPT,
        prompt_face: FACE_PROMPT,
        negative_face: NEGATIVE_FACE_PROMPT,
      },
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && process.env.NODE_ENV === 'development') {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    
    // Extract the output image URL from the result
    // For ComfyUI-based models, the structure is typically result.data.outputs with multiple possible outputs
    let outputImageUrl: string | undefined;
    
    // Try different possible response structures
    if (result?.data?.outputs) {
      // ComfyUI style outputs - look for image outputs
      for (const [nodeId, output] of Object.entries(result.data.outputs)) {
        if (output && typeof output === 'object' && 'images' in output && Array.isArray(output.images) && output.images.length > 0) {
          outputImageUrl = output.images[0]?.url;
          if (outputImageUrl) break;
        }
      }
    } else if (result?.data?.images?.[0]?.url) {
      // Standard images array format
      outputImageUrl = result.data.images[0].url;
    } else if (result?.data?.image?.url) {
      // Single image format (like background removal)
      outputImageUrl = result.data.image.url;
    }
    
    if (!outputImageUrl) {
      console.error('Fal.ai raw result:', JSON.stringify(result, null, 2)); // Log the full result for diagnostics
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
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const base64ImageData = imageBuffer.toString('base64');
    const processedImageDataUri = `data:${contentType};base64,${base64ImageData}`;
    
    // Save the processed image locally
    const savedPath = await saveUpscaledImage(processedImageDataUri, originalFileName);
    
    // Cache the result if hash is provided
    if (imageHash) {
      await setCachedImagePath(imageHash, 'upscaled', savedPath);
      console.log(`[Cache] SET: Stored upscaled image for hash ${imageHash}`);
    }
    
    console.log('Image upscaling completed successfully using Fal.ai.');
    return { savedPath };
    
  } catch (error) {
    console.error('Error in upscale image action (Fal.ai):', error);
    throw new Error(`Image upscaling with Fal.ai failed: ${(error as Error).message}`);
  }
}

/**
 * Face detailer action - alias for upscaleImageAction since they now use the same enhanced API
 * @param imageDataUri The original image as a data URI or public URL
 * @param imageHash Optional hash of the original image for caching
 * @param originalFileName Optional original filename for reference
 * @returns Promise an object containing the local relative path of the processed image
 */
export async function faceDetailerAction(
  imageDataUri: string,
  imageHash?: string,
  originalFileName?: string
): Promise<{ savedPath: string }> {
  // Delegate to the main upscaling action which now handles face enhancement too
  return upscaleImageAction(imageDataUri, imageHash, originalFileName);
}

/**
 * Checks if the image upscaling service is configured and available.
 * @returns {Promise<boolean>} True if the service is available, otherwise false.
 */
export async function isUpscaleServiceAvailable(): Promise<boolean> {
  // Availability is determined by the presence of the FAL_KEY in the environment variables.
  return !!process.env.FAL_KEY;
}

/**
 * Checks if the face detailing service is configured and available.
 * @returns {Promise<boolean>} True if the service is available, otherwise false.
 */
export async function isFaceDetailerAvailable(): Promise<boolean> {
  // Same availability check as upscaling since they use the same service
  return isUpscaleServiceAvailable();
}
