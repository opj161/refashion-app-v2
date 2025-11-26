import 'server-only';
import { GoogleGenAI } from '@google/genai';
import { getApiKeyForUser } from '@/services/apiKey.service';
import { getSetting } from '@/services/settings.service';
import { withGeminiRetry } from '@/lib/api-retry';
import { createApiLogger } from '@/lib/api-logger';
import { imageToGenerativePart } from '@/lib/ai-utils';

/**
 * Studio Mode: Get fit description based on the selected fit type
 */
export function getStudioModeFitDescription(fit: 'slim' | 'regular' | 'relaxed'): string {
  switch (fit) {
    case 'slim': return "slim fit, tailored closely to the model's body";
    case 'relaxed': return "relaxed fit, draping loosely and away from the model's body";
    case 'regular':
    default: return "regular fit, with a standard, comfortable drape";
  }
}

/**
 * Studio Mode: Build the ironclad prompt template for consistent product photography
 * @param fit The selected clothing fit
 * @param templateOverride Optional override for the template (used for testing)
 */
export function buildStudioModePrompt(
  fit: 'slim' | 'regular' | 'relaxed',
  templateOverride?: string
): string {
  const fitDescription = getStudioModeFitDescription(fit);

  // Fetch the template from the database via the settings service, or use override
  const promptTemplate = templateOverride ?? getSetting('ai_studio_mode_prompt_template');
  
  // Define a hardcoded fallback for resilience in case the setting is empty.
  const fallbackTemplate = `Create a PHOTOREALISTIC image of a female fashion model, of Indigenous descent, wearing this clothing item in the image with a {fitDescription}.

Setting: a modern studio setting with a seamless cyclorama with a subtle, even gradient as background

Style: The model should look authentic and relatable, with a natural expression and subtle smile

Technical details: Full-body shot. Superior clarity, well-exposed, and masterful composition.`;

  // Use the template if available; otherwise, use the fallback.
  const templateToUse = promptTemplate && promptTemplate.trim() ? promptTemplate : fallbackTemplate;

  // Inject the dynamic fit description.
  return templateToUse.replace('{fitDescription}', fitDescription);
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
export async function generateClothingDescription(
  imageDataUriOrUrl: string,
  username: string,
  model: string = 'gemini-flash-lite-latest'
): Promise<string> {
  const logger = createApiLogger('GEMINI_TEXT', 'Clothing Classification', {
    username,
    model,
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
 * Orchestrates the full prompt construction for Studio Mode.
 * Can be used for actual generation or dry-run testing.
 */
export async function constructStudioPrompt(
  imageDataUriOrUrl: string,
  fit: 'slim' | 'regular' | 'relaxed',
  username: string,
  templateOverride?: string,
  model: string = 'gemini-flash-lite-latest'
): Promise<{ classification: string; finalPrompt: string }> {
  // Step 1: Generate a dynamic clothing description using AI
  const classification = await generateClothingDescription(
    imageDataUriOrUrl,
    username,
    model
  );
  
  // Step 2: Build the Studio Mode prompt and inject the clothing description
  let studioPrompt = buildStudioModePrompt(fit, templateOverride);
  
  // Use explicit placeholder replacement first, fall back to string match for backwards compatibility
  if (studioPrompt.includes('{clothingItem}')) {
    studioPrompt = studioPrompt.replace('{clothingItem}', classification);
  } else {
    // Fallback for legacy templates in DB that might still use the literal string
    studioPrompt = studioPrompt.replace("clothing item", classification);
  }
  
  return { classification, finalPrompt: studioPrompt };
}
