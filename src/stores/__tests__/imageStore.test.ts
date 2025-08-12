// src/stores/__tests__/imageStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useImageStore } from '../imageStore';

// Mock the server actions
jest.mock('@/actions/imageActions', () => ({
  fetchImageAndConvertToDataUri: jest.fn().mockResolvedValue({
    success: true,
    dataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
    hash: 'test-hash'
  })
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

jest.mock('@/lib/utils', () => ({
  getDisplayableImageUrl: jest.fn((url) => url)
}));

describe('ImageStore (Simplified Global Store)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useImageStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useImageStore.getState();
      expect(state.isGlobalLoading).toBe(false);
    });
  });

  describe('Global Loading State', () => {
    it('should manage global loading state', () => {
      const { result } = renderHook(() => useImageStore());

      act(() => {
        useImageStore.setState({ isGlobalLoading: true });
      });

      expect(result.current.isGlobalLoading).toBe(true);

      act(() => {
        useImageStore.setState({ isGlobalLoading: false });
      });

      expect(result.current.isGlobalLoading).toBe(false);
    });
  });


  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      // Set some state
      act(() => {
        useImageStore.setState({ isGlobalLoading: true });
      });

      // Reset
      act(() => {
        useImageStore.getState().reset();
      });

      // Should be back to initial state
      const state = useImageStore.getState();
      expect(state.isGlobalLoading).toBe(false);
    });
  });

});
