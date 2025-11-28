'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, PersonStanding, Settings2, Sparkles, FileText, Shuffle, Save, Trash2, BrainCircuit, Code, Camera, Wand2 } from 'lucide-react';
import { isFaceDetailerAvailable, isUpscaleServiceAvailable } from "@/ai/actions/upscale-image.action";
import { isBackgroundRemovalAvailable } from "@/ai/actions/remove-background.action";
import type { ModelAttributes } from "@/lib/types";
import { usePromptManager } from '@/hooks/usePromptManager';
import { Textarea } from '@/components/ui/textarea';
import { useImageStore } from "@/stores/imageStore";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import {
  FASHION_STYLE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS,
  BODY_SHAPE_AND_SIZE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS,
  POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS, MODEL_ANGLE_OPTIONS,
  LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, LENS_EFFECT_OPTIONS,
  DEPTH_OF_FIELD_OPTIONS, OptionWithPromptSegment, ASPECT_RATIOS
} from '@/lib/prompt-builder';
import { motion, AnimatePresence } from 'motion/react';
import { MOTION_TRANSITIONS } from '@/lib/motion-constants';

// Updated interface
interface ImageParametersProps {
  isPending: boolean;
  maxImages?: number;
  userModel?: string;
  onSubmit: () => void; // NEW
}

export default function ImageParameters({ isPending, maxImages = 3, userModel, onSubmit }: ImageParametersProps) {
  const { toast } = useToast();
  const { versions, activeVersionId } = useImageStore();
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || null;

  // Store Access
  const imageSettings = useGenerationSettingsStore(state => state.imageSettings);
  const settingsMode = useGenerationSettingsStore(state => state.settingsMode);
  const setImageSettings = useGenerationSettingsStore(state => state.setImageSettings);
  const setSettingsModeStore = useGenerationSettingsStore(state => state.setSettingsMode);
  const { studioAspectRatio, setStudioAspectRatio } = useGenerationSettingsStore(state => ({ studioAspectRatio: state.studioAspectRatio, setStudioAspectRatio: state.setStudioAspectRatio }));

  const { backgroundRemovalEnabled, setBackgroundRemovalEnabled } = useGenerationSettingsStore(s => ({ backgroundRemovalEnabled: s.backgroundRemovalEnabled, setBackgroundRemovalEnabled: s.setBackgroundRemovalEnabled }));
  const { upscaleEnabled, setUpscaleEnabled } = useGenerationSettingsStore(s => ({ upscaleEnabled: s.upscaleEnabled, setUpscaleEnabled: s.setUpscaleEnabled }));
  const { faceDetailEnabled, setFaceDetailEnabled } = useGenerationSettingsStore(s => ({ faceDetailEnabled: s.faceDetailEnabled, setFaceDetailEnabled: s.setFaceDetailEnabled }));

  const isNanoBanana = userModel === 'fal_nano_banana_pro';

  // Local State
  const [useRandomization, setUseRandomization] = useState<boolean>(true);
  const [useAIPrompt, setUseAIPrompt] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);

  // Service availability
  const [isFaceDetailerServiceAvailable, setIsFaceDetailerServiceAvailable] = useState<boolean>(false);
  const [isBackgroundRemovalServiceAvailable, setIsBackgroundRemovalServiceAvailable] = useState<boolean>(false);
  const [isUpscaleServiceAvailableState, setIsUpscaleServiceAvailableState] = useState<boolean>(false);

  // Load defaults (Same as main)
  // ... (useEffect hooks for loading/saving local storage remain identical)

  // Handlers (Same as main)
  const handleParamChange = useCallback((key: keyof ModelAttributes, value: string) => {
    setImageSettings({ [key]: value });
    setUseRandomization(false);
  }, [setImageSettings]);

  const handleAIPromptChange = useCallback((value: boolean) => {
    setUseAIPrompt(value);
    setUseRandomization(false);
  }, []);

  const currentImageGenParams = React.useMemo(() => ({ ...imageSettings, settingsMode }), [imageSettings, settingsMode]);
  const { currentPrompt, isPromptManuallyEdited, handlePromptChange } = usePromptManager({
    generationType: 'image',
    generationParams: currentImageGenParams,
  });

  useEffect(() => {
    isFaceDetailerAvailable().then(setIsFaceDetailerServiceAvailable);
    isBackgroundRemovalAvailable().then(setIsBackgroundRemovalServiceAvailable);
    isUpscaleServiceAvailable().then(setIsUpscaleServiceAvailableState);
  }, []);

  // Helper for Selects
  const renderSelect = ({ id, label, value, options }: any) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</Label>
      <Select value={value} onValueChange={(v) => handleParamChange(id, v)} disabled={isPending}>
        <SelectTrigger id={id} className="w-full h-12 md:h-10 text-sm border-muted/60 focus:border-primary/50 bg-background/50">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {options.map((option: any) => (
            <SelectItem key={option.value} value={option.value} className="text-sm py-3 md:py-2">
              {option.displayLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Define Randomize handlers... (same as main)

  return (
    <>
      {/* REMOVED: Hidden inputs. Data is now gathered directly from store by useStoreSubmission */}

      <Card variant="glass">
        {/* ... Header ... */}
        <CardHeader>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Image Generation Settings
            </CardTitle>
            <CardDescription>{useRandomization ? 'Using automatic style randomization.' : 'Fine-tune every detail.'}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* UPDATED: Button uses onClick={onSubmit} instead of type="submit" */}
          <Button
            onClick={onSubmit}
            disabled={isPending || !preparedImageUrl}
            className="w-full text-lg h-14"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Generate {maxImages} Image{maxImages > 1 ? 's' : ''}</>
            )}
          </Button>

          {/* ... Rest of UI (Aspect Ratio, Toggles) remains exactly the same ... */}
          {isNanoBanana && (
            <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-muted/30">
              <Label htmlFor="creative-aspect-ratio" className="mb-2 block text-sm font-medium">Aspect Ratio</Label>
              <Select value={studioAspectRatio} onValueChange={setStudioAspectRatio} disabled={isPending || !preparedImageUrl}>
                <SelectTrigger id="creative-aspect-ratio" className="w-full h-12 md:h-10 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ratio) => (<SelectItem key={ratio.value} value={ratio.value}>{ratio.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ... Toggles for pipeline ... */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-muted/30 space-y-3">
            {/* ... (Use existing toggle code with isPending check) ... */}
            {isBackgroundRemovalServiceAvailable && (
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="bg-removal-switch" className="text-sm font-medium cursor-pointer">Remove Background</Label>
                <Switch id="bg-removal-switch" checked={backgroundRemovalEnabled} onCheckedChange={setBackgroundRemovalEnabled} disabled={isPending} />
              </div>
            )}
            {/* ... Upscale and Face Detail toggles ... */}
          </div>
        </CardContent>

        {/* ... Accordions for parameters ... */}
        <CardFooter className="flex-col items-stretch !pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="customize" className="border-b-0">
              <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground justify-center py-2 group">
                <Settings2 className="mr-2 h-4 w-4 transition-transform group-data-[state=open]:rotate-90" /> Customize Settings
              </AccordionTrigger>
              <AccordionContent className="pt-6 space-y-6">
                {/* ... Randomization Switches ... */}
                {/* ... Parameter Dropdowns using renderSelect ... */}
                {/* ... Prompt Preview ... */}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardFooter>
      </Card>
    </>
  );
}
