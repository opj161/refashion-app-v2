// src/lib/prompt-builder.ts

import {
  type OptionWithPromptSegment,
  FASHION_STYLE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS,
  BODY_SHAPE_AND_SIZE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS,
  POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS,
  LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, LENS_EFFECT_OPTIONS,
  DEPTH_OF_FIELD_OPTIONS, MODEL_ANGLE_OPTIONS,
  PREDEFINED_PROMPTS, MODEL_MOVEMENT_OPTIONS, FABRIC_MOTION_OPTIONS_VIDEO,
  CAMERA_ACTION_OPTIONS, AESTHETIC_VIBE_OPTIONS,
} from './prompt-options';

// Re-export OptionWithPromptSegment for backward compatibility
export type { OptionWithPromptSegment } from './prompt-options';

// Base parameters common to both or specific enough to be optional
export interface BaseGenerationParams {
  // Image specific (can be optional for video)
  gender?: string;
  bodyShapeAndSize?: string;
  ageRange?: string;
  ethnicity?: string;
  poseStyle?: string;
  background?: string;
  fashionStyle?: string;
  hairStyle?: string;
  modelExpression?: string;
  lightingType?: string;
  lightQuality?: string;
  modelAngle?: string;
  lensEffect?: string;
  depthOfField?: string;
  timeOfDay?: string; // Also used by image if relevant to background
  overallMood?: string; // Image specific mood

  // Video specific (can be optional for image)
  selectedPredefinedPrompt?: string;
  modelMovement?: string;
  fabricMotion?: string; // Video specific fabric motion
  cameraAction?: string; // Video specific camera action
  aestheticVibe?: string; // Video specific aesthetic

  // Common or generic
  settingsMode?: 'basic' | 'advanced'; // For image prompt construction style
}

export interface ImageDetails {
  width: number;
  height: number;
  // Potentially other details like dominant colors, item type if known
}

interface BuildAIPromptArgs {
  type: 'image' | 'video';
  params: BaseGenerationParams;
  imageDetails?: ImageDetails; // Optional: details about the input image if relevant for prompt
}

// --- Helper Function ---
// Optimized option lookup with caching to avoid repeated array searches
const optionCacheMap = new Map<readonly OptionWithPromptSegment[], Map<string, OptionWithPromptSegment>>();

const getSelectedOption = (options: readonly OptionWithPromptSegment[], value?: string): OptionWithPromptSegment | undefined => {
  if (!value) return undefined;

  // Check if we have a cache for this options array
  let cache = optionCacheMap.get(options);
  if (!cache) {
    // Build cache for this options array
    cache = new Map();
    options.forEach(opt => cache!.set(opt.value, opt));
    optionCacheMap.set(options, cache);
  }

  return cache.get(value);
};

