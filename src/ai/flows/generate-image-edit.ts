// This is a server-side file.
'use server';

import 'server-only';
import { after } from 'next/server';

/**
 * @fileOverview AI agent for editing an image based on a text prompt,
 * or generating an image purely from text if no source image is provided.
 * Generates three versions using different API keys.
 * Images are saved locally and their local paths are returned.
 * The source image can be provided as a data URI or a public HTTPS URL.
 */

import { z } from 'zod';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { saveDataUriLocally } from '@/services/storage.service';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';
import mime from 'mime-types';
import { getApiKeyForUser } from '@/services/apiKey.service';
import {
  MODEL_ANGLE_OPTIONS, GENDER_OPTIONS, BODY_SHAPE_AND_SIZE_OPTIONS, AGE_RANGE_OPTIONS,
  ETHNICITY_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, POSE_STYLE_OPTIONS,
  BACKGROUND_OPTIONS,
} from '@/lib/prompt-options';
import { buildAIPrompt } from '@/lib/prompt-builder';
import { generatePromptWithAI } from '@/ai/actions/generate-prompt.action';
import type { ModelAttributes } from '@/lib/types';
import type { FullUser } from '@/services/db';
import * as dbService from '@/services/db';
import { addHistoryItem } from '@/actions/historyActions';
import { generateWithFalEditModel } from '@/services/fal-api/image.service';
import { downloadAndSaveImageFromUrl } from '@/services/storage.service';
import { removeBackgroundAction } from '@/ai/actions/remove-background.action';
import { upscaleImageAction, faceDetailerAction } from '@/ai/actions/upscale-image.action';
// Import Axios and HttpsProxyAgent for explicit proxy control
// Axios and HttpsProxyAgent removed as they were only for Google API
import { withGeminiRetry } from '@/lib/api-retry';

// Import API logger for standardized logging
import { createApiLogger } from '@/lib/api-logger';

// Import Studio Prompt domain service
import { constructStudioPrompt } from '@/ai/domain/studio-prompt';

// ===== RANDOMIZATION PROBABILITY CONSTANTS =====
/** Ethnicity and pose style — high-frequency randomization */
const RANDOMIZATION_CHANCE_HIGH = 0.5;
/** Model angle — moderate-frequency randomization */
const RANDOMIZATION_CHANCE_MODEL_ANGLE = 0.3;
/** Hair style — medium-frequency randomization */
const RANDOMIZATION_CHANCE_MEDIUM = 0.25;
/** Model expression — low-frequency randomization */
const RANDOMIZATION_CHANCE_LOW = 0.15;


/**
 * Generate random parameters for stylistic settings with tiered probability system.
 * Excludes core model attributes (gender, bodyType, bodySize, ageRange) which remain as user-selected.
 * Uses graduated probability: Background (100%), Ethnicity/Pose (50%), Angle (30%), Hair (25%), Expression (15%).
 */
function generateRandomBasicParameters(baseParameters: ModelAttributes): ModelAttributes {
  const pickRandom = (options: readonly any[]) =>
    options[Math.floor(Math.random() * options.length)].value;

  const result = {
    ...baseParameters,
    background: pickRandom(BACKGROUND_OPTIONS), // Always randomized (100%)
  };

  // Tier 1: High frequency (50%)
  if (Math.random() < RANDOMIZATION_CHANCE_HIGH) {
    result.ethnicity = pickRandom(ETHNICITY_OPTIONS);
  }
  if (Math.random() < RANDOMIZATION_CHANCE_HIGH) {
    result.poseStyle = pickRandom(POSE_STYLE_OPTIONS);
  }
  if (Math.random() < RANDOMIZATION_CHANCE_MODEL_ANGLE) {
    result.modelAngle = pickRandom(MODEL_ANGLE_OPTIONS);
  }

  // Tier 2: Medium frequency (25%)
  if (Math.random() < RANDOMIZATION_CHANCE_MEDIUM) {
    result.hairStyle = pickRandom(HAIR_STYLE_OPTIONS);
  }

  // Tier 3: Low frequency (15%)
  if (Math.random() < RANDOMIZATION_CHANCE_LOW) {
    result.modelExpression = pickRandom(MODEL_EXPRESSION_OPTIONS);
  }

  return result;
}



