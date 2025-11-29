// src/stores/generationSettingsStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ModelAttributes, HistoryItem } from '@/lib/types';

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
  imageSettings: ModelAttributes;
  videoSettings: VideoParameters;
  settingsMode: 'basic' | 'advanced';
  generationMode: 'creative' | 'studio';
  studioFit: 'slim' | 'regular' | 'relaxed';
  studioAspectRatio: string;
  generationCount: number;
  historyFilter: 'all' | 'image' | 'video';
  backgroundRemovalEnabled: boolean;
  upscaleEnabled: boolean;
  faceDetailEnabled: boolean;
  
  // NEW: Active Prompts (Synced from UI)
  activeImagePrompt: string;
  activeVideoPrompt: string;

  // NEW: Bridge State
  // Stores the ID of the most recently started generation job
  currentResultId: string | null;
}

export interface GenerationSettingsActions {
  setImageSettings: (settings: Partial<ModelAttributes>) => void;
  setVideoSettings: (settings: Partial<VideoParameters>) => void;
  setSettingsMode: (mode: 'basic' | 'advanced') => void;
  setGenerationMode: (mode: 'creative' | 'studio') => void;
  setStudioFit: (fit: 'slim' | 'regular' | 'relaxed') => void;
  setStudioAspectRatio: (ratio: string) => void;
  setHistoryFilter: (filter: 'all' | 'image' | 'video') => void;
  incrementGenerationCount: () => void;
  setBackgroundRemovalEnabled: (enabled: boolean) => void;
  setUpscaleEnabled: (enabled: boolean) => void;
  setFaceDetailEnabled: (enabled: boolean) => void;
  loadFromHistory: (item: HistoryItem) => void;

  // NEW: Prompt Setters
  setActiveImagePrompt: (prompt: string) => void;
  setActiveVideoPrompt: (prompt: string) => void;

  // NEW: Action to update the bridge state
  setCurrentResultId: (id: string | null) => void;

  reset: () => void;
}

const defaultImageSettings: ModelAttributes = {
  gender: 'female',
  bodyShapeAndSize: 'default',
  ageRange: 'default',
  ethnicity: 'default',
  poseStyle: 'default',
  background: 'outdoor_nature_elements',
  fashionStyle: 'default_style',
  hairStyle: 'default',
  modelExpression: 'default',
  lightingType: 'default',
  lightQuality: 'default',
  modelAngle: 'front_facing',
  lensEffect: 'default',
  depthOfField: 'default',
  timeOfDay: 'default',
  overallMood: 'default',
};

const defaultVideoSettings: VideoParameters = {
  selectedPredefinedPrompt: 'walks_toward_camera_pullback',
  modelMovement: 'effortless_poise',
  fabricMotion: 'fabric_settles_naturally',
  cameraAction: 'composed_static_shot',
  aestheticVibe: 'natural_effortless_style',
  videoModel: 'lite',
  resolution: '480p',
  duration: '5',
  seed: '-1',
  cameraFixed: false,
};

const initialState: GenerationSettingsState = {
  imageSettings: defaultImageSettings,
  videoSettings: defaultVideoSettings,
  settingsMode: 'basic',
  generationMode: 'studio',
  studioFit: 'regular',
  studioAspectRatio: '9:16',
  generationCount: 0,
  historyFilter: 'all',
  backgroundRemovalEnabled: false,
  upscaleEnabled: false,
  faceDetailEnabled: false,
  // NEW: Initialize null
  activeImagePrompt: "",
  activeVideoPrompt: "",
  currentResultId: null,
};

export const useGenerationSettingsStore = create<GenerationSettingsState & GenerationSettingsActions>()(
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

      setStudioAspectRatio: (ratio) =>
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
          if (item.settingsMode) newState.settingsMode = item.settingsMode;
          newState.generationMode = item.generation_mode || 'creative';
          if (item.generation_mode === 'studio' && (item.attributes as any).studioFit) {
            newState.studioFit = (item.attributes as any).studioFit;
          }
          if (item.generation_mode === 'studio' && (item.attributes as any).studioAspectRatio) {
            newState.studioAspectRatio = (item.attributes as any).studioAspectRatio;
          }
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

      setActiveImagePrompt: (prompt) => 
        set({ activeImagePrompt: prompt }, false, 'setActiveImagePrompt'),

      setActiveVideoPrompt: (prompt) => 
        set({ activeVideoPrompt: prompt }, false, 'setActiveVideoPrompt'),

      // NEW: Implementation
      setCurrentResultId: (id) =>
        set({ currentResultId: id }, false, 'setCurrentResultId'),

      reset: () =>
        set(initialState, false, 'reset'),
    }),
    {
      name: 'generation-settings-store',
    }
  )
);
