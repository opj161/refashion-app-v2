// src/components/workspace/ControlRack.tsx
'use client';

import React, { useEffect } from 'react';
import { useActionState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Settings2, Camera, Palette } from 'lucide-react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/SegmentedControl';
import { ASPECT_RATIOS } from '@/lib/prompt-builder';
import { useShallow } from 'zustand/react/shallow';

interface ControlRackProps {
  maxImages?: number;
  userModel?: string;
}

/**
 * ControlRack - The center column of the workspace.
 * Contains the configuration form and generate button for image generation.
 * This is a unified control panel that handles Studio/Creative mode switching.
 */
export function ControlRack({ maxImages = 3, userModel }: ControlRackProps) {
  const { toast } = useToast();
  
  // Global State
  const { 
    generationMode, 
    setGenerationMode, 
    studioFit, 
    setStudioFit, 
    studioAspectRatio, 
    setStudioAspectRatio 
  } = useGenerationSettingsStore(
    useShallow((state) => ({
      generationMode: state.generationMode,
      setGenerationMode: state.setGenerationMode,
      studioFit: state.studioFit,
      setStudioFit: state.setStudioFit,
      studioAspectRatio: state.studioAspectRatio,
      setStudioAspectRatio: state.setStudioAspectRatio,
    }))
  );
  
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
  const setCurrentResultId = useGenerationSettingsStore(state => state.setCurrentResultId);
  const activeView = useGenerationSettingsStore(state => state.activeView);
  const { versions, activeVersionId } = useImageStore();
  
  // Computed State
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || '';
  const isImageReady = !!preparedImageUrl;
  const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');
  const isNanoBanana = userModel === 'fal_nano_banana_pro';

  // Form Action State
  const initialState: ImageGenerationFormState = { message: '' };
  const [formState, formAction, isPending] = useActionState(generateImageAction, initialState);

  // Side Effect: Handle Success/Error Toasts and update result ID
  useEffect(() => {
    if (!isPending && formState.message) {
      const successCount = formState.editedImageUrls?.filter(url => url !== null).length ?? 0;

      if (successCount > 0 || formState.newHistoryId) {
        incrementGenerationCount();
        // Set the result ID for the output gallery
        if (formState.newHistoryId) {
          setCurrentResultId(formState.newHistoryId);
        }
        toast({
          title: 'Generation Started',
          description: formState.message,
          className: "bg-teal-950 border-teal-800 text-teal-100"
        });
      } else if (formState.errors?.some(e => e !== null)) {
        toast({
          title: 'Generation Failed',
          description: 'Please check the settings and try again.',
          variant: 'destructive',
        });
      }
    }
  }, [formState, isPending, toast, incrementGenerationCount, setCurrentResultId]);

  const isSubmitDisabled = isPending || !isImageReady || isAnyVersionProcessing;

  // Only show for image mode (video mode will have its own panel later)
  if (activeView !== 'image') {
    return (
      <aside className="w-[320px] border-x border-white/5 bg-card/30 flex flex-col h-full shrink-0 z-10 items-center justify-center p-4 hidden lg:flex">
        <p className="text-sm text-muted-foreground text-center">
          Video controls coming soon.<br />Switch to Image Mode to generate images.
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-[320px] border-x border-white/5 bg-card/30 flex flex-col h-full shrink-0 z-10 hidden lg:flex">
      {/* Header */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50 justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Settings2 className="h-3 w-3" /> Configuration
        </span>
      </div>

      {/* Main Form Container */}
      <form action={formAction} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Hidden Inputs for State Transfer */}
        <input type="hidden" name="imageDataUriOrUrl" value={preparedImageUrl} />
        <input type="hidden" name="generationMode" value={generationMode} />
        <input type="hidden" name="studioFit" value={studioFit} />
        {isNanoBanana && <input type="hidden" name="aspectRatio" value={studioAspectRatio} />}

        {/* Scrollable Settings Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            
            {/* Mode Switcher */}
            <div className="flex justify-center">
              <SegmentedControl
                value={generationMode}
                onValueChange={(mode) => {
                  if (mode) setGenerationMode(mode as 'creative' | 'studio');
                }}
                className="w-full"
              >
                <SegmentedControlItem value="studio" className="flex-1 text-xs">
                  <Camera className="h-3.5 w-3.5 mr-1" /> Studio
                </SegmentedControlItem>
                <SegmentedControlItem value="creative" className="flex-1 text-xs">
                  <Palette className="h-3.5 w-3.5 mr-1" /> Creative
                </SegmentedControlItem>
              </SegmentedControl>
            </div>

            {/* Settings Section */}
            <div className="space-y-4">
              {generationMode === 'studio' ? (
                <StudioSettingsContent 
                  studioFit={studioFit}
                  setStudioFit={setStudioFit}
                  studioAspectRatio={studioAspectRatio}
                  setStudioAspectRatio={setStudioAspectRatio}
                  isNanoBanana={isNanoBanana}
                  isPending={isPending}
                  isImageReady={isImageReady}
                />
              ) : (
                <CreativeSettingsContent 
                  studioAspectRatio={studioAspectRatio}
                  setStudioAspectRatio={setStudioAspectRatio}
                  isNanoBanana={isNanoBanana}
                  isPending={isPending}
                  isImageReady={isImageReady}
                />
              )}
            </div>
            
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-white/5 bg-background/40 backdrop-blur-lg shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
          <Button 
            type="submit" 
            disabled={isSubmitDisabled} 
            className={cn(
              "w-full h-12 text-base font-semibold shadow-lg transition-all duration-300",
              !isSubmitDisabled ? "bg-gradient-to-r from-primary to-[hsl(190_90%_50%)] hover:brightness-110" : "opacity-50"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5 fill-current" /> 
                Generate {isNanoBanana ? '1 Image' : `${maxImages} Images`}
              </>
            )}
          </Button>
          
          {!isImageReady && (
            <p className="text-[10px] text-center text-red-400/80 mt-2 font-medium">
              * Upload an image in the Input Stage to continue
            </p>
          )}
        </div>
      </form>
    </aside>
  );
}

/**
 * Studio Mode Settings - Compact version for sidebar
 */
function StudioSettingsContent({
  studioFit,
  setStudioFit,
  studioAspectRatio,
  setStudioAspectRatio,
  isNanoBanana,
  isPending,
  isImageReady,
}: {
  studioFit: string;
  setStudioFit: (fit: 'slim' | 'regular' | 'relaxed') => void;
  studioAspectRatio: string;
  setStudioAspectRatio: (ratio: string) => void;
  isNanoBanana: boolean;
  isPending: boolean;
  isImageReady: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-muted/20 border border-white/5">
        <p className="text-xs text-muted-foreground mb-3">
          Studio Mode generates consistent, product-focused shots with high garment fidelity.
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studio-fit" className="text-xs font-medium text-muted-foreground">
              Clothing Fit
            </Label>
            <Select
              value={studioFit}
              onValueChange={(value) => setStudioFit(value as 'slim' | 'regular' | 'relaxed')}
              disabled={!isImageReady || isPending}
            >
              <SelectTrigger id="studio-fit" className="h-9 bg-black/20 border-white/10">
                <SelectValue placeholder="Select fit..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slim">Slim Fit</SelectItem>
                <SelectItem value="regular">Regular Fit</SelectItem>
                <SelectItem value="relaxed">Relaxed Fit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isNanoBanana && (
            <div className="space-y-2">
              <Label htmlFor="studio-aspect" className="text-xs font-medium text-muted-foreground">
                Aspect Ratio
              </Label>
              <Select
                value={studioAspectRatio}
                onValueChange={setStudioAspectRatio}
                disabled={!isImageReady || isPending}
              >
                <SelectTrigger id="studio-aspect" className="h-9 bg-black/20 border-white/10">
                  <SelectValue placeholder="Select ratio..." />
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
    </div>
  );
}

/**
 * Creative Mode Settings - Compact version for sidebar
 */
function CreativeSettingsContent({
  studioAspectRatio,
  setStudioAspectRatio,
  isNanoBanana,
  isPending,
  isImageReady,
}: {
  studioAspectRatio: string;
  setStudioAspectRatio: (ratio: string) => void;
  isNanoBanana: boolean;
  isPending: boolean;
  isImageReady: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-muted/20 border border-white/5">
        <p className="text-xs text-muted-foreground mb-3">
          Creative Mode gives you full control over model attributes, backgrounds, and styling.
        </p>
        
        <div className="space-y-4">
          {isNanoBanana && (
            <div className="space-y-2">
              <Label htmlFor="creative-aspect" className="text-xs font-medium text-muted-foreground">
                Aspect Ratio
              </Label>
              <Select
                value={studioAspectRatio}
                onValueChange={setStudioAspectRatio}
                disabled={!isImageReady || isPending}
              >
                <SelectTrigger id="creative-aspect" className="h-9 bg-black/20 border-white/10">
                  <SelectValue placeholder="Select ratio..." />
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
          
          <p className="text-[10px] text-muted-foreground/70 italic">
            Advanced settings are available in the full-page view.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ControlRack;
