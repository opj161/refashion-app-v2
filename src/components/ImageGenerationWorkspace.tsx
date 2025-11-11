// src/components/ImageGenerationWorkspace.tsx
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { useToast } from '@/hooks/use-toast';
import ImageParameters from './image-parameters';
import StudioParameters from './studio-parameters';
import { ImageResultsDisplay } from './ImageResultsDisplay';
import { GenerationProgressIndicator } from './GenerationProgressIndicator';

const NUM_IMAGES_TO_GENERATE = 3;

export function ImageGenerationWorkspace() {
  const { toast } = useToast();
  const generationMode = useGenerationSettingsStore(state => state.generationMode);
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);

  const initialState: ImageGenerationFormState = { message: '' };
  const [formState, formAction, isPending] = useActionState(generateImageAction, initialState);

  // Ref for auto-scroll to results
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
    if (formState.message && formState.editedImageUrls) {
      const successCount = formState.editedImageUrls.filter(url => url !== null).length;

      if (successCount > 0) {
        // Trigger history gallery refresh via Zustand store
        incrementGenerationCount();
        toast({
          title: 'Generation Complete!',
          description: formState.message,
        });
      } else if (formState.errors) {
        toast({
          title: 'All Generations Failed',
          description: 'Please check the errors or try again.',
          variant: 'destructive',
        });
      }
    } else if (formState.message && formState.errors) {
      toast({ title: 'Generation Failed', description: formState.message, variant: 'destructive' });
    }
  }, [formState, toast, incrementGenerationCount]);

  return (
    <div className="space-y-6">
      {/* Parameter Panels wrapped in a single form */}
      <form action={formAction}>
        <AnimatePresence mode="wait">
          <motion.div
            key={generationMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          >
            {generationMode === 'creative' ? (
              <ImageParameters formAction={formAction} isPending={isPending} />
            ) : (
              <StudioParameters formAction={formAction} isPending={isPending} />
            )}
          </motion.div>
        </AnimatePresence>
      </form>

      {/* Progress Indicator - Shows during generation */}
      {isPending && (
        <GenerationProgressIndicator
          isGenerating={isPending}
          stage="processing"
          progress={0}
          imageCount={NUM_IMAGES_TO_GENERATE}
        />
      )}

      {/* Results Display */}
      <div ref={resultsRef}>
        <ImageResultsDisplay formState={formState} isPending={isPending} />
      </div>
    </div>
  );
}
