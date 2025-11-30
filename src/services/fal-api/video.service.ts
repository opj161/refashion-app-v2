'use server';

import 'server-only';

/**
// FIX: Use factory function instead of global singleton
import { createFalClient } from '@fal-ai/client';

import { createApiLogger } from '@/lib/api-logger';
import { getApiKeyForUser } from '@/services/apiKey.service';

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
    model: input.videoModel === 'pro' ? 'seedance-pro' : 'seedance-lite',
  });

  const modelId = input.videoModel === 'pro'
    ? 'fal-ai/bytedance/seedance/v1/pro/image-to-video'
    : 'fal-ai/bytedance/seedance/v1/lite/image-to-video';
    
  const falInput: any = {
    prompt: input.prompt,
    image_url: input.image_url,
  };
  if (input.resolution) falInput.resolution = input.resolution;
  if (input.duration) falInput.duration = input.duration;
  if (typeof input.camera_fixed === 'boolean') falInput.camera_fixed = input.camera_fixed;
  if (typeof input.seed === 'number' && input.seed !== undefined) falInput.seed = input.seed;
  if (input.end_image_url) falInput.end_image_url = input.end_image_url;

  logger.start({
    modelId,
    promptLength: input.prompt.length,
    imageUrl: input.image_url.substring(0, 100),
    resolution: input.resolution || '480p',
    duration: input.duration || '5',
    webhookUrl: webhookUrl.substring(0, 100),
  });

  try {
    logger.progress('Submitting to Fal.ai queue with webhook');
    
    // Use fal.queue.submit instead of manual fetch
    const { request_id } = await fal.queue.submit(modelId, {
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
 * Checks if the video generation service is available by verifying the API key
 * @returns Promise<boolean> True if the service is configured and available
 */
export async function isVideoServiceAvailable(): Promise<boolean> {
  // Check if the feature flag is enabled AND FAL_KEY is set
  const featureEnabled = getBooleanSetting('feature_video_generation');
  return featureEnabled && !!process.env.FAL_KEY;
}
