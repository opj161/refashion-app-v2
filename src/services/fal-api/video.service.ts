// src/services/fal-api/video.service.ts
'use server';

import 'server-only';

// FIX: Use factory function instead of global singleton
import { createFalClient } from '@fal-ai/client';

import { createApiLogger } from '@/lib/api-logger';
import { getApiKeyForUser } from '@/services/apiKey.service';
import { getBooleanSetting } from '@/services/settings.service';

// Strict adherence to the documentation provided
const FAL_MODEL_ID = 'fal-ai/bytedance/seedance/v1/pro/fast/image-to-video';

export interface VideoGenerationInput {
  prompt: string;
  image_url: string;
  // videoModel removed from active logic, optionally kept in type for compatibility if needed
  resolution?: '480p' | '720p' | '1080p';
  duration?: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
  camera_fixed?: boolean;
  seed?: number;
  // aspect_ratio is supported by the model ("auto" default), added here if UI sends it later
  aspect_ratio?: "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "auto";
}

export interface VideoGenerationResult {
  video?: {
    url: string;
  };
  seed?: number;
}

/**
 * Starts a video generation task using a webhook for completion notification
 * Enforces use of Seedance Pro Fast model.
 */
export async function startVideoGenerationWithWebhook(
  input: VideoGenerationInput, 
  webhookUrl: string, 
  username: string
): Promise<string> {
  const logger = createApiLogger('FAL_VIDEO', 'Video Generation (Webhook)', {
    username,
    model: FAL_MODEL_ID,
  });

  // 1. Securely retrieve the user-specific API key
  const apiKey = await getApiKeyForUser(username, 'fal');

  // 2. Create a scoped client instance (Fixes Singleton Mutation)
  const fal = createFalClient({
    credentials: apiKey,
  });

  // 3. Construct payload strictly according to docs
  const falInput: any = {
    prompt: input.prompt,
    image_url: input.image_url,
    enable_safety_checker: false, // Disable NSFW/Concept safety filter
  };

  // Add optional parameters only if defined
  if (input.resolution) falInput.resolution = input.resolution;
  if (input.duration) falInput.duration = input.duration;
  if (typeof input.camera_fixed === 'boolean') falInput.camera_fixed = input.camera_fixed;
  if (typeof input.seed === 'number' && input.seed !== undefined) falInput.seed = input.seed;
  if (input.aspect_ratio) falInput.aspect_ratio = input.aspect_ratio;

  // Default safety checker to true as per docs default, or expose if needed
  // falInput.enable_safety_checker = true; 

  logger.start({
    modelId: FAL_MODEL_ID,
    promptLength: input.prompt.length,
    imageUrl: input.image_url.substring(0, 100),
    resolution: input.resolution || '1080p', // Doc default
    duration: input.duration || '5',         // Doc default
    webhookUrl: webhookUrl.substring(0, 100),
  });

  try {
    logger.progress('Submitting to Fal.ai queue');
    
    const { request_id } = await fal.queue.submit(FAL_MODEL_ID, {
      input: falInput,
      webhookUrl: webhookUrl,
    });
    
    logger.success({
      requestId: request_id,
    });
    
    return request_id;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Gets the status and result of a video generation task
 */
export async function getVideoGenerationResult(taskId: string): Promise<VideoGenerationResult | null> {
  // NOTE: For status checks, we use the global environment key as fallback 
  // since this is often a polling operation where user context might be looser,
  // but ideally, we should pass the user context here too.
  const fal = createFalClient({ credentials: process.env.FAL_KEY }); 
  
  try {
    console.log(`Checking status of video generation task: ${taskId}`);
    
    const result = await fal.queue.status(FAL_MODEL_ID, {
      requestId: taskId,
      logs: process.env.NODE_ENV === 'development'
    });
    
    if (result.status === 'COMPLETED') {
      console.log('Video generation completed successfully');
      return (result as any).responseBody as VideoGenerationResult;
    } else {
      console.log(`Video generation still in progress. Status: ${result.status}`);
      return null; 
    }
    
  } catch (error) {
    console.error('Error checking video generation status:', error);
    throw new Error(`Failed to check video generation status: ${(error as Error).message}`);
  }
}

/**
 * Checks if the video generation service is available by verifying configuration
 * @returns Promise<boolean> True if the service is configured and available
 */
export async function isVideoServiceAvailable(): Promise<boolean> {
  // Check if the feature flag is enabled AND FAL_KEY is set
  const featureEnabled = await getBooleanSetting('feature_video_generation');
  return featureEnabled && !!process.env.FAL_KEY;
}
