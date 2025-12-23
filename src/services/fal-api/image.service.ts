// SECURITY FIX: Removed 'use server' directive.
// This service makes API calls using user credentials and should only be callable by server-side code.

import 'server-only';

// REMOVED: import { fal } from '@/lib/fal-client';
import { createFalClient } from '@fal-ai/client';
import { createApiLogger } from '@/lib/api-logger';
import { getApiKeyForUser } from '@/services/apiKey.service'; // Import key service

/**
 * Generates an image using Fal.ai's Gemini 2.5 Flash Image model.
 * @param prompt The text prompt for generation.
 * @param imageUrl The public URL of the source image.
 * @param username The user performing the action for authentication.
 * @returns Promise<{imageUrl: string, description?: string}> The result from FAL.AI
 */
export async function generateWithFalEditModel(
  prompt: string,
  imageUrl: string, // MUST be a public URL
  username: string,
  modelId: 'fal-ai/gemini-25-flash-image/edit' | 'fal-ai/nano-banana-pro/edit',
  apiKey?: string,
  options?: { aspectRatio?: string } // NEW: Options argument
): Promise<{ imageUrl: string; description?: string }> {
  const logger = createApiLogger('FAL_IMAGE', `Generation (${modelId.split('/')[1]})`, {
    username,
    model: modelId,
  });

  // Construct input with optional aspect ratio
  const input: any = {
    prompt: prompt,
    image_urls: [imageUrl],
    num_images: 1,
    output_format: "png",
  };

  // Only add aspect_ratio if explicitly provided AND model supports it (Nano Banana)
  if (options?.aspectRatio && modelId.includes('nano-banana-pro')) {
    input.aspect_ratio = options.aspectRatio;
  }

  logger.start({
    promptLength: prompt.length,
    aspectRatio: input.aspect_ratio, // Log it
  });

  try {
    logger.progress('Submitting to Fal.ai queue');

    // Resolve Key: Priority to argument, then DB lookup, then Env
    let keyToUse = apiKey;
    if (!keyToUse) {
       keyToUse = await getApiKeyForUser(username, 'fal');
    }

    // REFACTORED: Create scoped client
    const fal = createFalClient({
      credentials: keyToUse,
    });

    // Use scoped client
    const result: any = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          update.logs.forEach((log: any) => logger.progress(`Queue: ${log.message}`));
        }
      },
    });

    // Parse response
    // Expected format from Fal: { images: [{ url: "..." }], description: "..." }
    // The result object from subscribe contains the data in `data` property
    const data = result.data;
    
    if (!data?.images?.[0]?.url) {
      console.error("Unexpected Fal Response:", JSON.stringify(data, null, 2));
      throw new Error('Unexpected response format. Expected: { images: [{ url: "..." }] }');
    }

    const imageUrl_result = data.images[0].url;
    const description = data.description || undefined;

    logger.success({
      imageUrl: imageUrl_result,
      hasDescription: !!description,
    });
    
    return {
      imageUrl: imageUrl_result,
      description: description
    };

  } catch (error) {
    logger.error(error);
    throw new Error(`FAL.AI generation failed: ${(error as Error).message}`);
  }
}

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

// Constants for upscaling and face enhancement
const UPSCALE_PROMPT = "high quality fashion photography, high-quality clothing, natural, 8k";
const NEGATIVE_UPSCALE_PROMPT = "low quality, ugly, make-up, fake, deformed";
const UPSCALE_FACE_PROMPT = "photorealistic, detailed natural skin, high quality, natural fashion model";
const NEGATIVE_UPSCALE_FACE_PROMPT = "weird, ugly, make-up, cartoon, anime";

// NEW: Constants for the dedicated Face Detailer endpoint
const FACE_DETAILER_PROMPT = "photorealistic, detailed natural skin, high quality, natural fashion model, defined facial features";
const NEGATIVE_FACE_DETAILER_PROMPT = "weird, ugly, make-up, cartoon, anime";

