'use server';

import { GoogleGenAI } from '@google/genai';
import { getApiKeyForUser } from '@/services/apiKey.service';
import type { ModelAttributes } from '@/lib/types';
import mime from 'mime-types';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';
import {
  GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS, BODY_SHAPE_AND_SIZE_OPTIONS,
  HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS,
  TIME_OF_DAY_OPTIONS, LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, CAMERA_ANGLE_OPTIONS,
  LENS_EFFECT_OPTIONS, DEPTH_OF_FIELD_OPTIONS, OVERALL_MOOD_OPTIONS,
  FASHION_STYLE_OPTIONS, type OptionWithPromptSegment
} from '@/lib/prompt-builder';
import { withGeminiRetry } from '@/lib/api-retry';
import { getSystemPrompt } from '@/services/systemPrompt.service';

// Helper to convert an image path/URI to the format the SDK needs
async function imageToGenerativePart(imageDataUriOrUrl: string) {
  let dataUri = imageDataUriOrUrl;
  
  if (dataUri.startsWith('/')) { // It's a local path
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
  const expressionText = getOptionText(MODEL_EXPRESSION_OPTIONS, params.modelExpression);
  
  // Only add pose/expression line if we have actual values
  if (poseText || expressionText) {
    let poseLine = '';
    if (poseText) poseLine += poseText;
    if (expressionText) {
      if (poseLine) poseLine += ', ';
      poseLine += expressionText;
    }
    lines.push(poseLine);
  }

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

  // Technical details with actual options only
  const technicalEnhancements: string[] = [];
  
  const lightQualityText = getOptionText(LIGHT_QUALITY_OPTIONS, params.lightQuality);
  if (lightQualityText) technicalEnhancements.push(lightQualityText);

  const cameraAngleText = getOptionText(CAMERA_ANGLE_OPTIONS, params.cameraAngle);
  if (cameraAngleText) technicalEnhancements.push(cameraAngleText);

  const lensEffectText = getOptionText(LENS_EFFECT_OPTIONS, params.lensEffect);
  if (lensEffectText) technicalEnhancements.push(lensEffectText);

  const depthOfFieldText = getOptionText(DEPTH_OF_FIELD_OPTIONS, params.depthOfField);
  if (depthOfFieldText) technicalEnhancements.push(depthOfFieldText);

  // Only add technical enhancements if there are any
  if (technicalEnhancements.length > 0) {
    lines.push('technical details: ' + technicalEnhancements.join(', '));
  }

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
  const apiKey = await getApiKeyForUser(username, 'gemini', keyIndex);
  const ai = new GoogleGenAI({ apiKey });
  
  // Load the system instruction from database with file fallback
  const systemInstruction = await getSystemPrompt();
  
  const config = {
    temperature: 1,
    systemInstruction: [
      {
        text: systemInstruction,
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

  // Use centralized retry logic
  return withGeminiRetry(async () => {
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
  }, `AI prompt generation (Key ${keyIndex})`);
}