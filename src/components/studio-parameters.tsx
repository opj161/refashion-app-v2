// src/components/studio-parameters.tsx
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useImageStore } from '@/stores/imageStore';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { useToast } from '@/hooks/use-toast';
import { ImageResultsDisplay } from './ImageResultsDisplay';
import { GenerationProgressIndicator } from './GenerationProgressIndicator';

const NUM_IMAGES_TO_GENERATE = 3;

// Submit button component specific to this form
function SubmitButton({ isImageReady }: { isImageReady: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || !isImageReady} className="w-full text-lg h-14">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" /> Generate 3 Images
        </>
      )}
    </Button>
  );
}

export default function StudioParameters() {
  const { toast } = useToast();
  const generationMode = useGenerationSettingsStore(state => state.generationMode);
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
  
  // Form state management
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

  // Optimized selector - only subscribe to the specific state we need
  const { preparedImageUrl, isImageReady } = useImageStore(
    useShallow((state) => {
      const activeImage = state.activeVersionId ? state.versions[state.activeVersionId] : null;
      return {
        preparedImageUrl: activeImage?.imageUrl || '',
        isImageReady: !!activeImage?.imageUrl,
      };
    })
  );

  const { studioFit, setStudioFit } = useGenerationSettingsStore(
    useShallow((state) => ({
      studioFit: state.studioFit,
      setStudioFit: state.setStudioFit,
    }))
  );

  return (
    <div className="space-y-6">
      <form action={formAction}>
        {/* Hidden inputs to pass data to the server action */}
        <input type="hidden" name="imageDataUriOrUrl" value={preparedImageUrl} />
        <input type="hidden" name="generationMode" value="studio" />
        <input type="hidden" name="studioFit" value={studioFit} />

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Studio Mode Settings
            </CardTitle>
            <CardDescription>
              Generate consistent, product-focused shots with high garment fidelity. A standard virtual model and studio environment are used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isImageReady && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Image Required</AlertTitle>
                <AlertDescription>
                  Please prepare an image in the section above before generating.
                </AlertDescription>
              </Alert>
            )}

            <div className={!isImageReady || isPending ? 'opacity-50' : ''}>
              <div className="space-y-2">
                <Label htmlFor="studio-fit-select">Clothing Fit</Label>
                <Select
                  value={studioFit}
                  onValueChange={(value) => setStudioFit(value as 'slim' | 'regular' | 'relaxed')}
                  disabled={!isImageReady || isPending}
                >
                  <SelectTrigger id="studio-fit-select" className="w-full">
                    <SelectValue placeholder="Select a fit..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slim">Slim Fit</SelectItem>
                    <SelectItem value="regular">Regular Fit</SelectItem>
                    <SelectItem value="relaxed">Relaxed Fit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton isImageReady={isImageReady} />
          </CardFooter>
        </Card>
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
      <div ref={resultsRef} key={generationMode}>
        <ImageResultsDisplay formState={formState} isPending={isPending} />
      </div>
    </div>
  );
}