/**
 * Generic helper to run a Fal.ai image workflow, handling subscription and response parsing.
 * 
 * This function uses the proxied fal client which automatically handles:
 * - API key authentication via server-side proxy
 * - Data URI uploads to Fal storage (no manual conversion needed)
 * - Request queuing and progress tracking
 * 
 * @param modelId The ID of the Fal.ai model to run.
 * @param input The input object for the model. Data URIs are automatically uploaded.
 * @param taskName A descriptive name for the task for logging purposes.
 * @param username The username (preserved for compatibility, not used for auth).
 * @returns Promise<string> The URL of the processed image from Fal.ai.
 */
async function runFalImageWorkflow(modelId: string, input: any, taskName: string, username: string): Promise<string> {
  const logger = createApiLogger('FAL_IMAGE', taskName, {
    username,
    endpoint: modelId,
  });

  logger.start({
    modelId,
    inputKeys: Object.keys(input).join(', '),
  });

  try {
    // 1. Get the user's specific key
    const apiKey = await getApiKeyForUser(username, 'fal');

    // 2. Create scoped client
    const fal = createFalClient({
      credentials: apiKey,
    });

    logger.progress('Submitting to Fal.ai queue');

    // 3. Use scoped client
    const result: any = await fal.subscribe(modelId, {
      input,
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS" && update.logs && process.env.NODE_ENV === 'development') {
          (update.logs as any[]).forEach((log: any) => logger.progress(`Queue: ${log.message}`));
        }
      },
    });

    // Robustly parse the output to find the image URL
    let outputImageUrl: string | undefined;
    if (result?.data?.outputs) {
      for (const output of Object.values(result.data.outputs) as any) {
        if (output?.images?.[0]?.url) {
          outputImageUrl = output.images[0].url;
          break;
        }
      }
    } else if (result?.data?.images?.[0]?.url) {
      outputImageUrl = result.data.images[0].url;
    } else if (result?.data?.image?.url) {
      outputImageUrl = result.data.image.url;
    }

    if (!outputImageUrl) {
      throw new Error('Fal.ai did not return a valid image URL');
    }

    logger.success({
      imageUrl: outputImageUrl,
    });

    return outputImageUrl;
  } catch (error) {
    logger.error(error);
    throw new Error(`${taskName} failed: ${(error as Error).message}`);
  }
}

/**
 * Removes background from an image using Fal.ai's rembg service
 * @param imageUrlOrDataUri The image data URI or public URL to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function removeBackground(imageUrlOrDataUri: string, username: string): Promise<string> {
  return runFalImageWorkflow("fal-ai/rembg", { image_url: imageUrlOrDataUri }, 'Background Removal', username);
}

/**
 * Upscales and enhances an image using Fal.ai's sd-ultimateface service
 * @param imageUrlOrDataUri The image URL or data URI to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function upscaleAndEnhance(imageUrlOrDataUri: string, username: string): Promise<string> {
  const input = {
    loadimage_1: imageUrlOrDataUri,
    prompt_upscale: UPSCALE_PROMPT,
    negative_upscale: NEGATIVE_UPSCALE_PROMPT,
    prompt_face: UPSCALE_FACE_PROMPT,
    negative_face: NEGATIVE_UPSCALE_FACE_PROMPT,
  };
  return runFalImageWorkflow("comfy/opj161/sd-ultimateface", input, 'Upscaling and Enhancement', username);
}

/**
 * Enhances faces in an image using Fal.ai's face-detailer service
 * @param imageUrlOrDataUri The image URL or data URI to process
 * @returns Promise<string> The URL of the processed image from Fal.ai
 */
export async function detailFaces(imageUrlOrDataUri: string, username: string): Promise<string> {
  const input = {
    loadimage_1: imageUrlOrDataUri,
    prompt_face: FACE_DETAILER_PROMPT,
    negative_face: NEGATIVE_FACE_DETAILER_PROMPT,
  };
  return runFalImageWorkflow("comfy/opj161/face-detailer", input, 'Face Detailing', username);
}

/**
 * Checks if the Fal.ai services are configured and available.
 * @returns {Promise<boolean>} True if the service is available, otherwise false.
 */
export async function isServiceAvailable(): Promise<boolean> {
  // Check if FAL_KEY environment variable is set (used by the proxy)
  return !!process.env.FAL_KEY;
}