/**
 * Make a direct API call to Gemini API with explicit proxy support using axios
 * This provides better proxy control than node-fetch's automatic detection
 */
// makeGeminiApiCall removed


const GenerateImageEditInputSchema = z.object({
  prompt: z.string().optional().describe('The prompt to use for generating or editing the image.'),
  parameters: z.any().optional().describe('The parameters object to build the prompt from.'),
  settingsMode: z.enum(['basic', 'advanced']).optional().describe('The settings mode for prompt construction.'),
  imageDataUriOrUrl: z
    .string()
    .optional()
    .describe(
      "Optional: The image to edit, as a data URI (e.g., 'data:image/png;base64,...') or a publicly accessible HTTPS URL."
    ),
  useAIPrompt: z.boolean().optional().default(false).describe('Whether to use AI to generate the prompt itself.'),
  useRandomization: z.boolean().optional().default(false).describe('Whether to use different random parameters for each of the 3 generation slots.'),
  removeBackground: z.boolean().optional().default(false).describe('Whether to remove background before generation.'),
  upscale: z.boolean().optional().default(false).describe('Whether to upscale the image before generation.'),
  enhanceFace: z.boolean().optional().default(false).describe('Whether to enhance face details before generation.'),
  generationMode: z.enum(['creative', 'studio']).optional().describe('The generation mode: creative or studio.'),
  studioFit: z.enum(['slim', 'regular', 'relaxed']).optional().describe('The fit setting for Studio Mode.'),
  aspectRatio: z.string().optional().describe('The aspect ratio for Nano Banana Pro (e.g., "9:16", "auto").'), // NEW
});
export type GenerateImageEditInput = z.infer<typeof GenerateImageEditInputSchema>;

const SingleImageOutputSchema = z.object({
  editedImageUrl: z
    .string()
    .describe('The URL or local path of the generated or edited image.'),
});
export type SingleImageOutput = z.infer<typeof SingleImageOutputSchema>;

async function performSingleImageGeneration(
  input: GenerateImageEditInput,
  user: FullUser,
  flowIdentifier: string,
  keyIndex: 1 | 2 | 3,
  modelId: string // Changed from generationConfigOverride
): Promise<SingleImageOutput> {
  const username = user.username;

  // Use the passed modelId directly
  const modelEndpoint = modelId;

  const logger = createApiLogger('FAL_IMAGE', `Image Gen (${modelEndpoint})`, {
    username,
    endpoint: modelEndpoint,
  });

  if (!input.imageDataUriOrUrl) {
    throw new Error(`Generation requires a source image for ${flowIdentifier}`);
  }

  logger.start({
    flowIdentifier,
    promptLength: input.prompt?.length || 0,
    sourceType: input.imageDataUriOrUrl.startsWith('data:') ? 'dataURI' :
      input.imageDataUriOrUrl.startsWith('/') ? 'localFile' : 'publicURL',
  });

  // Convert to public URL for FAL.AI (FAL.AI requires publicly accessible URLs)
  let publicImageUrl = input.imageDataUriOrUrl;

  // Handle Data URI or Local Path by uploading to Fal Storage
  if (input.imageDataUriOrUrl.startsWith('data:') || input.imageDataUriOrUrl.startsWith('/uploads/')) {
    logger.progress('Converting source to public URL via Fal Storage');

    let imageBlob: Blob;

    if (input.imageDataUriOrUrl.startsWith('data:')) {
      const dataUriMatch = input.imageDataUriOrUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!dataUriMatch) throw new Error(`Invalid data URI format`);
      const mimeType = dataUriMatch[1];
      const binaryData = Buffer.from(dataUriMatch[2], 'base64');
      imageBlob = new Blob([binaryData], { type: mimeType });
    } else {
      const fileBuffer = await getBufferFromLocalPath(input.imageDataUriOrUrl);
      const mimeType = mime.lookup(input.imageDataUriOrUrl) || 'image/png';
      imageBlob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    }

    const { uploadToFalStorage } = await import('@/ai/actions/generate-video.action');
    publicImageUrl = await uploadToFalStorage(imageBlob, username);
    logger.progress(`Source ready: ${publicImageUrl.substring(0, 50)}...`);
  }

  try {
    logger.progress(`Calling ${modelEndpoint}`);

    const falResult = await generateWithFalEditModel(
      input.prompt || '',
      publicImageUrl,
      username,
      modelEndpoint as any, // Cast to valid enum
      await getApiKeyForUser(username, 'fal'), // Inject User API Key
      { aspectRatio: input.aspectRatio } // NEW: Pass options object
    );

    logger.progress(`Downloading generated image...`);

    const { relativeUrl: localImageUrl } = await downloadAndSaveImageFromUrl(
      falResult.imageUrl,
      `RefashionAI_${user.image_generation_model}_${flowIdentifier}`,
      'generated_images'
    );

    logger.success({
      localImageUrl,
    });

    return { editedImageUrl: localImageUrl };
  } catch (falError: unknown) {
    const knownFalError = falError as Error;
    logger.error(falError);
    throw new Error(`Generation failed for ${flowIdentifier}: ${knownFalError.message}`);
  }
}


