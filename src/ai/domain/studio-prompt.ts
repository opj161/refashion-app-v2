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
    default: return "";
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
  const fallbackTemplate = `Create a high-quality, full-body fashion photograph of a realistic female model wearing the {clothingItem} from the provided image. The model should wear the item with a {fitDescription}, posing in a relaxed, candid manner with a natural expression and subtle smile. The setting should be simple and well-suited to the clothing. To perfectly replicate the reference garment, ensure high fidelity to the original fabric texture, color, pattern, and specific design details.`;

  // Use the template if available; otherwise, use the fallback.
  let templateToUse = promptTemplate && promptTemplate.trim() ? promptTemplate : fallbackTemplate;

  // Special handling for empty fit description (regular fit)
  if (!fitDescription) {
    // Remove the specific phrase "with a {fitDescription}" if it exists
    templateToUse = templateToUse.replace(/with a \{fitDescription\}/gi, "");
  }

  // Inject the dynamic fit description (or empty string)
  let finalPrompt = templateToUse.replace('{fitDescription}', fitDescription);

  // Clean up punctuation and spacing
  finalPrompt = finalPrompt
    .replace(/\s{2,}/g, ' ')       // Collapse multiple spaces
    .replace(/\s+([,.])/g, '$1')   // Remove space before comma or dot
    .replace(/([,.])\1+/g, '$1')   // Deduplicate commas or dots
    .trim();

  return finalPrompt;
}

/**
 * Studio Mode Enhancement: Generate a concise clothing description using Gemini text model
 * This description replaces the generic "clothing item" placeholder in the studio prompt
 * for more specific and accurate image generation.
 * 
 * @param imageDataUriOrUrl - The source image (data URI, local path, or HTTPS URL)
 * @param username - Username for API key retrieval
 * @param model - Optional specific model to use. If not provided, a fallback strategy is used.
 * @returns A 2-5 word clothing description, or "clothing item" as fallback on failure
 */
export async function generateClothingDescription(
  imageDataUriOrUrl: string,
  username: string,
  model?: string
): Promise<string> {
  // If a specific model is requested, use it directly without fallback
  if (model) {
    return generateClothingDescriptionSingle(imageDataUriOrUrl, username, model);
  }

  // Fallback Strategy: Pro -> Flash -> Flash Lite
  const fallbackChain = [
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-flash-lite-latest'
  ];

  for (const fallbackModel of fallbackChain) {
    try {
      return await generateClothingDescriptionSingle(imageDataUriOrUrl, username, fallbackModel);
    } catch (error) {
      console.warn(`Gemini model ${fallbackModel} failed, trying next fallback...`, error);
      // Continue to next model in chain
    }
  }

  // If all models fail, return generic placeholder
  return "clothing item";
}

/**
 * Internal helper to run a single model generation attempt
 */
async function generateClothingDescriptionSingle(
  imageDataUriOrUrl: string,
  username: string,
  model: string
): Promise<string> {
  const logger = createApiLogger('GEMINI_TEXT', 'Clothing Classification', {
    username,
    model,
    keyIndex: 1,
  });

  const classificationPrompt = "Classify this clothing item: Use 1 word for the fabric finish or texture, 1-3 words to specify the silhouette (fit and length), and 1-2 words to classify the specific garment type. Provide only this 3-6 word classification using standard e-commerce terminology.";

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
    logger.error(error, `Model ${model} failed`);
    throw error; // Re-throw to trigger fallback in parent function
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
  model?: string
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

/**
 * Runs the clothing classification using all three Gemini models in parallel for comparison.
 */
export async function compareClothingDescriptions(
  imageDataUriOrUrl: string,
  username: string
): Promise<Record<string, string>> {
  const models = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-2.5-pro'
  ];

  const results = await Promise.all(
    models.map(async (model) => {
      try {
        const description = await generateClothingDescription(imageDataUriOrUrl, username, model);
        return { model, description };
      } catch (error) {
        return { model, description: "Error: Failed to generate" };
      }
    })
  );

  return results.reduce((acc, { model, description }) => {
    acc[model] = description;
    return acc;
  }, {} as Record<string, string>);
}
