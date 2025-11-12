// src/components/studio-parameters.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useImagePreparation, useActivePreparationImage } from '@/contexts/ImagePreparationContext';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

const NUM_IMAGES_TO_GENERATE = 3;

// Submit button component specific to this form
function SubmitButton({ isImageReady }: { isImageReady: boolean }) {
  const { pending } = useFormStatus();
  const { isAnyVersionProcessing } = useImagePreparation();
  
  const isDisabled = pending || !isImageReady || isAnyVersionProcessing;
  
  return (
    <Button type="submit" disabled={isDisabled} className="w-full text-lg h-14">
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

interface StudioParametersProps {
  isPending: boolean;
}

export default function StudioParameters({ isPending }: StudioParametersProps) {
  // Get prepared image from context
  const activeImage = useActivePreparationImage();
  const preparedImageUrl = activeImage?.imageUrl || '';
  const isImageReady = !!activeImage?.imageUrl;

  const { studioFit, setStudioFit } = useGenerationSettingsStore(
    useShallow((state) => ({
      studioFit: state.studioFit,
      setStudioFit: state.setStudioFit,
    }))
  );

  return (
    <>
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
    </>
  );
}
