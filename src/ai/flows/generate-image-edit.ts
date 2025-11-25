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
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import fetch from 'node-fetch'; // For fetching image from URL
import fs from 'fs';
import path from 'path';
import { saveDataUriLocally } from '@/services/storage.service';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';
import mime from 'mime-types';
import { getApiKeyForUser } from '@/services/apiKey.service';
import { MODEL_ANGLE_OPTIONS,
  buildAIPrompt, GENDER_OPTIONS, BODY_SHAPE_AND_SIZE_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS
} from '@/lib/prompt-builder'; // <-- No change here, but POSE_STYLE_OPTIONS is now used below
import { generatePromptWithAI } from '@/ai/actions/generate-prompt.action';
import type { ModelAttributes } from '@/lib/types';
import type { FullUser } from '@/services/database.service'; // Import the user type
import * as dbService from '@/services/database.service';
import { addHistoryItem } from '@/actions/historyActions';
import { generateWithFalEditModel } from '@/services/fal-api/image.service';
import { downloadAndSaveImageFromUrl } from '@/services/storage.service';
import { removeBackgroundAction } from '@/ai/actions/remove-background.action';
import { upscaleImageAction, faceDetailerAction } from '@/ai/actions/upscale-image.action';
import { getSetting } from '@/services/settings.service'; // Add this import for Studio Mode prompt

// Import Axios and HttpsProxyAgent for explicit proxy control
// Axios and HttpsProxyAgent removed as they were only for Google API
import { withGeminiRetry } from '@/lib/api-retry';

// Import GoogleGenAI SDK for text-based classification tasks
import { GoogleGenAI } from '@google/genai';

// Import API logger for standardized logging
import { createApiLogger } from '@/lib/api-logger';

// Direct API configuration matching Python implementation
// BASE_URL removed


// Gemini Image API types removed


/**
 * Generate random parameters for stylistic settings with tiered probability system
 * Excludes core model attributes (gender, bodyType, bodySize, ageRange) which should remain as user selected
 * Uses graduated probability: Background (100%), Ethnicity/Pose (50%), Hair (25%), Expression (15%)
 */
function generateRandomBasicParameters(baseParameters: ModelAttributes): ModelAttributes {
  // Helper that picks a random value from all available options, including "default".
  // This allows randomization to include "no specific setting" as a valid choice.
  const pickRandom = (options: any[]) => {
    return options[Math.floor(Math.random() * options.length)].value;
  };

  const result = {
    ...baseParameters, // Keep all existing parameters as base
    background: pickRandom(BACKGROUND_OPTIONS), // Always randomize background (100%)
  };

  // Tier 1: High frequency randomization (50% chance)
  // 50% chance to randomize ethnicity, otherwise keep user's original choice
  if (Math.random() < 0.5) {
    result.ethnicity = pickRandom(ETHNICITY_OPTIONS);
  }

  // 50% chance to randomize pose style, otherwise keep user's original choice  
  if (Math.random() < 0.5) {
    result.poseStyle = pickRandom(POSE_STYLE_OPTIONS);
  }

  // New: 30% chance to randomize model angle
  if (Math.random() < 0.3) {
    result.modelAngle = pickRandom(MODEL_ANGLE_OPTIONS);
  }

  // Tier 2: Medium frequency randomization (25% chance)
  // 25% chance to randomize hair style, otherwise keep user's original choice
  if (Math.random() < 0.25) {
    result.hairStyle = pickRandom(HAIR_STYLE_OPTIONS);
  }

  // Tier 3: Low frequency randomization (15% chance) 
  // 15% chance to randomize model expression, otherwise keep user's original choice
  if (Math.random() < 0.15) {
    result.modelExpression = pickRandom(MODEL_EXPRESSION_OPTIONS);
  }

  return result;
}

/**
 * Studio Mode: Get fit description based on the selected fit type
 */
function getStudioModeFitDescription(fit: 'slim' | 'regular' | 'relaxed'): string {
  switch (fit) {
    case 'slim': return "slim fit";
    case 'relaxed': return "relaxed fit";
    case 'regular':
    default: return "regular fit";
  }
}

/**
 * Studio Mode: Build the ironclad prompt template for consistent product photography
 */
