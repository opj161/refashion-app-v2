'use server';

import { GoogleGenAI } from '@google/genai';
import { getApiKeyForUser } from '@/services/apiKey.service';
import type { ModelAttributes } from '@/lib/types';
import path from 'path';
import fs from 'fs/promises';
import mime from 'mime-types';
import {
  GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS, BODY_SHAPE_AND_SIZE_OPTIONS,
  HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS,
  TIME_OF_DAY_OPTIONS, LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, CAMERA_ANGLE_OPTIONS,
  LENS_EFFECT_OPTIONS, DEPTH_OF_FIELD_OPTIONS, OVERALL_MOOD_OPTIONS, FABRIC_RENDERING_OPTIONS,
  FASHION_STYLE_OPTIONS, type OptionWithPromptSegment
} from '@/lib/prompt-builder';

// The powerful system instruction provided in the request
const PROMPT_ENGINEER_SYSTEM_INSTRUCTION = `You are an expert prompt engineer specializing in high-end, photorealistic fashion photography for an advanced text-to-image AI. Your primary mission is to transform a user's parameters into a focused and cohesive prompt that avoids being overloaded. Your output must be only the final, optimized prompt string, without any additional text, explanation, or formatting.

The key to a successful prompt is strategic focus. Not every element should be described with equal detail. Follow this strict hierarchy of importance to allocate descriptive detail effectively:

**1. The Core Subject (Highest Priority & Detail)**

Your first and most important task is to define the subject and enforce the intended composition.

*   **Intentional Framing:** Always begin the prompt with a phrase establishing the composition, such as "A photorealistic full-body photograph of...". Crucially, to anchor this composition and prevent the AI from defaulting to a cropped shot, **explicitly describe what is on the model's feet or the surface they are standing on** (e.g., "wearing black leather boots," or "standing barefoot on a sandy beach"). This forces the AI to render the entire figure from head to toe.
*   **Model Persona:** Immediately following the opening, synthesize the user's description of the fashion model. Focus on creating a natural and believable persona by describing their expression and an elegant, natural pose.
*   **Clothing Fidelity:** To ensure absolute accuracy to the attached clothing item, you must describe the model as wearing it using the explicit phrase "exactly as seen in the attached image". This instruction to replicate the garment's design, texture, and fit is the central pillar of the prompt and requires no further embellishment.

**2. Photographic Qualities (Selective & Impactful Detail)**

This layer elevates the image, but must be applied with precision to guide the AI's focus correctly.

*   **Lighting & Mood:** Consider the user's desired style. Describe the quality of light in a way that creates a single, coherent mood. For example, you might focus on how the light sculpts the model's form or how it accentuates the texture of the fabric. You do not need to describe every shadow and highlight.
*   **Holistic Focus & Composition:** To prevent the AI from cropping the head or limbs by over-focusing on the clothing, you must describe the focus holistically. Use phrases like **"tack-sharp focus on the entire figure"** and specify that this causes the background to fall away into a soft, pleasing blur. This ensures the entire model is treated as the primary subject.

**3. The Setting (Lowest Priority & Intentional Brevity)**

The setting plays a supporting role. It should be described subtly to establish a mood without competing for attention.

*   **Atmospheric Backdrop:** Treat the user's specified setting as an atmospheric backdrop, not a detailed scene. Use minimal, evocative language to provide context. For example, instead of describing every tree in a forest, you might simply state "in a serene, out-of-focus natural environment." This conserves the prompt's focus for the main subject.

**Final Output Requirement:** Your entire output must be a single, cohesive, unformatted paragraph of text. Do not include titles, bullet points, explanations, or any markdown formatting. Simply provide the finished prompt.`

