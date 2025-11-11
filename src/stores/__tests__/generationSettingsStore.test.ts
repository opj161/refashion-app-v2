// src/stores/__tests__/generationSettingsStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGenerationSettingsStore } from '../generationSettingsStore';
import type { ModelAttributes, HistoryItem } from '@/lib/types';

// Helper function to create a minimal HistoryItem for testing
const createHistoryItem = (
  attributes: ModelAttributes,
  options?: {
    settingsMode?: 'basic' | 'advanced';
    generation_mode?: 'creative' | 'studio';
    videoGenerationParams?: HistoryItem['videoGenerationParams'];
  }
): HistoryItem => ({
  id: 'test-id',
  timestamp: Date.now(),
  attributes,
  constructedPrompt: 'Test prompt',
  originalClothingUrl: '/test/image.png',
  editedImageUrls: [],
  username: 'testuser',
  settingsMode: options?.settingsMode,
  generation_mode: options?.generation_mode,
  videoGenerationParams: options?.videoGenerationParams,
});

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

    it('should have creative generation mode by default', () => {
      const state = useGenerationSettingsStore.getState();
      expect(state.generationMode).toBe('creative');
    });

    it('should have regular studio fit by default', () => {
      const state = useGenerationSettingsStore.getState();
      expect(state.studioFit).toBe('regular');
    });

    it('should have zero generation count by default', () => {
      const state = useGenerationSettingsStore.getState();
      expect(state.generationCount).toBe(0);
    });

    it('should have all preparation options disabled by default', () => {
      const state = useGenerationSettingsStore.getState();
      expect(state.backgroundRemovalEnabled).toBe(false);
      expect(state.upscaleEnabled).toBe(false);
      expect(state.faceDetailEnabled).toBe(false);
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

      const historyItem = createHistoryItem(historyAttributes);

      act(() => {
        result.current.loadFromHistory(historyItem);
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
        prompt: 'Test video prompt',
        selectedPredefinedPrompt: 'turn_to_profile',
        modelMovement: 'elegant_turn_profile',
        fabricMotion: 'soft_flow_with_movement',
        cameraAction: 'slow_zoom_in',
        aestheticVibe: 'timeless_chic_sophistication',
        videoModel: 'pro' as 'lite' | 'pro',
        resolution: '1080p',
        duration: '8',
        seed: 42,
        cameraFixed: true,
        sourceImageUrl: '/test/source.png',
      };

      const historyItem = createHistoryItem(historyAttributes, { videoGenerationParams: videoParams });

      act(() => {
        result.current.loadFromHistory(historyItem);
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

      const historyItem = createHistoryItem(historyAttributes, { settingsMode: 'advanced' });

      act(() => {
        result.current.loadFromHistory(historyItem);
      });

      expect(result.current.settingsMode).toBe('advanced');
    });

    it('should use defaults for missing attributes', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      const partialAttributes = {
        gender: 'male',
      } as Partial<ModelAttributes>;

      const historyItem = createHistoryItem(partialAttributes as ModelAttributes);

      act(() => {
        result.current.loadFromHistory(historyItem);
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

  describe('incrementGenerationCount', () => {
    it('should increment generation count', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      expect(result.current.generationCount).toBe(0);

      act(() => {
        result.current.incrementGenerationCount();
      });

      expect(result.current.generationCount).toBe(1);

      act(() => {
        result.current.incrementGenerationCount();
      });

      expect(result.current.generationCount).toBe(2);
    });
  });

  describe('Preparation Options', () => {
    it('should update background removal enabled state', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      expect(result.current.backgroundRemovalEnabled).toBe(false);

      act(() => {
        result.current.setBackgroundRemovalEnabled(true);
      });

      expect(result.current.backgroundRemovalEnabled).toBe(true);

      act(() => {
        result.current.setBackgroundRemovalEnabled(false);
      });

      expect(result.current.backgroundRemovalEnabled).toBe(false);
    });

    it('should update upscale enabled state', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      expect(result.current.upscaleEnabled).toBe(false);

      act(() => {
        result.current.setUpscaleEnabled(true);
      });

      expect(result.current.upscaleEnabled).toBe(true);
    });

    it('should update face detail enabled state', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      expect(result.current.faceDetailEnabled).toBe(false);

      act(() => {
        result.current.setFaceDetailEnabled(true);
      });

      expect(result.current.faceDetailEnabled).toBe(true);
    });

    it('should allow multiple preparation options to be enabled simultaneously', () => {
      const { result } = renderHook(() => useGenerationSettingsStore());

      act(() => {
        result.current.setBackgroundRemovalEnabled(true);
        result.current.setUpscaleEnabled(true);
        result.current.setFaceDetailEnabled(true);
      });

      expect(result.current.backgroundRemovalEnabled).toBe(true);
      expect(result.current.upscaleEnabled).toBe(true);
      expect(result.current.faceDetailEnabled).toBe(true);
    });
  });

  describe('Studio Mode', () => {
    describe('setGenerationMode', () => {
      it('should update generation mode to studio', () => {
        const { result } = renderHook(() => useGenerationSettingsStore());

        act(() => {
          result.current.setGenerationMode('studio');
        });

        expect(result.current.generationMode).toBe('studio');
      });

      it('should update generation mode back to creative', () => {
        const { result } = renderHook(() => useGenerationSettingsStore());

        act(() => {
          result.current.setGenerationMode('studio');
        });

        expect(result.current.generationMode).toBe('studio');

        act(() => {
          result.current.setGenerationMode('creative');
        });

        expect(result.current.generationMode).toBe('creative');
      });
    });

    describe('setStudioFit', () => {
      it('should update studio fit to slim', () => {
        const { result } = renderHook(() => useGenerationSettingsStore());

        act(() => {
          result.current.setStudioFit('slim');
        });

        expect(result.current.studioFit).toBe('slim');
      });

      it('should update studio fit to relaxed', () => {
        const { result } = renderHook(() => useGenerationSettingsStore());

        act(() => {
          result.current.setStudioFit('relaxed');
        });

        expect(result.current.studioFit).toBe('relaxed');
      });

      it('should update studio fit back to regular', () => {
        const { result } = renderHook(() => useGenerationSettingsStore());

        act(() => {
          result.current.setStudioFit('slim');
        });

        act(() => {
          result.current.setStudioFit('regular');
        });

        expect(result.current.studioFit).toBe('regular');
      });
    });

    describe('loadFromHistory with Studio Mode', () => {
      it('should load studio mode and fit from history', () => {
        const { result } = renderHook(() => useGenerationSettingsStore());

        const historyAttributes: ModelAttributes & { studioFit?: 'slim' | 'regular' | 'relaxed' } = {
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
          studioFit: 'slim', // Studio fit stored in attributes
        };

        const historyItem = createHistoryItem(historyAttributes, {
          settingsMode: 'basic',
          generation_mode: 'studio',
        });

        act(() => {
          result.current.loadFromHistory(historyItem);
        });

        expect(result.current.generationMode).toBe('studio');
        expect(result.current.studioFit).toBe('slim');
      });

      it('should preserve creative mode when loading history without generation mode', () => {
        const { result } = renderHook(() => useGenerationSettingsStore());

        const historyAttributes: ModelAttributes = {
          gender: 'male',
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

        const historyItem = createHistoryItem(historyAttributes);

        act(() => {
          result.current.loadFromHistory(historyItem);
        });

        // Should remain creative mode when not specified
        expect(result.current.generationMode).toBe('creative');
        expect(result.current.studioFit).toBe('regular');
      });
    });

    describe('reset with Studio Mode', () => {
      it('should reset studio mode settings to defaults', () => {
        const { result } = renderHook(() => useGenerationSettingsStore());

        // Modify studio mode settings
        act(() => {
          result.current.setGenerationMode('studio');
          result.current.setStudioFit('slim');
        });

        expect(result.current.generationMode).toBe('studio');
        expect(result.current.studioFit).toBe('slim');

        // Reset
        act(() => {
          result.current.reset();
        });

        // Should be back to initial state
        expect(result.current.generationMode).toBe('creative');
        expect(result.current.studioFit).toBe('regular');
      });
    });
  });
});