function buildStudioModePrompt(fit: 'slim' | 'regular' | 'relaxed'): string {
  const fitDescription = getStudioModeFitDescription(fit);

  // Fetch the template from the database via the settings service.
  const promptTemplate = getSetting('ai_studio_mode_prompt_template');
  
  // Define a hardcoded fallback for resilience in case the setting is empty.
  const fallbackTemplate = `Create a high-quality fashion photograph featuring a realistic female model wearing this {clothingItem} in the provided image with a {fitDescription}. The model should have a modern, approachable look and stand in a relaxed, candid pose with a natural expression and subtle smile. Ensure the fabric weight, drape, and texture interact realistically with the model's body geometry and pose. The setting is a bright, daylight studio with a textured, neutral wall background that provides soft, complementary contrast. Use diffused natural lighting to highlight the material details of the clothing without harsh shadows. Frame the image as a full-body shot using a 50mm lens perspective for a natural, photorealistic result.`;

  // Use the database template if available; otherwise, use the fallback.
  const templateToUse = promptTemplate && promptTemplate.trim() ? promptTemplate : fallbackTemplate;

  // Inject the dynamic fit description.
  return templateToUse.replace('{fitDescription}', fitDescription);
}

/**
 * Helper to convert an image path/URI to the format the GoogleGenAI SDK needs
 * Duplicated from generate-prompt.action.ts for encapsulation
 */
