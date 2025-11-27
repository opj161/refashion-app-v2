// src/components/ImageGenerationWorkspace.tsx
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import ImageParameters from './image-parameters';
import StudioParameters from './studio-parameters';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { useToast } from '@/hooks/use-toast';
import { ImageResultsDisplay } from './ImageResultsDisplay';
import { GenerationProgressIndicator } from './GenerationProgressIndicator';

export function ImageGenerationWorkspace({
  setCurrentTab,
  onLoadImageUrl,
  maxImages = 3,
  userModel, // NEW
}: {
  setCurrentTab?: (tab: string) => void;
  onLoadImageUrl?: (imageUrl: string) => void;
  maxImages?: number;
  userModel?: string; // NEW
}) {
  const generationMode = useGenerationSettingsStore(state => state.generationMode);
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
  const { toast } = useToast();

  const initialState: ImageGenerationFormState = { message: '' };
  const [formState, formAction, isPending] = useActionState(generateImageAction, initialState);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when generation starts
  useEffect(() => {
    if (isPending && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  // Effect to handle form submission results
  useEffect(() => {
    if (!isPending && formState.message) {
      const successCount = formState.editedImageUrls?.filter(url => url !== null).length ?? 0;

      if (successCount > 0) {
        incrementGenerationCount();
        toast({
          title: 'Generation Complete!',
          description: formState.message,
        });
      } else if (formState.errors?.some(e => e !== null)) {
        toast({
          title: 'Generation Failed',
          description: formState.message || 'Please check the errors below.',
          variant: 'destructive',
        });
      }
    }
  }, [formState, isPending, toast, incrementGenerationCount]);

  return (
    <div className="space-y-6">
      <form action={formAction}>
        <AnimatePresence mode="wait">
          <motion.div
            key={generationMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          >
            {generationMode === 'creative' ? (
              <ImageParameters isPending={isPending} maxImages={maxImages} userModel={userModel} />
            ) : (
              <StudioParameters isPending={isPending} maxImages={maxImages} userModel={userModel} />
            )}
          </motion.div>
        </AnimatePresence>
      </form>

      {/* Render progress and results here, outside the form but in the same component */}
      <div ref={resultsRef}>
        {isPending && (
          <GenerationProgressIndicator
            isGenerating={isPending}
            stage="processing"
            imageCount={3}
          />
        )}
        <ImageResultsDisplay
          formState={formState}
          isPending={isPending}
          setCurrentTab={setCurrentTab}
          onLoadImageUrl={onLoadImageUrl}
          maxImages={maxImages}
        />
      </div>
    </div>
  );
}
