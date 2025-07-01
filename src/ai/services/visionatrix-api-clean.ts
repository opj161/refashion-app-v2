'use server';

/**
 * @fileOverview Fal.ai API integration service for background removal.
 *
 * This service handles communication with:
 * - Fal.ai API to remove backgrounds from clothing images.
 *
 * API Documentation:
 * - Fal.ai: Provided by user
 */

import { Buffer } from 'buffer';
import { fal } from '@fal-ai/client';

/**
 * Main function to remove background from an image using Fal.ai
 * @param imageDataUri The image as a data URI or a public URL
 * @returns Promise an object containing the processed image URL
 */
export async function removeBackgroundFromImage(
  imageDataUri: string
): Promise<{ outputImageUrl: string }> {
  try {
    console.log('Starting background removal process with Fal.ai...');

    // Process the image using Fal.ai's background removal service
    const result: any = await fal.subscribe("fal-ai/rembg", {
      input: {
        image_url: imageDataUri,
      },
      logs: process.env.NODE_ENV === 'development', // Enable logs in development for easier debugging
      onQueueUpdate: (update) => {
        // Optional: Log queue updates, e.g., progress
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach(log => console.log(`[Fal.ai Progress]: ${log.message}`));
        }
      },
    });

    // According to Fal.ai documentation, the output structure for rembg is:
    // { "data": { "image": { "url": "...", "content_type": "...", ... } } }
    if (result && result.data && result.data.image && result.data.image.url) {
      console.log('Background removal completed successfully with Fal.ai.');
      return { outputImageUrl: result.data.image.url };
    } else {
      console.error('Fal.ai background removal response did not contain the expected image URL.');
      console.error('Fal.ai raw result:', result); // Log the full result for diagnostics
      throw new Error('Fal.ai background removal failed to return a valid image URL.');
    }
  } catch (error) {
    console.error('Error during Fal.ai background removal call:', error);
    // Check if the error is from Fal.ai client or a network issue, etc.
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
      const response = error.response as any;
      console.error('Fal.ai API error response:', response.data);
      throw new Error(`Fal.ai background removal API error: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    // For other types of errors (network, timeout, etc.)
    throw new Error(`Background removal with Fal.ai failed: ${(error as Error).message}`);
  }
}

/**
 * Check if Visionatrix service is available and configured
 * @returns Promise<boolean> True if service is available
 */
export async function checkVisionatrixAvailability(): Promise<boolean> {
  // Since we're only using Fal.ai now, always return false for Visionatrix
  return false;
}
