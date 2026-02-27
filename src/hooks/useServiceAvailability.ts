'use client';

import { useState, useEffect } from 'react';
import { isBackgroundRemovalAvailable } from '@/ai/actions/remove-background.action';
import {
  isUpscaleServiceAvailable,
  isFaceDetailerAvailable,
} from '@/ai/actions/upscale-image.action';

export interface ServiceAvailability {
  isBgRemovalAvailable: boolean;
  isUpscaleAvailable: boolean;
  isFaceDetailerAvailable: boolean;
  isLoading: boolean;
}

/**
 * Checks availability of background removal, upscale, and face detailer services on mount.
 * All three checks run in parallel and resolve independently.
 */
export function useServiceAvailability(): ServiceAvailability {
  const [isBgRemoval, setIsBgRemoval] = useState(false);
  const [isUpscale, setIsUpscale] = useState(false);
  const [isFaceDetailer, setIsFaceDetailer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const [bg, upscale, face] = await Promise.all([
          isBackgroundRemovalAvailable(),
          isUpscaleServiceAvailable(),
          isFaceDetailerAvailable(),
        ]);

        if (!cancelled) {
          setIsBgRemoval(bg);
          setIsUpscale(upscale);
          setIsFaceDetailer(face);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return {
    isBgRemovalAvailable: isBgRemoval,
    isUpscaleAvailable: isUpscale,
    isFaceDetailerAvailable: isFaceDetailer,
    isLoading,
  };
}
