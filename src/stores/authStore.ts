// src/stores/authStore.ts
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getCurrentUser } from '@/actions/authActions';
import type { SessionUser } from '@/lib/types';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
}

interface AuthActions {
  setUser: (user: SessionUser | null) => void;
  clearUser: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      user: null,
      loading: false,

      setUser: (user) => set({ user }, undefined, 'setUser'),

      clearUser: () => set({ user: null }, undefined, 'clearUser'),

      refreshUser: async () => {
        set({ loading: true }, undefined, 'refreshUser/start');
        try {
          const currentUser = await getCurrentUser();
          set({ user: currentUser, loading: false }, undefined, 'refreshUser/success');
        } catch (error) {
          console.error('Failed to refresh user session', error);
          set({ user: null, loading: false }, undefined, 'refreshUser/error');
        }
      },
    }),
    { name: 'auth-store' }
  )
);
