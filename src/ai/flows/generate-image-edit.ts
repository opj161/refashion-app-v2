// This is a server-side file.
'use server';

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
import { generateWithGemini25Flash } from '@/services/fal-api/image.service';
import { downloadAndSaveImageFromUrl } from '@/services/storage.service';

// Import Axios and HttpsProxyAgent for explicit proxy control
import axios, { AxiosError } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { withGeminiRetry } from '@/lib/api-retry';

// Direct API configuration matching Python implementation
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent";

// --- START Defined Types ---
interface GeminiPart {
  inlineData?: {
    mimeType: string;
    data: string;
  };
  text?: string;
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

interface GeminiGenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  responseModalities: string[];
}

interface GeminiSafetySetting {
  category: string;
  threshold: string;
}

interface GeminiApiRequestBody {
  contents: GeminiContent[];
  generationConfig: GeminiGenerationConfig;
  safetySettings: GeminiSafetySetting[];
}

interface GeminiApiSuccessResponseCandidate {
  finishReason?: string;
  content?: {
    parts?: Array<GeminiPart>;
  };
  // Other candidate properties if relevant
}
interface GeminiApiSuccessResponse {
  candidates?: Array<GeminiApiSuccessResponseCandidate>;
  // Other top-level response properties if relevant
}

interface GeminiErrorDetail {
  message: string;
  // other fields like code, status if they exist
}

interface GeminiErrorData { // Renamed from GeminiErrorResponse to avoid conflict with actual HTTP response
  error?: GeminiErrorDetail | string;
}
// --- END Defined Types ---

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
 * Make a direct API call to Gemini API with explicit proxy support using axios
 * This provides better proxy control than node-fetch's automatic detection
 */
