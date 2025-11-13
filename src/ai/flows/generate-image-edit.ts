// This is a server-side file.
'use server';

import 'server-only';

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
import { removeBackgroundAction } from '@/ai/actions/remove-background.action';
import { upscaleImageAction, faceDetailerAction } from '@/ai/actions/upscale-image.action';
import { getSetting } from '@/services/settings.service'; // Add this import for Studio Mode prompt

// Import Axios and HttpsProxyAgent for explicit proxy control
import axios, { AxiosError } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { withGeminiRetry } from '@/lib/api-retry';

// Import GoogleGenAI SDK for text-based classification tasks
import { GoogleGenAI } from '@google/genai';

// Import API logger for standardized logging
import { createApiLogger } from '@/lib/api-logger';

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
 * Studio Mode: Get fit description based on the selected fit type
 */
function getStudioModeFitDescription(fit: 'slim' | 'regular' | 'relaxed'): string {
  switch (fit) {
    case 'slim': return "slim fit, tailored closely to the model's body.";
    case 'relaxed': return "relaxed fit, draping loosely and away from the model's body.";
    case 'regular':
    default: return "regular fit, with a standard, comfortable drape.";
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
  const fallbackTemplate = `Create a PHOTOREALISTIC image of a female fashion model, of Indigenous descent, wearing this clothing item in the image with a {fitDescription}.

Setting: a modern studio setting with a seamless cyclorama with a subtle, even gradient as background

Style: The model should look authentic and relatable, with a natural expression and subtle smile

Technical details: Full-body shot. Superior clarity, well-exposed, and masterful composition.`;

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
async function makeGeminiApiCall(
  apiKey: string, 
  requestBody: GeminiApiRequestBody, 
  keyIndex: number,
  username: string
): Promise<GeminiApiSuccessResponse> {
  const logger = createApiLogger('GEMINI_IMAGE', 'Direct Image Generation', {
    username,
    model: 'gemini-2.0-flash-exp-image',
    keyIndex,
  });

  const url = `${BASE_URL}?key=${apiKey}`;
  
  logger.start({
    promptLength: requestBody.contents[0].parts.find(p => 'text' in p)?.text?.length || 0,
    hasImage: requestBody.contents[0].parts.some(p => 'inlineData' in p),
    temperature: requestBody.generationConfig?.temperature,
  });

  let httpsAgent;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxyUrl) {
    logger.progress(`Using proxy: ${proxyUrl.replace(/\/\/.*@/, '//***:***@')}`);
    httpsAgent = new HttpsProxyAgent(proxyUrl);
  } else {
    logger.progress('Making direct API call (no proxy)');
  }
  
  try {
    const response = await axios.post<GeminiApiSuccessResponse>(url, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: httpsAgent,
    });

    logger.success({
      status: response.status,
      hasImageResponse: !!response.data.candidates?.[0]?.content?.parts?.[0]?.inlineData,
    });
    
    return response.data;

  } catch (error) {
    if (axios.isAxiosError<GeminiErrorData>(error) && error.response) {
      const errData = error.response.data.error;
      const message = (typeof errData === 'string' ? errData : errData?.message) || JSON.stringify(error.response.data);
      
      logger.error(error, `Gemini API Error (${error.response.status}): ${message}`);
      throw new Error(`Gemini API Error (${error.response.status}): ${message}`);
    }
    
    logger.error(error);
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
  user: FullUser, // <-- Accept the full user object as a parameter
  flowIdentifier: string,
  keyIndex: 1 | 2 | 3,
  generationConfigOverride?: Partial<GeminiGenerationConfig>
): Promise<SingleImageOutput> {
  const username = user.username; // Get username from the passed object
  
  // 2. Route based on the user's setting
  if (user.image_generation_model === 'fal_gemini_2_5') {
    // --- FAL.AI GEMINI 2.5 PATH ---
    const logger = createApiLogger('FAL_IMAGE', 'Fal.ai Image Generation (Gemini 2.5)', {
      username,
      endpoint: 'fal-ai/gemini-25-flash-image-edit',
    });

    if (!input.imageDataUriOrUrl) {
      throw new Error(`FAL.AI Gemini 2.5 requires a source image for ${flowIdentifier}`);
    }
    
    logger.start({
      flowIdentifier,
      promptLength: input.prompt?.length || 0,
      sourceType: input.imageDataUriOrUrl.startsWith('data:') ? 'dataURI' : 
                  input.imageDataUriOrUrl.startsWith('/') ? 'localFile' : 'publicURL',
    });

    // Convert to public URL for FAL.AI (FAL.AI requires publicly accessible URLs)
    let publicImageUrl = input.imageDataUriOrUrl;
    
    if (input.imageDataUriOrUrl.startsWith('data:')) {
      // Handle data URI: Convert to Blob and upload to FAL storage
      logger.progress('Converting data URI to public URL via Fal Storage');
      
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
      logger.progress(`Data URI converted to public URL: ${publicImageUrl.substring(0, 80)}`);
    } else if (input.imageDataUriOrUrl.startsWith('/uploads/') || input.imageDataUriOrUrl.startsWith('uploads/')) {
      // Handle local file path: Read from disk and upload to FAL storage
      logger.progress('Converting local file to public URL via Fal Storage');
      
      // Use secure file reading utility (consistent with video generation)
      const fileBuffer = await getBufferFromLocalPath(input.imageDataUriOrUrl);
      const mimeType = mime.lookup(input.imageDataUriOrUrl) || 'image/png';
      
      // Use consistent blob creation pattern (matching video generation)
      const imageBlob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
      
      const { uploadToFalStorage } = await import('@/ai/actions/generate-video.action');
      publicImageUrl = await uploadToFalStorage(imageBlob, username);
      logger.progress(`Local file converted to public URL: ${publicImageUrl.substring(0, 80)}`);
    } else if (!input.imageDataUriOrUrl.startsWith('http://') && !input.imageDataUriOrUrl.startsWith('https://')) {
      throw new Error(`Invalid image URL format for FAL.AI: ${input.imageDataUriOrUrl}. Expected data URI, local file path, or public URL.`);
    }
    
    try {
      logger.progress('Calling Fal.ai Gemini 2.5 Flash API');
      
      const falResult = await generateWithGemini25Flash(
        input.prompt || '',
        publicImageUrl,
        username
      );
      
      logger.progress(`Downloading generated image (${falResult.imageUrl.substring(0, 60)}...)`);
      
      // Download the FAL.AI generated image and store it locally for consistency
      // This ensures all generated images follow the same storage pattern
      const { relativeUrl: localImageUrl } = await downloadAndSaveImageFromUrl(
        falResult.imageUrl,
        `RefashionAI_fal_generated_${flowIdentifier}`,
        'generated_images'
      );
      
      logger.success({
        localImageUrl,
        description: falResult.description || null,
      });
      
      return { editedImageUrl: localImageUrl };
    } catch (falError: unknown) {
      const knownFalError = falError as Error;
      logger.error(falError);
      throw new Error(`FAL.AI generation failed for ${flowIdentifier}: ${knownFalError.message}`);
    }
  }

  // --- GOOGLE GEMINI 2.0 PATH (EXISTING LOGIC) ---
  const geminiLogger = createApiLogger('GEMINI_IMAGE', 'Google Gemini 2.0 Image Generation', {
    username,
    model: 'gemini-2.0-flash-exp-image',
    keyIndex,
  });

  geminiLogger.start({
    flowIdentifier,
    promptLength: input.prompt?.length || 0,
    hasSourceImage: !!input.imageDataUriOrUrl,
  });

  const apiKey = await getApiKeyForUser(username, 'gemini', keyIndex);

  let sourceImageDataForModelProcessing: { mimeType: string; data: string; } | null = null;
  if (input.imageDataUriOrUrl) {
    let dataUriToProcess = input.imageDataUriOrUrl;
    if (input.imageDataUriOrUrl.startsWith('http://') || input.imageDataUriOrUrl.startsWith('https://')) {
      try {
        // CACHE-STRATEGY: Policy: Static - The source image URL should be treated as a static asset.
        // Caching prevents re-downloading if the same image is used in multiple generation slots.
        geminiLogger.progress(`Fetching image from URL: ${input.imageDataUriOrUrl.substring(0, 60)}...`);
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
        geminiLogger.progress(`Successfully converted URL to data URI (${mimeType})`);
      } catch (fetchError: unknown) {
        geminiLogger.error(fetchError, `Failed to fetch/convert image URL for ${flowIdentifier}`);
        throw new Error(`Failed to process source image from URL for ${flowIdentifier}: ${(fetchError as Error).message}`);
      }
    } else if (input.imageDataUriOrUrl.startsWith('/')) {
      try {
        geminiLogger.progress(`Converting local file to data URI: ${input.imageDataUriOrUrl.substring(0, 60)}...`);
        // Use secure file system utility for reading local files
        const imageBuffer = await getBufferFromLocalPath(input.imageDataUriOrUrl);
        const mimeType = mime.lookup(input.imageDataUriOrUrl) || 'image/png';
        dataUriToProcess = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        geminiLogger.progress(`Successfully converted local file to data URI (${mimeType})`);
      } catch (localFileError: unknown) {
        geminiLogger.error(localFileError, `Failed to read local image for ${flowIdentifier}`);
        throw new Error(`Failed to process local source image for ${flowIdentifier}: ${(localFileError as Error).message}`);
      }
    }
    const match = dataUriToProcess.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      sourceImageDataForModelProcessing = { mimeType: match[1], data: match[2] };
    } else if (input.imageDataUriOrUrl) {
      geminiLogger.warning(`Could not parse data URI for ${flowIdentifier}. Original: ${input.imageDataUriOrUrl.substring(0, 60)}`);
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
      responseModalities: ["image", "text"],
      ...generationConfigOverride, // Apply temperature override for Studio Mode
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

  geminiLogger.progress('Calling Gemini API with image generation model');
  
  // Use centralized retry logic for image generation
  return withGeminiRetry(async () => {
    const response = await makeGeminiApiCall(apiKey, requestBody, keyIndex, username);
    
    let generatedImageDataUri: string | null = null;
    
    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        geminiLogger.warning(`Image generation blocked by safety settings for ${flowIdentifier}`);
        throw new Error(`Image generation blocked by safety settings for ${flowIdentifier}.`);
      }
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType;
            const base64Data = part.inlineData.data;
            generatedImageDataUri = `data:${mimeType};base64,${base64Data}`;
            geminiLogger.progress(`Image received (${mimeType})`);
            break;
          } else if (part.text) {
            geminiLogger.progress(`Text response received: ${part.text.substring(0, 100)}`);
          }
        }
      }
    }

    if (!generatedImageDataUri) {
      geminiLogger.error(new Error('No image data in response'), `AI for ${flowIdentifier} did not return image data`);
      throw new Error(`AI for ${flowIdentifier} (REST) did not return image data.`);
    }
    
    geminiLogger.progress('Saving generated image locally');
    
    try {
      const { relativeUrl: imageUrl } = await saveDataUriLocally(
        generatedImageDataUri,
        `RefashionAI_generated_${flowIdentifier}`,
        'generated_images'
      );
      
      geminiLogger.success({
        editedImageUrl: imageUrl,
      });
      
      return { editedImageUrl: imageUrl };
    } catch (uploadError: unknown) {
      const knownUploadError = uploadError as Error;
      geminiLogger.error(uploadError, `Failed to store image from ${flowIdentifier}`);
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

  // ===================================
  // STUDIO MODE WORKFLOW
  // ===================================
  if (input.generationMode === 'studio') {
    console.log(`🚀 Routing to Studio Mode for user ${username}`);
    
    if (!input.studioFit || !input.imageDataUriOrUrl) {
      throw new Error('Studio Mode requires a fit setting and a source image.');
    }

    // Background removal step has been removed to allow faster processing
    // and preserve original image context. The Ironclad Prompt is designed
    // to handle images with backgrounds effectively.
    
    // Note: Previously, a mandatory background removal step was performed here.
    // This has been removed to reduce processing time and Fal.ai API costs.
    // Trade-off: Slightly less consistent outputs if source images have complex backgrounds,
    // but the strong Studio Mode prompt should still maintain quality.
    
    // try {
    //   console.log('🎨 Studio Mode Step 1: Removing background...');
    //   const bgResult = await removeBackgroundAction(input.imageDataUriOrUrl, undefined);
    //   studioInputImageUrl = bgResult.savedPath;
    //   console.log(`✅ Background removed. New path for generation: ${studioInputImageUrl}`);
    // } catch (bgError) {
    //   console.error('❌ Studio Mode background removal failed:', bgError);
    //   throw new Error(`Studio Mode failed at background removal: ${(bgError as Error).message}`);
    // }
    
    // Step 1: Generate a dynamic clothing description using AI
    const clothingDescription = await generateClothingDescription(
      input.imageDataUriOrUrl,
      username
    );
    console.log(`🏷️ Clothing identified as: "${clothingDescription}"`);
    
    // Step 2: Build the Studio Mode prompt and inject the clothing description
    let studioPrompt = buildStudioModePrompt(input.studioFit);
    studioPrompt = studioPrompt.replace("clothing item", clothingDescription);
    console.log('📝 Studio Mode Prompt constructed with dynamic clothing description.');

    // Parallel Generation with Tuned Parameters (low temperature for consistency)
    const generationPromises = [1, 2, 3].map(i =>
      performSingleImageGeneration({
        ...input,
        imageDataUriOrUrl: input.imageDataUriOrUrl, // Use original image directly
        prompt: studioPrompt,
      }, user, `studio-flow${i}`, i as 1 | 2 | 3, { temperature: 0.3 })
    );

    const settledResults = await Promise.allSettled(generationPromises);

    // Handle Results
    const editedImageUrlsResult: (string | null)[] = Array(3).fill(null);
    const errorsResult: (string | null)[] = Array(3).fill(null);

    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        editedImageUrlsResult[index] = result.value.editedImageUrl;
      } else {
        console.error(`Studio Mode generation ${index + 1} failed:`, result.reason);
        errorsResult[index] = result.reason?.message || 'Unknown error';
      }
    });

    // Save to history with Studio Mode context
    const successCount = editedImageUrlsResult.filter(url => url !== null).length;
    let newHistoryId: string | undefined;
    
    if (successCount > 0 && input.imageDataUriOrUrl) {
      try {
        newHistoryId = await addHistoryItem(
          { studioFit: input.studioFit } as any, // Store fit in attributes
          studioPrompt,
          input.imageDataUriOrUrl,
          editedImageUrlsResult,
          'basic', // Studio mode is always 'basic'
          user.image_generation_model,
          'completed',
          undefined,
          username,
          undefined,
          'studio' // Set generation_mode
        );
        console.log(`✅ Studio Mode: History saved with ID ${newHistoryId}`);
      } catch (err) {
        console.error('Failed to save Studio Mode history:', err);
      }
    }
    
    return {
      editedImageUrls: editedImageUrlsResult,
      constructedPrompt: studioPrompt,
      errors: errorsResult,
      newHistoryId,
    };
  }

  // ======================================
  // CREATIVE MODE WORKFLOW (Existing Logic)
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

  // --- START REFACTORED LOGIC ---

  // High-priority override: If a manual prompt is provided, use it for all slots.
  if (processedInput.prompt) {
    console.log('Using manually provided prompt for all image slots.');
    prompts = Array(3).fill(processedInput.prompt);
    finalConstructedPromptForHistory = processedInput.prompt;
  } else {
    // STAGE 1: Determine the parameter sets for each slot (randomized or fixed).
    let parameterSetsForSlots: ModelAttributes[];

    // REMOVED: `&& modelToUse !== 'fal_gemini_2_5'` condition.
    // This ensures randomization works consistently for all image generation models,
    // honoring the user's explicit choice in the UI.
    if (processedInput.useRandomization) {
      console.log('🎲 Randomization enabled. Generating 3 different parameter sets.');
      parameterSetsForSlots = Array.from({ length: 3 }, () => generateRandomBasicParameters(processedInput.parameters!));
    } else {
      console.log('⚙️ Using fixed parameters for all 3 slots.');
      // The informational log about disabled randomization is no longer needed as the condition is removed.
      parameterSetsForSlots = Array(3).fill(processedInput.parameters);
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
    performSingleImageGeneration({ ...processedInput, prompt: prompt1! }, user, `flow1`, 1),
    performSingleImageGeneration({ ...processedInput, prompt: prompt2! }, user, `flow2`, 2),
    performSingleImageGeneration({ ...processedInput, prompt: prompt3! }, user, `flow3`, 3),
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
    if (username && processedInput.imageDataUriOrUrl) {
      try {
        if (existingHistoryId) {
          // When caller provided a job id, do NOT create a new history record here.
          // Caller (e.g. API worker) is expected to call updateHistoryItem(jobId, ...) afterwards.
          // This avoids creating a duplicate row for API job flows.
        } else {
          const newHistoryId = await addHistoryItem(
            processedInput.parameters,
            finalConstructedPromptForHistory,
            input.imageDataUriOrUrl!, // Use original image URL for history, not processed
            editedImageUrlsResult,
            processedInput.settingsMode || 'basic',
            modelUsed,
            'completed',
            undefined, // error
            undefined, // username
            undefined, // webhookUrl
            'creative' // generation_mode
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