// Helper to convert an image path/URI to the format the SDK needs
async function imageToGenerativePart(imageDataUriOrUrl: string) {
  let dataUri = imageDataUriOrUrl;
  
  if (dataUri.startsWith('/')) { // It's a local path
    const absolutePath = path.join(process.cwd(), dataUri);
    const buffer = await fs.readFile(absolutePath);
    const mimeType = mime.lookup(absolutePath) || 'image/png';
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

// Helper to format user parameters into natural conversational request for the AI
// Uses the actual option values and prompt segments from prompt-builder.ts
function formatParametersForAI(params: ModelAttributes): string {
  // Helper function to get natural language from option values
  const getOptionText = (options: OptionWithPromptSegment[], value: string): string => {
    const option = options.find(opt => opt.value === value);
    if (option && option.value !== 'default' && option.promptSegment) {
      return option.promptSegment;
    }
    return '';
  };

  // Build the conversational request
  const lines: string[] = [];
  
  // Always start with this
  lines.push('high-quality photorealistic image');

  // Model description line using actual option constants
  const genderOption = GENDER_OPTIONS.find(opt => opt.value === params.gender);
  let modelLine = 'a stunning ' + (genderOption?.promptSegment || 'fashion') + ' fashion model';

  // Add model attributes
  const ageText = getOptionText(AGE_RANGE_OPTIONS, params.ageRange);
  if (ageText) modelLine += ', ' + ageText;

  const ethnicityText = getOptionText(ETHNICITY_OPTIONS, params.ethnicity);
  if (ethnicityText) modelLine += ', ' + ethnicityText;

  const bodyShapeAndSizeText = getOptionText(BODY_SHAPE_AND_SIZE_OPTIONS, params.bodyShapeAndSize);
  if (bodyShapeAndSizeText) modelLine += ', ' + bodyShapeAndSizeText;

  const hairStyleText = getOptionText(HAIR_STYLE_OPTIONS, params.hairStyle);
  if (hairStyleText) modelLine += ', ' + hairStyleText;

  lines.push(modelLine);

  // Pose and expression line using actual options
  const poseText = getOptionText(POSE_STYLE_OPTIONS, params.poseStyle);
  let poseLine = poseText || 'in a natural pose';

  const expressionText = getOptionText(MODEL_EXPRESSION_OPTIONS, params.modelExpression);
  if (expressionText) poseLine += ', ' + expressionText;

  lines.push(poseLine);

  // Setting line - only create if background is chosen or other setting elements exist
  const backgroundText = getOptionText(BACKGROUND_OPTIONS, params.background);
  let settingElements: string[] = [];
  
  // Only add background if it's actually set
  if (backgroundText) {
    settingElements.push(backgroundText);
  }

  // Add other setting elements only if they exist
  const timeText = getOptionText(TIME_OF_DAY_OPTIONS, params.timeOfDay);
  if (timeText) settingElements.push(timeText);

  const lightingText = getOptionText(LIGHTING_TYPE_OPTIONS, params.lightingType);
  if (lightingText) settingElements.push(lightingText);

  const moodText = getOptionText(OVERALL_MOOD_OPTIONS, params.overallMood);
  if (moodText) settingElements.push(moodText);

  // Add fashion style to setting
  const fashionStyleOption = FASHION_STYLE_OPTIONS.find(opt => opt.value === params.fashionStyle);
  if (fashionStyleOption && fashionStyleOption.value !== 'default_style' && fashionStyleOption.promptSegment) {
    settingElements.push('in ' + fashionStyleOption.displayLabel.toLowerCase() + ' style');
  }

  // Only add setting line if there are elements to include
  if (settingElements.length > 0) {
    lines.push('setting: ' + settingElements.join(', '));
  }

  // Clothing line with fabric rendering
  let clothingLine = 'wearing this clothing item in the image. The clothing has a clean, precise fit, with photorealistic fabric texture';
  
  const fabricText = getOptionText(FABRIC_RENDERING_OPTIONS, params.fabricRendering);
  if (fabricText) clothingLine += ', ' + fabricText;
  
  clothingLine += '.';
  lines.push(clothingLine);

  // Technical details with actual options
  let technicalLine = 'Technical details: Full-body shot, Superior clarity, high-contrast, well-exposed, and masterful composition.';
  
  const technicalEnhancements: string[] = [];
  
  const lightQualityText = getOptionText(LIGHT_QUALITY_OPTIONS, params.lightQuality);
  if (lightQualityText) technicalEnhancements.push(lightQualityText);

  const cameraAngleText = getOptionText(CAMERA_ANGLE_OPTIONS, params.cameraAngle);
  if (cameraAngleText) technicalEnhancements.push(cameraAngleText);

  const lensEffectText = getOptionText(LENS_EFFECT_OPTIONS, params.lensEffect);
  if (lensEffectText) technicalEnhancements.push(lensEffectText);

  const depthOfFieldText = getOptionText(DEPTH_OF_FIELD_OPTIONS, params.depthOfField);
  if (depthOfFieldText) technicalEnhancements.push(depthOfFieldText);

  if (technicalEnhancements.length > 0) {
    technicalLine += ' ' + technicalEnhancements.join(', ') + '.';
  }
  
  lines.push(technicalLine);

  return `Please create the perfect prompt for me, using these parameters:
\`\`\`
${lines.join('\n')}
\`\`\``;
}

// Helper function to check if an error is retryable
function isRetryableError(error: any): boolean {
  // Check for 503 (service unavailable), 429 (rate limit), or network errors
  if (error?.status === 503 || error?.status === 429) return true;
  if (error?.code === 503 || error?.code === 429) return true;
  if (error?.message?.includes('overloaded')) return true;
  if (error?.message?.includes('rate limit')) return true;
  if (error?.message?.includes('UNAVAILABLE')) return true;
  if (error?.message?.includes('RESOURCE_EXHAUSTED')) return true;
  // Network/connection errors
  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
  return false;
}

// Helper function to wait for a specified number of milliseconds
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generatePromptWithAI(
  params: ModelAttributes,
  imageDataUriOrUrl: string,
  username: string,
  keyIndex: 1 | 2 | 3
): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds
  
  const apiKey = await getApiKeyForUser(username, 'gemini', keyIndex);
  const ai = new GoogleGenAI({ apiKey });
  
  const config = {
    temperature: 1,
    systemInstruction: [
      {
        text: PROMPT_ENGINEER_SYSTEM_INSTRUCTION,
      }
    ],
  };
  
  const model = 'gemini-2.5-pro';
  const imagePart = await imageToGenerativePart(imageDataUriOrUrl);
  const parametersText = formatParametersForAI(params);
  
  // Log the input text being sent to AI prompt enhancer
  console.log(`\n🎨 AI PROMPT ENHANCER INPUT (Key ${keyIndex}):`);
  console.log('='.repeat(80));
  console.log(parametersText);
  console.log('='.repeat(80));
  
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: parametersText,
        },
        imagePart
      ],
    },
  ];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s
        console.log(`🔄 Retrying AI prompt generation (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms delay...`);
        await wait(delay);
      }

      const response = await ai.models.generateContent({
        model,
        config,
        contents,
      });

      const text = response.text;

      if (!text) {
        console.error("AI Prompt Generation Response:", JSON.stringify(response, null, 2));
        throw new Error('The AI prompt generator did not return a valid prompt.');
      }

      // Log the received optimized prompt
      console.log(`\n✨ AI PROMPT ENHANCER OUTPUT (Key ${keyIndex}):`);
      console.log('='.repeat(80));
      console.log(text.trim());
      console.log('='.repeat(80));

      return text.trim();
      
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const canRetry = isRetryableError(error);
      
      console.error(`Error generating prompt with AI for keyIndex ${keyIndex} (attempt ${attempt + 1}):`, error);
      
      if (!canRetry || isLastAttempt) {
        // Either not a retryable error, or we've exhausted all retries
        const errorMessage = canRetry 
          ? `AI prompt generation failed after ${maxRetries + 1} attempts due to server overload. Please try again later.`
          : `AI prompt generation failed: ${(error as Error).message}`;
        throw new Error(errorMessage);
      }
      
      // Continue to next retry attempt
      console.log(`⏳ Will retry in ${baseDelay * Math.pow(2, attempt)}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected error in retry logic');
}