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
import { buildAIPrompt, GENDER_OPTIONS, BODY_SHAPE_AND_SIZE_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS } from '@/lib/prompt-builder';
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
 * Generate random parameters for stylistic settings only
 * Excludes core model attributes (gender, bodyType, bodySize, ageRange) which should remain as user selected
 * Always randomizes background and ethnicity only
 */
function generateRandomBasicParameters(baseParameters: ModelAttributes): ModelAttributes {
  const pickRandom = (options: any[]) => options[Math.floor(Math.random() * options.length)].value;
  
  // Randomize background and ethnicity only
  const result = {
    ...baseParameters, // Keep all existing parameters
    background: pickRandom(BACKGROUND_OPTIONS),
    ethnicity: pickRandom(ETHNICITY_OPTIONS),
  };
  
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
  useRandomizedAIPrompts: z.boolean().optional().default(false).describe('Whether to use different random parameters for each of the 3 AI prompts.'),
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


export async function generateImageEdit(input: GenerateImageEditInput, username: string): Promise<GenerateMultipleImagesOutput> {
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

  if (input.useAIPrompt && input.parameters && input.imageDataUriOrUrl) {
    console.log("Using AI to generate prompts...");
    
    let parametersForPrompts: ModelAttributes[];
    // Only randomize if we are using the Google model which makes separate calls
    if (input.useRandomizedAIPrompts && modelToUse === 'google_gemini_2_0') {
      console.log("🎲 RANDOMIZATION ENABLED: Generating 3 different random parameter sets for AI prompts");
      // Generate 3 different random parameter sets
      parametersForPrompts = [
        generateRandomBasicParameters(input.parameters),
        generateRandomBasicParameters(input.parameters),
        generateRandomBasicParameters(input.parameters)
      ];
      
      // Log the randomized parameters for each prompt
      parametersForPrompts.forEach((params, index) => {
        console.log(`\n🎲 RANDOM PARAMETERS SET ${index + 1}:`);
        console.log(`Ethnicity: ${params.ethnicity}, Background: ${params.background}`);
        console.log(`[Keeping user's: Gender: ${params.gender}, Body: ${params.bodyShapeAndSize}, Age: ${params.ageRange}, Hair: ${params.hairStyle}, Expression: ${params.modelExpression}, Pose: ${params.poseStyle}]`);
      });
    } else {
      // Use the same parameters for all 3 prompts
      parametersForPrompts = [input.parameters, input.parameters, input.parameters];
      if (input.useRandomizedAIPrompts && modelToUse === 'fal_gemini_2_5') {
        console.log("INFO: Randomization is disabled for Fal.ai model as it uses a single prompt for all images.");
      }
    }
    
    const promptPromises = [
      generatePromptWithAI(parametersForPrompts[0], input.imageDataUriOrUrl, username, 1),
      generatePromptWithAI(parametersForPrompts[1], input.imageDataUriOrUrl, username, 2),
      generatePromptWithAI(parametersForPrompts[2], input.imageDataUriOrUrl, username, 3),
    ];
    const promptResults = await Promise.allSettled(promptPromises);
    prompts = promptResults.map((res, index) => {
      if (res.status === 'fulfilled') {
        return res.value;
      } else {
        console.warn(`AI prompt generation failed for slot ${index + 1}. Using high-quality fallback prompt. Reason:`, res.reason);
        
        // Fallback to a high-quality, locally-built prompt
        const fallbackParams: Omit<ModelAttributes, 'settingsMode'> = {
          ...parametersForPrompts[index],
          // Ensure some safe, high-quality defaults are set if not present
          poseStyle: parametersForPrompts[index].poseStyle === 'default' ? 'standing_relaxed' : parametersForPrompts[index].poseStyle,
          modelExpression: parametersForPrompts[index].modelExpression === 'default' ? 'neutral_subtle_smile' : parametersForPrompts[index].modelExpression,
          background: parametersForPrompts[index].background === 'default' ? 'studio_neutral_gray' : parametersForPrompts[index].background,
          lightingType: 'studio_lighting',
          lightQuality: 'soft_even_light',
          cameraAngle: 'eye_level',
        };

        return buildAIPrompt({
          type: 'image',
          params: fallbackParams
        });
      }
    });
    
    // For history, we'll save the first successfully generated prompt.
    finalConstructedPromptForHistory = prompts.find(p => p !== null) ?? "AI prompt generation failed.";
  } else {
    console.log("Using local prompt builder...");
    let constructedPrompt: string;
    if (input.parameters) {
      constructedPrompt = buildAIPrompt({
        type: 'image',
        params: {
          ...input.parameters,
          settingsMode: input.settingsMode || 'basic'
        }
      });
    } else if (input.prompt) {
      constructedPrompt = input.prompt;
    } else {
      throw new Error('Either parameters or prompt must be provided');
    }
    prompts = Array(3).fill(constructedPrompt);
    finalConstructedPromptForHistory = constructedPrompt;
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

  // MODIFIED LOGIC: IMAGE GENERATION
  const imageGenerationPromises = prompts.map((prompt, index) => {
    if (prompt) {
      // Create a specific input object for each generation with its unique prompt
      const inputForGeneration: GenerateImageEditInput = {
        ...input,
        prompt: prompt,
      };
      // Call the appropriate generation function
      switch (index) {
        case 0:
          return generateImageFlow1(inputForGeneration, user);
        case 1:
          return generateImageFlow2(inputForGeneration, user);
        case 2:
          return generateImageFlow3(inputForGeneration, user);
        default:
          throw new Error(`Invalid flow index: ${index}`);
      }
    }
    // If prompt generation failed for this slot, return a rejected promise
    return Promise.reject(new Error('Prompt was not generated for this slot.'));
  });

  const results = await Promise.allSettled(imageGenerationPromises);

  const editedImageUrlsResult: (string | null)[] = [null, null, null];
  const errorsResult: (string | null)[] = [null, null, null];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      editedImageUrlsResult[index] = result.value.editedImageUrl;
    } else {
      console.error(`Error from flow ${index + 1}:`, result.reason);
      // Ensure result.reason is an Error before accessing .message
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
        const newHistoryId = await addHistoryItem(
          input.parameters,
          finalConstructedPromptForHistory,
          input.imageDataUriOrUrl,
          editedImageUrlsResult,
          input.settingsMode || 'basic',
          modelUsed,
          'completed'
        );
        // Optionally set active history item or refresh gallery here
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

export async function generateSingleImageSlot(
  input: GenerateImageEditInput, 
  slotIndex: 0 | 1 | 2, 
  username: string
): Promise<{ slotIndex: number; result: SingleImageOutput; constructedPrompt: string }> {
  if (!username) {
    throw new Error('Username is required to generate images.');
  }

  // Fetch the user object ONCE at the beginning
  const user = dbService.findUserByUsername(username);
  if (!user) {
    throw new Error(`User ${username} not found.`);
  }

  // Generate prompt for this specific slot
  let promptForSlot: string;
  let finalConstructedPromptForHistory: string;

  if (input.useAIPrompt && input.parameters && input.imageDataUriOrUrl) {
    console.log(`🎨 Generating AI prompt for slot ${slotIndex + 1}...`);
    
    let parametersForPrompt: ModelAttributes;
    if (input.useRandomizedAIPrompts) {
      console.log(`🎲 Using randomized parameters for slot ${slotIndex + 1}`);
      parametersForPrompt = generateRandomBasicParameters(input.parameters);
      
      // Log the randomized parameters for this slot
      console.log(`\n🎲 RANDOM PARAMETERS FOR SLOT ${slotIndex + 1}:`);
      console.log(`Ethnicity: ${parametersForPrompt.ethnicity}, Hair: ${parametersForPrompt.hairStyle}`);
      console.log(`Expression: ${parametersForPrompt.modelExpression}, Pose: ${parametersForPrompt.poseStyle}`);
      console.log(`Background: ${parametersForPrompt.background}`);
      console.log(`[Keeping user's: Gender: ${parametersForPrompt.gender}, Body: ${parametersForPrompt.bodyShapeAndSize}, Age: ${parametersForPrompt.ageRange}]`);
    } else {
      parametersForPrompt = input.parameters;
    }
    
    try {
      promptForSlot = await generatePromptWithAI(parametersForPrompt, input.imageDataUriOrUrl, username, (slotIndex + 1) as 1 | 2 | 3);
      finalConstructedPromptForHistory = promptForSlot;
      
      console.log(`\n🚀 AI-GENERATED PROMPT FOR SLOT ${slotIndex + 1}:`);
      console.log('='.repeat(60));
      console.log(promptForSlot);
      console.log('='.repeat(60));
    } catch (error) {
      console.error(`Failed to generate AI prompt for slot ${slotIndex + 1}:`, error);
      throw new Error(`AI prompt generation failed for slot ${slotIndex + 1}: ${(error as Error).message}`);
    }
  } else {
    console.log(`Using local prompt builder for slot ${slotIndex + 1}...`);
    if (input.parameters) {
      promptForSlot = buildAIPrompt({
        type: 'image',
        params: {
          ...input.parameters,
          settingsMode: input.settingsMode || 'basic'
        }
      });
    } else if (input.prompt) {
      promptForSlot = input.prompt;
    } else {
      throw new Error('Either parameters or prompt must be provided');
    }
    finalConstructedPromptForHistory = promptForSlot;
  }

  // Generate the image for this slot
  const inputForGeneration: GenerateImageEditInput = {
    ...input,
    prompt: promptForSlot,
  };

  let result: SingleImageOutput;
  switch (slotIndex) {
    case 0:
      result = await generateImageFlow1(inputForGeneration, user);
      break;
    case 1:
      result = await generateImageFlow2(inputForGeneration, user);
      break;
    case 2:
      result = await generateImageFlow3(inputForGeneration, user);
      break;
    default:
      throw new Error(`Invalid slot index: ${slotIndex}`);
  }

  return {
    slotIndex,
    result,
    constructedPrompt: finalConstructedPromptForHistory
  };
}

export async function regenerateSingleImage(input: GenerateImageEditInput, flowIndex: number, username: string): Promise<SingleImageOutput> {
  if (!username) {
    throw new Error('Username is required to re-roll an image.');
  }
  
  // Fetch the user object ONCE at the beginning
  const user = dbService.findUserByUsername(username);
  if (!user) {
    throw new Error(`User ${username} not found.`);
  }
  
  console.log(`Attempting to re-roll image for flow index: ${flowIndex}`);
  switch (flowIndex) {
    case 0:
      return performSingleImageGeneration(input, user, 'flow1-reroll', 1);
    case 1:
      return performSingleImageGeneration(input, user, 'flow2-reroll', 2);
    case 2:
      return performSingleImageGeneration(input, user, 'flow3-reroll', 3);
    default:
      throw new Error(`Invalid flow index: ${flowIndex}. Must be 0, 1, or 2.`);
  }
}
