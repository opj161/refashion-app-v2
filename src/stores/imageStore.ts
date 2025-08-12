// src/stores/imageStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Global state - only for cross-component communication
export interface GlobalImageState {
  isGlobalLoading: boolean;
}

export interface GlobalImageActions {
  reset: () => void;
}

type GlobalImageStore = GlobalImageState & GlobalImageActions;

// Initial state
const initialState: GlobalImageState = {
  isGlobalLoading: false,
};

// Global store - dramatically simplified, only for truly global functionality
export const useImageStore = create<GlobalImageStore>()(
  devtools(
    (set) => ({
      ...initialState,
      reset: () => set(initialState),
    }),
    {
      name: 'global-app-store', // Renamed for clarity
    }
  )
);


// For development - access in console as window.globalImageStore
if (typeof window !== 'undefined') {
  (window as any).globalImageStore = useImageStore;
}