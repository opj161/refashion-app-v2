// src/actions/apiActions.ts
'use server';

import 'server-only';


import { sendWebhook } from '@/services/webhook.service';
import { getDisplayableImageUrl } from '@/lib/utils';
import { generateImageEdit } from "@/ai/flows/generate-image-edit";
import { addHistoryItem, updateHistoryItem } from "./historyActions";
import type { ModelAttributes } from "@/lib/types";

interface ApiJobPayload {
  username: string;
  imageDataUri: string;
  parameters: ModelAttributes;
  settingsMode: 'basic' | 'advanced';
  webhookUrl?: string;
}

/**
 * Creates a new job record in the database with a 'processing' status.
 * @returns The new job ID (which is a history_id).
 */
export async function createApiJob(payload: ApiJobPayload): Promise<string> {
  const { username, parameters, imageDataUri, settingsMode, webhookUrl } = payload;
  
  // Fetch the user to get their specific image generation model
  const { findUserByUsername } = await import('@/services/database.service');
  const user = await findUserByUsername(username);
  
  const imageGenerationModel = user?.image_generation_model || 'fal_gemini_2_5';

  const newHistoryId = await addHistoryItem(
    parameters,
    "Job created via API. Prompt to be generated.", // Placeholder prompt
    imageDataUri, // Using this as the original clothing URL
    [], // No edited images yet
    settingsMode,
    imageGenerationModel, // Use the user's actual model
    'processing', // Initial status
    undefined,    // No error
    username,     // Pass the authenticated username from API key
    webhookUrl    // Pass the webhookUrl to be saved
  );
  return newHistoryId;
}

/**
 * This function is designed to be called without 'await'.
 * It runs the full generation and updates the DB record upon completion or failure.
 */
export async function processApiGenerationJob(jobId: string, payload: Omit<ApiJobPayload, 'username'>, username: string): Promise<void> {
  const { webhookUrl } = payload;
  try {
  const result = await generateImageEdit({ 
      parameters: payload.parameters,
      settingsMode: payload.settingsMode,
      imageDataUriOrUrl: payload.imageDataUri,
      useAIPrompt: false, // Default to false for API calls
      useRandomization: false, // Default to false for API calls
      removeBackground: false, // Default to false for API calls
      upscale: false, // Default to false for API calls
      enhanceFace: false, // Default to false for API calls
  }, username, jobId); // Pass the existing jobId so generateImageEdit does NOT create a second history row

    // Update history item with results AND the constructed prompt
    await updateHistoryItem(jobId, {
      editedImageUrls: result.editedImageUrls,
      constructedPrompt: result.constructedPrompt,
      status: 'completed',
    }, username);
    console.log(`API Job ${jobId} completed successfully.`);

    if (webhookUrl) {
      // Construct absolute URLs before sending
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
      const absoluteImageUrls = result.editedImageUrls
        .map(url => url ? (url.startsWith('http') ? url : `${baseUrl}${getDisplayableImageUrl(url)}`) : null);

      await sendWebhook(webhookUrl, {
        status: 'completed',
        generatedImageUrls: absoluteImageUrls,
        historyId: jobId,
      });
    }

  } catch (e) {
    console.error(`API Job ${jobId} failed:`, e);
    // Update history item with error status
    await updateHistoryItem(jobId, { status: 'failed', error: (e as Error).message }, username);

    if (webhookUrl) {
      await sendWebhook(webhookUrl, {
        status: 'failed',
        error: (e as Error).message,
        historyId: jobId,
      });
    }
  }
}
