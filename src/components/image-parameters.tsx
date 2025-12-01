'use client';

import React, { useState, useEffect, useMemo } from "react";
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
import { useShallow } from 'zustand/react/shallow';
import {
  FASHION_STYLE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS,
  BODY_SHAPE_AND_SIZE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS,
  POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS, MODEL_ANGLE_OPTIONS,
  LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, LENS_EFFECT_OPTIONS,
  DEPTH_OF_FIELD_OPTIONS, OptionWithPromptSegment, ASPECT_RATIOS
} from '@/lib/prompt-builder';
import { m, AnimatePresence } from 'motion/react';
import { MOTION_TRANSITIONS } from '@/lib/motion-constants';

interface ImageParametersProps {
  isPending: boolean;
  maxImages?: number;
  userModel?: string;
  onSubmit: () => void;
}

export default function ImageParameters({ isPending, maxImages = 3, userModel, onSubmit }: ImageParametersProps) {
  const { toast } = useToast();
  const { versions, activeVersionId } = useImageStore();
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || null;

  // Consolidate store selectors with useShallow to prevent infinite loops
  const { 
    imageSettings,
    settingsMode,
    setImageSettings,
    setSettingsModeStore,
    studioAspectRatio,
    setStudioAspectRatio,
    backgroundRemovalEnabled, 
    setBackgroundRemovalEnabled,
    upscaleEnabled, 
    setUpscaleEnabled,
    faceDetailEnabled, 
    setFaceDetailEnabled,
    setActiveImagePrompt
  } = useGenerationSettingsStore(
    useShallow(s => ({ 
      imageSettings: s.imageSettings,
      settingsMode: s.settingsMode,
      setImageSettings: s.setImageSettings,
      setSettingsModeStore: s.setSettingsMode,
      studioAspectRatio: s.studioAspectRatio,
      setStudioAspectRatio: s.setStudioAspectRatio,
      backgroundRemovalEnabled: s.backgroundRemovalEnabled, 
      setBackgroundRemovalEnabled: s.setBackgroundRemovalEnabled,
      upscaleEnabled: s.upscaleEnabled, 
      setUpscaleEnabled: s.setUpscaleEnabled,
      faceDetailEnabled: s.faceDetailEnabled, 
      setFaceDetailEnabled: s.setFaceDetailEnabled,
      setActiveImagePrompt: s.setActiveImagePrompt
    }))
  );

  const isNanoBanana = userModel === 'fal_nano_banana_pro';

  // Local State
  const [useRandomization, setUseRandomization] = useState<boolean>(true);
  const [useAIPrompt, setUseAIPrompt] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);

  // Service availability
  const [isFaceDetailerServiceAvailable, setIsFaceDetailerServiceAvailable] = useState<boolean>(false);
  const [isBackgroundRemovalServiceAvailable, setIsBackgroundRemovalServiceAvailable] = useState<boolean>(false);
  const [isUpscaleServiceAvailableState, setIsUpscaleServiceAvailableState] = useState<boolean>(false);

  // Config for randomization (Memoized to prevent recreation)
  const PARAMETER_CONFIG = useMemo(() => ({
    gender: { options: GENDER_OPTIONS, defaultVal: GENDER_OPTIONS[0].value },
    bodyShapeAndSize: { options: BODY_SHAPE_AND_SIZE_OPTIONS, defaultVal: BODY_SHAPE_AND_SIZE_OPTIONS[0].value },
    ageRange: { options: AGE_RANGE_OPTIONS, defaultVal: AGE_RANGE_OPTIONS[0].value },
    ethnicity: { options: ETHNICITY_OPTIONS, defaultVal: ETHNICITY_OPTIONS[0].value },
    poseStyle: { options: POSE_STYLE_OPTIONS, defaultVal: POSE_STYLE_OPTIONS[0].value },
    background: { options: BACKGROUND_OPTIONS, defaultVal: BACKGROUND_OPTIONS.find(o => o.value === "outdoor_nature_elements")?.value || BACKGROUND_OPTIONS[0].value },
    fashionStyle: { options: FASHION_STYLE_OPTIONS, defaultVal: FASHION_STYLE_OPTIONS[0].value },
    hairStyle: { options: HAIR_STYLE_OPTIONS, defaultVal: HAIR_STYLE_OPTIONS[0].value },
    modelExpression: { options: MODEL_EXPRESSION_OPTIONS, defaultVal: MODEL_EXPRESSION_OPTIONS[0].value },
    lightingType: { options: LIGHTING_TYPE_OPTIONS, defaultVal: LIGHTING_TYPE_OPTIONS[0].value },
    lightQuality: { options: LIGHT_QUALITY_OPTIONS, defaultVal: LIGHT_QUALITY_OPTIONS[0].value },
    modelAngle: { options: MODEL_ANGLE_OPTIONS, defaultVal: MODEL_ANGLE_OPTIONS[0].value },
    lensEffect: { options: LENS_EFFECT_OPTIONS, defaultVal: LENS_EFFECT_OPTIONS[0].value },
    depthOfField: { options: DEPTH_OF_FIELD_OPTIONS, defaultVal: DEPTH_OF_FIELD_OPTIONS[0].value },
    timeOfDay: { options: TIME_OF_DAY_OPTIONS, defaultVal: TIME_OF_DAY_OPTIONS[0].value },
    overallMood: { options: OVERALL_MOOD_OPTIONS, defaultVal: OVERALL_MOOD_OPTIONS[0].value },
  }), []);

  // Load/Save local storage settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMode = window.localStorage.getItem('imageForgeSettingsMode');
      if (storedMode === 'basic' || storedMode === 'advanced') {
        setSettingsModeStore(storedMode);
      }

      const savedDefaultsString = window.localStorage.getItem('imageForgeDefaults');
      if (savedDefaultsString) {
        try {
          const savedDefaults = JSON.parse(savedDefaultsString) as ModelAttributes;
          setImageSettings(savedDefaults);
        } catch (e) { console.error("Failed to parse imageForgeDefaults", e); }
      }

      const storedPromptPreview = window.localStorage.getItem('imageForgeShowPromptPreview');
      if (storedPromptPreview === 'true') {
        setShowPromptPreview(true);
      }
    }
  }, [setImageSettings, setSettingsModeStore]);

  // Persist UI preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('imageForgeShowPromptPreview', showPromptPreview.toString());
    }
  }, [showPromptPreview]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('imageForgeSettingsMode', settingsMode);
    }
  }, [settingsMode]);

  // Service Availability
  useEffect(() => {
    isFaceDetailerAvailable().then(setIsFaceDetailerServiceAvailable);
    isBackgroundRemovalAvailable().then(setIsBackgroundRemovalServiceAvailable);
    isUpscaleServiceAvailable().then(setIsUpscaleServiceAvailableState);
  }, []);

  // Handlers (Plain functions, relying on React Compiler for memoization)
  const handleParamChange = (key: keyof ModelAttributes, value: string) => {
    setImageSettings({ [key]: value });
    setUseRandomization(false);
  };

  const handleAIPromptChange = (value: boolean) => {
    setUseAIPrompt(value);
    setUseRandomization(false);
  };

  const handleSettingsModeChange = (value: 'basic' | 'advanced') => {
    setSettingsModeStore(value);
    setUseRandomization(false);
  };

  const handleRandomizeConfiguration = () => {    
    const pickRandom = (options: OptionWithPromptSegment[]) => options[Math.floor(Math.random() * options.length)].value;
    const randomized: Partial<ModelAttributes> = {};
    Object.entries(PARAMETER_CONFIG).forEach(([key, config]) => {
      randomized[key as keyof ModelAttributes] = pickRandom(config.options);
    });
    setImageSettings(randomized);
    setUseRandomization(false);
    toast({ title: "Configuration Randomized", description: "New random style parameters applied." });
  };

  const handleSaveDefaults = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('imageForgeDefaults', JSON.stringify(imageSettings));
    toast({ 
      title: "Defaults Saved",
      description: "Your current settings have been saved for future sessions."
    });
  };

  const resetAllParametersToAppDefaults = () => {
    const defaults: Partial<ModelAttributes> = {};
    Object.entries(PARAMETER_CONFIG).forEach(([key, config]) => {
      defaults[key as keyof ModelAttributes] = config.defaultVal;
    });
    setImageSettings(defaults);
  };

  const handleClearDefaults = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('imageForgeDefaults');
    resetAllParametersToAppDefaults();
    toast({ 
      title: "Defaults Cleared",
      description: "Settings reset to application defaults."
    });
  };

  // Prompt Management
  const currentImageGenParams = useMemo(() => ({ 
    ...imageSettings, 
    settingsMode 
  }), [imageSettings, settingsMode]);
  
  const { currentPrompt, isPromptManuallyEdited } = usePromptManager({
    generationType: 'image',
    generationParams: currentImageGenParams,
  });

  // Sync prompt to store
  useEffect(() => {
    setActiveImagePrompt(currentPrompt);
  }, [currentPrompt, setActiveImagePrompt]);

  // UI Helper - Strictly Typed
  const renderSelect = ({ id, label, value, options }: { id: keyof ModelAttributes; label: string; value: string; options: OptionWithPromptSegment[] }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</Label>
      <Select value={value} onValueChange={(v) => handleParamChange(id, v)} disabled={isPending}>
        <SelectTrigger id={id} className="w-full h-12 md:h-10 text-sm border-muted/60 focus:border-primary/50 bg-background/50">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {options.map((option: OptionWithPromptSegment) => (
            <SelectItem key={option.value} value={option.value} className="text-sm py-3 md:py-2">
              {option.displayLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <Card variant="glass">
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

          {/* Aspect Ratio - Only for Nano Banana */}
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

          {/* Processing Pipeline Options */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-muted/30 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Image Processing Options</h3>
            </div>
            
            {isBackgroundRemovalServiceAvailable && (
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="bg-removal-switch" className="text-sm font-medium cursor-pointer">Remove Background</Label>
                <Switch id="bg-removal-switch" checked={backgroundRemovalEnabled} onCheckedChange={setBackgroundRemovalEnabled} disabled={isPending} />
              </div>
            )}
            
            {isUpscaleServiceAvailableState && (
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="upscale-switch" className="text-sm font-medium cursor-pointer">Upscale Image</Label>
                <Switch id="upscale-switch" checked={upscaleEnabled} onCheckedChange={setUpscaleEnabled} disabled={isPending} />
              </div>
            )}
            
            {isFaceDetailerServiceAvailable && (
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="face-detail-switch" className="text-sm font-medium cursor-pointer">Enhance Face Details</Label>
                <Switch id="face-detail-switch" checked={faceDetailEnabled} onCheckedChange={setFaceDetailEnabled} disabled={isPending} />
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col items-stretch !pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="customize" className="border-b-0">
              <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground justify-center py-2 group">
                <Settings2 className="mr-2 h-4 w-4 transition-transform group-data-[state=open]:rotate-90" /> Customize Settings
              </AccordionTrigger>
              <AccordionContent className="pt-6 space-y-6">
                
                {/* Settings Controls */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="randomization-switch" className="text-sm font-medium flex flex-col cursor-pointer">
                      Randomize Style
                      <span className="font-normal text-xs text-muted-foreground">
                        {useRandomization ? "ON: Different styles for each image." : "OFF: Use your exact manual settings."}
                      </span>
                    </Label>
                    <Switch id="randomization-switch" checked={useRandomization} onCheckedChange={setUseRandomization} />
                  </div>

                  <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className="pt-4 border-t border-border/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ai-prompt-switch" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                          <BrainCircuit className="h-4 w-4 text-primary"/> AI Prompt Enhancement
                        </Label>
                        <Switch id="ai-prompt-switch" checked={useAIPrompt} onCheckedChange={handleAIPromptChange} />
                      </div>

                      <div className="flex items-end justify-between gap-4">
                        <div className="flex-grow">
                          <div className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-background/50 p-1 text-muted-foreground">
                            <Button variant={settingsMode === 'basic' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSettingsModeChange('basic')} className="h-7 px-3 text-xs">Simple</Button>
                            <Button variant={settingsMode === 'advanced' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSettingsModeChange('advanced')} className="h-7 px-3 text-xs">Detailed</Button>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleRandomizeConfiguration} className="h-9 px-3" disabled={isPending || !preparedImageUrl}>
                          <Shuffle className="mr-2 h-4 w-4"/> Randomize
                        </Button>
                      </div>
                    </div>
                  </m.div>
                </div>

                {/* Parameters Accordion */}
                <Accordion type="multiple" defaultValue={['model-attributes']} className="w-full">
                  <AccordionItem value="model-attributes">
                    <AccordionTrigger><div className="flex items-center gap-2"><PersonStanding className="h-5 w-5 text-primary" /> Model Attributes</div></AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {renderSelect({ id: "gender", label: "Gender", value: imageSettings.gender, options: GENDER_OPTIONS })}
                        {renderSelect({ id: "bodyShapeAndSize", label: "Body Shape & Size", value: imageSettings.bodyShapeAndSize, options: BODY_SHAPE_AND_SIZE_OPTIONS })}
                        {renderSelect({ id: "ageRange", label: "Age Range", value: imageSettings.ageRange, options: AGE_RANGE_OPTIONS })}
                        {renderSelect({ id: "ethnicity", label: "Ethnicity", value: imageSettings.ethnicity, options: ETHNICITY_OPTIONS })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="art-direction">
                    <AccordionTrigger><div className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Art Direction & Styling</div></AccordionTrigger>
                    <AccordionContent className="pt-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {renderSelect({ id: "fashionStyle", label: "Fashion Style", value: imageSettings.fashionStyle, options: FASHION_STYLE_OPTIONS })}
                        {renderSelect({ id: "poseStyle", label: "Pose Style", value: imageSettings.poseStyle, options: POSE_STYLE_OPTIONS })}
                        {renderSelect({ id: "modelExpression", label: "Model Expression", value: imageSettings.modelExpression, options: MODEL_EXPRESSION_OPTIONS })}
                        {renderSelect({ id: "modelAngle", label: "Model Angle", value: imageSettings.modelAngle, options: MODEL_ANGLE_OPTIONS })}
                        {renderSelect({ id: "hairStyle", label: "Hair Style", value: imageSettings.hairStyle, options: HAIR_STYLE_OPTIONS })}
                        {renderSelect({ id: "background", label: "Background Setting", value: imageSettings.background, options: BACKGROUND_OPTIONS })}
                        {settingsMode === 'advanced' && renderSelect({ id: "timeOfDay", label: "Time of Day", value: imageSettings.timeOfDay, options: TIME_OF_DAY_OPTIONS })}
                        {settingsMode === 'advanced' && renderSelect({ id: "overallMood", label: "Overall Mood", value: imageSettings.overallMood, options: OVERALL_MOOD_OPTIONS })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {settingsMode === 'advanced' && (
                    <AccordionItem value="photography-technical">
                      <AccordionTrigger><div className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Photography & Technical</div></AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          {renderSelect({ id: "lightingType", label: "Lighting Type", value: imageSettings.lightingType, options: LIGHTING_TYPE_OPTIONS })}
                          {renderSelect({ id: "lightQuality", label: "Light Quality", value: imageSettings.lightQuality, options: LIGHT_QUALITY_OPTIONS })}
                          {renderSelect({ id: "lensEffect", label: "Lens Effect", value: imageSettings.lensEffect, options: LENS_EFFECT_OPTIONS })}
                          {renderSelect({ id: "depthOfField", label: "Depth of Field", value: imageSettings.depthOfField, options: DEPTH_OF_FIELD_OPTIONS })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                {/* Utility Actions */}
                <div className="bg-muted/20 rounded-lg p-4 border border-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground/70">Presets:</span>
                      <Button variant="outline" onClick={handleSaveDefaults} size="sm" disabled={!preparedImageUrl || isPending} className="h-9 px-3 border-muted/60 hover:border-muted-foreground/40">
                        <Save className="mr-2 h-4 w-4"/> Save Current
                      </Button>
                      <Button variant="ghost" onClick={handleClearDefaults} size="sm" disabled={!preparedImageUrl || isPending} className="h-9 px-3 text-muted-foreground hover:text-foreground">
                        <Trash2 className="mr-2 h-4 w-4"/> Reset
                      </Button>
                    </div>
                    
                    <Button variant={showPromptPreview ? "secondary" : "outline"} onClick={() => setShowPromptPreview(!showPromptPreview)} size="sm" disabled={!preparedImageUrl || isPending} className="h-9 px-3 border-muted/60 hover:border-muted-foreground/40">
                      <Code className="mr-2 h-4 w-4" /> {showPromptPreview ? "Hide" : "View"} Prompt
                    </Button>
                  </div>
                </div>

                {/* Prompt Preview */}
                {showPromptPreview && (
                  <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={MOTION_TRANSITIONS.tween.standard} className="overflow-hidden">
                    <div className="bg-muted/30 rounded-lg p-4 border border-muted/30 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><FileText className="h-4 w-4" /> Generated Prompt Preview</div>
                      <Textarea value={currentPrompt} readOnly placeholder="Your prompt will appear here..." className="min-h-[120px] resize-none bg-background/50 border-muted/40 text-sm leading-relaxed" />
                    </div>
                  </m.div>
                )}

              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardFooter>
      </Card>
    </>
  );
}