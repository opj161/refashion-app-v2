'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import ImageParameters from './image-parameters';
import StudioParameters from './studio-parameters';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { ImageResultsDisplay } from './ImageResultsDisplay';
import { GenerationProgressIndicator } from './GenerationProgressIndicator';
import { useStoreSubmission } from '@/hooks/useStoreSubmission';

export function ImageGenerationWorkspace({
  setCurrentTab,
  onLoadImageUrl,
  maxImages = 3,
  userModel,
}: {
  setCurrentTab?: (tab: string) => void;
  onLoadImageUrl?: (imageUrl: string) => void;
  maxImages?: number;
  userModel?: string;
}) {
  const generationMode = useGenerationSettingsStore(state => state.generationMode);
  const resultsRef = useRef<HTMLDivElement>(null);

  // NEW: Use centralized submission logic
  const { submit, isPending } = useStoreSubmission<ImageGenerationFormState>(
    generateImageAction,
    'image', // NEW Type
    { message: '' }
  );

  // Auto-scroll logic (Same as before)
  useEffect(() => {
    if (isPending && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isPending]);

  return (
    <div className="space-y-6">
      {/* RESTORED: Form for accessibility, but intercept submit to use store logic */}
      <form onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={generationMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          >
            {/* Pass submit handler down */}
            {generationMode === 'creative' ? (
              <ImageParameters
                isPending={isPending}
                maxImages={maxImages}
                userModel={userModel}
                onSubmit={submit}
              />
            ) : (
              <StudioParameters
                isPending={isPending}
                maxImages={maxImages}
                userModel={userModel}
                onSubmit={submit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </form>

      <div ref={resultsRef}>
        {isPending && (
          <GenerationProgressIndicator
            isGenerating={isPending}
            stage="processing"
            imageCount={maxImages}
          />
        )}

        <ImageResultsDisplay
          setCurrentTab={setCurrentTab}
          onLoadImageUrl={onLoadImageUrl}
          maxImages={maxImages}
        />
      </div>
    </div>
  );
}
