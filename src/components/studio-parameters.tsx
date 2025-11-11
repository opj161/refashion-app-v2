// src/components/studio-parameters.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useActivePreparationImage } from '@/stores/imageStore';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { Sparkles, Loader2, Info } from 'lucide-react';

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
  const activeImage = useActivePreparationImage();
  const { studioFit, setStudioFit } = useGenerationSettingsStore((state) => ({
    studioFit: state.studioFit,
    setStudioFit: state.setStudioFit,
  }));

  const initialState: ImageGenerationFormState = { message: '' };
  const [formState, formAction, isPending] = useActionState(generateImageAction, initialState);

  const isImageReady = !!activeImage?.imageUrl;

  return (
    <form action={formAction}>
      {/* Hidden inputs to pass data to the server action */}
      <input type="hidden" name="imageDataUriOrUrl" value={activeImage?.imageUrl || ''} />
      <input type="hidden" name="generationMode" value="studio" />
      <input type="hidden" name="studioFit" value={studioFit} />
      {/* Pass dummy values for unused creative mode params to satisfy action signature */}
      <input type="hidden" name="settingsMode" value="basic" />
      <input type="hidden" name="useAIPrompt" value="false" />
      <input type="hidden" name="useRandomization" value="false" />
      <input type="hidden" name="removeBackground" value="false" />
      <input type="hidden" name="upscale" value="false" />
      <input type="hidden" name="enhanceFace" value="false" />
      {/* Include all ModelAttributes as hidden fields with default values */}
      <input type="hidden" name="gender" value="female" />
      <input type="hidden" name="bodyShapeAndSize" value="default" />
      <input type="hidden" name="ageRange" value="default" />
      <input type="hidden" name="ethnicity" value="default" />
      <input type="hidden" name="poseStyle" value="default" />
      <input type="hidden" name="background" value="default" />
      <input type="hidden" name="fashionStyle" value="default_style" />
      <input type="hidden" name="hairStyle" value="default" />
      <input type="hidden" name="modelExpression" value="default" />
      <input type="hidden" name="lightingType" value="default" />
      <input type="hidden" name="lightQuality" value="default" />
      <input type="hidden" name="modelAngle" value="default" />
      <input type="hidden" name="lensEffect" value="default" />
      <input type="hidden" name="depthOfField" value="default" />
      <input type="hidden" name="timeOfDay" value="default" />
      <input type="hidden" name="overallMood" value="default" />

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
  );
}
