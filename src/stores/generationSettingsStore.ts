// src/stores/generationSettingsStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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
  aspect_ratio?: string;
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
  
  // UI preference
  showPromptPreview: boolean;

  // Active Prompts (Synced from UI)
  activeImagePrompt: string;
  activeVideoPrompt: string;

  // Bridge State
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

  setShowPromptPreview: (show: boolean) => void;

  // Prompt Setters
  setActiveImagePrompt: (prompt: string) => void;
  setActiveVideoPrompt: (prompt: string) => void;

  // Action to update the bridge state
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
  showPromptPreview: false,
  activeImagePrompt: "",
  activeVideoPrompt: "",
  currentResultId: null,
};

export const useGenerationSettingsStore = create<GenerationSettingsState & GenerationSettingsActions>()(
  devtools(
    persist(
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
          if (item.generation_mode === 'studio' && item.attributes.studioFit) {
            newState.studioFit = item.attributes.studioFit;
          }
          if (item.generation_mode === 'studio' && item.attributes.studioAspectRatio) {
            newState.studioAspectRatio = item.attributes.studioAspectRatio;
          }
          if (item.videoGenerationParams) {
            newState.videoSettings = {
              selectedPredefinedPrompt: item.videoGenerationParams.selectedPredefinedPrompt || defaultVideoSettings.selectedPredefinedPrompt,
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

      setShowPromptPreview: (show) =>
        set({ showPromptPreview: show }, false, 'setShowPromptPreview'),

      setActiveImagePrompt: (prompt) => 
        set({ activeImagePrompt: prompt }, false, 'setActiveImagePrompt'),

      setActiveVideoPrompt: (prompt) => 
        set({ activeVideoPrompt: prompt }, false, 'setActiveVideoPrompt'),

      setCurrentResultId: (id) =>
        set({ currentResultId: id }, false, 'setCurrentResultId'),

      reset: () =>
        set(initialState, false, 'reset'),
    }),
    {
      name: 'refashion-generation-settings',
      version: 1,
      partialize: (state) => ({
        imageSettings: state.imageSettings,
        videoSettings: state.videoSettings,
        settingsMode: state.settingsMode,
        generationMode: state.generationMode,
        studioFit: state.studioFit,
        studioAspectRatio: state.studioAspectRatio,
        historyFilter: state.historyFilter,
        backgroundRemovalEnabled: state.backgroundRemovalEnabled,
        upscaleEnabled: state.upscaleEnabled,
        faceDetailEnabled: state.faceDetailEnabled,
        showPromptPreview: state.showPromptPreview,
      }),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as object) };

        // One-time migration from legacy localStorage keys
        if (typeof window !== 'undefined') {
          const oldMode = window.localStorage.getItem('imageForgeSettingsMode');
          const oldDefaults = window.localStorage.getItem('imageForgeDefaults');
          const oldPromptPreview = window.localStorage.getItem('imageForgeShowPromptPreview');

          if (oldMode || oldDefaults || oldPromptPreview) {
            if (oldMode === 'basic' || oldMode === 'advanced') {
              merged.settingsMode = oldMode;
            }
            if (oldDefaults) {
              try {
                merged.imageSettings = { ...defaultImageSettings, ...JSON.parse(oldDefaults) };
              } catch { /* ignore malformed data */ }
            }
            if (oldPromptPreview === 'true') {
              merged.showPromptPreview = true;
            }

            // Clean up legacy keys
            window.localStorage.removeItem('imageForgeSettingsMode');
            window.localStorage.removeItem('imageForgeDefaults');
            window.localStorage.removeItem('imageForgeShowPromptPreview');
          }
        }

        return merged as GenerationSettingsState & GenerationSettingsActions;
      },
    },
    ),
    {
      name: 'generation-settings-store',
    }
  )
);
