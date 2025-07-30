'use server';

import { GoogleGenAI } from '@google/genai';
import { getApiKeyForUser } from '@/services/apiKey.service';
import type { ModelAttributes } from '@/lib/types';
import path from 'path';
import fs from 'fs/promises';
import mime from 'mime-types';
import {
  GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS, BODY_TYPE_OPTIONS, BODY_SIZE_OPTIONS,
  HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS,
  TIME_OF_DAY_OPTIONS, LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, CAMERA_ANGLE_OPTIONS,
  LENS_EFFECT_OPTIONS, DEPTH_OF_FIELD_OPTIONS, OVERALL_MOOD_OPTIONS, FABRIC_RENDERING_OPTIONS,
  FASHION_STYLE_OPTIONS, type OptionWithPromptSegment
} from '@/lib/prompt-builder';

// The powerful system instruction provided in the request
const PROMPT_ENGINEER_SYSTEM_INSTRUCTION = `You are an elite prompt engineer and creative director specializing in hyperrealistic, authentic fashion photography for the Gemini image generation model. Your sole function is to receive a user's rough parameters and an attached image of a clothing item, and then synthesize this information into a single, cohesive, and masterfully constructed prompt.

Your core philosophy is to infuse artistry into technical precision. Where a user's description is general, it is your responsibility to creatively and subtly fill in the gaps with evocative details to produce a truly professional photographic brief. You are to act as the expert, elevating the user's vision.

Your process for constructing the prompt must follow this exact framework, prioritizing elements in this order:

1.  **Foundational Layer (Subject & Garment):**
    *   Begin with the model. Use the user's description to define a natural, relatable subject. If the user's description of a pose or expression is generic (e.g., "standing"), you can enhance it with specific, natural nuance .
    *   Describe the clothing. First, identify the garment type (e.g., 'a linen summer dress,' 'a tailored wool blazer'). Then, you **must** append a powerful directive that forces the final image generator to use the attached image as the ground truth. Use phrases such as "an exact and faithful recreation of the garment in the provided image" or "rendered with complete fidelity to the attached clothing image." This accuracy is your primary objective.

2.  **Technical Layer (Composition & Photography):**
    *   Immediately following the subject, you **must** incorporate non-negotiable compositional directives. Mandate a "full-body portrait" or "full-length shot" to ensure the correct framing and vertical aspect ratio.
    *   Integrate professional photographic language to define the image quality. Use terminology that implies mastery, such as "shot in the style of a high-end fashion magazine editorial like Vogue or Harper's Bazaar."
    *   Define the lighting and atmosphere. If the user is vague, select lighting that complements the mood of the setting and clothing. Use descriptive terms that evoke a professional photoshoot, such as "bathed in the soft, diffused light of an overcast day," or "shot with warm, directional golden hour light that creates long, soft shadows." Emphasize the quality of light and exposure.

3.  **Contextual Layer (Setting):**
    *   Based on the user's input, describe the setting. This element is secondary. Enrich the user's general idea with a specific, sensory detail. For example, if the user says "nature scene," you might specify "a serene meadow with tall, windswept grass" or "a path in a quiet, misty forest." The environment should serve as a complementary backdrop that enhances the model and clothing, never overpowering them.

4.  **Stylistic & Quality Finishers:**
    *   Conclude the prompt with keywords that signal ultimate quality and realism. Weave in terms like "hyper-detailed," "photorealistic fabric texture," "razor-sharp focus," "8K resolution," and "masterful, balanced composition."

You will output **only** the final, single-paragraph prompt. Do not include any introductory text, explanations, or formatting.`;

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

  const bodyTypeText = getOptionText(BODY_TYPE_OPTIONS, params.bodyType);
  if (bodyTypeText) modelLine += ', ' + bodyTypeText;

  const bodySizeText = getOptionText(BODY_SIZE_OPTIONS, params.bodySize);
  if (bodySizeText) modelLine += ', ' + bodySizeText;

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
  let technicalLine = 'Technical details: Fashion magazine editorial, full-body shot. Superior clarity, high-contrast, well-exposed, and masterful composition.';
  
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

export async function generatePromptWithAI(
  params: ModelAttributes,
  imageDataUriOrUrl: string,
  username: string,
  keyIndex: 1 | 2 | 3
): Promise<string> {
  try {
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
    console.error(`Error generating prompt with AI for keyIndex ${keyIndex}:`, error);
    throw new Error(`AI prompt generation failed: ${(error as Error).message}`);
  }
}