// ===== EXTRACTED WORKFLOW HELPERS =====

/**
 * Persist final generation results (images and errors) to the history record.
 * Determines overall status (completed / failed) from per-slot error state.
 */
function saveGenerationResults(
  historyId: string,
  editedImageUrls: (string | null)[],
  errors: (string | null)[],
  constructedPrompt: string,
  modeLabel: string
): void {
  const allFailed = errors.every(e => e);
  const someFailed = errors.some(e => e);
  dbService.updateHistoryItem(historyId, {
    constructedPrompt,
    editedImageUrls,
    status: allFailed ? 'failed' : 'completed',
    error: allFailed
      ? errors.filter(Boolean).join('; ')
      : someFailed
        ? `Partial failure: ${errors.filter(Boolean).join('; ')}`
        : undefined,
  });
  console.log(`✅ ${modeLabel}: History updated for ${historyId}`);
}

/**
 * Apply optional non-destructive image processing steps (background removal,
 * upscale, face enhancement) in sequence. Returns the final processed image URL.
 */
async function applyImageProcessingPipeline(
  imageUrl: string,
  options: { removeBackground?: boolean; upscale?: boolean; enhanceFace?: boolean }
): Promise<string> {
  if (!options.removeBackground && !options.upscale && !options.enhanceFace) {
    return imageUrl;
  }

  console.log('🔧 Applying non-destructive image processing pipeline...');
  let processedUrl = imageUrl;

  try {
    if (options.removeBackground) {
      console.log('🎨 Step 1: Removing background...');
      const bgResult = await removeBackgroundAction(processedUrl, undefined);
      processedUrl = bgResult.savedPath;
      console.log(`✅ Background removed. New path: ${processedUrl}`);
    }
    if (options.upscale) {
      console.log('🔍 Step 2: Upscaling image...');
      const upscaleResult = await upscaleImageAction(processedUrl, undefined);
      processedUrl = upscaleResult.savedPath;
      console.log(`✅ Image upscaled. New path: ${processedUrl}`);
    }
    if (options.enhanceFace) {
      console.log('👤 Step 3: Enhancing face details...');
      const faceResult = await faceDetailerAction(processedUrl, undefined);
      processedUrl = faceResult.savedPath;
      console.log(`✅ Face details enhanced. New path: ${processedUrl}`);
    }
    console.log('✨ Pipeline complete. Processed image ready for generation.');
    return processedUrl;
  } catch (pipelineError) {
    console.error('❌ Pipeline processing error:', pipelineError);
    throw new Error(`Image processing pipeline failed: ${(pipelineError as Error).message}`);
  }
}