// --- Main Prompt Building Function ---
export function buildAIPrompt({ type, params }: BuildAIPromptArgs): string {
  if (type === 'image') {
    // Logic from image-parameters.tsx constructPrompt
    const {
      gender, bodyShapeAndSize, ageRange, ethnicity, poseStyle, background,
      fashionStyle, hairStyle, modelExpression, lightingType, lightQuality,
      modelAngle, lensEffect, depthOfField, timeOfDay, overallMood,
      settingsMode
    } = params;

    if (settingsMode === 'basic') {
      const genderOption = getSelectedOption(GENDER_OPTIONS, gender)!;
      let modelDescriptionPart = `Create a PHOTOREALISTIC image of a ${genderOption.promptSegment} fashion model`;

      const attributePhrases: string[] = [];
      const bodyShapeAndSizeOption = getSelectedOption(BODY_SHAPE_AND_SIZE_OPTIONS, bodyShapeAndSize);
      if (bodyShapeAndSizeOption && bodyShapeAndSizeOption.value !== "default" && bodyShapeAndSizeOption.promptSegment) attributePhrases.push(bodyShapeAndSizeOption.promptSegment);

      const ageRangeOption = getSelectedOption(AGE_RANGE_OPTIONS, ageRange);
      if (ageRangeOption && ageRangeOption.value !== "default" && ageRangeOption.promptSegment) attributePhrases.push(ageRangeOption.promptSegment);

      const ethnicityOption = getSelectedOption(ETHNICITY_OPTIONS, ethnicity);
      if (ethnicityOption && ethnicityOption.value !== "default" && ethnicityOption.promptSegment && ethnicityOption.value !== "diverse_multiracial") { // Assuming diverse_multiracial was an old value
        attributePhrases.push(ethnicityOption.promptSegment);
      }

      if (attributePhrases.length > 0) modelDescriptionPart += `, ${attributePhrases.join(', ')}`;

      const poseStyleOption = getSelectedOption(POSE_STYLE_OPTIONS, poseStyle);
      if (poseStyleOption && poseStyleOption.value !== "default" && poseStyleOption.promptSegment) {
        modelDescriptionPart += ` standing in ${poseStyleOption.promptSegment}`;
      }

      const modelAngleOption = getSelectedOption(MODEL_ANGLE_OPTIONS, modelAngle);
      if (modelAngleOption && modelAngleOption.value !== "front_facing" && modelAngleOption.promptSegment) {
        modelDescriptionPart += `${modelAngleOption.promptSegment}`;
      }

      modelDescriptionPart += ", wearing this clothing item in the image.";

      let settingPart = "";
      const backgroundOption = getSelectedOption(BACKGROUND_OPTIONS, background);
      if (backgroundOption && backgroundOption.value !== "default" && backgroundOption.promptSegment) {
        settingPart = `\n\nSetting: ${backgroundOption.promptSegment}.`;
      }

      const stylePartOld = "\n\nStyle: The model should look authentic and relatable, with a natural expression and subtle smile. The clothing must fit perfectly and be the visual focus of the image.";
      const techPartOld = "\n\nTechnical details: full-body shot. Superior clarity, well-exposed, and masterful composition.";

      return `${modelDescriptionPart}${settingPart}${stylePartOld}${techPartOld}`;
    } else { // Advanced mode
      const styleOpt = getSelectedOption(FASHION_STYLE_OPTIONS, fashionStyle);
      let prompt = styleOpt?.basePrompt || FASHION_STYLE_OPTIONS.find(s => s.value === "default_style")!.basePrompt!;

      const genderOpt = getSelectedOption(GENDER_OPTIONS, gender)!;
      prompt = prompt.replace("{gender}", genderOpt.promptSegment);

      let modelDetailSegments: string[] = [];
      const addSegment = (optionArray: readonly OptionWithPromptSegment[], value?: string) => {
        const opt = getSelectedOption(optionArray, value);
        if (opt && opt.value !== "default" && opt.promptSegment) modelDetailSegments.push(opt.promptSegment);
      };

      addSegment(AGE_RANGE_OPTIONS, ageRange);
      addSegment(ETHNICITY_OPTIONS, ethnicity);
      addSegment(BODY_SHAPE_AND_SIZE_OPTIONS, bodyShapeAndSize);
      addSegment(HAIR_STYLE_OPTIONS, hairStyle);
      addSegment(MODEL_EXPRESSION_OPTIONS, modelExpression);

      prompt = prompt.replace("{modelDetails}", modelDetailSegments.length > 0 ? modelDetailSegments.join(", ") : "with typical features");

      const poseOpt = getSelectedOption(POSE_STYLE_OPTIONS, poseStyle);
      let poseDetail = "";
      if (poseOpt && poseOpt.value !== "default" && poseOpt.promptSegment) {
        poseDetail = `in ${poseOpt.promptSegment}`;
      }
      prompt = prompt.replace("{poseStyleDetails}", poseDetail);

      if (styleOpt && styleOpt.value !== "default_style" && styleOpt.promptSegment) {
        prompt += `\n\nOverall Style Notes: ${styleOpt.promptSegment}`;
      }

      let settingDescription = "";
      const backgroundOpt = getSelectedOption(BACKGROUND_OPTIONS, background);
      const timeOfDayOpt = getSelectedOption(TIME_OF_DAY_OPTIONS, timeOfDay);

      if (backgroundOpt && backgroundOpt.value !== "default" && backgroundOpt.promptSegment) {
        settingDescription += backgroundOpt.promptSegment;
      } else if (params.fashionStyle === "ecommerce_product") {
        settingDescription += getSelectedOption(BACKGROUND_OPTIONS, "studio_white")?.promptSegment ?? '';
      }

      if (timeOfDayOpt && timeOfDayOpt.value !== "default" && timeOfDayOpt.promptSegment) {
        if (settingDescription) settingDescription += `, ${timeOfDayOpt.promptSegment}`;
        else settingDescription = `The scene is set ${timeOfDayOpt.promptSegment}`;
      }
      if (settingDescription) {
        prompt += `\n\nSetting: ${settingDescription}.`;
      }

      let lightingDescription = "";
      const lightingTypeOpt = getSelectedOption(LIGHTING_TYPE_OPTIONS, lightingType);
      const lightQualityOpt = getSelectedOption(LIGHT_QUALITY_OPTIONS, lightQuality);

      if (lightingTypeOpt && lightingTypeOpt.value !== "default" && lightingTypeOpt.promptSegment) {
        lightingDescription += lightingTypeOpt.promptSegment;
      } else {
        if (params.fashionStyle === "ecommerce_product") {
          lightingDescription += getSelectedOption(LIGHTING_TYPE_OPTIONS, "studio_softbox_even")!.promptSegment;
        } else if (params.fashionStyle === "lifestyle_street" && timeOfDayOpt?.value !== "default") {
          lightingDescription += getSelectedOption(LIGHTING_TYPE_OPTIONS, "natural_available_light")!.promptSegment;
        } else if (params.fashionStyle === "high_fashion_editorial" || params.fashionStyle === "creative_conceptual") {
          lightingDescription += "Lighting should be artistic and complement the concept, potentially dramatic or unconventional.";
        } else {
          lightingDescription += "Professional fashion photography lighting.";
        }
      }

      if (lightQualityOpt && lightQualityOpt.value !== "default" && lightQualityOpt.promptSegment) {
        if (lightingDescription.length > 0 && !lightingDescription.endsWith(".")) lightingDescription += ".";
        lightingDescription += ` ${lightQualityOpt.promptSegment}`;
      }
      if (lightingDescription) {
        prompt += `\n\nLighting: ${lightingDescription.trim()}`;
      }

      let shotDetailSegments: string[] = [];
      const addShotDetail = (optionArray: readonly OptionWithPromptSegment[], value?: string) => {
        const opt = getSelectedOption(optionArray, value);
        if (opt && opt.value !== "default" && opt.promptSegment) shotDetailSegments.push(opt.promptSegment);
      };

      addShotDetail(MODEL_ANGLE_OPTIONS, modelAngle);
      addShotDetail(LENS_EFFECT_OPTIONS, lensEffect);
      addShotDetail(DEPTH_OF_FIELD_OPTIONS, depthOfField);

      if (shotDetailSegments.length > 0) {
        prompt += `\n\nShot Details: ${shotDetailSegments.join('. ')}.`;
      } else {
        if (params.fashionStyle === "ecommerce_product") {
          prompt += `\n\nShot Details: a full body shot. ${getSelectedOption(LENS_EFFECT_OPTIONS, "default")!.promptSegment}.`;
        }
      }

      if (params.fashionStyle !== "creative_conceptual") {
        prompt += " The composition should be visually striking, well-balanced, and effectively showcase the subject and garment.";
      }

      const moodOpt = getSelectedOption(OVERALL_MOOD_OPTIONS, overallMood);
      if (moodOpt && moodOpt.value !== "default" && moodOpt.promptSegment) {
        prompt += `\n\nOverall Mood & Atmosphere: ${moodOpt.promptSegment}.`;
      }

      let finalQualityStatement = "The final image must be photorealistic, highly detailed, with impeccable exposure and color accuracy. Ensure the clothing fits the model perfectly and is the clear visual focus of the image. Avoid common AI artifacts, especially in hands and facial features, aiming for natural human anatomy.";
      if (params.fashionStyle === "ecommerce_product") {
        finalQualityStatement = "For this e-commerce shot, the final image must be exceptionally high-resolution, with tack-sharp focus on the garment. True-to-life color representation and clear visibility of fabric texture, weave, and garment details (stitching, buttons) are paramount. Ensure a clean, professional presentation and that the clothing fits the model accurately and flatteringly. No distracting elements.";
      } else if (params.fashionStyle === "high_fashion_editorial" || params.fashionStyle === "creative_conceptual") {
        finalQualityStatement = "The final image should be of exceptional artistic quality, highly detailed, and powerfully convey the intended concept or narrative. Exposure and color should be masterfully controlled, whether for accuracy or deliberate artistic effect. Subtleties in model expression and pose are critical. Avoid AI artifacts.";
      }
      prompt += `\n\nTechnical & Quality Requirements: ${finalQualityStatement}`;

      return prompt.replace(/,\s*$/, ".").replace(/\.\s*\./g, ".").replace(/\s{2,}/g, ' ').trim();
    }

  } else if (type === 'video') {
    // Logic from video-parameters.tsx constructVideoPrompt
    const { selectedPredefinedPrompt, modelMovement, fabricMotion, cameraAction, aestheticVibe } = params;

    const predefined = getSelectedOption(PREDEFINED_PROMPTS, selectedPredefinedPrompt);
    if (predefined && predefined.value !== 'custom' && predefined.promptSegment) {
      return predefined.promptSegment; // This is the full prompt for predefined options
    }

    // Custom construction
    const getSeg = (options: readonly OptionWithPromptSegment[], value?: string) => getSelectedOption(options, value)?.promptSegment || '';
    const modelMovementSeg = getSeg(MODEL_MOVEMENT_OPTIONS, modelMovement);
    const fabricMotionSeg = getSeg(FABRIC_MOTION_OPTIONS_VIDEO, fabricMotion); // Use renamed constant
    const cameraActionSeg = getSeg(CAMERA_ACTION_OPTIONS, cameraAction);
    const aestheticVibeSeg = getSeg(AESTHETIC_VIBE_OPTIONS, aestheticVibe);

    const clauses: string[] = [];
    if (modelMovementSeg) {
      const modelPrefix = modelMovementSeg.startsWith('s ') ? "The model'" : "The model ";
      let modelClause = `${modelPrefix}${modelMovementSeg}`;
      if (fabricMotionSeg) modelClause += `, and the garment's fabric ${fabricMotionSeg}`;
      clauses.push(modelClause + '.');
    } else if (fabricMotionSeg) {
      clauses.push(`The garment's fabric ${fabricMotionSeg}.`);
    }
    if (cameraActionSeg) clauses.push(`The camera ${cameraActionSeg}.`);
    if (aestheticVibeSeg) clauses.push(aestheticVibeSeg);

    return clauses.length > 0 ? clauses.join(' ') : 'A photorealistic fashion model posing elegantly in a stylish outfit.';
  }
  return "Invalid generation type specified.";
}
