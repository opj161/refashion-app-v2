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
import { useGenerationSettingsStore, type VideoParameters as VideoParamsType } from "@/stores/generationSettingsStore";
import {
  PREDEFINED_PROMPTS, MODEL_MOVEMENT_OPTIONS, FABRIC_MOTION_OPTIONS_VIDEO,
  CAMERA_ACTION_OPTIONS, AESTHETIC_VIBE_OPTIONS
} from "@/lib/prompt-builder";
import { AlertTriangle, Info, Loader2, PaletteIcon, Shuffle, Video, MonitorPlay } from "lucide-react";
import { usePromptManager } from "@/hooks/usePromptManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateVideoCost, formatPrice, VideoDuration, VideoResolution } from "@/lib/pricing";
import { m, AnimatePresence } from 'motion/react';
import { COMMON_VARIANTS } from '@/lib/motion-constants';
import { ImageResultsDisplay } from './ImageResultsDisplay';
import { GenerationProgressIndicator } from './GenerationProgressIndicator';
import { useStoreSubmission } from "@/hooks/useStoreSubmission";
import { generateVideoAction, type VideoGenerationFormState } from '@/ai/actions/generate-video.action';
import { isFalVideoGenerationAvailable } from '@/ai/actions/generate-video.action';

// Aspect Ratios supported by Fal.ai Seedance model
const VIDEO_ASPECT_RATIOS = [
  { value: "9:16", label: "9:16 (Portrait/Story)" },
  { value: "16:9", label: "16:9 (Cinematic)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Classic)" },
  { value: "21:9", label: "21:9 (Ultrawide)" },
  { value: "3:4", label: "3:4 (Editorial)" },
];

