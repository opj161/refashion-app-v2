// src/components/image-parameters.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, PersonStanding, Settings2, Sparkles, Wand2, FileText, Shuffle, Save, Trash2, Eye, RefreshCw, Download, Video as VideoIcon, UserCheck } from 'lucide-react';
import { generateImageEdit, type GenerateImageEditInput, type GenerateMultipleImagesOutput } from "@/ai/flows/generate-image-edit";
import { upscaleImageAction } from "@/ai/actions/upscale-image";
import { addHistoryItem, updateHistoryItem, getHistoryItemById } from "@/actions/historyActions";
import { useAuth } from "@/contexts/AuthContext";
import type { ModelAttributes, HistoryItem } from "@/lib/types";
import { getDisplayableImageUrl } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from 'next/navigation';
import { usePromptManager } from '@/hooks/usePromptManager';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import {
    FASHION_STYLE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS,
    BODY_TYPE_OPTIONS, BODY_SIZE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS,
    POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS,
    LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, CAMERA_ANGLE_OPTIONS, LENS_EFFECT_OPTIONS,
    DEPTH_OF_FIELD_OPTIONS, FABRIC_RENDERING_OPTIONS, OptionWithPromptSegment
} from '@/lib/prompt-builder';

// Interface for image generation parameters
interface ImageGenerationParams extends ModelAttributes {
  settingsMode: 'basic' | 'advanced';
}

// Constants
const NUM_IMAGES_TO_GENERATE = 3;

interface ImageParametersProps {
  preparedImageUrl: string | null;
}