async function imageToGenerativePart(imageDataUriOrUrl: string) {
  let dataUri = imageDataUriOrUrl;
  
  if (dataUri.startsWith('/')) {
    const buffer = await getBufferFromLocalPath(dataUri);
    const mimeType = mime.lookup(dataUri) || 'image/png';
    dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
  
  const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data URI');

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

/**
 * Studio Mode Enhancement: Generate a concise clothing description using Gemini text model
 * This description replaces the generic "clothing item" placeholder in the studio prompt
 * for more specific and accurate image generation.
 * 
 * @param imageDataUriOrUrl - The source image (data URI, local path, or HTTPS URL)
 * @param username - Username for API key retrieval
 * @returns A 2-5 word clothing description, or "clothing item" as fallback on failure
 */
async function generateClothingDescription(
  imageDataUriOrUrl: string,
  username: string
): Promise<string> {
  const logger = createApiLogger('GEMINI_TEXT', 'Clothing Classification', {
    username,
    model: 'gemini-flash-lite-latest',
    keyIndex: 1,
  });

  const classificationPrompt = "Classify this clothing item using 2-5 words that specify both fit and length. Provide only the classification without additional formatting or explanation.";

  logger.start({
    imageSource: imageDataUriOrUrl.substring(0, 100),
    promptLength: classificationPrompt.length,
  });

  try {
    const apiKey = await getApiKeyForUser(username, 'gemini', 1);
    const ai = new GoogleGenAI({ apiKey });

    const imagePart = await imageToGenerativePart(imageDataUriOrUrl);
    logger.progress(`Image converted: ${imagePart.inlineData.mimeType}`);

    const contents = [{
      role: 'user',
      parts: [imagePart, { text: classificationPrompt }]
    }];

    const model = 'gemini-flash-lite-latest';
    
    logger.progress('Sending request to Gemini API');

    const response = await withGeminiRetry(async () => {
      const result = await ai.models.generateContent({ model, contents });
      if (!result.text) {
        throw new Error("Gemini did not return a text description");
      }
      return result;
    }, 'Clothing Classification');

    const description = response.text?.trim() || "clothing item";
    
    logger.success({
      description,
      candidatesCount: response.candidates?.length || 0,
      finishReason: response.candidates?.[0]?.finishReason || 'N/A',
    });
    
    return description;

  } catch (error) {
    logger.error(error, 'Using generic "clothing item" placeholder');
    return "clothing item";
  }
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
      await getApiKeyForUser(username, 'fal') // Inject User API Key
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
  const initialImageArray = Array(3).fill(null); // Always keep DB array size 3 for consistency in UI

  // 1. Create initial history item EARLY (if not existing)
  let historyId = existingHistoryId;
  
  if (!historyId && input.imageDataUriOrUrl) {
    try {
      const isStudio = input.generationMode === 'studio';
      const initialAttributes = isStudio 
        ? { studioFit: input.studioFit } as any 
        : input.parameters;
        
      historyId = await addHistoryItem(
        initialAttributes || {},
        "Processing...", // Placeholder prompt
        input.imageDataUriOrUrl,
        [null, null, null], // Empty images
        input.settingsMode || 'basic',
        user.image_generation_model,
        'processing', // STATUS: PROCESSING
        undefined,
        username,
        undefined,
        input.generationMode || 'creative'
      );
      console.log(`✅ Created initial history item: ${historyId}`);
    } catch (err) {
      console.error('Failed to create initial history item:', err);
      throw err;
    }
  }

  // 2. Schedule background work using Next.js 15 after()
  after(async () => {
    try {
      console.log(`🔄 Starting background generation for ${historyId}`);

      // ===================================
      // STUDIO MODE WORKFLOW
      // ===================================
      if (input.generationMode === 'studio') {
        console.log(`🚀 Routing to Studio Mode for user ${username}`);
        
        if (!input.studioFit || !input.imageDataUriOrUrl) {
          throw new Error('Studio Mode requires a fit setting and a source image.');
        }

        // Step 1: Generate a dynamic clothing description using AI
        const clothingDescription = await generateClothingDescription(
          input.imageDataUriOrUrl,
          username
        );
        console.log(`🏷️ Clothing identified as: "${clothingDescription}"`);
        
        // Step 2: Build the Studio Mode prompt and inject the clothing description
        let studioPrompt = buildStudioModePrompt(input.studioFit);
        
        // Use explicit placeholder replacement first, fall back to string match for backwards compatibility
        if (studioPrompt.includes('{clothingItem}')) {
           studioPrompt = studioPrompt.replace('{clothingItem}', clothingDescription);
        } else {
           // Fallback for legacy templates in DB that might still use the literal string
           studioPrompt = studioPrompt.replace("clothing item", clothingDescription);
        }
        console.log('📝 Studio Mode Prompt constructed with dynamic clothing description.');

        // Parallel Generation with Tuned Parameters (low temperature for consistency)
        // Parallel Generation with Tuned Parameters (low temperature for consistency)
        // Parallel Generation with Tuned Parameters (low temperature for consistency)
        const generationPromises = Array.from({ length: imagesToGenerateCount }, (_, i) => i + 1).map(async (i) => {
          try {
            const result = await performSingleImageGeneration({
              ...input,
              imageDataUriOrUrl: input.imageDataUriOrUrl, // Use original image directly
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

        // Handle Results
        const editedImageUrlsResult: (string | null)[] = Array(imagesToGenerateCount).fill(null);
        const errorsResult: (string | null)[] = Array(imagesToGenerateCount).fill(null);

        settledResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            editedImageUrlsResult[index] = result.value.editedImageUrl;
          } else {
            console.error(`Studio Mode generation ${index + 1} failed:`, result.reason);
            errorsResult[index] = result.reason?.message || 'Unknown error';
          }
        });

        // Update History
        if (historyId) {
          dbService.updateHistoryItem(historyId, {
            constructedPrompt: studioPrompt,
            editedImageUrls: editedImageUrlsResult,
            status: errorsResult.every(e => e) ? 'failed' : 'completed',
            error: errorsResult.find(e => e) || undefined
          });
          console.log(`✅ Studio Mode: History updated for ${historyId}`);
        }
        return;
      }

      // ======================================
      // CREATIVE MODE WORKFLOW
      // ======================================
      console.log(`🎨 Routing to Creative Mode for user ${username}`);

      // === NON-DESTRUCTIVE PIPELINE: Apply image processing if requested ===
      let processedImageUrl = input.imageDataUriOrUrl;
      
      if (input.imageDataUriOrUrl && (input.removeBackground || input.upscale || input.enhanceFace)) {
        console.log('🔧 Applying non-destructive image processing pipeline...');
        
        try {
          // Step 1: Background Removal (if enabled)
          if (input.removeBackground) {
            console.log('🎨 Step 1: Removing background...');
            const bgResult = await removeBackgroundAction(processedImageUrl!, undefined);
            processedImageUrl = bgResult.savedPath;
            console.log(`✅ Background removed. New path: ${processedImageUrl}`);
          }
          
          // Step 2: Upscale (if enabled)
          if (input.upscale) {
            console.log('🔍 Step 2: Upscaling image...');
            const upscaleResult = await upscaleImageAction(processedImageUrl!, undefined);
            processedImageUrl = upscaleResult.savedPath;
            console.log(`✅ Image upscaled. New path: ${processedImageUrl}`);
          }
          
          // Step 3: Face Enhancement (if enabled)
          if (input.enhanceFace) {
            console.log('👤 Step 3: Enhancing face details...');
            const faceResult = await faceDetailerAction(processedImageUrl!, undefined);
            processedImageUrl = faceResult.savedPath;
            console.log(`✅ Face details enhanced. New path: ${processedImageUrl}`);
          }
          
          console.log('✨ Pipeline complete. Processed image ready for generation.');
        } catch (pipelineError) {
          console.error('❌ Pipeline processing error:', pipelineError);
          throw new Error(`Image processing pipeline failed: ${(pipelineError as Error).message}`);
        }
      }
      
      // Update the input with the processed image URL
      const processedInput = { ...input, imageDataUriOrUrl: processedImageUrl };

      // NEW LOGIC: PROMPT GENERATION
      let prompts: (string | null)[];
      let finalConstructedPromptForHistory: string;

      const modelToUse = user.image_generation_model;

      // High-priority override: If a manual prompt is provided, use it for all slots.
      if (processedInput.prompt) {
        console.log('Using manually provided prompt for all image slots.');
        prompts = Array(imagesToGenerateCount).fill(processedInput.prompt);
        finalConstructedPromptForHistory = processedInput.prompt;
      } else {
        // STAGE 1: Determine the parameter sets for each slot (randomized or fixed).
        let parameterSetsForSlots: ModelAttributes[];

        if (processedInput.useRandomization) {
          console.log(`🎲 Randomization enabled. Generating ${imagesToGenerateCount} different parameter sets.`);
          parameterSetsForSlots = Array.from({ length: imagesToGenerateCount }, () => generateRandomBasicParameters(processedInput.parameters!));
        } else {
          console.log(`⚙️ Using fixed parameters for all ${imagesToGenerateCount} slots.`);
          parameterSetsForSlots = Array(imagesToGenerateCount).fill(processedInput.parameters);
        }

        // STAGE 2: Build prompts from the determined parameter sets.
        if (processedInput.useAIPrompt && processedInput.imageDataUriOrUrl) {
          console.log('🧠 Using AI prompt enhancement...');
          const promptPromises = parameterSetsForSlots.map((params, i) =>
            generatePromptWithAI(params, processedInput.imageDataUriOrUrl!, username, (i + 1) as 1 | 2 | 3)
              .catch(err => {
                console.warn(`AI prompt generation for slot ${i + 1} failed. Falling back to local builder. Reason:`, err);
                return buildAIPrompt({ type: 'image', params: { ...params, settingsMode: 'advanced' } });
              })
          );
          prompts = await Promise.all(promptPromises);
        } else {
          console.log('📝 Using local prompt builder...');
          prompts = parameterSetsForSlots.map(params =>
            buildAIPrompt({ type: 'image', params: { ...params, settingsMode: processedInput.settingsMode || 'basic' } })
          );
        }

        // The first prompt is considered the "main" one for history purposes.
        finalConstructedPromptForHistory = prompts[0] || 'Prompt generation failed.';
      }
      
      // Log all received optimized prompts together
      console.log(`\n🚀 ALL AI-GENERATED PROMPTS SUMMARY:`);
      console.log('='.repeat(100));
      console.log(`Target Model for Generation: ${modelToUse}`);
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

      const [prompt1, prompt2, prompt3] = prompts;

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

      const editedImageUrlsResult: (string | null)[] = Array(imagesToGenerateCount).fill(null);
      const errorsResult: (string | null)[] = Array(imagesToGenerateCount).fill(null);

      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          editedImageUrlsResult[index] = result.value.editedImageUrl;
        } else {
          console.error(`Error from flow ${index + 1}:`, result.reason);
          const reasonError = result.reason as Error;
          errorsResult[index] = `Image ${index + 1} processing failed: ${reasonError?.message || 'Unknown error'}`;
        }
      });

      // Update History
      if (historyId) {
        dbService.updateHistoryItem(historyId, {
          constructedPrompt: finalConstructedPromptForHistory,
          editedImageUrls: editedImageUrlsResult,
          status: errorsResult.every(e => e) ? 'failed' : 'completed',
          error: errorsResult.find(e => e) || undefined
        });
        console.log(`✅ Creative Mode: History updated for ${historyId}`);
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
