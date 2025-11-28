'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { usePromptManager } from '@/hooks/usePromptManager';
import {
  Shuffle, BrainCircuit, Wand2, Sparkles, UserCheck, ChevronDown, RefreshCw
} from 'lucide-react';
import {
  GENDER_OPTIONS, ETHNICITY_OPTIONS, FASHION_STYLE_OPTIONS, BACKGROUND_OPTIONS,
  ASPECT_RATIOS, OptionWithPromptSegment, BODY_SHAPE_AND_SIZE_OPTIONS, AGE_RANGE_OPTIONS,
  POSE_STYLE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, MODEL_ANGLE_OPTIONS,
  LIGHTING_TYPE_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS
} from '@/lib/prompt-builder';
import { motion, AnimatePresence } from 'motion/react';

// ... imports for service availability checks (omitted for brevity, assume passed or re-imported)
import { isFaceDetailerAvailable, isUpscaleServiceAvailable } from "@/ai/actions/upscale-image.action";
import { isBackgroundRemovalAvailable } from "@/ai/actions/remove-background.action";
import { cn } from "@/lib/utils";

interface ImageParametersProps {
  isPending: boolean;
  maxImages?: number;
  userModel?: string;
  variant?: 'default' | 'sidebar';
}

export default function ImageParameters({ isPending, userModel, variant = 'default' }: ImageParametersProps) {
  // Store Access
  const imageSettings = useGenerationSettingsStore(state => state.imageSettings);
  const settingsMode = useGenerationSettingsStore(state => state.settingsMode);
  const setImageSettings = useGenerationSettingsStore(state => state.setImageSettings);
  const setSettingsModeStore = useGenerationSettingsStore(state => state.setSettingsMode);
  const { studioAspectRatio, setStudioAspectRatio } = useGenerationSettingsStore(state => ({ studioAspectRatio: state.studioAspectRatio, setStudioAspectRatio: state.setStudioAspectRatio }));

  // Pipeline Toggles
  const { backgroundRemovalEnabled, setBackgroundRemovalEnabled } = useGenerationSettingsStore(s => ({ backgroundRemovalEnabled: s.backgroundRemovalEnabled, setBackgroundRemovalEnabled: s.setBackgroundRemovalEnabled }));
  const { upscaleEnabled, setUpscaleEnabled } = useGenerationSettingsStore(s => ({ upscaleEnabled: s.upscaleEnabled, setUpscaleEnabled: s.setUpscaleEnabled }));
  const { faceDetailEnabled, setFaceDetailEnabled } = useGenerationSettingsStore(s => ({ faceDetailEnabled: s.faceDetailEnabled, setFaceDetailEnabled: s.setFaceDetailEnabled }));

  const isNanoBanana = userModel === 'fal_nano_banana_pro';

  // Local State for UI logic
  const [useRandomization, setUseRandomization] = useState<boolean>(true);
  const [useAIPrompt, setUseAIPrompt] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);

  // Feature Flags (loaded on mount)
  const [features, setFeatures] = useState({ bg: false, upscale: false, face: false });

  useEffect(() => {
    Promise.all([
      isBackgroundRemovalAvailable(),
      isUpscaleServiceAvailable(),
      isFaceDetailerAvailable()
    ]).then(([bg, upscale, face]) => setFeatures({ bg, upscale, face }));
  }, []);

  // Prompt Manager logic reused
  const currentImageGenParams = useMemo(() => ({ ...imageSettings, settingsMode }), [imageSettings, settingsMode]);
  const { currentPrompt, isPromptManuallyEdited, handlePromptChange } = usePromptManager({
    generationType: 'image',
    generationParams: currentImageGenParams,
  });

  // Helper to update params and disable randomization
  const handleParamChange = useCallback((key: any, value: string) => {
    setImageSettings({ [key]: value });
    setUseRandomization(false);
  }, [setImageSettings]);

  // Styling adjustment for Sidebar vs Default
  const containerClass = variant === 'sidebar' ? "space-y-4" : "space-y-6 p-4 border rounded-lg bg-card";
  // Increased from text-[10px] to text-xs (12px) for better readability
  const labelClass = "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2";

  // Updated Helper for Selects
  const renderSelect = (id: string, label: string, value: string, options: any[]) => (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => handleParamChange(id, v)} disabled={isPending}>
        <SelectTrigger className="h-8 bg-black/20 border-white/10 text-xs focus:ring-1 focus:ring-primary/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.displayLabel}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className={containerClass}>
      {/* Hidden Inputs for Form Submission */}
      <input type="hidden" name="gender" value={imageSettings.gender} />
      {/* ... other hidden inputs for all attributes ... */}
      <input type="hidden" name="background" value={imageSettings.background} />
      <input type="hidden" name="fashionStyle" value={imageSettings.fashionStyle} />
      <input type="hidden" name="useRandomization" value={String(useRandomization)} />
      <input type="hidden" name="useAIPrompt" value={String(useAIPrompt)} />
      <input type="hidden" name="removeBackground" value={String(backgroundRemovalEnabled)} />
      <input type="hidden" name="upscale" value={String(upscaleEnabled)} />
      <input type="hidden" name="enhanceFace" value={String(faceDetailEnabled)} />
      {isNanoBanana && <input type="hidden" name="aspectRatio" value={studioAspectRatio} />}
      {isPromptManuallyEdited && <input type="hidden" name="manualPrompt" value={currentPrompt} />}

      {/* 1. Automation */}
      <div className="space-y-2">
        <Label className={labelClass}>Automation</Label>

        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between p-2.5 rounded-md bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <span className="text-xs font-medium ml-1">Randomize Style</span>
            <Switch checked={useRandomization} onCheckedChange={setUseRandomization} className="scale-90" />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-md bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <span className="text-xs font-medium ml-1 flex items-center gap-2">
              AI Prompt <BrainCircuit className="h-3.5 w-3.5 text-primary" />
            </span>
            <Switch checked={useAIPrompt} onCheckedChange={(v) => { setUseAIPrompt(v); setUseRandomization(false); }} className="scale-90" />
          </div>
        </div>
      </div>

      {/* 2. Pipeline Options */}
      <div className="space-y-2">
        <Label className={labelClass}>Pipeline</Label>
        <div className="grid grid-cols-3 gap-2">
          {features.bg && (
            <ToggleOption
              icon={Wand2}
              active={backgroundRemovalEnabled}
              onClick={() => setBackgroundRemovalEnabled(!backgroundRemovalEnabled)}
              label="Remove BG"
            />
          )}
          {features.upscale && (
            <ToggleOption
              icon={Sparkles}
              active={upscaleEnabled}
              onClick={() => setUpscaleEnabled(!upscaleEnabled)}
              label="Upscale"
            />
          )}
          {features.face && (
            <ToggleOption
              icon={UserCheck}
              active={faceDetailEnabled}
              onClick={() => setFaceDetailEnabled(!faceDetailEnabled)}
              label="Face Fix"
            />
          )}
        </div>
      </div>

      {/* 3. Attributes */}
      <Accordion type="single" collapsible className="w-full border-t border-white/5 pt-2">
        <AccordionItem value="style" className="border-b-0">
          <AccordionTrigger className="py-2 text-xs font-semibold hover:no-underline hover:bg-white/5 px-2 rounded-sm text-muted-foreground">
            Advanced Configuration
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-3 px-1">

            {/* Aspect Ratio */}
            {isNanoBanana && (
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Aspect Ratio</Label>
                <Select value={studioAspectRatio} onValueChange={setStudioAspectRatio}>
                  <SelectTrigger className="h-8 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Compact Selects */}
            {renderSelect("gender", "Gender", imageSettings.gender, GENDER_OPTIONS)}
            {renderSelect("fashionStyle", "Style", imageSettings.fashionStyle, FASHION_STYLE_OPTIONS)}
            {renderSelect("background", "Setting", imageSettings.background, BACKGROUND_OPTIONS)}
            {renderSelect("poseStyle", "Pose", imageSettings.poseStyle, POSE_STYLE_OPTIONS)}

            {/* Prompt Preview */}
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPromptPreview(!showPromptPreview)}
                className="w-full h-7 text-[10px] border border-dashed border-white/10 hover:bg-white/5 text-muted-foreground"
              >
                {showPromptPreview ? "Hide Prompt" : "View/Edit Raw Prompt"}
              </Button>
              {showPromptPreview && (
                <Textarea
                  value={currentPrompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  className="mt-2 text-[10px] font-mono min-h-[100px] bg-black/30 border-white/10 leading-relaxed"
                  placeholder="Prompt..."
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// Helper with slightly better sizing
function ToggleOption({ icon: Icon, active, onClick, label }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-md border transition-all duration-200",
        active
          ? "bg-primary/15 border-primary/50 text-primary shadow-[0_0_10px_rgba(45,212,191,0.1)]"
          : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
