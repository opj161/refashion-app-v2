// src/components/studio-parameters.tsx
'use client';

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
import { motion, AnimatePresence } from 'motion/react';
import { COMMON_VARIANTS } from '@/lib/motion-constants';

const NUM_IMAGES_TO_GENERATE = 3;

// Submit button component specific to this form
function SubmitButton({ isImageReady, maxImages }: { isImageReady: boolean; maxImages: number }) {
  const { pending } = useFormStatus();
  const { versions } = useImageStore();
  const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');
  
  const isDisabled = pending || !isImageReady || isAnyVersionProcessing;
  
  return (
    <Button type="submit" disabled={isDisabled} className="w-full text-lg h-14">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" /> Generate {maxImages} Image{maxImages > 1 ? 's' : ''}
        </>
      )}
    </Button>
  );
}

interface StudioParametersProps {
  isPending: boolean;
  maxImages?: number;
  userModel?: string; // NEW
}

const ASPECT_RATIOS = [
  { value: "auto", label: "Auto (Match Input)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "9:16", label: "9:16 (Portrait/Story)" },
  { value: "16:9", label: "16:9 (Cinematic)" },
  { value: "3:4", label: "3:4 (Editorial)" },
  { value: "4:3", label: "4:3 (Landscape)" },
  { value: "2:3", label: "2:3 (Classic Portrait)" },
  { value: "3:2", label: "3:2 (Classic Landscape)" },
  { value: "4:5", label: "4:5 (Social Portrait)" },
  { value: "5:4", label: "5:4 (Social Landscape)" },
  { value: "21:9", label: "21:9 (Ultrawide)" },
];

export default function StudioParameters({ isPending, maxImages = 3, userModel }: StudioParametersProps) {
  // Get prepared image from store
  const { versions, activeVersionId } = useImageStore();
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || '';
  const isImageReady = !!activeImage?.imageUrl;

  // NEW: Retrieve and set aspect ratio from store
  const { studioFit, setStudioFit, studioAspectRatio, setStudioAspectRatio } = useGenerationSettingsStore(
    useShallow((state) => ({
      studioFit: state.studioFit,
      setStudioFit: state.setStudioFit,
      studioAspectRatio: state.studioAspectRatio,
      setStudioAspectRatio: state.setStudioAspectRatio,
    }))
  );

  const isNanoBanana = userModel === 'fal_nano_banana_pro';

  return (
    <>
      {/* Hidden inputs to pass data to the server action */}
      <input type="hidden" name="imageDataUriOrUrl" value={preparedImageUrl} />
      <input type="hidden" name="generationMode" value="studio" />
      <input type="hidden" name="studioFit" value={studioFit} />
      {isNanoBanana && <input type="hidden" name="aspectRatio" value={studioAspectRatio} />} 

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
          <AnimatePresence>
            {!isImageReady && (
              <motion.div
                key="image-required-alert"
                variants={COMMON_VARIANTS.slideDownAndFade}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Image Required</AlertTitle>
                  <AlertDescription>
                    Please prepare an image in the section above before generating.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={!isImageReady || isPending ? 'opacity-50' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* NEW: Conditionally render Aspect Ratio selector */}
              {isNanoBanana && (
                <div className="space-y-2">
                  <Label htmlFor="aspect-ratio-select">Aspect Ratio</Label>
                  <Select
                    value={studioAspectRatio}
                    onValueChange={setStudioAspectRatio}
                    disabled={!isImageReady || isPending}
                  >
                    <SelectTrigger id="aspect-ratio-select" className="w-full">
                      <SelectValue placeholder="Select aspect ratio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton isImageReady={isImageReady} maxImages={maxImages} />
        </CardFooter>
      </Card>
    </>
  );
}