/**
 * Build the prompt(s) for each image generation slot.
 * Supports manual prompts, local prompt builder, and AI-enhanced prompts.
 * Returns the array of prompts and a consolidated prompt string for history.
 */
async function generatePromptsForSlots(
  input: GenerateImageEditInput,
  username: string,
  imagesToGenerateCount: number
): Promise<{ prompts: (string | null)[]; constructedPromptForHistory: string }> {
  if (input.prompt) {
    console.log('Using manually provided prompt for all image slots.');
    return {
      prompts: Array(imagesToGenerateCount).fill(input.prompt),
      constructedPromptForHistory: input.prompt,
    };
  }

  // Stage 1: Determine parameter sets (randomized or fixed)
  let parameterSetsForSlots: ModelAttributes[];

  if (input.useRandomization) {
    if (!input.parameters) {
      throw new Error('Parameters are required when randomization is enabled.');
    }
    console.log(`🎲 Randomization enabled. Generating ${imagesToGenerateCount} different parameter sets.`);
    parameterSetsForSlots = Array.from(
      { length: imagesToGenerateCount },
      () => generateRandomBasicParameters(input.parameters)
    );
  } else {
    console.log(`⚙️ Using fixed parameters for all ${imagesToGenerateCount} slots.`);
    parameterSetsForSlots = Array(imagesToGenerateCount).fill(input.parameters);
  }

  // Stage 2: Build prompts from parameter sets
  let prompts: (string | null)[];

  if (input.useAIPrompt && input.imageDataUriOrUrl) {
    console.log('🧠 Using AI prompt enhancement...');
    const promptPromises = parameterSetsForSlots.map((params, i) =>
      generatePromptWithAI(params, input.imageDataUriOrUrl!, username, (i + 1) as 1 | 2 | 3)
        .catch(err => {
          console.warn(`AI prompt generation for slot ${i + 1} failed. Falling back to local builder. Reason:`, err);
          return buildAIPrompt({ type: 'image', params: { ...params, settingsMode: 'advanced' } });
        })
    );
    prompts = await Promise.all(promptPromises);
  } else {
    console.log('📝 Using local prompt builder...');
    prompts = parameterSetsForSlots.map(params =>
      buildAIPrompt({ type: 'image', params: { ...params, settingsMode: input.settingsMode || 'basic' } })
    );
  }

  return {
    prompts,
    constructedPromptForHistory: prompts[0] || 'Prompt generation failed.',
  };
}

/**
 * Execute the Studio Mode workflow: classify garment via Gemini, construct a
 * studio-style prompt, generate images in parallel, and persist results.
 */
