// src/stores/generationSettingsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ModelAttributes, HistoryItem } from '@/lib/types';

// Video-specific parameters that aren't in ModelAttributes
export interface VideoParameters {
  selectedPredefinedPrompt: string;
  modelMovement: string;
  fabricMotion: string;
  cameraAction: string;
  aestheticVibe: string;
  videoModel: 'lite' | 'pro';
  resolution: '480p' | '720p' | '1080p';
  duration: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
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
  
  // Generation mode (Creative or Studio)
  generationMode: 'creative' | 'studio';
  
  // Studio mode settings
  studioFit: 'slim' | 'regular' | 'relaxed';
  studioAspectRatio: string; // NEW
  
  // Generation counter for triggering history refresh
  generationCount: number;
  
  // History filter state
  historyFilter: 'all' | 'image' | 'video';
  
  // Image preparation options (for non-destructive pipeline)
  backgroundRemovalEnabled: boolean;
  upscaleEnabled: boolean;
  faceDetailEnabled: boolean;
}

export interface GenerationSettingsActions {
  // Update image settings
  setImageSettings: (settings: Partial<ModelAttributes>) => void;
  
  // Update video settings
  setVideoSettings: (settings: Partial<VideoParameters>) => void;
  
  // Update settings mode
  setSettingsMode: (mode: 'basic' | 'advanced') => void;
  
  // Update generation mode
  setGenerationMode: (mode: 'creative' | 'studio') => void;
  
  // Update studio fit
  setStudioFit: (fit: 'slim' | 'regular' | 'relaxed') => void;
  setStudioAspectRatio: (ratio: string) => void; // NEW
  
  // Update history filter
  setHistoryFilter: (filter: 'all' | 'image' | 'video') => void;
  
  // Increment generation counter to trigger history refresh
  incrementGenerationCount: () => void;
  
  // Update image preparation options
  setBackgroundRemovalEnabled: (enabled: boolean) => void;
  setUpscaleEnabled: (enabled: boolean) => void;
  setFaceDetailEnabled: (enabled: boolean) => void;
  
  // Load from history item - takes full HistoryItem object
  loadFromHistory: (item: HistoryItem) => void;
  
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
  modelAngle: 'front_facing', // MODEL_ANGLE_OPTIONS[0]
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
  generationMode: 'studio',
  studioFit: 'regular',
  studioAspectRatio: '9:16', // NEW: Default to vertical for fashion
  generationCount: 0,
  historyFilter: 'all',
  backgroundRemovalEnabled: false,
  upscaleEnabled: false,
  faceDetailEnabled: false,
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
      
      setGenerationMode: (mode) =>
        set({ generationMode: mode }, false, 'setGenerationMode'),
      
      setStudioFit: (fit) =>
        set({ studioFit: fit }, false, 'setStudioFit'),

      setStudioAspectRatio: (ratio) => // NEW
        set({ studioAspectRatio: ratio }, false, 'setStudioAspectRatio'),
      
      setHistoryFilter: (filter) =>
        set({ historyFilter: filter }, false, 'setHistoryFilter'),
      
      incrementGenerationCount: () =>
        set((state) => ({ generationCount: state.generationCount + 1 }), false, 'incrementGenerationCount'),
      
      setBackgroundRemovalEnabled: (enabled) =>
        set({ backgroundRemovalEnabled: enabled }, false, 'setBackgroundRemovalEnabled'),
      
      setUpscaleEnabled: (enabled) =>
        set({ upscaleEnabled: enabled }, false, 'setUpscaleEnabled'),
      
      setFaceDetailEnabled: (enabled) =>
        set({ faceDetailEnabled: enabled }, false, 'setFaceDetailEnabled'),
      
      loadFromHistory: (item) =>
        set((state) => {
          const newState: Partial<GenerationSettingsState> = {
            imageSettings: { ...defaultImageSettings, ...item.attributes },
          };
          
          // Load settings mode if present
          if (item.settingsMode) {
            newState.settingsMode = item.settingsMode;
          }
          
          // Load generation mode if present (defaults to 'creative' if not specified)
          newState.generationMode = item.generation_mode || 'creative';
          
          // Load studio fit from attributes if present and in Studio Mode
          if (item.generation_mode === 'studio' && (item.attributes as any).studioFit) {
            newState.studioFit = (item.attributes as any).studioFit;
          }

          // NEW: Load aspect ratio if present (checking attributes for loose coupling)
          if (item.generation_mode === 'studio' && (item.attributes as any).studioAspectRatio) {
            newState.studioAspectRatio = (item.attributes as any).studioAspectRatio;
          }
          
          // Load video parameters if present
          if (item.videoGenerationParams) {
            newState.videoSettings = {
              selectedPredefinedPrompt: (item.videoGenerationParams as any).selectedPredefinedPrompt || defaultVideoSettings.selectedPredefinedPrompt,
              modelMovement: item.videoGenerationParams.modelMovement || defaultVideoSettings.modelMovement,
              fabricMotion: item.videoGenerationParams.fabricMotion || defaultVideoSettings.fabricMotion,
              cameraAction: item.videoGenerationParams.cameraAction || defaultVideoSettings.cameraAction,
              aestheticVibe: item.videoGenerationParams.aestheticVibe || defaultVideoSettings.aestheticVibe,
              videoModel: item.videoGenerationParams.videoModel || defaultVideoSettings.videoModel,
              resolution: (item.videoGenerationParams.resolution as '480p' | '720p' | '1080p') || defaultVideoSettings.resolution,
              duration: (item.videoGenerationParams.duration as VideoParameters['duration']) || defaultVideoSettings.duration,
              seed: item.videoGenerationParams.seed?.toString() || defaultVideoSettings.seed,
              cameraFixed: item.videoGenerationParams.cameraFixed ?? defaultVideoSettings.cameraFixed,
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
