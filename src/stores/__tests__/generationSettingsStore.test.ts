// src/stores/__tests__/generationSettingsStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGenerationSettingsStore } from '../generationSettingsStore';
import type { ModelAttributes } from '@/lib/types';

describe('GenerationSettingsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGenerationSettingsStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial image settings', () => {
      const state = useGenerationSettingsStore.getState();
      expect(state.imageSettings.gender).toBe('female');
      expect(state.imageSettings.bodyShapeAndSize).toBe('default');
      expect(state.imageSettings.fashionStyle).toBe('default_style');
    });

    it('should have correct initial video settings', () => {
      const state = useGenerationSettingsStore.getState();
      expect(state.videoSettings.selectedPredefinedPrompt).toBe('walks_toward_camera_pullback');
      expect(state.videoSettings.modelMovement).toBe('effortless_poise');
      expect(state.videoSettings.videoModel).toBe('lite');
      expect(state.videoSettings.resolution).toBe('480p');
      expect(state.videoSettings.duration).toBe('5');
    });

    it('should have basic settings mode by default', () => {
      const state = useGenerationSettingsStore.getState();
      expect(state.settingsMode).toBe('basic');
    });
  });

  describe('setImageSettings', () => {
    it('should update image settings partially', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      act(() => {
        result.current.setImageSettings({ gender: 'male', ageRange: 'mid_30s' });
      });

      expect(result.current.imageSettings.gender).toBe('male');
      expect(result.current.imageSettings.ageRange).toBe('mid_30s');
      // Other settings should remain unchanged
      expect(result.current.imageSettings.fashionStyle).toBe('default_style');
    });

    it('should merge with existing settings', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      act(() => {
        result.current.setImageSettings({ gender: 'male' });
      });

      act(() => {
        result.current.setImageSettings({ background: 'studio_plain' });
      });

      expect(result.current.imageSettings.gender).toBe('male');
      expect(result.current.imageSettings.background).toBe('studio_plain');
    });
  });

  describe('setVideoSettings', () => {
    it('should update video settings partially', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      act(() => {
        result.current.setVideoSettings({ 
          videoModel: 'pro', 
          resolution: '1080p',
          duration: '10'
        });
      });

      expect(result.current.videoSettings.videoModel).toBe('pro');
      expect(result.current.videoSettings.resolution).toBe('1080p');
      expect(result.current.videoSettings.duration).toBe('10');
      // Other settings should remain unchanged
      expect(result.current.videoSettings.modelMovement).toBe('effortless_poise');
    });
  });

  describe('setSettingsMode', () => {
    it('should update settings mode', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      act(() => {
        result.current.setSettingsMode('advanced');
      });

      expect(result.current.settingsMode).toBe('advanced');
    });
  });

  describe('loadFromHistory', () => {
    it('should load image attributes from history', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      const historyAttributes: ModelAttributes = {
        gender: 'male',
        bodyShapeAndSize: 'athletic',
        ageRange: 'late_20s',
        ethnicity: 'white',
        poseStyle: 'standing_confident',
        background: 'studio_plain',
        fashionStyle: 'high_fashion_editorial',
        hairStyle: 'short_styled',
        modelExpression: 'serious',
        lightingType: 'dramatic',
        lightQuality: 'hard',
        modelAngle: 'three_quarter',
        lensEffect: 'portrait_85mm',
        depthOfField: 'shallow',
        timeOfDay: 'golden_hour',
        overallMood: 'confident',
      };

      act(() => {
        result.current.loadFromHistory(historyAttributes);
      });

      expect(result.current.imageSettings).toEqual(historyAttributes);
    });

    it('should load video parameters from history', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      const historyAttributes: ModelAttributes = {
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
        modelAngle: 'default',
        lensEffect: 'default',
        depthOfField: 'default',
        timeOfDay: 'default',
        overallMood: 'default',
      };

      const videoParams = {
        selectedPredefinedPrompt: 'turn_to_profile',
        modelMovement: 'elegant_turn_profile',
        fabricMotion: 'soft_flow_with_movement',
        cameraAction: 'slow_zoom_in',
        aestheticVibe: 'timeless_chic_sophistication',
        videoModel: 'pro' as 'lite' | 'pro',
        resolution: '1080p' as '480p' | '720p' | '1080p',
        duration: '8',
        seed: 42,
        cameraFixed: true,
      };

      act(() => {
        result.current.loadFromHistory(historyAttributes, videoParams);
      });

      expect(result.current.videoSettings.selectedPredefinedPrompt).toBe('turn_to_profile');
      expect(result.current.videoSettings.videoModel).toBe('pro');
      expect(result.current.videoSettings.resolution).toBe('1080p');
      expect(result.current.videoSettings.seed).toBe('42');
    });

    it('should load settings mode from history', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      const historyAttributes: ModelAttributes = {
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
        modelAngle: 'default',
        lensEffect: 'default',
        depthOfField: 'default',
        timeOfDay: 'default',
        overallMood: 'default',
      };

      act(() => {
        result.current.loadFromHistory(historyAttributes, undefined, 'advanced');
      });

      expect(result.current.settingsMode).toBe('advanced');
    });

    it('should use defaults for missing attributes', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      const partialAttributes = {
        gender: 'male',
      } as Partial<ModelAttributes>;

      act(() => {
        result.current.loadFromHistory(partialAttributes as ModelAttributes);
      });

      expect(result.current.imageSettings.gender).toBe('male');
      // Missing attributes should use defaults
      expect(result.current.imageSettings.bodyShapeAndSize).toBe('default');
      expect(result.current.imageSettings.fashionStyle).toBe('default_style');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      // Modify state
      act(() => {
        result.current.setImageSettings({ gender: 'male', background: 'studio_plain' });
        result.current.setVideoSettings({ videoModel: 'pro', resolution: '1080p' });
        result.current.setSettingsMode('advanced');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      // Should be back to initial state
      const state = result.current;
      expect(state.imageSettings.gender).toBe('female');
      expect(state.imageSettings.background).toBe('outdoor_nature_elements');
      expect(state.videoSettings.videoModel).toBe('lite');
      expect(state.videoSettings.resolution).toBe('480p');
      expect(state.settingsMode).toBe('basic');
    });
  });
});
