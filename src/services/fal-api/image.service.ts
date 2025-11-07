'use server';

import 'server-only';

/**
 * Generates an image using Fal.ai's Gemini 2.5 Flash Image model.
 * @param prompt The text prompt for generation.
 * @param imageUrl The public URL of the source image.
 * @param username The user performing the action for authentication.
 * @returns Promise<{imageUrl: string, description?: string}> The result from FAL.AI
 */
export async function generateWithGemini25Flash(
  prompt: string,
  imageUrl: string, // MUST be a public URL
  username: string
): Promise<{ imageUrl: string; description?: string }> {
  try {
    console.log(`Calling FAL.AI Gemini 2.5 Flash for image generation...`);

    const input = {
      prompt: prompt,
      image_urls: [imageUrl], // The API expects a list
      num_images: 1,
      output_format: "png" as const,
    };

    console.log(`FAL.AI Input:`, { 
      prompt: prompt.slice(0, 100) + (prompt.length > 100 ? '...' : ''),
      image_urls: [imageUrl],
      num_images: 1,
      output_format: "png"
    });

    const result: any = await fal.subscribe("fal-ai/gemini-25-flash-image/edit", {
      input,
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS" && update.logs && process.env.NODE_ENV === 'development') {
          (update.logs as any[]).forEach((log: any) => 
            console.log(`[FAL.AI Gemini 2.5 Progress]: ${log.message}`)
          );
        }
      },
    });

    console.log(`FAL.AI Raw Response:`, JSON.stringify(result?.data, null, 2));

    // Parse response according to FAL.AI Gemini 2.5 Flash documentation:
    // Expected format: { images: [{ url: "..." }], description: "..." }
    if (!result?.data?.images?.[0]?.url) {
      console.error('FAL.AI Gemini 2.5 unexpected response format:', JSON.stringify(result, null, 2));
      throw new Error('FAL.AI Gemini 2.5 did not return expected image format. Expected: { images: [{ url: "..." }] }');
    }

    const imageUrl_result = result.data.images[0].url;
    const description = result.data.description || undefined;

    console.log(`FAL.AI Gemini 2.5 generation completed successfully. Image URL: ${imageUrl_result}`);
    
    return {
      imageUrl: imageUrl_result,
      description: description
    };

  } catch (error) {
    console.error('Error in FAL.AI Gemini 2.5 generation:', error);
    throw new Error(`FAL.AI Gemini 2.5 generation failed: ${(error as Error).message}`);
  }
}

/**
 * Legacy function - generates an image using generic workflow (kept for other FAL.AI models)
 * @deprecated Use generateWithGemini25Flash for Gemini 2.5 Flash specifically
 */
export async function generateWithGemini25FlashLegacy(
  prompt: string,
  imageUrl: string,
  username: string
): Promise<string> {
  const input = {
    prompt: prompt,
    image_urls: [imageUrl],
    num_images: 1,
    output_format: "png" as const,
  };

  return await runFalImageWorkflow(
    "fal-ai/gemini-25-flash-image/edit",
    input,
    'Gemini 2.5 Image Generation',
    username
  );
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

import { fal } from '@/lib/fal-client';

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
 * @param modelId The ID of the Fal.ai model to run.
 * @param input The input object for the model.
 * @param taskName A descriptive name for the task for logging purposes.
 * @returns Promise<string> The URL of the processed image from Fal.ai.
 */
async function runFalImageWorkflow(modelId: string, input: any, taskName: string, username: string): Promise<string> {
  try {
    console.log(`Calling Fal.ai ${modelId} for ${taskName}...`);

    // NO MORE createFalClient, NO MORE ensureUrl
    // The input object (e.g., { image_url: "data:image/png;base64,..." })
    // is passed directly to the client. The fal client automatically handles
    // data URIs by uploading them to Fal storage.

    const result: any = await fal.subscribe(modelId, {
      input,
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS" && update.logs && process.env.NODE_ENV === 'development') {
          (update.logs as any[]).forEach((log: any) => console.log(`[Fal.ai Progress - ${taskName}]: ${log.message}`));
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
      console.error(`Fal.ai ${taskName} raw result:`, JSON.stringify(result, null, 2));
      throw new Error(`Fal.ai (${taskName}) did not return a valid image URL.`);
    }

    console.log(`${taskName} completed successfully.`);
    return outputImageUrl;
  } catch (error) {
    console.error(`Error in Fal.ai ${taskName}:`, error);
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
