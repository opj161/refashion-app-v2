import type {
  GenderValue, BodyShapeAndSizeValue, AgeRangeValue, EthnicityValue,
  PoseStyleValue, FashionStyleValue, HairStyleValue, ModelExpressionValue,
  LightingTypeValue, LightQualityValue, ModelAngleValue, LensEffectValue,
  DepthOfFieldValue, TimeOfDayValue, OverallMoodValue, StudioFitValue,
  AspectRatioValue,
} from './prompt-options';

export interface SessionUser {
  username: string;
  role: 'admin' | 'user';
  isLoggedIn: boolean;
}

export interface SessionData {
  user?: SessionUser;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  attributes: ModelAttributes;
  constructedPrompt: string;
  originalClothingUrl: string;
  editedImageUrls: (string | null)[];
  originalImageUrls?: (string | null)[]; // Store pre-face-detailed versions for comparison
  username: string;
  settingsMode?: 'basic' | 'advanced';
  generation_mode?: 'creative' | 'studio';
  generatedVideoUrls?: (string | null)[];
  videoGenerationParams?: {
    prompt: string;
    resolution: string;
    videoModel?: 'lite' | 'pro';
    duration: string;
    seed: number;
    sourceImageUrl: string;
    // NEW structured fields
    modelMovement: string;
    fabricMotion: string;
    cameraAction: string;
    aestheticVibe: string;
    cameraFixed: boolean;
    // Webhook-related fields
    localVideoUrl?: string | null;
    // Persisted UI state
    selectedPredefinedPrompt?: string;
    aspect_ratio?: string;
  };
  status?: 'processing' | 'completed' | 'failed';
  error?: string;
  webhookUrl?: string;
  imageGenerationModel?: 'fal_nano_banana_pro' | 'fal_gemini_2_5';
}

export interface ModelAttributes {
  gender: GenderValue;
  bodyShapeAndSize: BodyShapeAndSizeValue;
  ageRange: AgeRangeValue;
  ethnicity: EthnicityValue;
  poseStyle: PoseStyleValue;
  background: string; // Kept as string — store default 'outdoor_nature_elements' is not in BACKGROUND_OPTIONS
  fashionStyle: FashionStyleValue;
  hairStyle: HairStyleValue;
  modelExpression: ModelExpressionValue;
  lightingType: LightingTypeValue;
  lightQuality: LightQualityValue;
  modelAngle: ModelAngleValue;
  lensEffect: LensEffectValue;
  depthOfField: DepthOfFieldValue;
  timeOfDay: TimeOfDayValue;
  overallMood: OverallMoodValue;
  // Studio Mode Attributes
  studioFit?: StudioFitValue;
  aspectRatio?: AspectRatioValue;
  studioAspectRatio?: string;
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}