async function executeStudioWorkflow(
  input: GenerateImageEditInput,
  user: FullUser,
  historyId: string | undefined,
  imagesToGenerateCount: number,
  modelEndpoint: string
): Promise<void> {
  const username = user.username;
  console.log(`🚀 Routing to Studio Mode for user ${username}`);

  if (!input.studioFit || !input.imageDataUriOrUrl) {
    throw new Error('Studio Mode requires a fit setting and a source image.');
  }

  const { classification, finalPrompt: studioPrompt } = await constructStudioPrompt(
    input.imageDataUriOrUrl,
    input.studioFit,
    username
  );

  console.log(`🏷️ Clothing identified as: "${classification}"`);
  console.log('📝 Studio Mode Prompt constructed with dynamic clothing description.');

  // Parallel generation
  const generationPromises = Array.from({ length: imagesToGenerateCount }, (_, i) => i + 1).map(async (i) => {
    try {
      const result = await performSingleImageGeneration({
        ...input,
        imageDataUriOrUrl: input.imageDataUriOrUrl,
        prompt: studioPrompt,
      }, user, `studio-flow${i}`, i as 1 | 2 | 3, modelEndpoint);

      if (historyId && result.editedImageUrl) {
        dbService.updateHistoryImageSlot(historyId, i - 1, result.editedImageUrl);
        console.log(`✅ Studio Mode: Image ${i} saved to DB for ${historyId}`);
      }
      return result;
    } catch (err) {
      console.error(`Studio Mode flow ${i} error:`, err);
      throw err;
    }
  });

  const settledResults = await Promise.allSettled(generationPromises);

  // Collect results
  const editedImageUrls: (string | null)[] = Array(imagesToGenerateCount).fill(null);
  const errors: (string | null)[] = Array(imagesToGenerateCount).fill(null);

  settledResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      editedImageUrls[index] = result.value.editedImageUrl;
    } else {
      console.error(`Studio Mode generation ${index + 1} failed:`, result.reason);
      errors[index] = result.reason?.message || 'Unknown error';
    }
  });

  if (historyId) {
    saveGenerationResults(historyId, editedImageUrls, errors, studioPrompt, 'Studio Mode');
  }
}

/**
 * Execute the Creative Mode workflow: apply image processing pipeline,
 * generate prompts, run parallel image generation, and persist results.
 */
async function executeCreativeWorkflow(
  input: GenerateImageEditInput,
  user: FullUser,
  historyId: string | undefined,
  imagesToGenerateCount: number,
  modelEndpoint: string
): Promise<void> {
  const username = user.username;
  console.log(`🎨 Routing to Creative Mode for user ${username}`);

  // Apply non-destructive image processing pipeline
  const processedImageUrl = input.imageDataUriOrUrl
    ? await applyImageProcessingPipeline(input.imageDataUriOrUrl, {
        removeBackground: input.removeBackground,
        upscale: input.upscale,
        enhanceFace: input.enhanceFace,
      })
    : input.imageDataUriOrUrl;

  const processedInput = { ...input, imageDataUriOrUrl: processedImageUrl };

  // Generate prompts for all slots
  const { prompts, constructedPromptForHistory } = await generatePromptsForSlots(
    processedInput,
    username,
    imagesToGenerateCount
  );

  // Log all prompts
  console.log(`\n🚀 ALL AI-GENERATED PROMPTS SUMMARY:`);
  console.log('='.repeat(100));
  console.log(`Target Model for Generation: ${user.image_generation_model}`);
  prompts.forEach((prompt, index) => {
    console.log(`\n📝 PROMPT ${index + 1}:`);
    if (prompt) {
      console.log(prompt);
    } else {
      console.log('❌ FAILED TO GENERATE');
    }
    console.log('-'.repeat(60));
  });
  console.log('='.repeat(100));
  console.log("Generated Prompts:", prompts);

  // Parallel generation
  const generationPromises = prompts.map(async (prompt, index) => {
    if (!prompt) throw new Error(`Prompt for slot ${index + 1} was missing`);

    try {
      const result = await performSingleImageGeneration(
        { ...processedInput, prompt },
        user,
        `flow${index + 1}`,
        (index + 1) as 1 | 2 | 3,
        modelEndpoint
      );

      if (historyId && result.editedImageUrl) {
        dbService.updateHistoryImageSlot(historyId, index, result.editedImageUrl);
        console.log(`✅ Creative Mode: Image ${index + 1} saved to DB for ${historyId}`);
      }
      return result;
    } catch (err) {
      console.error(`Creative Mode flow ${index + 1} error:`, err);
      throw err;
    }
  });

  const settledResults = await Promise.allSettled(generationPromises);

  // Collect results
  const editedImageUrls: (string | null)[] = Array(imagesToGenerateCount).fill(null);
  const errors: (string | null)[] = Array(imagesToGenerateCount).fill(null);

  settledResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      editedImageUrls[index] = result.value.editedImageUrl;
    } else {
      console.error(`Error from flow ${index + 1}:`, result.reason);
      const reasonError = result.reason as Error;
      errors[index] = `Image ${index + 1} processing failed: ${reasonError?.message || 'Unknown error'}`;
    }
  });

  if (historyId) {
    saveGenerationResults(historyId, editedImageUrls, errors, constructedPromptForHistory, 'Creative Mode');
  }
}


