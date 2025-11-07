// src/stores/generationSettingsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ModelAttributes } from '@/lib/types';

// Video-specific parameters that aren't in ModelAttributes
export interface VideoParameters {
  selectedPredefinedPrompt: string;
  modelMovement: string;
  fabricMotion: string;
  cameraAction: string;
  aestheticVibe: string;
  videoModel: 'lite' | 'pro';
  resolution: '480p' | '720p' | '1080p';
  duration: string;
  seed: string;
  cameraFixed: boolean;
}

export interface GenerationSettingsState {
  // Image parameters (ModelAttributes)
  imageSettings: ModelAttributes;
  
  // Video parameters
  videoSettings: VideoParameters;
  
  // Settings mode (shared between image and video potentially)
  settingsMode: 'basic' | 'advanced';
}

export interface GenerationSettingsActions {
  // Update image settings
  setImageSettings: (settings: Partial<ModelAttributes>) => void;
  
  // Update video settings
  setVideoSettings: (settings: Partial<VideoParameters>) => void;
  
  // Update settings mode
  setSettingsMode: (mode: 'basic' | 'advanced') => void;
  
  // Load from history item
  loadFromHistory: (attributes: ModelAttributes, videoParams?: any, mode?: 'basic' | 'advanced') => void;
  
  // Reset to defaults
  reset: () => void;
}

type GenerationSettingsStore = GenerationSettingsState & GenerationSettingsActions;

// Default values that match the component defaults
// These are derived from the first element in each OPTIONS array from prompt-builder.ts
const defaultImageSettings: ModelAttributes = {
  gender: 'female', // GENDER_OPTIONS[0]
  bodyShapeAndSize: 'default', // BODY_SHAPE_AND_SIZE_OPTIONS[0]
  ageRange: 'default', // AGE_RANGE_OPTIONS[0]
  ethnicity: 'default', // ETHNICITY_OPTIONS[0]
  poseStyle: 'default', // POSE_STYLE_OPTIONS[0]
  background: 'outdoor_nature_elements', // BACKGROUND_OPTIONS - user sets this as default
  fashionStyle: 'default_style', // FASHION_STYLE_OPTIONS[0]
  hairStyle: 'default', // HAIR_STYLE_OPTIONS[0]
  modelExpression: 'default', // MODEL_EXPRESSION_OPTIONS[0]
  lightingType: 'default', // LIGHTING_TYPE_OPTIONS[0]
  lightQuality: 'default', // LIGHT_QUALITY_OPTIONS[0]
  modelAngle: 'default', // MODEL_ANGLE_OPTIONS[0]
  lensEffect: 'default', // LENS_EFFECT_OPTIONS[0]
  depthOfField: 'default', // DEPTH_OF_FIELD_OPTIONS[0]
  timeOfDay: 'default', // TIME_OF_DAY_OPTIONS[0]
  overallMood: 'default', // OVERALL_MOOD_OPTIONS[0]
};

const defaultVideoSettings: VideoParameters = {
  selectedPredefinedPrompt: 'walks_toward_camera_pullback', // PREDEFINED_PROMPTS[0]
  modelMovement: 'effortless_poise', // MODEL_MOVEMENT_OPTIONS[0]
  fabricMotion: 'fabric_settles_naturally', // FABRIC_MOTION_OPTIONS_VIDEO[0]
  cameraAction: 'composed_static_shot', // CAMERA_ACTION_OPTIONS[0]
  aestheticVibe: 'natural_effortless_style', // AESTHETIC_VIBE_OPTIONS[0]
  videoModel: 'lite',
  resolution: '480p',
  duration: '5',
  seed: '-1',
  cameraFixed: false,
};

// Initial state
const initialState: GenerationSettingsState = {
  imageSettings: defaultImageSettings,
  videoSettings: defaultVideoSettings,
  settingsMode: 'basic',
};

// Create the store
export const useGenerationSettingsStore = create<GenerationSettingsStore>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setImageSettings: (settings) => 
        set((state) => ({
          imageSettings: { ...state.imageSettings, ...settings }
        }), false, 'setImageSettings'),
      
      setVideoSettings: (settings) =>
        set((state) => ({
          videoSettings: { ...state.videoSettings, ...settings }
        }), false, 'setVideoSettings'),
      
      setSettingsMode: (mode) =>
        set({ settingsMode: mode }, false, 'setSettingsMode'),
      
      loadFromHistory: (attributes, videoParams, mode) =>
        set((state) => {
          const newState: Partial<GenerationSettingsState> = {
            imageSettings: { ...defaultImageSettings, ...attributes },
          };
          
          if (mode) {
            newState.settingsMode = mode;
          }
          
          if (videoParams) {
            newState.videoSettings = {
              selectedPredefinedPrompt: videoParams.selectedPredefinedPrompt || defaultVideoSettings.selectedPredefinedPrompt,
              modelMovement: videoParams.modelMovement || defaultVideoSettings.modelMovement,
              fabricMotion: videoParams.fabricMotion || defaultVideoSettings.fabricMotion,
              cameraAction: videoParams.cameraAction || defaultVideoSettings.cameraAction,
              aestheticVibe: videoParams.aestheticVibe || defaultVideoSettings.aestheticVibe,
              videoModel: videoParams.videoModel || defaultVideoSettings.videoModel,
              resolution: videoParams.resolution || defaultVideoSettings.resolution,
              duration: videoParams.duration || defaultVideoSettings.duration,
              seed: videoParams.seed?.toString() || defaultVideoSettings.seed,
              cameraFixed: videoParams.cameraFixed ?? defaultVideoSettings.cameraFixed,
            };
          }
          
          return newState;
        }, false, 'loadFromHistory'),
      
      reset: () => 
        set(initialState, false, 'reset'),
    }),
    {
      name: 'generation-settings-store',
    }
  )
);

// For development - access in console as window.generationSettingsStore
if (typeof window !== 'undefined') {
  (window as any).generationSettingsStore = useGenerationSettingsStore;
}
