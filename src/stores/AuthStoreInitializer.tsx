// src/stores/AuthStoreInitializer.tsx
'use client';

import { useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { SessionUser } from '@/lib/types';

/**
 * Syncs the server-provided initialUser into the Zustand auth store.
 * Renders nothing — exists solely for hydration.
 */
export function AuthStoreInitializer({ initialUser }: { initialUser: SessionUser | null }) {
  const initialized = useRef(false);

  // Eagerly set on first render (before effects) so consumers
  // reading the store during SSR/hydration see the correct value.
  if (!initialized.current) {
    useAuthStore.setState({ user: initialUser });
    initialized.current = true;
  }

  return null;
}