export default function ImageParameters({ preparedImageUrl }: ImageParametersProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for parameters
  const [gender, setGender] = useState<string>(GENDER_OPTIONS.find(o => o.value === "female")?.value || GENDER_OPTIONS[0].value);
  const [bodyType, setBodyType] = useState<string>(BODY_TYPE_OPTIONS[0].value);
  const [bodySize, setBodySize] = useState<string>(BODY_SIZE_OPTIONS[0].value);
  const [ageRange, setAgeRange] = useState<string>(AGE_RANGE_OPTIONS[0].value);
  const [ethnicity, setEthnicity] = useState<string>(ETHNICITY_OPTIONS[0].value);
  const [poseStyle, setPoseStyle] = useState<string>(POSE_STYLE_OPTIONS.find(o => o.value === "natural_relaxed_pose")?.value || POSE_STYLE_OPTIONS[0].value);
  const [background, setBackground] = useState<string>(BACKGROUND_OPTIONS.find(o => o.value === "outdoor_nature_elements")?.value || BACKGROUND_OPTIONS[0].value);
  const [fashionStyle, setFashionStyle] = useState<string>(FASHION_STYLE_OPTIONS[0].value);
  const [hairStyle, setHairStyle] = useState<string>(HAIR_STYLE_OPTIONS[0].value);
  const [modelExpression, setModelExpression] = useState<string>(MODEL_EXPRESSION_OPTIONS[0].value);
  const [lightingType, setLightingType] = useState<string>(LIGHTING_TYPE_OPTIONS[0].value);
  const [lightQuality, setLightQuality] = useState<string>(LIGHT_QUALITY_OPTIONS[0].value);
  const [cameraAngle, setCameraAngle] = useState<string>(CAMERA_ANGLE_OPTIONS[0].value);
  const [lensEffect, setLensEffect] = useState<string>(LENS_EFFECT_OPTIONS[0].value);
  const [depthOfField, setDepthOfField] = useState<string>(DEPTH_OF_FIELD_OPTIONS[0].value);
  const [timeOfDay, setTimeOfDay] = useState<string>(TIME_OF_DAY_OPTIONS[0].value);
  const [overallMood, setOverallMood] = useState<string>(OVERALL_MOOD_OPTIONS[0].value);
  const [fabricRendering, setFabricRendering] = useState<string>(FABRIC_RENDERING_OPTIONS[0].value);

  const [settingsMode, setSettingsMode] = useState<'basic' | 'advanced'>('basic');
  const [showAdvancedSettingsActiveMessage, setShowAdvancedSettingsActiveMessage] = useState<boolean>(false);

  // State for generation results
  const [outputImageUrls, setOutputImageUrls] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));
  const [originalOutputImageUrls, setOriginalOutputImageUrls] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));
  const [generationErrors, setGenerationErrors] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReRollingSlot, setIsReRollingSlot] = useState<number | null>(null);
  const [isUpscalingSlot, setIsUpscalingSlot] = useState<number | null>(null);
  const [comparingSlotIndex, setComparingSlotIndex] = useState<number | null>(null);
  const [activeHistoryItemId, setActiveHistoryItemId] = useState<string | null>(null);

  const commonFormDisabled = !preparedImageUrl || isLoading;

  // Initial default values for all configurable parameters
  const initialAppDefaults = React.useRef({
    gender: GENDER_OPTIONS.find(o => o.value === "female")?.value || GENDER_OPTIONS[0].value,
    bodyType: BODY_TYPE_OPTIONS[0].value,
    bodySize: BODY_SIZE_OPTIONS[0].value,
    ageRange: AGE_RANGE_OPTIONS[0].value,
    ethnicity: ETHNICITY_OPTIONS[0].value,
    poseStyle: POSE_STYLE_OPTIONS.find(o => o.value === "natural_relaxed_pose")?.value || POSE_STYLE_OPTIONS[0].value,
    background: BACKGROUND_OPTIONS.find(o => o.value === "outdoor_nature_elements")?.value || BACKGROUND_OPTIONS[0].value,
    fashionStyle: FASHION_STYLE_OPTIONS[0].value,
    hairStyle: HAIR_STYLE_OPTIONS[0].value,
    modelExpression: MODEL_EXPRESSION_OPTIONS[0].value,
    lightingType: LIGHTING_TYPE_OPTIONS[0].value,
    lightQuality: LIGHT_QUALITY_OPTIONS[0].value,
    cameraAngle: CAMERA_ANGLE_OPTIONS[0].value,
    lensEffect: LENS_EFFECT_OPTIONS[0].value,
    depthOfField: DEPTH_OF_FIELD_OPTIONS[0].value,
    timeOfDay: TIME_OF_DAY_OPTIONS[0].value,
    overallMood: OVERALL_MOOD_OPTIONS[0].value,
    fabricRendering: FABRIC_RENDERING_OPTIONS[0].value,
  }).current;

  const PARAMETER_CONFIG = React.useMemo(() => ({
    gender: { setter: setGender, options: GENDER_OPTIONS, defaultVal: initialAppDefaults.gender },
    bodyType: { setter: setBodyType, options: BODY_TYPE_OPTIONS, defaultVal: initialAppDefaults.bodyType },
    bodySize: { setter: setBodySize, options: BODY_SIZE_OPTIONS, defaultVal: initialAppDefaults.bodySize },
    ageRange: { setter: setAgeRange, options: AGE_RANGE_OPTIONS, defaultVal: initialAppDefaults.ageRange },
    ethnicity: { setter: setEthnicity, options: ETHNICITY_OPTIONS, defaultVal: initialAppDefaults.ethnicity },
    poseStyle: { setter: setPoseStyle, options: POSE_STYLE_OPTIONS, defaultVal: initialAppDefaults.poseStyle },
    background: { setter: setBackground, options: BACKGROUND_OPTIONS, defaultVal: initialAppDefaults.background },
    fashionStyle: { setter: setFashionStyle, options: FASHION_STYLE_OPTIONS, defaultVal: initialAppDefaults.fashionStyle },
    hairStyle: { setter: setHairStyle, options: HAIR_STYLE_OPTIONS, defaultVal: initialAppDefaults.hairStyle },
    modelExpression: { setter: setModelExpression, options: MODEL_EXPRESSION_OPTIONS, defaultVal: initialAppDefaults.modelExpression },
    lightingType: { setter: setLightingType, options: LIGHTING_TYPE_OPTIONS, defaultVal: initialAppDefaults.lightingType },
    lightQuality: { setter: setLightQuality, options: LIGHT_QUALITY_OPTIONS, defaultVal: initialAppDefaults.lightQuality },
    cameraAngle: { setter: setCameraAngle, options: CAMERA_ANGLE_OPTIONS, defaultVal: initialAppDefaults.cameraAngle },
    lensEffect: { setter: setLensEffect, options: LENS_EFFECT_OPTIONS, defaultVal: initialAppDefaults.lensEffect },
    depthOfField: { setter: setDepthOfField, options: DEPTH_OF_FIELD_OPTIONS, defaultVal: initialAppDefaults.depthOfField },
    timeOfDay: { setter: setTimeOfDay, options: TIME_OF_DAY_OPTIONS, defaultVal: initialAppDefaults.timeOfDay },
    overallMood: { setter: setOverallMood, options: OVERALL_MOOD_OPTIONS, defaultVal: initialAppDefaults.overallMood },
    fabricRendering: { setter: setFabricRendering, options: FABRIC_RENDERING_OPTIONS, defaultVal: initialAppDefaults.fabricRendering },
  }), [initialAppDefaults]);

  // Load/Save settingsMode and user defaults from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMode = window.localStorage.getItem('imageForgeSettingsMode');
      if (storedMode === 'basic' || storedMode === 'advanced') {
        setSettingsMode(storedMode);
      }

      const savedDefaultsString = window.localStorage.getItem('imageForgeDefaults');
      if (savedDefaultsString) {
        try {
          const savedDefaults = JSON.parse(savedDefaultsString) as ModelAttributes;
          Object.entries(savedDefaults).forEach(([key, value]) => {
            const config = PARAMETER_CONFIG[key as keyof ModelAttributes];
            if (config && config.options.some(opt => opt.value === value)) {
              config.setter(value as string);
            }
          });
        } catch (e) { console.error("Failed to parse imageForgeDefaults", e); }
      }
    }
  }, [PARAMETER_CONFIG]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('imageForgeSettingsMode', settingsMode);
    }
    if (settingsMode === 'basic') {
      const advancedParams: (keyof ModelAttributes)[] = [
        "fashionStyle", "hairStyle", "modelExpression", "lightingType",
        "lightQuality", "cameraAngle", "lensEffect", "depthOfField",
        "timeOfDay", "overallMood", "fabricRendering"
      ];
      const advancedSettingsAreActive = advancedParams.some(param => {
        const stateValue = { 
          gender, bodyType, bodySize, ageRange, ethnicity, poseStyle, background,
          fashionStyle, hairStyle, modelExpression, lightingType, lightQuality, 
          cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering 
        }[param];
        return stateValue !== initialAppDefaults[param];
      });
      setShowAdvancedSettingsActiveMessage(advancedSettingsAreActive);
    } else {
      setShowAdvancedSettingsActiveMessage(false);
    }
  }, [settingsMode, initialAppDefaults, gender, bodyType, bodySize, ageRange, ethnicity, poseStyle, background, fashionStyle, hairStyle, modelExpression, lightingType, lightQuality, cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering]);

  // Consolidate all params for the hook
  const currentImageGenParams = React.useMemo((): ImageGenerationParams => ({
    gender, bodyType, bodySize, ageRange, ethnicity, poseStyle, background,
    fashionStyle, hairStyle, modelExpression, lightingType, lightQuality,
    cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering,
    settingsMode,
  }), [
    gender, bodyType, bodySize, ageRange, ethnicity, poseStyle, background,
    fashionStyle, hairStyle, modelExpression, lightingType, lightQuality,
    cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering,
    settingsMode
  ]);

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

  const handleSaveDefaults = () => {
    if (typeof window === 'undefined') return;
    const currentSettingsToSave: ModelAttributes = {
      gender, bodyType, bodySize, ageRange, ethnicity, poseStyle, background,
      fashionStyle, hairStyle, modelExpression, lightingType, lightQuality,
      cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering,
    };
    window.localStorage.setItem('imageForgeDefaults', JSON.stringify(currentSettingsToSave));
    toast({ title: "Defaults Saved" });
  };

  const resetAllParametersToAppDefaults = useCallback(() => {
    Object.values(PARAMETER_CONFIG).forEach(config => config.setter(config.defaultVal));
  }, [PARAMETER_CONFIG]);

  const handleClearDefaults = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('imageForgeDefaults');
    resetAllParametersToAppDefaults();
    toast({ title: "Defaults Cleared" });
  };

  const handleRandomizeConfiguration = () => {
    const pickRandom = (options: OptionWithPromptSegment[]) => options[Math.floor(Math.random() * options.length)].value;
    Object.values(PARAMETER_CONFIG).forEach(config => {
        if (settingsMode === 'advanced' ||
            ['gender', 'bodyType', 'bodySize', 'ageRange', 'ethnicity', 'poseStyle', 'background'].includes(Object.keys(PARAMETER_CONFIG).find(k => PARAMETER_CONFIG[k as keyof ModelAttributes] === config) || "")) {
            config.setter(pickRandom(config.options));
        }
    });
    toast({ title: "Configuration Randomized!" });
  };

  const handleSubmit = async () => {
    if (!preparedImageUrl) {
      toast({ title: "Image Not Prepared", description: "Please prepare an image in the previous step.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setOutputImageUrls(Array(NUM_IMAGES_TO_GENERATE).fill(null));
    setOriginalOutputImageUrls(Array(NUM_IMAGES_TO_GENERATE).fill(null));
    setGenerationErrors(Array(NUM_IMAGES_TO_GENERATE).fill(null));

    const finalPromptToUse = currentPrompt;
    const currentAttributes: ModelAttributes = {
      gender, bodyType, bodySize, ageRange, ethnicity, poseStyle, background,
      fashionStyle, hairStyle, modelExpression, lightingType, lightQuality,
      cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering
    };

    try {
      const input: GenerateImageEditInput = { prompt: finalPromptToUse, imageDataUriOrUrl: preparedImageUrl };
      const result: GenerateMultipleImagesOutput = await generateImageEdit(input);
      setOutputImageUrls(result.editedImageUrls);
      setGenerationErrors(result.errors || Array(NUM_IMAGES_TO_GENERATE).fill(null));

      if (result.errors && result.errors.some(e => e !== null)) {
        toast({ title: "Generation Issues", description: `${result.errors.filter(e => e !== null).length} image(s) failed.`, variant: "destructive" });
      } else {
        toast({ title: "Images Generated!", description: "Your edited images are ready." });
      }

      // Add to history
      if (currentUser && preparedImageUrl) {
        await addHistoryItem(currentAttributes, finalPromptToUse, preparedImageUrl, result.editedImageUrls, settingsMode);
        setActiveHistoryItemId(crypto.randomUUID());
      }

    } catch (error) {
      console.error("Error generating images:", error);
      const errorMessage = (error as Error).message || "Unexpected error during image generation.";
      setGenerationErrors(Array(NUM_IMAGES_TO_GENERATE).fill(errorMessage));
      toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReRollImage = async (slotIndex: number) => {
    if (!preparedImageUrl) {
      toast({ title: "Image Not Prepared", variant: "destructive" });
      return;
    }
    setIsReRollingSlot(slotIndex);
    
    try {
        const inputForReroll: GenerateImageEditInput = { prompt: currentPrompt, imageDataUriOrUrl: preparedImageUrl };
        const result: GenerateMultipleImagesOutput = await generateImageEdit(inputForReroll);

        const updatedUrls = [...outputImageUrls];
        const newImageUrl = result.editedImageUrls[0];
        updatedUrls[slotIndex] = newImageUrl;
        setOutputImageUrls(updatedUrls);

        const updatedErrors = [...generationErrors];
        const newError = result.errors?.[0] || null;
        updatedErrors[slotIndex] = newError;
        setGenerationErrors(updatedErrors);

        if (activeHistoryItemId && newImageUrl) {
            await updateHistoryItem(activeHistoryItemId, { 
              editedImageUrls: updatedUrls,
              originalImageUrls: originalOutputImageUrls 
            });
        }
        toast({title: `Image ${slotIndex + 1} Re-rolled`});
    } catch (error) {
        toast({title: `Re-roll Failed (Slot ${slotIndex+1})`, description: (error as Error).message, variant: "destructive"});
    } finally {
        setIsReRollingSlot(null);
    }
  };

  const handleUpscale = async (slotIndex: number) => {
    const imageUrl = outputImageUrls[slotIndex];
    if (!imageUrl) {
      toast({ title: "Image Not Available", variant: "destructive" });
      return;
    }
    setIsUpscalingSlot(slotIndex);
    try {
      // Store the current URL as the "original" before enhancing
      const currentOriginals = [...originalOutputImageUrls];
      currentOriginals[slotIndex] = imageUrl;
      setOriginalOutputImageUrls(currentOriginals);

      // Convert local URL to data URI for the action
      const absoluteUrl = `${window.location.origin}${imageUrl}`;
      const response = await fetch(absoluteUrl);
      if (!response.ok) throw new Error("Failed to fetch image for processing.");
      const blob = await response.blob();
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // We pass undefined for hash and filename as this is a generated image, not the original upload
      const { savedPath } = await upscaleImageAction(dataUri, undefined, `generated_image_${slotIndex}.png`);

      const updatedUrls = [...outputImageUrls];
      updatedUrls[slotIndex] = savedPath;
      setOutputImageUrls(updatedUrls);

      if (activeHistoryItemId) {
        await updateHistoryItem(activeHistoryItemId, { 
          editedImageUrls: updatedUrls,
          originalImageUrls: originalOutputImageUrls 
        });
      }
      toast({ title: `Image ${slotIndex + 1} Upscaled Successfully` });
    } catch (error) {
      console.error(`Error upscaling image ${slotIndex}:`, error);
      const errorMessage = (error as Error).message || "Unexpected error during upscaling.";
      toast({ title: "Upscaling Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUpscalingSlot(null);
    }
  };

  const handleDownloadOutput = (imageUrl: string | null, index: number) => {
    if (!imageUrl) return;
    const downloadUrl = getDisplayableImageUrl(imageUrl);
    if (!downloadUrl) return;

    fetch(downloadUrl)
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `RefashionAI_image_${index + 1}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }).catch(err => {
        toast({ title: "Download Error", variant: "destructive" });
    });
  };

  const handleSendToVideoPage = (imageUrl: string | null) => {
    if (!imageUrl) return;
    const params = new URLSearchParams();
    // The 'create' page expects 'sourceImageUrl' to load an image
    // and 'defaultTab' to select the correct tab.
    params.set('sourceImageUrl', imageUrl);
    params.set('defaultTab', 'video');
    router.push(`/create?${params.toString()}`);
  };

  // Effect to load configuration from historyItemId in URL
  useEffect(() => {
    const historyItemId = searchParams.get('historyItemId');
    if (historyItemId && currentUser && !activeHistoryItemId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const { success, item, error } = await getHistoryItemById(historyItemId);
          if (success && item) {
            // Set all parameters from the loaded history item
            if (item.attributes) {
              Object.entries(item.attributes).forEach(([key, value]) => {
                const config = PARAMETER_CONFIG[key as keyof ModelAttributes];
                if (config && typeof value === 'string') {
                  config.setter(value);
                }
              });
            }
            if (item.settingsMode) {
              setSettingsMode(item.settingsMode);
            }
            if (item.constructedPrompt) {
              handlePromptChange(item.constructedPrompt);
            }
            if (item.editedImageUrls) {
              setOutputImageUrls(item.editedImageUrls);
            }
            if (item.originalImageUrls) {
              setOriginalOutputImageUrls(item.originalImageUrls);
            }
            setActiveHistoryItemId(item.id);
            toast({ title: "History Loaded", description: "Configuration and images have been restored." });
          } else {
            toast({ title: "Failed to Load History", description: error || "Unknown error", variant: "destructive" });
            // Optionally, clear the invalid historyItemId from URL
            router.replace('/create', { scroll: false });
          }
        } catch (error) {
          console.error('Error loading history:', error);
          toast({ title: "Failed to Load History", description: "An error occurred while loading history.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
    // Intentionally run only when historyItemId is detected on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentUser, activeHistoryItemId]);

  // Helper to render select components
  const renderSelect = ({ id, label, value, onChange, options, disabled }: {
    id: string; label: string; value: string; onChange: (value: string) => void; options: OptionWithPromptSegment[]; disabled?: boolean;
  }) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full text-sm">
          <SelectValue placeholder={options.find(o => o.value === value)?.displayLabel || `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (<SelectItem key={option.value} value={option.value} className="text-sm">{option.displayLabel}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Configure Image Parameters
            </CardTitle>
            <CardDescription>Define the model, style, and scene for your fashion images.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <Label htmlFor="settings-mode-switch" className="text-sm font-medium whitespace-nowrap">
                    {settingsMode === 'basic' ? 'Basic' : 'Advanced'}
                </Label>
                <Switch
                    id="settings-mode-switch"
                    checked={settingsMode === 'advanced'}
                    onCheckedChange={(checked: boolean) => setSettingsMode(checked ? 'advanced' : 'basic')}
                    disabled={commonFormDisabled}
                    aria-label="Toggle settings mode"
                />
            </div>
            <Button variant="outline" size="icon" onClick={handleRandomizeConfiguration} disabled={commonFormDisabled} aria-label="Randomize Configuration" title="Randomize Settings">
                <Shuffle className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preparedImageUrl && (
            <div className="mb-4 p-3 border rounded-md bg-amber-50 border-amber-200 text-amber-700">
                <p className="text-sm font-medium">Please prepare an image in the previous step to enable generation.</p>
            </div>
          )}

          {/* Parameter Controls */}
          {settingsMode === 'advanced' ? (
            <>
              {/* Advanced Settings Accordions */}
              <Accordion type="multiple" defaultValue={["style-concept", "model-attributes"]} className="w-full">
                <AccordionItem value="style-concept">
                  <AccordionTrigger className="text-lg"><Sparkles className="h-5 w-5 mr-2 text-primary" />Overall Style & Concept</AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                    {renderSelect({ id: "fashionStyle", label: "Photographic Style", value: fashionStyle, onChange: setFashionStyle, options: FASHION_STYLE_OPTIONS, disabled: commonFormDisabled })}
                    {renderSelect({ id: "overallMood", label: "Desired Mood & Atmosphere", value: overallMood, onChange: setOverallMood, options: OVERALL_MOOD_OPTIONS, disabled: commonFormDisabled })}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="model-attributes">
                  <AccordionTrigger className="text-lg"><PersonStanding className="h-5 w-5 mr-2 text-primary" />Model Attributes</AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4 pt-1" disabled={commonFormDisabled}>
                        {GENDER_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                            <Label htmlFor={`gender-${option.value}`} className="text-sm font-medium">{option.displayLabel}</Label>
                          </div>
                        ))}
                    </RadioGroup>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {renderSelect({ id: "ageRange", label: "Age Range", value: ageRange, onChange: setAgeRange, options: AGE_RANGE_OPTIONS, disabled: commonFormDisabled })}
                        {renderSelect({ id: "ethnicity", label: "Ethnicity", value: ethnicity, onChange: setEthnicity, options: ETHNICITY_OPTIONS, disabled: commonFormDisabled })}
                        {renderSelect({ id: "bodyType", label: "Body Type", value: bodyType, onChange: setBodyType, options: BODY_TYPE_OPTIONS, disabled: commonFormDisabled })}
                        {renderSelect({ id: "bodySize", label: "Body Frame/Stature", value: bodySize, onChange: setBodySize, options: BODY_SIZE_OPTIONS, disabled: commonFormDisabled })}
                        {renderSelect({ id: "hairStyle", label: "Hair Style", value: hairStyle, onChange: setHairStyle, options: HAIR_STYLE_OPTIONS, disabled: commonFormDisabled })}
                        {renderSelect({ id: "modelExpression", label: "Model Expression", value: modelExpression, onChange: setModelExpression, options: MODEL_EXPRESSION_OPTIONS, disabled: commonFormDisabled })}
                        {renderSelect({ id: "poseStyle", label: "Pose Style", value: poseStyle, onChange: setPoseStyle, options: POSE_STYLE_OPTIONS, disabled: commonFormDisabled })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="scene-photographic">
                  <AccordionTrigger className="text-lg"><Settings2 className="h-5 w-5 mr-2 text-primary" />Scene & Photographic Details</AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                    {renderSelect({ id: "background", label: "Background Setting", value: background, onChange: setBackground, options: BACKGROUND_OPTIONS, disabled: commonFormDisabled })}
                    {renderSelect({ id: "timeOfDay", label: "Time of Day", value: timeOfDay, onChange:setTimeOfDay, options: TIME_OF_DAY_OPTIONS, disabled: commonFormDisabled })}
                    {renderSelect({ id: "lightingType", label: "Lighting Type/Setup", value: lightingType, onChange: setLightingType, options: LIGHTING_TYPE_OPTIONS, disabled: commonFormDisabled })}
                    {renderSelect({ id: "lightQuality", label: "Light Quality", value: lightQuality, onChange: setLightQuality, options: LIGHT_QUALITY_OPTIONS, disabled: commonFormDisabled })}
                    {renderSelect({ id: "cameraAngle", label: "Camera Angle", value: cameraAngle, onChange: setCameraAngle, options: CAMERA_ANGLE_OPTIONS, disabled: commonFormDisabled })}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          ) : (
            /* Basic Mode Settings */
            <div className="space-y-4">
              {showAdvancedSettingsActiveMessage && (
                <div className="p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                  <p><strong>Note:</strong> Some advanced settings are active. Switch to Advanced mode to review or modify them.</p>
                </div>
              )}
              <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4 pt-1" disabled={commonFormDisabled}>
                {GENDER_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                    <Label htmlFor={`gender-${option.value}`} className="text-sm font-medium">{option.displayLabel}</Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {renderSelect({ id: "bodyType", label: "Body Type", value: bodyType, onChange: setBodyType, options: BODY_TYPE_OPTIONS, disabled: commonFormDisabled })}
                {renderSelect({ id: "bodySize", label: "Body Frame/Stature", value: bodySize, onChange: setBodySize, options: BODY_SIZE_OPTIONS, disabled: commonFormDisabled })}
                {renderSelect({ id: "ageRange", label: "Age Range", value: ageRange, onChange: setAgeRange, options: AGE_RANGE_OPTIONS, disabled: commonFormDisabled })}
                {renderSelect({ id: "ethnicity", label: "Ethnicity", value: ethnicity, onChange: setEthnicity, options: ETHNICITY_OPTIONS, disabled: commonFormDisabled })}
              </div>
            </div>
          )}
           {/* Save/Clear Defaults Buttons */}
           <div className="flex gap-2 pt-4 border-t mt-4">
                <Button variant="outline" onClick={handleSaveDefaults} size="sm" disabled={commonFormDisabled}><Save className="mr-2 h-4 w-4"/>Save Defaults</Button>
                <Button variant="ghost" onClick={handleClearDefaults} size="sm" disabled={commonFormDisabled}><Trash2 className="mr-2 h-4 w-4"/>Clear Defaults</Button>
            </div>

          {/* Prompt Textarea */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label htmlFor="imagePromptTextarea" className="text-sm font-medium">Full Prompt</Label>
              {isManualPromptOutOfSync() && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600">Prompt manually edited</span>
                  <Button variant="link" size="sm" onClick={resetPromptToAuto} className="text-xs text-amber-600 hover:text-amber-700 p-0 h-auto">
                    Reset to Auto
                  </Button>
                </div>
              )}
            </div>
            <Textarea
              id="imagePromptTextarea"
              value={currentPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              rows={5}
              className="text-xs font-mono"
              placeholder="Prompt will be generated here based on your selections, or you can type your own."
              disabled={commonFormDisabled}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch space-y-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !preparedImageUrl || isReRollingSlot !== null || !currentPrompt.trim()}
            className="w-full text-lg"
            size="lg"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Images...</>
            ) : (
              <><Wand2 className="mr-2 h-5 w-5" /> Generate {NUM_IMAGES_TO_GENERATE} Images</>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Generated Images Display */}
      {(outputImageUrls.some(uri => uri !== null) || generationErrors.some(err => err !== null) || isLoading) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Generated Images
            </CardTitle>
            <CardDescription>Your AI-generated fashion model images.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !outputImageUrls.some(uri => uri !== null) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: NUM_IMAGES_TO_GENERATE }).map((_, index) => (
                  <div key={index} className="aspect-[3/4] bg-muted/50 rounded-md border animate-pulse flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {outputImageUrls.map((uri, index) => {
                const error = generationErrors[index];
                const isCurrentlyReRollingThisSlot = isReRollingSlot === index;
                const isCurrentlyUpscalingThisSlot = isUpscalingSlot === index;
                const isProcessingThisSlot = isCurrentlyReRollingThisSlot || isCurrentlyUpscalingThisSlot;
                const originalUri = originalOutputImageUrls[index];
                const displayUri = comparingSlotIndex === index ? originalUri : uri;
                return (
                  <div key={index} className="relative group">
                    {uri ? (
                      <>
                        <div className="aspect-[3/4] overflow-hidden rounded-md border relative">
                          <Image src={getDisplayableImageUrl(displayUri) || ''} alt={`Generated image ${index + 1}`} width={300} height={400} className="w-full h-full object-cover" />
                          {isCurrentlyUpscalingThisSlot && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-white text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p className="text-sm">Upscaling...</p>
                              </div>
                            </div>
                          )}
                          {originalUri && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                              onMouseDown={() => setComparingSlotIndex(index)}
                              onMouseUp={() => setComparingSlotIndex(null)}
                              onMouseLeave={() => setComparingSlotIndex(null)}
                              onTouchStart={() => setComparingSlotIndex(index)}
                              onTouchEnd={() => setComparingSlotIndex(null)}
                              title="Hold to see original"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1">
                            <Button onClick={() => handleDownloadOutput(uri, index)} className="flex-1" variant="outline" size="sm" disabled={isProcessingThisSlot || isLoading}><Download className="h-3 w-3 mr-1" /> <span className="text-xs">DL</span></Button>
                            <Button onClick={() => handleReRollImage(index)} className="flex-1" variant="ghost" size="sm" disabled={isProcessingThisSlot || isLoading}><RefreshCw className="h-3 w-3 mr-1" /> <span className="text-xs">Re-roll</span></Button>
                            <Button onClick={() => handleUpscale(index)} className="flex-1" variant="ghost" size="sm" disabled={isProcessingThisSlot || isLoading}><Sparkles className="h-3 w-3 mr-1" /> <span className="text-xs">Upscale</span></Button>
                            <Button onClick={() => handleSendToVideoPage(uri)} className="flex-1" variant="ghost" size="sm" disabled={isProcessingThisSlot || isLoading}><VideoIcon className="h-3 w-3 mr-1" /> <span className="text-xs">Video</span></Button>
                        </div>
                      </>
                    ) : isCurrentlyReRollingThisSlot ? (
                      <div className="aspect-[3/4] flex items-center justify-center bg-muted/50 rounded-md border">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : error ? (
                      <div className="aspect-[3/4] flex flex-col items-center justify-center text-center text-xs text-destructive p-2 bg-destructive/10">
                        Failed. <Button onClick={() => handleReRollImage(index)} variant="link" size="sm" className="text-xs p-0 h-auto mt-1" disabled={isProcessingThisSlot || isLoading}>Retry</Button>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] flex flex-col items-center justify-center text-center text-xs text-muted-foreground p-2 bg-muted/50">
                        Not generated. <Button onClick={() => handleReRollImage(index)} variant="link" size="sm" className="text-xs p-0 h-auto mt-1" disabled={isProcessingThisSlot || isLoading}>Generate</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
