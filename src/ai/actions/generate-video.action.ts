// src/ai/actions/generate-video.action.ts
'use server';

import 'server-only';

// FIX: Use factory function to prevent singleton race conditions
import { createFalClient } from '@fal-ai/client';

import { getCurrentUser } from '@/actions/authActions';
import { addStandaloneVideoHistoryItem, updateVideoHistoryItem } from '@/actions/historyActions';
import * as videoService from '@/services/fal-api/video.service';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';
import { createApiLogger } from '@/lib/api-logger';
import { getApiKeyForUser } from '@/services/apiKey.service';

// Ensure FAL_KEY is available
if (!process.env.FAL_KEY) {
  console.warn('FAL_KEY environment variable is not set.');
}

export interface GenerateVideoInput {
  prompt: string;
  image_url: string;
  local_image_path?: string;
  // videoModel is deprecated but kept in interface for compatibility with UI types
  videoModel?: 'lite' | 'pro'; 
  resolution?: '480p' | '720p' | '1080p';
  duration?: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
  camera_fixed?: boolean;
  seed?: number;
  selectedPredefinedPrompt?: string;
  modelMovement?: string;
  fabricMotion?: string;
  cameraAction?: string;
  aestheticVibe?: string;
}

export interface GenerateVideoOutput {
  taskId?: string;
  historyItemId?: string;
  error?: string;
}

export interface VideoGenerationFormState {
  message: string;
  taskId?: string;
  historyItemId?: string;
  error?: string;
}

export async function isFalVideoGenerationAvailable(): Promise<{ available: boolean }> {
  const isAvailable = await videoService.isVideoServiceAvailable();
  return { available: isAvailable };
}

/**
 * Utility to upload a file to Fal Storage.
 * Refactored to use createFalClient for thread safety.
 */
export async function uploadToFalStorage(file: File | Blob, username: string): Promise<string> {
  const logger = createApiLogger('STORAGE', 'Fal Storage Upload', {
    username,
    endpoint: 'fal.storage.upload',
  });

  logger.start({ fileSize: file.size, fileType: file.type });

  try {
    logger.progress('Uploading to Fal Storage');
    
    // 1. Get Key
    const apiKey = await getApiKeyForUser(username, 'fal');
    
    // 2. Create Scoped Client
    const fal = createFalClient({
      credentials: apiKey
    });

    // 3. Upload
    const url = await fal.storage.upload(file);
    
    logger.success({ url: url.substring(0, 100) });
    return url;
  } catch (error: any) {
    logger.error(error);
    throw new Error(`Failed to upload to Fal Storage: ${error.message}`);
  }
}