async function makeGeminiApiCall(apiKey: string, requestBody: GeminiApiRequestBody): Promise<GeminiApiSuccessResponse> {
  const url = `${BASE_URL}?key=${apiKey}`;
  
  let httpsAgent;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxyUrl) {
    console.log(`Using proxy: ${proxyUrl.replace(/\/\/.*@/, '//***:***@')}`);
    httpsAgent = new HttpsProxyAgent(proxyUrl);
  } else {
    console.log('No HTTPS_PROXY environment variable set. Making direct call.');
  }

  console.log(`Making Axios API call to: ${url.replace(/key=.*/, 'key=***')}`);
  
  try {
    const response = await axios.post<GeminiApiSuccessResponse>(url, requestBody, { // Added type to axios.post
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: httpsAgent,
    });

    console.log(`Gemini API response status: ${response.status}`);
    return response.data;

  } catch (error) {
    console.error('Error calling Gemini API:', axios.isAxiosError(error) ? error.toJSON() : error);
    
    if (axios.isAxiosError<GeminiErrorData>(error) && error.response) {
      console.error("Axios error response data:", error.response.data);
      const errData = error.response.data.error;
      const message = (typeof errData === 'string' ? errData : errData?.message) || JSON.stringify(error.response.data);
      throw new Error(`Gemini API Error (${error.response.status}): ${message}`);
    }
    
    const generalError = error as Error;
    throw new Error(`Failed to call Gemini API: ${generalError.message}`);
  }
}

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
  user: FullUser, // <-- Accept the full user object as a parameter
  flowIdentifier: string,
  keyIndex: 1 | 2 | 3
): Promise<SingleImageOutput> {
  const username = user.username; // Get username from the passed object
  
  // 2. Route based on the user's setting
  if (user.image_generation_model === 'fal_gemini_2_5') {
    // --- FAL.AI GEMINI 2.5 PATH ---
    console.log(`🚀 Routing to Fal.ai Gemini 2.5 for ${flowIdentifier}`);
    
    if (!input.imageDataUriOrUrl) {
      throw new Error(`FAL.AI Gemini 2.5 requires a source image for ${flowIdentifier}`);
    }
    
    // Convert to public URL for FAL.AI (FAL.AI requires publicly accessible URLs)
    let publicImageUrl = input.imageDataUriOrUrl;
    
    if (input.imageDataUriOrUrl.startsWith('data:')) {
      // Handle data URI: Convert to Blob and upload to FAL storage
      const dataUriMatch = input.imageDataUriOrUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!dataUriMatch) {
        throw new Error(`Invalid data URI format for FAL.AI upload in ${flowIdentifier}`);
      }
      
      const mimeType = dataUriMatch[1];
      const base64Data = dataUriMatch[2];
      const binaryData = Buffer.from(base64Data, 'base64');
      const imageBlob = new Blob([binaryData], { type: mimeType });
      
      const { uploadToFalStorage } = await import('@/ai/actions/generate-video.action');
      publicImageUrl = await uploadToFalStorage(imageBlob, username);
      console.log(`Converted data URI to public URL for FAL.AI: ${publicImageUrl}`);
    } else if (input.imageDataUriOrUrl.startsWith('/uploads/') || input.imageDataUriOrUrl.startsWith('uploads/')) {
      // Handle local file path: Read from disk and upload to FAL storage
      console.log(`Converting local file path to public URL for FAL.AI: ${input.imageDataUriOrUrl}`);
      
      // Use secure file reading utility (consistent with video generation)
      const fileBuffer = await getBufferFromLocalPath(input.imageDataUriOrUrl);
      const mimeType = mime.lookup(input.imageDataUriOrUrl) || 'image/png';
      
      // Use consistent blob creation pattern (matching video generation)
      const imageBlob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
      
      const { uploadToFalStorage } = await import('@/ai/actions/generate-video.action');
      publicImageUrl = await uploadToFalStorage(imageBlob, username);
      console.log(`Converted local file to public URL for FAL.AI: ${publicImageUrl}`);
    } else if (!input.imageDataUriOrUrl.startsWith('http://') && !input.imageDataUriOrUrl.startsWith('https://')) {
      throw new Error(`Invalid image URL format for FAL.AI: ${input.imageDataUriOrUrl}. Expected data URI, local file path, or public URL.`);
    }
    
    try {
      const falResult = await generateWithGemini25Flash(
        input.prompt || '',
        publicImageUrl,
        username
      );
      
      console.log(`🔍 FAL.AI generated image at: ${falResult.imageUrl}`);
      if (falResult.description) {
        console.log(`🔍 FAL.AI description: ${falResult.description}`);
      }
      
      // Download the FAL.AI generated image and store it locally for consistency
      // This ensures all generated images follow the same storage pattern
      const { relativeUrl: localImageUrl } = await downloadAndSaveImageFromUrl(
        falResult.imageUrl,
        `RefashionAI_fal_generated_${flowIdentifier}`,
        'generated_images'
      );
      
      console.log(`🔍 Successfully generated and stored FAL.AI image locally for ${flowIdentifier}: ${localImageUrl}`);
      return { editedImageUrl: localImageUrl };
    } catch (falError: unknown) {
      const knownFalError = falError as Error;
      console.error(`FAL.AI generation failed for ${flowIdentifier}:`, knownFalError);
      throw new Error(`FAL.AI generation failed for ${flowIdentifier}: ${knownFalError.message}`);
    }
  }

  // --- GOOGLE GEMINI 2.0 PATH (EXISTING LOGIC) ---
  console.log(`🛰️ Routing to Google Gemini 2.0 for ${flowIdentifier}`);
  const apiKey = await getApiKeyForUser(username, 'gemini', keyIndex);

  let sourceImageDataForModelProcessing: { mimeType: string; data: string; } | null = null;
  if (input.imageDataUriOrUrl) {
    let dataUriToProcess = input.imageDataUriOrUrl;
    if (input.imageDataUriOrUrl.startsWith('http://') || input.imageDataUriOrUrl.startsWith('https://')) {
      try {
        // CACHE-STRATEGY: Policy: Static - The source image URL should be treated as a static asset.
        // Caching prevents re-downloading if the same image is used in multiple generation slots.
        console.log(`Fetching image from URL for ${flowIdentifier}: ${input.imageDataUriOrUrl}`);
        const response = await fetch(input.imageDataUriOrUrl, { cache: 'force-cache' } as any);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL (${input.imageDataUriOrUrl}): ${response.status} ${response.statusText}`);
        }
        const imageBuffer = await response.buffer();
        const mimeType = response.headers.get('content-type') || 'image/png';
        if (!mimeType.startsWith('image/')) {
          throw new Error(`Fetched content from URL (${input.imageDataUriOrUrl}) is not an image: ${mimeType}`);
        }
        dataUriToProcess = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        console.log(`Successfully converted URL to data URI for ${flowIdentifier}. MimeType: ${mimeType}`);
      } catch (fetchError: unknown) { // Changed to unknown
        console.error(`Error fetching or converting image URL for ${flowIdentifier}:`, fetchError);
        throw new Error(`Failed to process source image from URL for ${flowIdentifier}: ${(fetchError as Error).message}`);
      }
    } else if (input.imageDataUriOrUrl.startsWith('/')) {
      try {
        // Use secure file system utility for reading local files
        const imageBuffer = await getBufferFromLocalPath(input.imageDataUriOrUrl);
        const mimeType = mime.lookup(input.imageDataUriOrUrl) || 'image/png';
        dataUriToProcess = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        console.log(`Successfully converted local path ${input.imageDataUriOrUrl} to data URI for ${flowIdentifier}.`);
      } catch (localFileError: unknown) { // Changed to unknown
        console.error(`Error reading local image file for ${flowIdentifier}:`, localFileError);
        throw new Error(`Failed to process local source image for ${flowIdentifier}: ${(localFileError as Error).message}`);
      }
    }
    const match = dataUriToProcess.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      sourceImageDataForModelProcessing = { mimeType: match[1], data: match[2] };
    } else if (input.imageDataUriOrUrl) {
        console.warn(`Could not parse processed image data URI for ${flowIdentifier}. Original input: ${input.imageDataUriOrUrl}`);
    }
  }
  const parts: GeminiPart[] = []; // Typed parts
  
  if (sourceImageDataForModelProcessing) {
    parts.push({
      inlineData: {
        mimeType: sourceImageDataForModelProcessing.mimeType,
        data: sourceImageDataForModelProcessing.data,
      },
    });
  }
  parts.push({ text: input.prompt });
  const requestBody: GeminiApiRequestBody = { // Typed requestBody
    contents: [
      {
        role: "user",
        parts: parts
      }
    ],
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseModalities: ["image", "text"]
    },
    safetySettings: [
      {
        "category": "HARM_CATEGORY_CIVIC_INTEGRITY",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE"
      }
    ]
  };
  console.log(`Calling Gemini API directly for ${flowIdentifier} with model gemini-2.0-flash-preview-image-generation`);
  console.log(`With API Key: ${apiKey ? 'SET' : 'NOT SET'}`);
  if (sourceImageDataForModelProcessing) {
    console.log(`WITH IMAGE: ${sourceImageDataForModelProcessing.mimeType}`);
  } else {
    console.log(`Performing text-to-image generation for ${flowIdentifier} as no source image was provided or processed.`);
  }
  
  // Use centralized retry logic for image generation
  return withGeminiRetry(async () => {
    console.log(`🔍 Generating image for ${flowIdentifier} using REST API`);
    
    const response = await makeGeminiApiCall(apiKey, requestBody);
    
    let generatedImageDataUri: string | null = null;
    
    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        console.warn(`Image generation blocked by safety settings for ${flowIdentifier}. Candidate:`, JSON.stringify(candidate, null, 2));
        throw new Error(`Image generation blocked by safety settings for ${flowIdentifier}.`);
      }
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType;
            const base64Data = part.inlineData.data;
            generatedImageDataUri = `data:${mimeType};base64,${base64Data}`;
            console.log(`🔍 Image received from ${flowIdentifier} via REST. MimeType: ${mimeType}`);
            break;
          } else if (part.text) {
            console.log(`🔍 Text response from ${flowIdentifier}: ${part.text}`);
          }
        }
      }
    }

    if (!generatedImageDataUri) {
      console.error(`🔍 AI for ${flowIdentifier} (REST) did not return an image. Full API Response:`, JSON.stringify(response, null, 2));
      throw new Error(`AI for ${flowIdentifier} (REST) did not return image data.`);
    }
    
    console.log(`🔍 Successfully generated image for ${flowIdentifier}`);
    
    try {
      const { relativeUrl: imageUrl } = await saveDataUriLocally(
        generatedImageDataUri,
        `RefashionAI_generated_${flowIdentifier}`,
        'generated_images'
      );
      return { editedImageUrl: imageUrl };
    } catch (uploadError: unknown) {
      const knownUploadError = uploadError as Error;
      console.error(`Error storing image from ${flowIdentifier} (axios):`, knownUploadError);
      throw new Error(`Failed to store image from ${flowIdentifier} (axios): ${knownUploadError.message}`);
    }
  }, `Image generation for ${flowIdentifier}`);
}

async function generateImageFlow1(input: GenerateImageEditInput, user: FullUser): Promise<SingleImageOutput> {
  return performSingleImageGeneration(input, user, 'flow1', 1);
}

async function generateImageFlow2(input: GenerateImageEditInput, user: FullUser): Promise<SingleImageOutput> {
  return performSingleImageGeneration(input, user, 'flow2', 2);
}

async function generateImageFlow3(input: GenerateImageEditInput, user: FullUser): Promise<SingleImageOutput> {
  return performSingleImageGeneration(input, user, 'flow3', 3);
}

const GenerateMultipleImagesOutputSchema = z.object({
  editedImageUrls: z.array(z.string().nullable()).length(3)
    .describe('An array of three generated or edited image URLs/paths (or null for failures).'),
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

  // NEW LOGIC: PROMPT GENERATION
  let prompts: (string | null)[];
  let finalConstructedPromptForHistory: string;

  const modelToUse = user.image_generation_model;

  // --- START REFACTORED LOGIC ---

  // High-priority override: If a manual prompt is provided, use it for all slots.
  if (input.prompt) {
    console.log('Using manually provided prompt for all image slots.');
    prompts = Array(3).fill(input.prompt);
    finalConstructedPromptForHistory = input.prompt;
  } else {
    // STAGE 1: Determine the parameter sets for each slot (randomized or fixed).
    let parameterSetsForSlots: ModelAttributes[];

    // REMOVED: `&& modelToUse !== 'fal_gemini_2_5'` condition.
    // This ensures randomization works consistently for all image generation models,
    // honoring the user's explicit choice in the UI.
    if (input.useRandomization) {
      console.log('🎲 Randomization enabled. Generating 3 different parameter sets.');
      parameterSetsForSlots = Array.from({ length: 3 }, () => generateRandomBasicParameters(input.parameters!));
    } else {
      console.log('⚙️ Using fixed parameters for all 3 slots.');
      // The informational log about disabled randomization is no longer needed as the condition is removed.
      parameterSetsForSlots = Array(3).fill(input.parameters);
    }

    // STAGE 2: Build prompts from the determined parameter sets.
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

    // The first prompt is considered the "main" one for history purposes.
    finalConstructedPromptForHistory = prompts[0] || 'Prompt generation failed.';
  }
  // --- END REFACTORED LOGIC ---
  
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

  const generationPromises = [
    performSingleImageGeneration({ ...input, prompt: prompt1! }, user, `flow1`, 1),
    performSingleImageGeneration({ ...input, prompt: prompt2! }, user, `flow2`, 2),
    performSingleImageGeneration({ ...input, prompt: prompt3! }, user, `flow3`, 3),
  ];

  const settledResults = await Promise.allSettled(generationPromises);

  const editedImageUrlsResult: (string | null)[] = Array(3).fill(null);
  const errorsResult: (string | null)[] = Array(3).fill(null);

  settledResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      editedImageUrlsResult[index] = result.value.editedImageUrl;
    } else {
      console.error(`Error from flow ${index + 1}:`, result.reason);
      const reasonError = result.reason as Error;
      errorsResult[index] = `Image ${index + 1} processing failed: ${reasonError?.message || 'Unknown error'}`;
    }
  });

  // Add to history if at least one image succeeded
  const successCount = editedImageUrlsResult.filter(url => url !== null).length;
  if (successCount > 0) {
    const modelUsed = user.image_generation_model;
    if (username && input.imageDataUriOrUrl) {
      try {
        if (existingHistoryId) {
          // When caller provided a job id, do NOT create a new history record here.
          // Caller (e.g. API worker) is expected to call updateHistoryItem(jobId, ...) afterwards.
          // This avoids creating a duplicate row for API job flows.
        } else {
          const newHistoryId = await addHistoryItem(
            input.parameters,
            finalConstructedPromptForHistory,
            input.imageDataUriOrUrl,
            editedImageUrlsResult,
            input.settingsMode || 'basic',
            modelUsed,
            'completed'
          );
          // Return the created history id to caller so the client can set activeHistoryItemId.
          return {
            editedImageUrls: editedImageUrlsResult,
            constructedPrompt: finalConstructedPromptForHistory,
            errors: errorsResult.some(e => e !== null) ? errorsResult : undefined,
            newHistoryId
          };
        }
      } catch (err) {
        console.error('Failed to add history item:', err);
      }
    }
  }

  return {
    editedImageUrls: editedImageUrlsResult,
    constructedPrompt: finalConstructedPromptForHistory,
    errors: errorsResult.some(e => e !== null) ? errorsResult : undefined
  };
}
