'use server';

/**
 * @fileOverview Server action for face detailing using Fal.ai API
 * 
 * This action handles face detail enhancement for user-uploaded clothing images
 * and integrates with the existing image upload workflow.
 */

import { fal } from '@fal-ai/client';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { getCachedImagePath, setCachedImagePath } from './cache-manager';

const FACE_PROMPT = "photorealistic, ultra-detailed skin, high quality, 8k, detailed, sharp, natural, relatable fashion model, Genuine beauty";
const NEGATIVE_FACE_PROMPT = "weird, ugly, make-up, cartoon, anime";

/**
 * Save the face-detailed image locally
 * @param imageDataUri The processed image as a data URI
 * @param originalFileName Optional original filename for reference
 * @returns Promise<string> The local relative path of the saved image
 */
async function saveFaceDetailedImage(
  imageDataUri: string, 
  originalFileName?: string
): Promise<string> {
  const match = imageDataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URI format for face-detailed image save');
  }
  
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = mimeType.split('/')[1] || 'png';
  
  // Create filename with face detailing indicator
  const uniqueFileName = `RefashionAI_face_detailed_${uuidv4()}.${extension}`;
  
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
  console.log(`Face-detailed image saved locally to: ${filePath}, accessible at: ${relativeUrl}`);
  return relativeUrl;
}

/**
 * Enhance face details in a user-uploaded image
 * @param imageDataUri The original image as a data URI or public URL
 * @param imageHash Optional hash of the original image for caching
 * @param originalFileName Optional original filename for reference
 * @returns Promise an object containing the local relative path of the face-detailed image
 */
export async function faceDetailerAction(
  imageDataUri: string,
  imageHash?: string,
  originalFileName?: string
): Promise<{ savedPath: string }> {
  if (!imageDataUri) {
    throw new Error('Image data URI or URL is required for face detailing');
  }

  // Check cache first if hash is provided
  if (imageHash) {
    const cachedPath = await getCachedImagePath(imageHash, 'faceDetailed');
    if (cachedPath) {
      console.log(`[Cache] HIT: Found face-detailed image for hash ${imageHash}`);
      return { savedPath: cachedPath };
    }
    console.log(`[Cache] MISS: No cached face-detailed image for hash ${imageHash}`);
  }
  
  try {
    console.log('Starting face detailing process with Fal.ai...');

    // Process image using Fal.ai face detailer
    const result: any = await fal.subscribe("comfy/opj161/face-detailer", {
      input: {
        loadimage_1: imageDataUri,
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
    const savedPath = await saveFaceDetailedImage(processedImageDataUri, originalFileName);
    
    // Cache the result if hash is provided
    if (imageHash) {
      await setCachedImagePath(imageHash, 'faceDetailed', savedPath);
      console.log(`[Cache] SET: Stored face-detailed image for hash ${imageHash}`);
    }
    
    console.log('Face detailing completed successfully using Fal.ai.');
    return { savedPath };
    
  } catch (error) {
    console.error('Error in face detailer action (Fal.ai):', error);
    throw new Error(`Face detailing with Fal.ai failed: ${(error as Error).message}`);
  }
}

/**
 * Checks if the face detailing service is configured and available.
 * @returns {Promise<boolean>} True if the service is available, otherwise false.
 */
export async function isFaceDetailerAvailable(): Promise<boolean> {
  // Availability is determined by the presence of the FAL_KEY in the environment variables.
  return !!process.env.FAL_KEY;
}