// Function to start video generation with webhook support
export async function startVideoGenerationAndCreateHistory(input: GenerateVideoInput) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'User not authenticated' };
  }

  // 1. Create history item
  // We implicitly set videoModel to 'pro' (or specific ID) for history tracking
  const historyVideoParams = {
    prompt: input.prompt,
    resolution: input.resolution || '1080p', // Default to 1080p for Pro Fast
    videoModel: 'pro' as const, // Force logging as pro
    duration: input.duration || '5',
    seed: input.seed || -1,
    sourceImageUrl: input.local_image_path || input.image_url,
    selectedPredefinedPrompt: input.selectedPredefinedPrompt || 'custom',
    modelMovement: input.modelMovement || '',
    fabricMotion: input.fabricMotion || '',
    cameraAction: input.cameraAction || '',
    aestheticVibe: input.aestheticVibe || '',
    cameraFixed: input.camera_fixed || false,
    status: 'processing' as const,
  };

  const historyItemId = await addStandaloneVideoHistoryItem(
    [null],
    historyVideoParams
  );

  // 2. Prepare webhook URL
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/video/webhook?historyItemId=${historyItemId}&username=${encodeURIComponent(user.username)}`;

  try {
    let falPublicUrl: string;
    
    // Handle Image Upload
    if (input.image_url.startsWith('https://v3.fal.media/') || input.image_url.startsWith('https://fal.media/')) {
      falPublicUrl = input.image_url;
    } else if (input.image_url.startsWith('/uploads/')) {
      console.log(`Uploading local image for video generation: ${input.image_url}`);
      const fileBuffer = await getBufferFromLocalPath(input.image_url);
      const imageBlob = new Blob([new Uint8Array(fileBuffer)]);
      falPublicUrl = await uploadToFalStorage(imageBlob, user.username);
    } else {
      falPublicUrl = input.image_url;
    }

    // Map input to service input
    const videoServiceInput: videoService.VideoGenerationInput = {
      prompt: input.prompt,
      image_url: falPublicUrl,
      resolution: input.resolution,
      duration: input.duration as any, // Cast string to expected union type
      camera_fixed: input.camera_fixed,
      seed: input.seed,
      // Note: videoModel is intentionally omitted here as the service hardcodes it
    };

    const taskId = await videoService.startVideoGenerationWithWebhook(
      videoServiceInput, 
      webhookUrl, 
      user.username
    );

    await updateVideoHistoryItem({ 
      username: user.username, 
      historyItemId, 
      videoUrls: [null],
      localVideoUrl: null,
      seedUsed: null,
      status: 'processing',
      videoModel: 'pro', // Update history to reflect actual model used
    });

    return { taskId, historyItemId };
  } catch (error: any) {
    console.error('Fal.ai submission error:', error);
    
    await updateVideoHistoryItem({ 
      username: user.username, 
      historyItemId, 
      videoUrls: [null],
      localVideoUrl: null,
      seedUsed: null,
      status: 'failed', 
      error: 'Failed to submit job to fal.ai',
      videoModel: 'pro',
    });
    return { error: 'Failed to submit video generation job.' };
  }
}

export async function generateVideoAction(
  previousState: VideoGenerationFormState | null,
  formData: FormData
): Promise<VideoGenerationFormState> {
  try {
    // ... existing param extraction ...
    const prompt = formData.get('prompt') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const localImagePath = formData.get('localImagePath') as string | null;
    // We still extract this to prevent crashes if sent, but we don't use it for logic
    const videoModel = (formData.get('videoModel') as 'lite' | 'pro') || 'lite'; 
    const resolution = (formData.get('resolution') as any) || '1080p';
    const duration = formData.get('duration') as string || '5';
    const seedStr = formData.get('seed') as string;
    const seed = seedStr === '-1' ? -1 : parseInt(seedStr, 10);
    const cameraFixed = formData.get('cameraFixed') === 'true';
    
    const selectedPredefinedPrompt = formData.get('selectedPredefinedPrompt') as string || 'custom';
    const modelMovement = formData.get('modelMovement') as string || '';
    const fabricMotion = formData.get('fabricMotion') as string || '';
    const cameraAction = formData.get('cameraAction') as string || '';
    const aestheticVibe = formData.get('aestheticVibe') as string || '';

    if (!imageUrl || !prompt || !prompt.trim()) {
      return { message: 'Missing required fields', error: 'Image and prompt are required' };
    }

    const videoInput: GenerateVideoInput = {
      prompt,
      image_url: imageUrl,
      local_image_path: localImagePath || imageUrl,
      videoModel, // Passed but ignored by service logic
      resolution,
      duration: duration as any,
      seed,
      camera_fixed: cameraFixed,
      selectedPredefinedPrompt,
      modelMovement,
      fabricMotion,
      cameraAction,
      aestheticVibe,
    };

    const result = await startVideoGenerationAndCreateHistory(videoInput);

    if (result.error) {
      return { message: 'Video generation failed to start', error: result.error };
    }

    return {
      message: 'Video generation started successfully.',
      taskId: result.taskId,
      historyItemId: result.historyItemId,
    };

  } catch (error) {
    console.error('Error in generateVideoAction:', error);
    return { 
      message: 'An unexpected error occurred.', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
