'use server';

/**
 * @fileOverview Fal.ai API service for video processing operations
 * 
 * This service handles low-level communication with Fal.ai APIs for video-related tasks:
 * - Video generation using Seedance image-to-video model
 * 
 * These functions interact directly with Fal.ai and return task IDs or raw results.
 * They do not handle local storage or history management.
 */

import { fal } from '@fal-ai/client';

export interface VideoGenerationInput {
  prompt: string;
  image_url: string;
  resolution?: '480p' | '720p';
  duration?: '5' | '10';
  camera_fixed?: boolean;
  seed?: number;
}

export interface VideoGenerationResult {
  video?: {
    url: string;
  };
  seed?: number;
}

/**
 * Starts a video generation task using Fal.ai's Seedance service
 * @param input The video generation parameters
 * @returns Promise<string> The task ID for tracking the video generation
 */
export async function startVideoGeneration(input: VideoGenerationInput): Promise<string> {
  try {
    console.log('Starting video generation with Fal.ai Seedance...');
    
    // Prepare the input for Fal.ai, only including defined values
    const falInput: any = {
      prompt: input.prompt,
      image_url: input.image_url,
    };
    
    // Add optional parameters only if they have values
    if (input.resolution) {
      falInput.resolution = input.resolution;
    }
    if (input.duration) {
      falInput.duration = input.duration;
    }
    if (typeof input.camera_fixed === 'boolean') {
      falInput.camera_fixed = input.camera_fixed;
    }
    if (typeof input.seed === 'number' && input.seed !== undefined) {
      falInput.seed = input.seed;
    }
    
    console.log('Fal.ai input parameters:', JSON.stringify(falInput, null, 2));
    
    // Submit the task to Fal.ai queue
    const { request_id } = await fal.queue.submit('fal-ai/bytedance/seedance/v1/lite/image-to-video', {
      input: falInput,
    });
    
    console.log(`Video generation task started. Task ID: ${request_id}`);
    return request_id;
    
  } catch (error) {
    console.error('Error starting video generation:', error);
    throw new Error(`Failed to start video generation: ${(error as Error).message}`);
  }
}

/**
 * Gets the status and result of a video generation task
 * @param taskId The task ID returned from startVideoGeneration
 * @returns Promise<VideoGenerationResult | null> The result if completed, null if still processing
 */
export async function getVideoGenerationResult(taskId: string): Promise<VideoGenerationResult | null> {
  try {
    console.log(`Checking status of video generation task: ${taskId}`);
    
    const result = await fal.queue.status('fal-ai/bytedance/seedance/v1/lite/image-to-video', {
      requestId: taskId,
      logs: process.env.NODE_ENV === 'development'
    });
    
    if (result.status === 'COMPLETED') {
      console.log('Video generation completed successfully');
      return (result as any).responseBody as VideoGenerationResult;
    } else {
      console.log(`Video generation still in progress. Status: ${result.status}`);
      return null; // Still processing
    }
    
  } catch (error) {
    console.error('Error checking video generation status:', error);
    throw new Error(`Failed to check video generation status: ${(error as Error).message}`);
  }
}

/**
 * Submits a video generation request and waits for completion (polling-based)
 * This is an alternative to the webhook-based approach
 * @param input The video generation parameters
 * @returns Promise<VideoGenerationResult> The completed video generation result
 */
export async function generateVideoSync(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  try {
    console.log('Starting synchronous video generation with Fal.ai...');
    
    const falInput: any = {
      prompt: input.prompt,
      image_url: input.image_url,
    };
    
    if (input.resolution) falInput.resolution = input.resolution;
    if (input.duration) falInput.duration = input.duration;
    if (typeof input.camera_fixed === 'boolean') falInput.camera_fixed = input.camera_fixed;
    if (typeof input.seed === 'number' && input.seed !== undefined) falInput.seed = input.seed;
    
    // Use fal.subscribe for polling-based completion
    const result: any = await fal.subscribe('fal-ai/bytedance/seedance/v1/lite/image-to-video', {
      input: falInput,
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && process.env.NODE_ENV === 'development') {
          console.log(`Video generation progress: ${update.status}`);
          if (update.logs) {
            update.logs.forEach(log => console.log(`[Fal.ai]: ${log.message}`));
          }
        }
      },
    });
    
    console.log('Synchronous video generation completed');
    return result.data as VideoGenerationResult;
    
  } catch (error) {
    console.error('Error in synchronous video generation:', error);
    throw new Error(`Synchronous video generation failed: ${(error as Error).message}`);
  }
}

/**
 * Starts a video generation task using a webhook for completion notification
 * @param input The video generation parameters
 * @param webhookUrl The URL that fal.ai will call upon completion
 * @returns Promise<string> The request ID for the submitted job
 */
export async function startVideoGenerationWithWebhook(input: VideoGenerationInput, webhookUrl: string): Promise<string> {
  try {
    console.log('Submitting video job to Fal.ai with webhook:', webhookUrl);
    
    // Prepare the input for Fal.ai, only including defined values
    const falInput: any = {
      prompt: input.prompt,
      image_url: input.image_url,
    };
    
    // Add optional parameters only if they have values
    if (input.resolution) falInput.resolution = input.resolution;
    if (input.duration) falInput.duration = input.duration;
    if (typeof input.camera_fixed === 'boolean') falInput.camera_fixed = input.camera_fixed;
    if (typeof input.seed === 'number' && input.seed !== undefined) falInput.seed = input.seed;
    
    console.log('Fal.ai input parameters:', JSON.stringify(falInput, null, 2));
    
    // Use a direct HTTP request to queue.fal.run with the fal_webhook parameter
    const response = await fetch(`https://queue.fal.run/fal-ai/bytedance/seedance/v1/lite/image-to-video?fal_webhook=${encodeURIComponent(webhookUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(falInput),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook submission failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const requestId = result.request_id || result.gateway_request_id;
    if (!requestId) {
      throw new Error('No request_id returned from webhook submission');
    }

    console.log('Webhook submission successful. Request ID:', requestId);
    return requestId;
    
  } catch (error) {
    console.error('Error in startVideoGenerationWithWebhook:', error);
    throw new Error(`Failed to start video generation with webhook: ${(error as Error).message}`);
  }
}

/**
 * Checks if the video generation service is available by verifying the API key
 * @returns Promise<boolean> True if the service is configured and available
 */
export async function isVideoServiceAvailable(): Promise<boolean> {
  return !!process.env.FAL_KEY;
}
