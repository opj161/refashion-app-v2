// src/components/image-parameters.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useFormStatus } from "react-dom";
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
    DEPTH_OF_FIELD_OPTIONS, OptionWithPromptSegment
} from '@/lib/prompt-builder';
import { motion, AnimatePresence } from 'motion/react';
import { MOTION_TRANSITIONS } from '@/lib/motion-constants';

// Interface for image generation parameters
interface ImageGenerationParams extends ModelAttributes {
  settingsMode: 'basic' | 'advanced';
}

// Constants
const NUM_IMAGES_TO_GENERATE = 3;

// SubmitButton component using useFormStatus for pending state
// Memoized to prevent unnecessary re-renders when parent state changes
const SubmitButton = React.memo(function SubmitButton({ preparedImageUrl, maxImages }: { preparedImageUrl: string | null; maxImages: number }) {
  const { pending } = useFormStatus();
  const { versions } = useImageStore();
  const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');
  
  const isDisabled = pending || !preparedImageUrl || isAnyVersionProcessing;
  
  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Button type="submit" disabled={isDisabled} className="w-full text-lg h-14">
        <AnimatePresence mode="wait" initial={false}>
          {pending ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center leading-none">
              <span className="flex items-center gap-2">
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                 Processing...
              </span>
              <span className="text-[10px] font-normal opacity-70 mt-1">Running in background</span>
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" /> Generate {maxImages} Image{maxImages > 1 ? 's' : ''}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
});

interface ImageParametersProps {
  isPending: boolean;
  maxImages?: number;
}

// Component only handles parameter selection and form UI
export default function ImageParameters({ isPending, maxImages = 3 }: ImageParametersProps) {
  const { toast } = useToast();
  
  // Get the active image from store
  const { versions, activeVersionId } = useImageStore();
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const preparedImageUrl = activeImage?.imageUrl || null;

  // Get settings from Zustand store - read and write directly to store
  const imageSettings = useGenerationSettingsStore(state => state.imageSettings);
  const settingsMode = useGenerationSettingsStore(state => state.settingsMode);
  const setImageSettings = useGenerationSettingsStore(state => state.setImageSettings);
  const setSettingsModeStore = useGenerationSettingsStore(state => state.setSettingsMode);
  
  // Get preparation options from Zustand store
  const backgroundRemovalEnabled = useGenerationSettingsStore(state => state.backgroundRemovalEnabled);
  const upscaleEnabled = useGenerationSettingsStore(state => state.upscaleEnabled);
  const faceDetailEnabled = useGenerationSettingsStore(state => state.faceDetailEnabled);
  const setBackgroundRemovalEnabled = useGenerationSettingsStore(state => state.setBackgroundRemovalEnabled);
  const setUpscaleEnabled = useGenerationSettingsStore(state => state.setUpscaleEnabled);
  const setFaceDetailEnabled = useGenerationSettingsStore(state => state.setFaceDetailEnabled);

  // --- REFACTORED STATE MANAGEMENT ---
  // Creative Mode is replaced by two independent states with new smart defaults.
  const [useRandomization, setUseRandomization] = useState<boolean>(true); // Default ON for variety
  const [useAIPrompt, setUseAIPrompt] = useState<boolean>(false); // Default OFF for speed

  useEffect(() => {
    // This effect, which coupled the old states, is now removed.
    // The two states are fully independent.
  }, []); // Empty dependency array, this effect no longer does anything meaningful.

  // State for prompt preview visibility
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);

  // Service availability state
  const [isFaceDetailerServiceAvailable, setIsFaceDetailerServiceAvailable] = useState<boolean>(false);
  const [isBackgroundRemovalServiceAvailable, setIsBackgroundRemovalServiceAvailable] = useState<boolean>(false);
  const [isUpscaleServiceAvailableState, setIsUpscaleServiceAvailableState] = useState<boolean>(false);

  const PARAMETER_CONFIG = React.useMemo(() => ({
    gender: { options: GENDER_OPTIONS, defaultVal: GENDER_OPTIONS.find(o => o.value === "female")?.value || GENDER_OPTIONS[0].value },
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

  // Load/Save settingsMode and user defaults from localStorage
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
          // Load directly into store
          setImageSettings(savedDefaults);
        } catch (e) { console.error("Failed to parse imageForgeDefaults", e); }
      }

      // Load prompt preview visibility preference
      const storedPromptPreview = window.localStorage.getItem('imageForgeShowPromptPreview');
      if (storedPromptPreview === 'true') {
        setShowPromptPreview(true);
      }
    }
  }, [setImageSettings, setSettingsModeStore]);

  // Save prompt preview state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('imageForgeShowPromptPreview', showPromptPreview.toString());
    }
  }, [showPromptPreview]);

  // Save settings mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('imageForgeSettingsMode', settingsMode);
    }
  }, [settingsMode]);

  // Centralized handler for parameter changes to automatically disable creative mode
  const handleParamChange = useCallback((key: keyof ModelAttributes, value: string) => {
    setImageSettings({ [key]: value });
    // Any manual parameter change by the user implies specific intent, so disable randomization.
    setUseRandomization(false);
  }, [setImageSettings]);

  // Special handler for settingsMode
  const handleSettingsModeChange = useCallback((value: 'basic' | 'advanced') => {
    // Write directly to Zustand store
    setSettingsModeStore(value);
    // This is a manual choice, so disable randomization.
    setUseRandomization(false);
  }, [setSettingsModeStore]);

  // Special handler for useAIPrompt
  const handleAIPromptChange = useCallback((value: boolean) => {
    setUseAIPrompt(value);
    // Toggling the prompt method is also a manual choice that disables randomization.
    setUseRandomization(false);
  }, []);

  // Consolidate all params for the hook - use values directly from store
  const currentImageGenParams = React.useMemo((): ImageGenerationParams => ({
    ...imageSettings,
    settingsMode,
  }), [imageSettings, settingsMode]);

  const {
    currentPrompt,
    isPromptManuallyEdited,
    handlePromptChange,
    resetPromptToAuto,
    isManualPromptOutOfSync,
  } = usePromptManager({
    generationType: 'image',
    generationParams: currentImageGenParams,
  });

  // Check Face Detailer service availability on mount
  useEffect(() => {
    isFaceDetailerAvailable().then(setIsFaceDetailerServiceAvailable);
    isBackgroundRemovalAvailable().then(setIsBackgroundRemovalServiceAvailable);
    isUpscaleServiceAvailable().then(setIsUpscaleServiceAvailableState);
  }, []);

  const handleRandomizeConfiguration = useCallback(() => {    
    // This button is only active in manual mode. It randomizes the UI fields directly.
    const pickRandom = (options: OptionWithPromptSegment[]) => options[Math.floor(Math.random() * options.length)].value;
    const randomized: Partial<ModelAttributes> = {};
    Object.entries(PARAMETER_CONFIG).forEach(([key, config]) => {
      randomized[key as keyof ModelAttributes] = pickRandom(config.options);
    });
    setImageSettings(randomized);
    // This is a one-time manual action, so ensure randomization state is off.
    setUseRandomization(false);
    toast({ title: "Manual Configuration Randomized!" });
  }, [PARAMETER_CONFIG, setImageSettings, toast]);

  const handleSaveDefaults = useCallback(() => {
    if (typeof window === 'undefined') return;
    // Save current store settings directly
    window.localStorage.setItem('imageForgeDefaults', JSON.stringify(imageSettings));
    toast({ 
      title: "Defaults Saved",
      description: "Your current settings have been saved for future sessions."
    });
  }, [imageSettings, toast]);

  const resetAllParametersToAppDefaults = useCallback(() => {
    // Reset each parameter to its default value in the store
    const defaults: Partial<ModelAttributes> = {};
    Object.entries(PARAMETER_CONFIG).forEach(([key, config]) => {
      defaults[key as keyof ModelAttributes] = config.defaultVal;
    });
    setImageSettings(defaults);
  }, [PARAMETER_CONFIG, setImageSettings]);

  const handleClearDefaults = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('imageForgeDefaults');
    resetAllParametersToAppDefaults();
    toast({ 
      title: "Defaults Cleared",
      description: "All saved settings have been reset to application defaults."
    });
  }, [resetAllParametersToAppDefaults, toast]);

  // Helper to render select components with enhanced styling
  const renderSelect = ({ id, label, value, options, disabled }: {
    id: keyof ModelAttributes; label: string; value: string; options: OptionWithPromptSegment[]; disabled?: boolean;
  }) => {

    return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</Label>
      <Select value={value} onValueChange={(v) => handleParamChange(id, v)} disabled={disabled}>
        <SelectTrigger id={id} className="w-full h-10 text-sm border-muted/60 focus:border-primary/50 bg-background/50">
          <SelectValue placeholder={options.find(o => o.value === value)?.displayLabel || `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-sm py-2">
              {option.displayLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    )
  };

  return (
    <>
      {/* Hidden inputs for all generation parameters */}
      <input type="hidden" name="imageDataUriOrUrl" value={preparedImageUrl || ''} />
      <input type="hidden" name="gender" value={imageSettings.gender} />
      <input type="hidden" name="bodyShapeAndSize" value={imageSettings.bodyShapeAndSize} />
      <input type="hidden" name="ageRange" value={imageSettings.ageRange} />
      <input type="hidden" name="ethnicity" value={imageSettings.ethnicity} />
      <input type="hidden" name="poseStyle" value={imageSettings.poseStyle} />
      <input type="hidden" name="background" value={imageSettings.background} />
      <input type="hidden" name="fashionStyle" value={imageSettings.fashionStyle} />
      <input type="hidden" name="hairStyle" value={imageSettings.hairStyle} />
      <input type="hidden" name="modelExpression" value={imageSettings.modelExpression} />
      <input type="hidden" name="lightingType" value={imageSettings.lightingType} />
      <input type="hidden" name="lightQuality" value={imageSettings.lightQuality} />
      <input type="hidden" name="modelAngle" value={imageSettings.modelAngle} />
      <input type="hidden" name="lensEffect" value={imageSettings.lensEffect} />
      <input type="hidden" name="depthOfField" value={imageSettings.depthOfField} />
      <input type="hidden" name="timeOfDay" value={imageSettings.timeOfDay} />
      <input type="hidden" name="overallMood" value={imageSettings.overallMood} />
      <input type="hidden" name="settingsMode" value={settingsMode} />
      <input type="hidden" name="useAIPrompt" value={String(useAIPrompt)} />
      <input type="hidden" name="useRandomization" value={String(useRandomization)} />
      <input type="hidden" name="removeBackground" value={String(backgroundRemovalEnabled)} />
      <input type="hidden" name="upscale" value={String(upscaleEnabled)} />
      <input type="hidden" name="enhanceFace" value={String(faceDetailEnabled)} />
      {isPromptManuallyEdited && <input type="hidden" name="manualPrompt" value={currentPrompt} />}
      
      {/* --- RESTRUCTURED CARD --- */}
      <Card variant="glass">
          <CardHeader>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Palette className="h-6 w-6 text-primary" />
                Image Generation Settings
              </CardTitle>
              <CardDescription>{useRandomization ? 'Using automatic style randomization for variety. Change any setting to switch to manual mode.' : 'Fine-tune every detail to match your vision.'}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <SubmitButton preparedImageUrl={preparedImageUrl} maxImages={maxImages} />
          
          {/* Image Processing Options - Non-Destructive Pipeline */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-muted/30 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Image Processing Options</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              These options will be applied automatically during generation
            </p>
            
            <div className="space-y-3">
              {/* Background Removal Toggle */}
              {isBackgroundRemovalServiceAvailable && (
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="bg-removal-switch" className="text-sm font-medium cursor-pointer">
                    Remove Background
                  </Label>
                  <Switch
                    id="bg-removal-switch"
                    checked={backgroundRemovalEnabled}
                    onCheckedChange={setBackgroundRemovalEnabled}
                    disabled={isPending}
                  />
                </div>
              )}
              
              {/* Upscale Toggle */}
              {isUpscaleServiceAvailableState && (
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="upscale-switch" className="text-sm font-medium cursor-pointer">
                    Upscale Image
                  </Label>
                  <Switch
                    id="upscale-switch"
                    checked={upscaleEnabled}
                    onCheckedChange={setUpscaleEnabled}
                    disabled={isPending}
                  />
                </div>
              )}
              
              {/* Face Detail Toggle */}
              {isFaceDetailerServiceAvailable && (
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="face-detail-switch" className="text-sm font-medium cursor-pointer">
                    Enhance Face Details
                  </Label>
                  <Switch
                    id="face-detail-switch"
                    checked={faceDetailEnabled}
                    onCheckedChange={setFaceDetailEnabled}
                    disabled={isPending}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch !pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="customize" className="border-b-0">
              <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground justify-center py-2 group">
                <Settings2 className="mr-2 h-4 w-4 transition-transform group-data-[state=open]:rotate-90"/>
                Customize Settings
              </AccordionTrigger>
              <AccordionContent className="pt-6 space-y-6">

                {/* === START REFACTORED SETTINGS UI === */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/20 space-y-4">
                  {/* Primary Toggle: Randomize Style */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="randomization-switch" className="text-sm font-medium flex flex-col cursor-pointer">
                      Randomize Style
                      <span className="font-normal text-xs text-muted-foreground">
                        {useRandomization ? "ON: Different styles for each image." : "OFF: Use your exact manual settings below."}
                      </span>
                    </Label>
                    <Switch
                      id="randomization-switch"
                      checked={useRandomization}
                      onCheckedChange={setUseRandomization}
                    />
                  </div>

                  {/* Manual Controls are now always available, not progressively disclosed */}
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 border-t border-border/20 space-y-4">
                          {/* AI Enhancement Toggle */}
                          <div className="flex items-center justify-between">
                            <Label htmlFor="ai-prompt-switch" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                              <BrainCircuit className="h-4 w-4 text-primary"/>
                              AI Prompt Enhancement
                            </Label>
                            <Switch
                              id="ai-prompt-switch"
                              checked={useAIPrompt}
                              onCheckedChange={handleAIPromptChange}
                            />
                          </div>

                          {/* Detail Level & Randomize Action */}
                          <div className="flex items-end justify-between gap-4">
                            <div className="flex-grow">
                              <div className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-background/50 p-1 text-muted-foreground">
                                <Button variant={settingsMode === 'basic' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSettingsModeChange('basic')} className="h-7 px-3 text-xs">Simple</Button>
                                <Button variant={settingsMode === 'advanced' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleSettingsModeChange('advanced')} className="h-7 px-3 text-xs">Detailed</Button>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRandomizeConfiguration}
                              className="h-9 px-3"
                              disabled={isPending || !preparedImageUrl}>
                              <Shuffle className="mr-2 h-4 w-4"/>
                              Randomize
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                </div>
                {/* === END REFACTORED SETTINGS UI === */}

                <Accordion type="multiple" defaultValue={['model-attributes']} className="w-full">
                  <AccordionItem value="model-attributes">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <PersonStanding className="h-5 w-5 text-primary" /> Model Attributes
                      </div>
                    </AccordionTrigger>
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
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                         <Palette className="h-5 w-5 text-primary" /> Art Direction & Styling
                      </div>
                    </AccordionTrigger>
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
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                           <Camera className="h-5 w-5 text-primary" /> Photography & Technical
                        </div>
                      </AccordionTrigger>
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

                {/* Enhanced Utility Actions */}
                <div className="bg-muted/20 rounded-lg p-4 border border-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Settings Management */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground/70">Presets:</span>
                      <Button 
                        variant="outline" 
                        onClick={handleSaveDefaults} 
                        size="sm" 
                        disabled={!preparedImageUrl || isPending}
                        className="h-9 px-3 border-muted/60 hover:border-muted-foreground/40"
                      >
                        <Save className="mr-2 h-4 w-4"/>
                        Save Current
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={handleClearDefaults} 
                        size="sm" 
                        disabled={!preparedImageUrl || isPending}
                        className="h-9 px-3 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="mr-2 h-4 w-4"/>
                        Reset to Default
                      </Button>
                    </div>
                    
                    {/* Prompt Preview Toggle */}
                    <Button 
                      variant={showPromptPreview ? "secondary" : "outline"} 
                      onClick={() => setShowPromptPreview(!showPromptPreview)} 
                      size="sm" 
                      disabled={!preparedImageUrl || isPending} 
                      className="h-9 px-3 border-muted/60 hover:border-muted-foreground/40"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      {showPromptPreview ? "Hide" : "View"} Prompt
                    </Button>
                  </div>
                </div>

                {/* Prompt Preview Panel */}
                {showPromptPreview && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={MOTION_TRANSITIONS.tween.standard}
                    className="overflow-hidden"
                  >
                    <div className="bg-muted/30 rounded-lg p-4 border border-muted/30 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Generated Prompt Preview
                      </div>
                      <Textarea
                        value={currentPrompt}
                        readOnly
                        placeholder="Your prompt will appear here once you configure your settings..."
                        className="min-h-[120px] resize-none bg-background/50 border-muted/40 text-sm leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}

              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardFooter>
      </Card>
    </>
  );
}
