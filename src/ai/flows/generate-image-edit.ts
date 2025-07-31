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
import { getApiKeyForUser } from '@/services/apiKey.service';
import { buildAIPrompt, GENDER_OPTIONS, BODY_SHAPE_AND_SIZE_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS } from '@/lib/prompt-builder';
import { generatePromptWithAI } from '@/ai/actions/generate-prompt.action';
import type { ModelAttributes } from '@/lib/types';

// UPDATED: Import the official Google GenAI SDK instead of manual HTTP clients
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { withGeminiRetry } from '@/lib/api-retry';

// The SDK handles all types internally, so we no longer need manual type definitions

/**
 * Generate random parameters for stylistic settings only
 * Excludes core model attributes (gender, bodyType, bodySize, ageRange) which should remain as user selected
 * Always randomizes background, and randomly selects 2 of the other 4 parameters to randomize
 */
function generateRandomBasicParameters(baseParameters: ModelAttributes): ModelAttributes {
  const pickRandom = (options: any[]) => options[Math.floor(Math.random() * options.length)].value;
  
  // Always randomize background
  const result = {
    ...baseParameters, // Keep all existing parameters
    background: pickRandom(BACKGROUND_OPTIONS),
  };
  
  // Define the 4 optional parameters to choose from
  const optionalParams = [
    { key: 'ethnicity', options: ETHNICITY_OPTIONS },
    { key: 'hairStyle', options: HAIR_STYLE_OPTIONS },
    { key: 'modelExpression', options: MODEL_EXPRESSION_OPTIONS },
    { key: 'poseStyle', options: POSE_STYLE_OPTIONS },
  ];
  
  // Randomly shuffle and select 2 of the 4 optional parameters
  const shuffled = optionalParams.sort(() => Math.random() - 0.5);
  const selectedParams = shuffled.slice(0, 2);
  
  // Randomize only the 2 selected parameters
  selectedParams.forEach(param => {
    (result as any)[param.key] = pickRandom(param.options);
  });
  
  return result;
}

// The makeGeminiApiCall function is replaced by the SDK's built-in methods

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
  flowIdentifier: string,
  username: string,
  keyIndex: 1 | 2 | 3
): Promise<SingleImageOutput> {
  const apiKey = await getApiKeyForUser(username, 'gemini', keyIndex);
  
  // Initialize the SDK
  const ai = new GoogleGenAI({ apiKey });

  let sourceImageDataForModelProcessing: { mimeType: string; data: string; } | null = null;
  if (input.imageDataUriOrUrl) {
    let dataUriToProcess = input.imageDataUriOrUrl;
    if (input.imageDataUriOrUrl.startsWith('http://') || input.imageDataUriOrUrl.startsWith('https://')) {
      try {
        console.log(`Fetching image from URL for ${flowIdentifier}: ${input.imageDataUriOrUrl}`);
        const response = await fetch(input.imageDataUriOrUrl);
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
        // FIX: The 'uploads' directory is now at the root, not inside 'public'.
        // We construct the path relative to the project root.
        const absolutePath = path.join(process.cwd(), input.imageDataUriOrUrl);
        if (fs.existsSync(absolutePath)) { // Note: existsSync is not async, consider fs.promises.access for full async pattern
          const imageBuffer = fs.readFileSync(absolutePath);
          let mimeType = 'image/png';
          if (input.imageDataUriOrUrl.endsWith('.jpg') || input.imageDataUriOrUrl.endsWith('.jpeg')) mimeType = 'image/jpeg';
          else if (input.imageDataUriOrUrl.endsWith('.webp')) mimeType = 'image/webp';
          else if (input.imageDataUriOrUrl.endsWith('.gif')) mimeType = 'image/gif';
          dataUriToProcess = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
          console.log(`Successfully converted local path ${input.imageDataUriOrUrl} to data URI for ${flowIdentifier}.`);
        } else {
          throw new Error(`Local image file not found at ${absolutePath}`);
        }
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
  const parts: any[] = [];
  
  if (sourceImageDataForModelProcessing) {
    parts.push({
      inlineData: {
        mimeType: sourceImageDataForModelProcessing.mimeType,
        data: sourceImageDataForModelProcessing.data,
      },
    });
  }
  parts.push({ text: input.prompt });
  console.log(`Calling Gemini API via SDK for ${flowIdentifier} with model gemini-2.0-flash-exp`);
  console.log(`With API Key: ${apiKey ? 'SET' : 'NOT SET'}`);
  if (sourceImageDataForModelProcessing) {
    console.log(`WITH IMAGE: ${sourceImageDataForModelProcessing.mimeType}`);
  } else {
    console.log(`Performing text-to-image generation for ${flowIdentifier} as no source image was provided or processed.`);
  }
  
  // Use centralized retry logic for image generation
  return withGeminiRetry(async () => {
    console.log(`🔍 Generating image for ${flowIdentifier} using SDK`);
    
    const config = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseModalities: ["IMAGE", "TEXT"],
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE }
      ],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config,
      contents: [{ role: 'user', parts }],
    });
    
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
            console.log(`🔍 Image received from ${flowIdentifier} via SDK. MimeType: ${mimeType}`);
            break;
          } else if (part.text) {
            console.log(`🔍 Text response from ${flowIdentifier}: ${part.text}`);
          }
        }
      }
    }

    if (!generatedImageDataUri) {
      console.error(`🔍 AI for ${flowIdentifier} (SDK) did not return an image. Full API Response:`, JSON.stringify(response, null, 2));
      throw new Error(`AI for ${flowIdentifier} (SDK) did not return image data.`);
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
      console.error(`Error storing image from ${flowIdentifier} (SDK):`, knownUploadError);
      throw new Error(`Failed to store image from ${flowIdentifier} (SDK): ${knownUploadError.message}`);
    }
  }, `Image generation for ${flowIdentifier}`);
}

