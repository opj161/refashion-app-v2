// src/stores/__tests__/imageStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useImageStore } from '../imageStore';
import type { ImageVersion } from '../imageStore';

// Mock the server actions
jest.mock('@/actions/imageActions', () => ({
  prepareInitialImage: jest.fn(),
  cropImage: jest.fn(),
  recreateStateFromHistoryAction: jest.fn(),
  rotateImage: jest.fn(),
  flipImage: jest.fn(),
}));

jest.mock('@/ai/actions/remove-background.action', () => ({
  removeBackgroundAction: jest.fn(),
}));

jest.mock('@/ai/actions/upscale-image.action', () => ({
  upscaleImageAction: jest.fn(),
  faceDetailerAction: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('ImageStore (Image Preparation Store)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useImageStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useImageStore.getState();
      
      expect(state.original).toBeNull();
      expect(state.versions).toEqual({});
      expect(state.activeVersionId).toBeNull();
      expect(state.versionHistory).toEqual([]);
      expect(state.historyIndex).toBe(-1);
      expect(state.isProcessing).toBe(false);
      expect(state.processingStep).toBeNull();
      expect(state.comparison).toBeNull();
      expect(state.currentTab).toBe('image');
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });
  });

  describe('Core Actions', () => {
    it('should set original image', () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const mockUrl = '/test/image.png';
      const mockHash = 'test-hash-123';

      act(() => {
        useImageStore.getState().setOriginalImage(mockFile, mockUrl, mockHash);
      });

      const state = useImageStore.getState();
      expect(state.original).toEqual({
        file: mockFile,
        imageUrl: mockUrl,
        hash: mockHash,
      });
      expect(state.versions).toHaveProperty('original');
      expect(state.activeVersionId).toBe('original');
      expect(state.versionHistory).toEqual(['original']);
      expect(state.historyIndex).toBe(0);
    });

    it('should add a new version', () => {
      // First set an original image
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      act(() => {
        useImageStore.getState().setOriginalImage(mockFile, '/original.png', 'hash-1');
      });

      // Add a cropped version
      const newVersion: Omit<ImageVersion, 'id' | 'createdAt'> = {
        imageUrl: '/cropped.png',
        label: 'Cropped',
        sourceVersionId: 'original',
        hash: 'hash-2',
      };

      let versionId: string = '';
      act(() => {
        versionId = useImageStore.getState().addVersion(newVersion);
      });

      const state = useImageStore.getState();
      expect(versionId).toBeTruthy();
      expect(state.versions[versionId]).toBeDefined();
      expect(state.versions[versionId].label).toBe('Cropped');
      expect(state.activeVersionId).toBe(versionId);
      expect(state.versionHistory).toHaveLength(2);
      expect(state.historyIndex).toBe(1);
    });

    it('should set active version', () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      act(() => {
        useImageStore.getState().setOriginalImage(mockFile, '/original.png', 'hash-1');
      });

      const state = useImageStore.getState();
      const originalId = state.versionHistory[0];

      // Change active version (in this simple case, back to original)
      act(() => {
        useImageStore.getState().setActiveVersion(originalId);
      });

      expect(useImageStore.getState().activeVersionId).toBe(originalId);
    });
  });

  describe('Undo/Redo Functionality', () => {
    beforeEach(() => {
      // Set up a history with multiple versions
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      act(() => {
        useImageStore.getState().setOriginalImage(mockFile, '/original.png', 'hash-1');
        useImageStore.getState().addVersion({
          imageUrl: '/cropped.png',
          label: 'Cropped',
          sourceVersionId: 'original',
          hash: 'hash-2',
        });
      });
    });

    it('should undo to previous version', () => {
      const stateBefore = useImageStore.getState();
      const secondVersionId = stateBefore.activeVersionId;

      act(() => {
        useImageStore.getState().undo();
      });

      const stateAfter = useImageStore.getState();
      expect(stateAfter.activeVersionId).toBe('original');
      expect(stateAfter.historyIndex).toBe(0);
      expect(stateAfter.canUndo).toBe(false);
      expect(stateAfter.canRedo).toBe(true);
    });

    it('should redo to next version', () => {
      // First undo
      act(() => {
        useImageStore.getState().undo();
      });

      const stateAfterUndo = useImageStore.getState();
      expect(stateAfterUndo.historyIndex).toBe(0);

      // Then redo
      act(() => {
        useImageStore.getState().redo();
      });

      const stateAfterRedo = useImageStore.getState();
      expect(stateAfterRedo.historyIndex).toBe(1);
      expect(stateAfterRedo.canUndo).toBe(true);
      expect(stateAfterRedo.canRedo).toBe(false);
    });

    it('should not undo when at the beginning', () => {
      // Undo to the beginning
      act(() => {
        useImageStore.getState().undo();
      });

      const stateAtBeginning = useImageStore.getState();
      const historyIndexBefore = stateAtBeginning.historyIndex;

      // Try to undo again
      act(() => {
        useImageStore.getState().undo();
      });

      const stateAfter = useImageStore.getState();
      expect(stateAfter.historyIndex).toBe(historyIndexBefore);
      expect(stateAfter.canUndo).toBe(false);
    });
  });

  describe('Processing State', () => {
    it('should manage processing state', () => {
      act(() => {
        useImageStore.getState().setProcessing(true, 'crop');
      });

      let state = useImageStore.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.processingStep).toBe('crop');

      act(() => {
        useImageStore.getState().setProcessing(false, null);
      });

      state = useImageStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.processingStep).toBeNull();
    });
  });

  describe('Tab State', () => {
    it('should manage current tab', () => {
      act(() => {
        useImageStore.getState().setCurrentTab('video');
      });

      expect(useImageStore.getState().currentTab).toBe('video');

      act(() => {
        useImageStore.getState().setCurrentTab('history');
      });

      expect(useImageStore.getState().currentTab).toBe('history');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      // Set up some state
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      act(() => {
        useImageStore.getState().setOriginalImage(mockFile, '/original.png', 'hash-1');
        useImageStore.getState().setProcessing(true, 'crop');
        useImageStore.getState().setCurrentTab('video');
      });

      // Verify state was set
      let state = useImageStore.getState();
      expect(state.original).not.toBeNull();
      expect(state.isProcessing).toBe(true);
      expect(state.currentTab).toBe('video');

      // Reset
      act(() => {
        useImageStore.getState().reset();
      });

      // Should be back to initial state
      state = useImageStore.getState();
      expect(state.original).toBeNull();
      expect(state.versions).toEqual({});
      expect(state.activeVersionId).toBeNull();
      expect(state.isProcessing).toBe(false);
      expect(state.processingStep).toBeNull();
      expect(state.currentTab).toBe('image');
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });
  });
});
