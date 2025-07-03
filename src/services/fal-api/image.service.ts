'use server';

/**
 * @fileOverview Fal.ai API service for image processing operations
 * 
 * This service handles low-level communication with Fal.ai APIs for image-related tasks:
 * - Background removal using rembg
 * - Image upscaling and face enhancement using sd-ultimateface
 * - Detailed face enhancement using face-detailer
 * 
 * These functions expect data URIs as input and return raw URLs from Fal.ai.
 * They do not handle local storage.
 */

import { fal } from '@fal-ai/client';
import { uploadToFalStorage } from '@/ai/actions/generate-video.action';

// Constants for upscaling and face enhancement
const UPSCALE_PROMPT = "high quality fashion photography, high-quality clothing, natural, 8k";
const NEGATIVE_UPSCALE_PROMPT = "low quality, ugly, make-up, fake, deformed";
const UPSCALE_FACE_PROMPT = "photorealistic, detailed natural skin, high quality, natural fashion model";
const NEGATIVE_UPSCALE_FACE_PROMPT = "weird, ugly, make-up, cartoon, anime";

// NEW: Constants for the dedicated Face Detailer endpoint
const FACE_DETAILER_PROMPT = "photorealistic, detailed natural skin, high quality, natural fashion model, defined facial features";
const NEGATIVE_FACE_DETAILER_PROMPT = "weird, ugly, make-up, cartoon, anime";

/**
 * Helper to convert data URI to Blob
 */
function dataUriToBlob(dataURI: string): Blob {
  // Split the data URI
  const [header, data] = dataURI.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

/**
 * Helper to ensure we have a URL (uploads data URI to Fal Storage if needed)
 */
async function ensureUrl(imageUrlOrDataUri: string, tempFileName: string): Promise<string> {
  if (imageUrlOrDataUri.startsWith('data:')) {
    console.log(`Data URI detected for ${tempFileName}, uploading to Fal Storage first...`);
    const blob = dataUriToBlob(imageUrlOrDataUri);
    const file = new File([blob], tempFileName, { type: blob.type || 'image/jpeg' });
    const publicUrl = await uploadToFalStorage(file);
    console.log(`Image uploaded to ${publicUrl}. Now processing.`);
    return publicUrl;
  }
  return imageUrlOrDataUri;
}

/**
 * Removes background from an image using Fal.ai's rembg service
 * @param imageUrlOrDataUri The image data URI or public URL to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function removeBackground(imageUrlOrDataUri: string): Promise<string> {
  try {
    console.log('Calling Fal.ai rembg service for background removal...');
    const imageUrl = await ensureUrl(imageUrlOrDataUri, 'bg-removal-input.jpg');
    const result: any = await fal.subscribe("fal-ai/rembg", {
      input: {
        image_url: imageUrl,
      },
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs && process.env.NODE_ENV === 'development') {
          update.logs.forEach(log => console.log(`[Fal.ai Progress]: ${log.message}`));
        }
      },
    });

    // Extract the image URL from the response
    if (!result?.data?.image?.url) {
      console.error('Fal.ai rembg raw result:', JSON.stringify(result, null, 2));
      throw new Error("Fal.ai (rembg) did not return a valid image URL.");
    }

    console.log('Background removal completed successfully.');
    return result.data.image.url;
    
  } catch (error) {
    console.error('Error in Fal.ai background removal:', error);
    throw new Error(`Background removal failed: ${(error as Error).message}`);
  }
}

/**
 * Upscales and enhances an image using Fal.ai's sd-ultimateface service
 * @param imageUrlOrDataUri The image URL or data URI to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function upscaleAndEnhance(imageUrlOrDataUri: string): Promise<string> {
  try {
    console.log('Calling Fal.ai sd-ultimateface service for upscaling and enhancement...');
    const imageUrl = await ensureUrl(imageUrlOrDataUri, 'upscale-input.jpg');
    const result: any = await fal.subscribe("comfy/opj161/sd-ultimateface", {
      input: {
        loadimage_1: imageUrl,
        prompt_upscale: UPSCALE_PROMPT,
        negative_upscale: NEGATIVE_UPSCALE_PROMPT,
        prompt_face: UPSCALE_FACE_PROMPT,
        negative_face: NEGATIVE_UPSCALE_FACE_PROMPT,
      },
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && process.env.NODE_ENV === 'development') {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    
    // Extract the output image URL from the result
    // For ComfyUI-based models, the structure is typically result.data.outputs
    let outputImageUrl: string | undefined;
    
    if (result?.data?.outputs) {
      // ComfyUI style outputs - look for image outputs
      for (const [nodeId, output] of Object.entries(result.data.outputs)) {
        if (output && typeof output === 'object' && 'images' in output && Array.isArray(output.images) && output.images.length > 0) {
          outputImageUrl = output.images[0]?.url;
          if (outputImageUrl) break;
        }
      }
    } else if (result?.data?.images?.[0]?.url) {
      outputImageUrl = result.data.images[0].url;
    } else if (result?.data?.image?.url) {
      outputImageUrl = result.data.image.url;
    }
    if (!outputImageUrl) {
      console.error('Fal.ai upscale raw result:', JSON.stringify(result, null, 2));
      throw new Error("Fal.ai (upscale) did not return a valid image URL.");
    }
    console.log('Image upscaling and enhancement completed successfully.');
    return outputImageUrl;
    
  } catch (error) {
    console.error('Error in Fal.ai upscaling and enhancement:', error);
    throw new Error(`Upscaling and enhancement failed: ${(error as Error).message}`);
  }
}

/**
 * Enhances faces in an image using Fal.ai's face-detailer service
 * @param imageUrlOrDataUri The image URL or data URI to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function detailFaces(imageUrlOrDataUri: string): Promise<string> {
  try {
    console.log('Calling Fal.ai face-detailer service for face enhancement...');
    const imageUrl = await ensureUrl(imageUrlOrDataUri, 'face-detailing-input.jpg');
    const result: any = await fal.subscribe("comfy/opj161/face-detailer", {
      input: {
        image_url: imageUrl,
        prompt: FACE_DETAILER_PROMPT,
        negative_prompt: NEGATIVE_FACE_DETAILER_PROMPT,
      },
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs && process.env.NODE_ENV === 'development') {
          update.logs.forEach(log => console.log(`[Fal.ai Progress]: ${log.message}`));
        }
      },
    });

    // Extract the image URL from the response
    if (!result?.data?.image?.url) {
      console.error('Fal.ai face-detailer raw result:', JSON.stringify(result, null, 2));
      throw new Error("Fal.ai (face-detailer) did not return a valid image URL.");
    }

    console.log('Face detailing completed successfully.');
    return result.data.image.url;
    
  } catch (error) {
    console.error('Error in Fal.ai face detailing:', error);
    throw new Error(`Face detailing failed: ${(error as Error).message}`);
  }
}

/**
 * Checks if the Fal.ai services are configured and available.
 * @returns {Promise<boolean>} True if the service is available, otherwise false.
 */
export async function isServiceAvailable(): Promise<boolean> {
  // The availability of all Fal.ai services depends on the presence of the FAL_KEY.
  return !!process.env.FAL_KEY;
}