async function generateImageFlow1(input: GenerateImageEditInput, username: string): Promise<SingleImageOutput> {
  return performSingleImageGeneration(input, 'flow1', username, 1);
}

async function generateImageFlow2(input: GenerateImageEditInput, username: string): Promise<SingleImageOutput> {
  return performSingleImageGeneration(input, 'flow2', username, 2);
}

async function generateImageFlow3(input: GenerateImageEditInput, username: string): Promise<SingleImageOutput> {
  return performSingleImageGeneration(input, 'flow3', username, 3);
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

  // NEW LOGIC: PROMPT GENERATION
  let prompts: (string | null)[];
  let finalConstructedPromptForHistory: string;

  if (input.useAIPrompt && input.parameters && input.imageDataUriOrUrl) {
    console.log("Using AI to generate prompts...");
    
    let parametersForPrompts: ModelAttributes[];
    if (input.useRandomizedAIPrompts) {
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
        console.log(`Ethnicity: ${params.ethnicity}, Hair: ${params.hairStyle}`);
        console.log(`Expression: ${params.modelExpression}, Pose: ${params.poseStyle}`);
        console.log(`Background: ${params.background}`);
        console.log(`[Keeping user's: Gender: ${params.gender}, Body: ${params.bodyShapeAndSize}, Age: ${params.ageRange}]`);
      });
    } else {
      // Use the same parameters for all 3 prompts
      parametersForPrompts = [input.parameters, input.parameters, input.parameters];
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
        console.warn(`AI prompt generation failed for slot ${index + 1}, falling back to local prompt builder:`, res.reason);
        // Fallback to local prompt builder for failed AI prompt generation
        return buildAIPrompt({
          type: 'image',
          params: {
            ...parametersForPrompts[index],
            settingsMode: input.settingsMode || 'basic'
          }
        });
      }
    });
    
    // Log all received optimized prompts together
    console.log(`\n🚀 ALL AI-GENERATED PROMPTS SUMMARY:`);
    console.log('='.repeat(100));
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
          return generateImageFlow1(inputForGeneration, username);
        case 1:
          return generateImageFlow2(inputForGeneration, username);
        case 2:
          return generateImageFlow3(inputForGeneration, username);
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
      result = await generateImageFlow1(inputForGeneration, username);
      break;
    case 1:
      result = await generateImageFlow2(inputForGeneration, username);
      break;
    case 2:
      result = await generateImageFlow3(inputForGeneration, username);
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
  console.log(`Attempting to re-roll image for flow index: ${flowIndex}`);
  switch (flowIndex) {
    case 0:
      return performSingleImageGeneration(input, 'flow1-reroll', username, 1);
    case 1:
      return performSingleImageGeneration(input, 'flow2-reroll', username, 2);
    case 2:
      return performSingleImageGeneration(input, 'flow3-reroll', username, 3);
    default:
      throw new Error(`Invalid flow index: ${flowIndex}. Must be 0, 1, or 2.`);
  }
}
