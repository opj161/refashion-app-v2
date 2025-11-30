'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useImageStore } from '@/stores/imageStore';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { m, AnimatePresence } from 'motion/react';
import { COMMON_VARIANTS } from '@/lib/motion-constants';
import { ASPECT_RATIOS } from '@/lib/prompt-builder';

interface StudioParametersProps {
  isPending: boolean;
  maxImages?: number;
  userModel?: string;
  onSubmit: () => void; // NEW Prop
}

export default function StudioParameters({ isPending, maxImages = 3, userModel, onSubmit }: StudioParametersProps) {
  const { versions, activeVersionId } = useImageStore();
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const isImageReady = !!activeImage?.imageUrl;

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
      {/* REMOVED: Hidden inputs */}

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Studio Mode Settings
          </CardTitle>
          <CardDescription>Generate consistent, product-focused shots.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AnimatePresence>
            {!isImageReady && (
              <m.div variants={COMMON_VARIANTS.slideDownAndFade} initial="hidden" animate="visible" exit="exit">
                <Alert className="py-2 bg-blue-500/10 border-blue-500/20 text-blue-200">
                  <div className="flex items-center gap-3">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="mb-0 text-sm">Image Required</AlertTitle>
                  </div>
                  <AlertDescription className="text-xs mt-0 ml-7">
                    Please prepare an image first.
                  </AlertDescription>
                </Alert>
              </m.div>
            )}
          </AnimatePresence>

          <div className={!isImageReady || isPending ? 'opacity-50' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="studio-fit-select">Clothing Fit</Label>
                <Select value={studioFit} onValueChange={(value) => setStudioFit(value as any)} disabled={!isImageReady || isPending}>
                  <SelectTrigger id="studio-fit-select" className="w-full h-12 md:h-10"><SelectValue placeholder="Select fit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slim">Slim Fit</SelectItem>
                    <SelectItem value="regular">Regular Fit</SelectItem>
                    <SelectItem value="relaxed">Relaxed Fit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isNanoBanana && (
                <div className="space-y-2">
                  <Label htmlFor="aspect-ratio-select">Aspect Ratio</Label>
                  <Select value={studioAspectRatio} onValueChange={setStudioAspectRatio} disabled={!isImageReady || isPending}>
                    <SelectTrigger id="aspect-ratio-select" className="w-full h-12 md:h-10"><SelectValue placeholder="Select aspect ratio" /></SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ratio) => (<SelectItem key={ratio.value} value={ratio.value}>{ratio.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {/* UPDATED: Button uses onClick={onSubmit} */}
          <Button
            onClick={onSubmit}
            disabled={isPending || !isImageReady}
            className="w-full text-base h-11 font-semibold"
          >
            {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-5 w-5" /> Generate {maxImages} Image{maxImages > 1 ? 's' : ''}</>}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