const GenerateMultipleImagesOutputSchema = z.object({
  editedImageUrls: z.array(z.string().nullable())
    .describe('An array of generated or edited image URLs/paths (or null for failures).'),
  constructedPrompt: z.string().describe('The final prompt that was sent to the AI.'),
  errors: z.array(z.string().nullable()).optional()
    .describe('An array of error messages if any generation or storage failed.'),
});
export type GenerateMultipleImagesOutput = z.infer<typeof GenerateMultipleImagesOutputSchema>;


export async function generateImageEdit(
  input: GenerateImageEditInput,
  username: string,
  existingHistoryId?: string
): Promise<GenerateMultipleImagesOutput & { newHistoryId?: string }> {
  if (!username) {
    throw new Error('Username is required to generate images.');
  }

  // FETCH ONCE: Fetch the user object ONCE at the top level of the main function.
  const user = dbService.findUserByUsername(username);
  if (!user) {
    throw new Error(`User ${username} not found.`);
  }

  // Determine how many images to generate based on the model
  // Nano Banana Pro = 1 image
  // Gemini 2.5 = 3 images
  const imagesToGenerateCount = user.image_generation_model === 'fal_nano_banana_pro' ? 1 : 3;

  let modelEndpoint = 'fal-ai/gemini-25-flash-image/edit';
  if (user.image_generation_model === 'fal_nano_banana_pro') {
    modelEndpoint = 'fal-ai/nano-banana-pro/edit';
  }

  console.log(`[generateImageEdit] User: ${username}, Model: ${user.image_generation_model}, Count: ${imagesToGenerateCount}`);

  // 1. Create initial history item EARLY (if not existing)
  let historyId = existingHistoryId;

  if (!historyId && input.imageDataUriOrUrl) {
    try {
      // Construct attributes for history
      const historyAttributes = {
        ...(input.parameters || {}),
        ...(input.studioFit && { studioFit: input.studioFit }),
        ...(input.aspectRatio && { aspectRatio: input.aspectRatio }),
      };

      // 4. Create History Item (Processing State)
      const historyItemId = await addHistoryItem({
        attributes: historyAttributes,
        constructedPrompt: "Processing...",
        originalClothingUrl: input.imageDataUriOrUrl,
        editedImageUrls: [null, null, null, null],
        settingsMode: input.settingsMode || 'basic',
        imageGenerationModel: user.image_generation_model,
        status: 'processing',
        username,
        generationMode: input.generationMode,
      });
      historyId = historyItemId; // Assign to historyId for subsequent use
      console.log(`✅ Created initial history item: ${historyId}`);
    } catch (err) {
      console.error('Failed to create initial history item:', err);
      throw err;
    }
  }

  // 2. Schedule background work using Next.js 16 after()
  after(async () => {
    try {
      console.log(`🔄 Starting background generation for ${historyId}`);

      if (input.generationMode === 'studio') {
        await executeStudioWorkflow(input, user, historyId, imagesToGenerateCount, modelEndpoint);
      } else {
        await executeCreativeWorkflow(input, user, historyId, imagesToGenerateCount, modelEndpoint);
      }

    } catch (error) {
      console.error(`❌ Background generation failed for ${historyId}:`, error);
      if (historyId) {
        dbService.updateHistoryItem(historyId, {
          status: 'failed',
          error: (error as Error).message
        });
      }
    }
  });

  // 3. Return immediate response
  return {
    editedImageUrls: [null, null, null],
    constructedPrompt: 'Processing...',
    newHistoryId: historyId,
  };
}
