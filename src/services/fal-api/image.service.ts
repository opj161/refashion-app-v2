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

// Constants for upscaling and face enhancement
const UPSCALE_PROMPT = "high quality photography, detailed natural skin, high-quality clothing";
const NEGATIVE_UPSCALE_PROMPT = "low quality, ugly";
const UPSCALE_FACE_PROMPT = "photorealistic, detailed natural skin, relatable fashion model, Genuine beauty, high quality, 8k, sharp";
const NEGATIVE_UPSCALE_FACE_PROMPT = "weird, ugly, make-up, cartoon, anime";

// NEW: Constants for the dedicated Face Detailer endpoint
const FACE_DETAILER_PROMPT = "photorealistic, ultra-detailed skin, high quality, 8k, detailed, sharp, natural, relatable fashion model, Genuine beauty";
const NEGATIVE_FACE_DETAILER_PROMPT = "weird, ugly, make-up, cartoon, anime";

/**
 * Removes background from an image using Fal.ai's rembg service
 * @param imageUrl The image data URI to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    console.log('Calling Fal.ai rembg service for background removal...');
    
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
 * @param imageUrl The image URL or data URI to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function upscaleAndEnhance(imageUrl: string): Promise<string> {
  try {
    console.log('Calling Fal.ai sd-ultimateface service for upscaling and enhancement...');
    
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
      // Standard images array format
      outputImageUrl = result.data.images[0].url;
    } else if (result?.data?.image?.url) {
      // Single image format
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
    throw new Error(`Image upscaling failed: ${(error as Error).message}`);
  }
}

/**
 * NEW: Enhances face details using Fal.ai's dedicated face-detailer service
 * @param imageUrl The image URL or data URI to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function enhanceFaceDetails(imageUrl: string): Promise<string> {
  try {
    console.log('Calling Fal.ai comfy/opj161/face-detailer service...');
    
    const result: any = await fal.subscribe("comfy/opj161/face-detailer", {
      input: {
        loadimage_1: imageUrl,
        prompt_face: FACE_DETAILER_PROMPT,
        negative_face: NEGATIVE_FACE_DETAILER_PROMPT,
      },
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && process.env.NODE_ENV === 'development') {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    // The output extraction logic is the same as other ComfyUI workflows
    let outputImageUrl: string | undefined;
    if (result?.data?.outputs) {
      for (const [nodeId, output] of Object.entries(result.data.outputs)) {
        if (output && typeof output === 'object' && 'images' in output && Array.isArray(output.images) && output.images.length > 0) {
          outputImageUrl = output.images[0]?.url;
          if (outputImageUrl) break;
        }
      }
    } else if (result?.data?.image?.url) {
        outputImageUrl = result.data.image.url;
    }

    if (!outputImageUrl) {
      console.error('Fal.ai face-detailer raw result:', JSON.stringify(result, null, 2));
      throw new Error("Fal.ai (face-detailer) did not return a valid image URL.");
    }
    
    console.log('Face enhancement completed successfully.');
    return outputImageUrl;
    
  } catch (error) {
    console.error('Error in Fal.ai face detailer:', error);
    throw new Error(`Face enhancement failed: ${(error as Error).message}`);
  }
}

/**
 * Checks if the Fal.ai service is available by verifying the API key
 * @returns Promise<boolean> True if the service is configured and available
 */
export async function isServiceAvailable(): Promise<boolean> {
  return !!process.env.FAL_KEY;
}