export default function VideoParameters() {
  // --- Store Access ---
  const { versions, activeVersionId } = useImageStore();
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || null;

  const videoSettings = useGenerationSettingsStore(state => state.videoSettings);
  const setVideoSettings = useGenerationSettingsStore(state => state.setVideoSettings);
  const setActiveVideoPrompt = useGenerationSettingsStore(state => state.setActiveVideoPrompt);

  // --- Submission Hook ---
  const { submit, isPending } = useStoreSubmission<VideoGenerationFormState>(
    generateVideoAction,
    'video',
    { message: '' }
  );

  // --- Local State ---
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(videoSettings.selectedPredefinedPrompt);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Check service availability
  useEffect(() => {
    isFalVideoGenerationAvailable().then(r => setIsServiceAvailable(r.available));
  }, []);

  // Auto-scroll on generation start
  useEffect(() => {
    if (isPending && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [isPending]);

  // Handle Preset Changes (e.g., "Walks Toward", "Zoom In")
  const handlePresetChange = useCallback((presetValue: string) => {
    setActivePreset(presetValue);
    setVideoSettings({ selectedPredefinedPrompt: presetValue });
  }, [setVideoSettings]);

  // Auto-select first preset on load if none selected
  useEffect(() => {
    if (PREDEFINED_PROMPTS[0] && !activePreset) {
      handlePresetChange(PREDEFINED_PROMPTS[0].value);
    }
  }, [activePreset, handlePresetChange]);

  // Prompt Manager Hook
  const { currentPrompt, handlePromptChange, resetPromptToAuto, isManualPromptOutOfSync } = usePromptManager({
    generationType: 'video',
    generationParams: videoSettings as any,
  });

  // Sync computed prompt to global store for submission
  useEffect(() => {
    setActiveVideoPrompt(currentPrompt);
  }, [currentPrompt, setActiveVideoPrompt]);

  const commonFormDisabled = isPending || !isServiceAvailable || !preparedImageUrl;

  // --- Helper to render Select inputs cleanly ---
  const renderSelect = (
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    options: { value: string; displayLabel: string }[]
  ) => (
    <div>
      <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={commonFormDisabled}>
        <SelectTrigger className="w-full bg-background/50 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-sm">
              {o.displayLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Helper for Granular Settings (clears presets)
  const handleGranularChange = (key: keyof VideoParamsType, value: string) => {
    setVideoSettings({ [key]: value });
    // If tweaking advanced settings, we are no longer using a strict preset
    if (activePreset !== 'custom') {
      setActivePreset(null);
      setVideoSettings({ selectedPredefinedPrompt: 'custom' });
    }
  };

  return (
    <div className="space-y-6">
      <Card variant="glass" className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <PaletteIcon className="h-6 w-6 text-primary" /> Video Settings
          </CardTitle>
          <CardDescription>Bring your image to life with AI animation.</CardDescription>
        </CardHeader>

        <div className="contents">
          <CardContent className="space-y-6">
            {/* Alerts */}
            <AnimatePresence>
              {!preparedImageUrl && (
                <m.div variants={COMMON_VARIANTS.slideDownAndFade} initial="hidden" animate="visible" exit="exit">
                  <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-200">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Start with an Image</AlertTitle>
                    <AlertDescription>Upload and prepare an image first to enable video generation.</AlertDescription>
                  </Alert>
                </m.div>
              )}
            </AnimatePresence>

            <div className={commonFormDisabled ? 'opacity-50 pointer-events-none' : ''}>
              {/* Presets Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {PREDEFINED_PROMPTS.map(preset => (
                  <Button 
                    key={preset.value} 
                    variant={activePreset === preset.value ? 'secondary' : 'outline'} 
                    onClick={() => handlePresetChange(preset.value)} 
                    className="h-auto py-2 px-3 text-xs whitespace-normal border-primary/20 hover:border-primary/50"
                  >
                    {preset.displayLabel}
                  </Button>
                ))}
              </div>

              <Accordion type="multiple" defaultValue={["specs"]} className="w-full mt-4">
                
                {/* 1. ADVANCED ANIMATION (Reimplemented) */}
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-sm">Advanced Animation</AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderSelect("Model Movement", videoSettings.modelMovement, (v) => handleGranularChange('modelMovement', v), MODEL_MOVEMENT_OPTIONS)}
                      {renderSelect("Fabric Motion", videoSettings.fabricMotion, (v) => handleGranularChange('fabricMotion', v), FABRIC_MOTION_OPTIONS_VIDEO)}
                      {renderSelect("Camera Action", videoSettings.cameraAction, (v) => handleGranularChange('cameraAction', v), CAMERA_ACTION_OPTIONS)}
                      {renderSelect("Aesthetic Vibe", videoSettings.aestheticVibe, (v) => handleGranularChange('aestheticVibe', v), AESTHETIC_VIBE_OPTIONS)}
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch 
                        id="cameraFixed" 
                        checked={videoSettings.cameraFixed} 
                        onCheckedChange={(checked) => setVideoSettings({ cameraFixed: checked })} 
                        disabled={commonFormDisabled} 
                      />
                      <Label htmlFor="cameraFixed" className="text-sm cursor-pointer">Fix Camera Position (Tripod Mode)</Label>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <Label htmlFor="fullVideoPrompt" className="text-sm">Full Prompt</Label>
                        {isManualPromptOutOfSync && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={resetPromptToAuto} 
                            className="text-xs text-amber-500 hover:text-amber-400 h-auto p-0 hover:bg-transparent"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" /> Reset to Auto
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id="fullVideoPrompt"
                        value={currentPrompt}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        rows={3}
                        className="text-xs font-mono bg-muted/30"
                        placeholder="Prompt will be generated here based on your selections..."
                        disabled={commonFormDisabled}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. VIDEO SPECS (Reimplemented & Fixed) */}
                <AccordionItem value="specs">
                  <AccordionTrigger className="text-sm">Video Specs</AccordionTrigger>
                  <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Aspect Ratio - NEW */}
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Aspect Ratio</Label>
                      <Select 
                        // Note: Using 'any' cast as store type update is pending, but JS works fine
                        value={(videoSettings as any).aspect_ratio || "9:16"} 
                        onValueChange={(v) => setVideoSettings({ aspect_ratio: v } as any)}
                        disabled={commonFormDisabled}
                      >
                        <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue placeholder="Select ratio" /></SelectTrigger>
                        <SelectContent>
                          {VIDEO_ASPECT_RATIOS.map(ratio => (
                            <SelectItem key={ratio.value} value={ratio.value}>{ratio.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Resolution */}
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Resolution</Label>
                      <Select 
                        value={videoSettings.resolution} 
                        onValueChange={(v) => setVideoSettings({ resolution: v as VideoResolution })} 
                        disabled={commonFormDisabled}
                      >
                        <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="480p">480p (Fastest)</SelectItem>
                          <SelectItem value="720p">720p (HD)</SelectItem>
                          <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duration */}
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Duration</Label>
                      <Select 
                        value={videoSettings.duration} 
                        onValueChange={(v) => setVideoSettings({ duration: v as VideoDuration })} 
                        disabled={commonFormDisabled}
                      >
                        <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['5', '10'].map(d => (
                            <SelectItem key={d} value={d}>
                              <div className="flex justify-between w-full min-w-[120px]">
                                <span>{d} seconds</span>
                                {/* Pricing assumes Pro model since Lite is removed */}
                                <span className="text-muted-foreground text-xs">
                                  {formatPrice(calculateVideoCost('pro', videoSettings.resolution, d as VideoDuration))}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Seed */}
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Seed</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={videoSettings.seed} 
                          onChange={(e) => setVideoSettings({ seed: e.target.value })} 
                          placeholder="-1 for random" 
                          disabled={commonFormDisabled} 
                          className="h-9 text-sm bg-background/50"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setVideoSettings({ seed: "-1" })} 
                          disabled={commonFormDisabled} 
                          className="h-9 w-9"
                          title="Randomize Seed"
                        >
                          <Shuffle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              onClick={submit} 
              disabled={commonFormDisabled} 
              className="w-full text-lg h-12 font-semibold shadow-lg shadow-primary/20" 
              size="lg"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Video...</>
              ) : (
                <><Video className="mr-2 h-5 w-5" /> Generate Video</>
              )}
            </Button>
          </CardFooter>
        </div>
      </Card>

      {!isServiceAvailable && (
        <Card variant="glass" className="border-amber-500/50 bg-amber-500/10 text-amber-200">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5" /> Service Not Available</CardTitle></CardHeader>
          <CardContent><p className="text-sm">Video generation service is not configured. Please check API keys.</p></CardContent>
        </Card>
      )}

      {/* Unified Result Display */}
      <div ref={resultsRef}>
        {isPending && (
          <GenerationProgressIndicator
            isGenerating={isPending}
            stage="processing"
            message="Generating video animation..."
            imageCount={1}
          />
        )}
        <ImageResultsDisplay maxImages={1} />
      </div>
    </div>
  );
}
