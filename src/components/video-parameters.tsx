'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useImageStore } from "@/stores/imageStore";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import {
  PREDEFINED_PROMPTS, MODEL_MOVEMENT_OPTIONS, FABRIC_MOTION_OPTIONS_VIDEO,
  CAMERA_ACTION_OPTIONS, AESTHETIC_VIBE_OPTIONS as AESTHETIC_STYLE_OPTIONS
} from "@/lib/prompt-builder";
import { AlertTriangle, Info, Loader2, PaletteIcon, Settings2, Shuffle, Video } from "lucide-react";
import { usePromptManager } from "@/hooks/usePromptManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateVideoCost, formatPrice, VideoResolution, VideoDuration } from "@/lib/pricing";
import { motion, AnimatePresence } from 'motion/react';
import { COMMON_VARIANTS } from '@/lib/motion-constants';
import { ImageResultsDisplay } from './ImageResultsDisplay'; // UNIFIED COMPONENT
import { useStoreSubmission } from "@/hooks/useStoreSubmission"; // NEW HOOK
import { generateVideoAction, type VideoGenerationFormState } from '@/ai/actions/generate-video.action';
import { isFalVideoGenerationAvailable } from '@/ai/actions/generate-video.action';

export default function VideoParameters() {
  // ... Store Access ...
  const { versions, activeVersionId } = useImageStore();
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || null;

  const videoSettings = useGenerationSettingsStore(state => state.videoSettings);
  const setVideoSettings = useGenerationSettingsStore(state => state.setVideoSettings);
  const setActiveVideoPrompt = useGenerationSettingsStore(state => state.setActiveVideoPrompt); // NEW

  // NEW: Use Hook
  const { submit, isPending } = useStoreSubmission<VideoGenerationFormState>(
    generateVideoAction,
    'video', // NEW Type
    { message: '' }
  );

  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(videoSettings.selectedPredefinedPrompt);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isFalVideoGenerationAvailable().then(r => setIsServiceAvailable(r.available));
  }, []);

  useEffect(() => {
    if (isPending && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [isPending]);

  const handlePresetChange = useCallback((presetValue: string) => {
    setActivePreset(presetValue);
    setVideoSettings({ selectedPredefinedPrompt: presetValue });
  }, [setVideoSettings]);

  // Auto-select first preset
  useEffect(() => {
    if (PREDEFINED_PROMPTS[0] && !activePreset) {
      handlePresetChange(PREDEFINED_PROMPTS[0].value);
    }
  }, [activePreset, handlePresetChange]);

  // Prompt Manager
  const { currentPrompt, handlePromptChange, resetPromptToAuto, isManualPromptOutOfSync } = usePromptManager({
    generationType: 'video',
    generationParams: videoSettings as any,
  });

  // NEW: Sync prompt to store for submission hook
  useEffect(() => {
    setActiveVideoPrompt(currentPrompt);
  }, [currentPrompt, setActiveVideoPrompt]);

  const commonFormDisabled = isPending || !isServiceAvailable || !preparedImageUrl;

  return (
    <div className="space-y-6">
      <Card variant="glass" className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><PaletteIcon className="h-6 w-6 text-primary" /> Video Settings</CardTitle>
          <CardDescription>Bring your image to life.</CardDescription>
        </CardHeader>

        {/* Changed from <form> to <div> since hook handles data gathering */}
        <div className="contents">

          <CardContent className="space-y-6">
            {/* Alerts */}
            <AnimatePresence>
              {!preparedImageUrl && (
                <motion.div variants={COMMON_VARIANTS.slideDownAndFade} initial="hidden" animate="visible" exit="exit">
                  <Alert><Info className="h-4 w-4" /><AlertTitle>Start with an Image</AlertTitle><AlertDescription>Upload an image first.</AlertDescription></Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className={commonFormDisabled ? 'opacity-50 pointer-events-none' : ''}>
              {/* Presets Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {PREDEFINED_PROMPTS.map(preset => (
                  <Button key={preset.value} variant={activePreset === preset.value ? 'secondary' : 'outline'} onClick={() => handlePresetChange(preset.value)} className="h-auto py-2 px-3 text-xs whitespace-normal">{preset.displayLabel}</Button>
                ))}
              </div>

              <Accordion type="single" collapsible className="w-full mt-4">
                {/* Advanced Animation */}
                <AccordionItem value="advanced"><AccordionTrigger>Advanced Animation</AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    {/* Selects for modelMovement, fabricMotion, cameraAction, aestheticVibe */}
                    {/* ... (Reuse existing Select code but update onChange to use setVideoSettings directly) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Model Movement</Label>
                        <Select value={videoSettings.modelMovement} onValueChange={v => setVideoSettings({ modelMovement: v })} disabled={commonFormDisabled}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{MODEL_MOVEMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {/* ... repeat for fabric, camera, aesthetic ... */}
                    </div>
                    {/* Prompt Textarea */}
                    <Textarea value={currentPrompt} onChange={e => handlePromptChange(e.target.value)} disabled={commonFormDisabled} className="font-mono text-xs" />
                  </AccordionContent>
                </AccordionItem>

                {/* Video Specs */}
                <AccordionItem value="specs"><AccordionTrigger>Video Specs</AccordionTrigger>
                  <AccordionContent className="pt-4 grid grid-cols-2 gap-4">
                    {/* Model, Resolution, Duration, Seed */}
                    {/* ... (Keep existing Select/Input code) ... */}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>

          <CardFooter>
            <Button onClick={submit} disabled={commonFormDisabled} className="w-full text-lg" size="lg">
              {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</> : <><Video className="mr-2 h-5 w-5" /> Generate Video</>}
            </Button>
          </CardFooter>
        </div>
      </Card>

      {/* Unified Result Display */}
      <div ref={resultsRef}>
        <ImageResultsDisplay maxImages={1} />
      </div>
    </div>
  );
}
