// src/components/image-parameters.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, PersonStanding, Settings2, Sparkles, Wand2, FileText, Shuffle, Save, Trash2, Eye, RefreshCw, Download, Video as VideoIcon, UserCheck, UploadCloud, AlertTriangle, BrainCircuit, X, AlertCircle, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { generateImageEdit, type GenerateImageEditInput, type GenerateMultipleImagesOutput } from "@/ai/flows/generate-image-edit";
import { upscaleImageAction, faceDetailerAction, isFaceDetailerAvailable } from "@/ai/actions/upscale-image.action";
import { addHistoryItem, updateHistoryItem, getHistoryItemById } from "@/actions/historyActions";
import { useAuth } from "@/contexts/AuthContext";
import type { ModelAttributes, HistoryItem } from "@/lib/types";
import { getDisplayableImageUrl } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { usePromptManager } from '@/hooks/usePromptManager';
import { Textarea } from '@/components/ui/textarea';
import { useActivePreparationImage, useImagePreparation } from "@/contexts/ImagePreparationContext";
import {
    FASHION_STYLE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS,
    BODY_SHAPE_AND_SIZE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS,
    POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS,
    LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, CAMERA_ANGLE_OPTIONS, LENS_EFFECT_OPTIONS,
    DEPTH_OF_FIELD_OPTIONS, FABRIC_RENDERING_OPTIONS, OptionWithPromptSegment
} from '@/lib/prompt-builder';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { MOTION_TRANSITIONS } from '@/lib/motion-constants';

// Interface for image generation parameters
interface ImageGenerationParams extends ModelAttributes {
  settingsMode: 'basic' | 'advanced';
}

// Props interface for the component
interface ImageParametersProps {
  historyItemToLoad?: HistoryItem | null;
  isLoadingHistory?: boolean;
}

// Constants
const NUM_IMAGES_TO_GENERATE = 3;

// Component now accepts props for loading configuration
export default function ImageParameters({
  historyItemToLoad = null,
  isLoadingHistory = false,
}: ImageParametersProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Get the active image and tab state from context
  const activeImage = useActivePreparationImage();
  const { setCurrentTab, addVersion } = useImagePreparation();
  const preparedImageUrl = activeImage?.imageUrl || null;

  // State for parameters
  const [gender, setGender] = useState<string>(GENDER_OPTIONS.find(o => o.value === "female")?.value || GENDER_OPTIONS[0].value);
  const [bodyShapeAndSize, setBodyShapeAndSize] = useState<string>(BODY_SHAPE_AND_SIZE_OPTIONS[0].value);
  const [ageRange, setAgeRange] = useState<string>(AGE_RANGE_OPTIONS[0].value);
  const [ethnicity, setEthnicity] = useState<string>(ETHNICITY_OPTIONS[0].value);
  const [poseStyle, setPoseStyle] = useState<string>(POSE_STYLE_OPTIONS[0].value);
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
  const [loadedHistoryItemId, setLoadedHistoryItemId] = useState<string | null>(null);

  // NEW CORE STATE: Tracks if the user has intentionally changed any setting.
  // This is the "tripwire" for switching from smart default to manual mode.
  const [isCustomized, setIsCustomized] = useState<boolean>(false);

  // NEW STATE for the AI prompt feature
  const [useAIPrompt, setUseAIPrompt] = useState<boolean>(true);
  const [useRandomizedAIPrompts, setUseRandomizedAIPrompts] = useState<boolean>(true);

  // State for prompt preview visibility
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);

  // State for generation results
  const [outputImageUrls, setOutputImageUrls] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));
  const [originalOutputImageUrls, setOriginalOutputImageUrls] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));

  // Ref for auto-scroll to results
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load form fields from history when historyItemToLoad changes
  useEffect(() => {
    if (historyItemToLoad && historyItemToLoad.attributes) {
      const attrs = historyItemToLoad.attributes;
      
      setGender(attrs.gender || GENDER_OPTIONS[0].value);
      setBodyShapeAndSize(attrs.bodyShapeAndSize || BODY_SHAPE_AND_SIZE_OPTIONS[0].value);
      setAgeRange(attrs.ageRange || AGE_RANGE_OPTIONS[0].value);
      setEthnicity(attrs.ethnicity || ETHNICITY_OPTIONS[0].value);
      setPoseStyle(attrs.poseStyle || POSE_STYLE_OPTIONS[0].value);
      setBackground(attrs.background || BACKGROUND_OPTIONS[0].value);
      setFashionStyle(attrs.fashionStyle || FASHION_STYLE_OPTIONS[0].value);
      setHairStyle(attrs.hairStyle || HAIR_STYLE_OPTIONS[0].value);
      setModelExpression(attrs.modelExpression || MODEL_EXPRESSION_OPTIONS[0].value);
      setLightingType(attrs.lightingType || LIGHTING_TYPE_OPTIONS[0].value);
      setLightQuality(attrs.lightQuality || LIGHT_QUALITY_OPTIONS[0].value);
      setCameraAngle(attrs.cameraAngle || CAMERA_ANGLE_OPTIONS[0].value);
      setLensEffect(attrs.lensEffect || LENS_EFFECT_OPTIONS[0].value);
      setDepthOfField(attrs.depthOfField || DEPTH_OF_FIELD_OPTIONS[0].value);
      setTimeOfDay(attrs.timeOfDay || TIME_OF_DAY_OPTIONS[0].value);
      setOverallMood(attrs.overallMood || OVERALL_MOOD_OPTIONS[0].value);
      setFabricRendering(attrs.fabricRendering || FABRIC_RENDERING_OPTIONS[0].value);
      
      setSettingsMode(historyItemToLoad.settingsMode || 'basic');
      setLoadedHistoryItemId(historyItemToLoad.id);
    }
  }, [historyItemToLoad]);
  
  const [generationErrors, setGenerationErrors] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingSlots, setIsGeneratingSlots] = useState<boolean[]>([false, false, false]); // Track each slot independently
  const [isUpscalingSlot, setIsUpscalingSlot] = useState<number | null>(null);
  const [isFaceRetouchingSlot, setIsFaceRetouchingSlot] = useState<number | null>(null);
  const [isFaceDetailerServiceAvailable, setIsFaceDetailerServiceAvailable] = useState<boolean>(false);
  const [comparingSlotIndex, setComparingSlotIndex] = useState<number | null>(null);
  const [activeHistoryItemId, setActiveHistoryItemId] = useState<string | null>(null);
  
  // Image viewer modal state
  const [isImageViewerOpen, setIsImageViewerOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [lastUsedPrompt, setLastUsedPrompt] = useState<string>(''); // Store the last constructed prompt for history

  // Auto-scroll to results when generation starts
  useEffect(() => {
    if (isLoading && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100); // Small delay to ensure the results section is rendered
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const commonFormDisabled = !preparedImageUrl || isLoading;

  // Initial default values for all configurable parameters
  const initialAppDefaults = React.useRef({
    gender: GENDER_OPTIONS.find(o => o.value === "female")?.value || GENDER_OPTIONS[0].value,
    bodyShapeAndSize: BODY_SHAPE_AND_SIZE_OPTIONS[0].value,
    ageRange: AGE_RANGE_OPTIONS[0].value,
    ethnicity: ETHNICITY_OPTIONS[0].value,
    poseStyle: POSE_STYLE_OPTIONS[0].value,
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
    bodyShapeAndSize: { setter: setBodyShapeAndSize, options: BODY_SHAPE_AND_SIZE_OPTIONS, defaultVal: initialAppDefaults.bodyShapeAndSize },
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

  // Load/Save settingsMode, user defaults, and prompt preview state from localStorage
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

      // Load prompt preview visibility preference
      const storedPromptPreview = window.localStorage.getItem('imageForgeShowPromptPreview');
      if (storedPromptPreview === 'true') {
        setShowPromptPreview(true);
      }
    }
  }, [PARAMETER_CONFIG]);

  // Save prompt preview state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('imageForgeShowPromptPreview', showPromptPreview.toString());
    }
  }, [showPromptPreview]);

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
          gender, bodyShapeAndSize, ageRange, ethnicity, poseStyle, background,
          fashionStyle, hairStyle, modelExpression, lightingType, lightQuality, 
          cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering 
        }[param];
        return stateValue !== initialAppDefaults[param];
      });
      setShowAdvancedSettingsActiveMessage(advancedSettingsAreActive);
    } else {
      setShowAdvancedSettingsActiveMessage(false);
    }
  }, [settingsMode, initialAppDefaults, gender, bodyShapeAndSize, ageRange, ethnicity, poseStyle, background, fashionStyle, hairStyle, modelExpression, lightingType, lightQuality, cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering]);

  // Consolidate all params for the hook
  const currentImageGenParams = React.useMemo((): ImageGenerationParams => ({
    gender, bodyShapeAndSize, ageRange, ethnicity, poseStyle, background,
    fashionStyle, hairStyle, modelExpression, lightingType, lightQuality,
    cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering,
    settingsMode,
  }), [
    gender, bodyShapeAndSize, ageRange, ethnicity, poseStyle, background,
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

  // Effect to populate state when a history item is loaded
  useEffect(() => {
    if (historyItemToLoad && !isLoadingHistory && historyItemToLoad.id !== loadedHistoryItemId) {
      const { attributes, constructedPrompt, settingsMode, editedImageUrls, originalImageUrls, id } = historyItemToLoad;
      
      // Clear any existing generated images first
      setOutputImageUrls(Array(NUM_IMAGES_TO_GENERATE).fill(null));
      setOriginalOutputImageUrls(Array(NUM_IMAGES_TO_GENERATE).fill(null));
      setGenerationErrors(Array(NUM_IMAGES_TO_GENERATE).fill(null));
      setActiveHistoryItemId(null);
      
      // Set all attribute states from the loaded history item
      setGender(attributes.gender || GENDER_OPTIONS.find(o => o.value === "female")?.value || GENDER_OPTIONS[0].value);
      setBodyShapeAndSize(attributes.bodyShapeAndSize || BODY_SHAPE_AND_SIZE_OPTIONS[0].value);
      setAgeRange(attributes.ageRange || AGE_RANGE_OPTIONS[0].value);
      setEthnicity(attributes.ethnicity || ETHNICITY_OPTIONS[0].value);
      setPoseStyle(attributes.poseStyle || POSE_STYLE_OPTIONS[0].value);
      setBackground(attributes.background || BACKGROUND_OPTIONS.find(o => o.value === "outdoor_nature_elements")?.value || BACKGROUND_OPTIONS[0].value);
      setFashionStyle(attributes.fashionStyle || FASHION_STYLE_OPTIONS[0].value);
      setHairStyle(attributes.hairStyle || HAIR_STYLE_OPTIONS[0].value);
      setModelExpression(attributes.modelExpression || MODEL_EXPRESSION_OPTIONS[0].value);
      setLightingType(attributes.lightingType || LIGHTING_TYPE_OPTIONS[0].value);
      setLightQuality(attributes.lightQuality || LIGHT_QUALITY_OPTIONS[0].value);
      setCameraAngle(attributes.cameraAngle || CAMERA_ANGLE_OPTIONS[0].value);
      setLensEffect(attributes.lensEffect || LENS_EFFECT_OPTIONS[0].value);
      setDepthOfField(attributes.depthOfField || DEPTH_OF_FIELD_OPTIONS[0].value);
      setTimeOfDay(attributes.timeOfDay || TIME_OF_DAY_OPTIONS[0].value);
      setOverallMood(attributes.overallMood || OVERALL_MOOD_OPTIONS[0].value);
      setFabricRendering(attributes.fabricRendering || FABRIC_RENDERING_OPTIONS[0].value);
      // Set settings mode
      setSettingsMode(settingsMode || 'basic');
      
      // *** BUG FIX / COMPLETENESS ***
      // Loading history is an explicit customization. Set the tripwire.
      setIsCustomized(true);
      
      // Only set the generated image URLs if we want to show the historical results
      // For now, we'll show them to maintain the current behavior but clear them first
      if (editedImageUrls && editedImageUrls.length > 0) {
        setOutputImageUrls(editedImageUrls);
      }
      // Set the original URLs for the "Compare" feature
      if (originalImageUrls && originalImageUrls.length > 0) {
        setOriginalOutputImageUrls(originalImageUrls);
      }
      
      setActiveHistoryItemId(id);
      // Set the prompt and mark it as manually edited to prevent auto-generation
      if (constructedPrompt) {
        handlePromptChange(constructedPrompt);
      }
      setLoadedHistoryItemId(historyItemToLoad.id);
      toast({
        title: "History Restored",
        description: "Image and all generation parameters have been successfully restored.",
      });
    }
  }, [historyItemToLoad, isLoadingHistory, loadedHistoryItemId, handlePromptChange, toast]);

  // NEW: Callback to set the `isCustomized` tripwire.
  // Memoized to prevent re-creation on every render.
  const handleFirstCustomization = useCallback(() => {
    if (!isCustomized) {
      setIsCustomized(true);
      toast({
        title: "Customization Mode Activated",
        description: "The 'Generate' button will now use your specific settings.",
        duration: 3000,
      });
    }
  }, [isCustomized, toast]);

  // Check Face Detailer service availability on mount
  useEffect(() => {
    isFaceDetailerAvailable().then(setIsFaceDetailerServiceAvailable);
  }, []);

  // Handler for opening image viewer modal
  const handleImageClick = (imageUrl: string, index: number) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageIndex(index);
    setIsImageViewerOpen(true);
  };

  // Handler for closing image viewer modal
  const handleCloseImageViewer = () => {
    setIsImageViewerOpen(false);
    setSelectedImageUrl(null);
    setSelectedImageIndex(null);
  };

  // Keyboard support for image viewer modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isImageViewerOpen && event.key === 'Escape') {
        handleCloseImageViewer();
      }
    };

    if (isImageViewerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isImageViewerOpen]);

  const handleSaveDefaults = () => {
    if (typeof window === 'undefined') return;
    const currentSettingsToSave: ModelAttributes = {
      gender, bodyShapeAndSize, ageRange, ethnicity, poseStyle, background,
      fashionStyle, hairStyle, modelExpression, lightingType, lightQuality,
      cameraAngle, lensEffect, depthOfField, timeOfDay, overallMood, fabricRendering,
    };
    window.localStorage.setItem('imageForgeDefaults', JSON.stringify(currentSettingsToSave));
    toast({ 
      title: "Defaults Saved",
      description: "Your current settings have been saved for future sessions."
    });
  };

  const resetAllParametersToAppDefaults = useCallback(() => {
    Object.values(PARAMETER_CONFIG).forEach(config => config.setter(config.defaultVal));
  }, [PARAMETER_CONFIG]);

  const handleClearDefaults = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('imageForgeDefaults');
    resetAllParametersToAppDefaults();
    toast({ 
      title: "Defaults Cleared",
      description: "All saved settings have been reset to application defaults."
    });
  };

  const handleRandomizeConfiguration = () => {
    handleFirstCustomization();
    if (useAIPrompt) {
      // When AI Prompt is enabled, don't change UI fields - set flag for AI generation instead
      setUseRandomizedAIPrompts(true);
      toast({ 
        title: "AI Randomization Activated!", 
        description: "Each of the 3 AI prompts will use different random parameters." 
      });
    } else {
      // Original behavior: randomize UI fields directly
      const pickRandom = (options: OptionWithPromptSegment[]) => options[Math.floor(Math.random() * options.length)].value;
      Object.values(PARAMETER_CONFIG).forEach(config => {
          if (settingsMode === 'advanced' ||
              ['gender', 'bodyShapeAndSize', 'ageRange', 'ethnicity', 'hairStyle', 'modelExpression', 'poseStyle', 'background'].includes(Object.keys(PARAMETER_CONFIG).find(k => PARAMETER_CONFIG[k as keyof ModelAttributes] === config) || "")) {
              config.setter(pickRandom(config.options));
          }
      });
      toast({ title: "Configuration Randomized!" });
    }
  };

  const handleSubmit = async () => {
    if (!preparedImageUrl) {
      toast({ title: "Image Not Prepared", description: "Please prepare an image in the previous step.", variant: "destructive" });
      return;
    }

    // 1. Set global loading state
    setIsLoading(true);
    setOutputImageUrls(Array(NUM_IMAGES_TO_GENERATE).fill(null));
    setOriginalOutputImageUrls(Array(NUM_IMAGES_TO_GENERATE).fill(null));
    setGenerationErrors(Array(NUM_IMAGES_TO_GENERATE).fill(null));
    
    // Start all slots in a "generating" visual state
    setIsGeneratingSlots([true, true, true]);

    let generationInput: GenerateImageEditInput;

    if (!isCustomized) {
      // --- SMART DEFAULT MODE ---
      // User has not touched any controls, so we use the best, most creative defaults.
      generationInput = {
        imageDataUriOrUrl: preparedImageUrl,
        parameters: currentImageGenParams, // Use default parameters
        settingsMode: 'basic', // Use basic mode as the foundation
        useAIPrompt: true, // Force AI prompt generation
        useRandomizedAIPrompts: true, // Force randomization for variety
      };
      toast({ title: "Starting AI Creative Generation...", description: "Using randomized styles for variety." });
    } else {
      // --- MANUAL CUSTOMIZATION MODE ---
      // User has interacted with the controls, so we respect their exact choices.
      generationInput = {
        prompt: isPromptManuallyEdited ? currentPrompt : undefined,
        imageDataUriOrUrl: preparedImageUrl,
        parameters: currentImageGenParams,
        settingsMode: settingsMode,
        useAIPrompt: useAIPrompt,
        useRandomizedAIPrompts: useRandomizedAIPrompts,
      };
      toast({ title: "Starting Generation...", description: "Using your custom settings." });
    }

    try {
      // 3. Make a SINGLE call to the batch server action
      const result: GenerateMultipleImagesOutput = await generateImageEdit(generationInput, currentUser?.username || '');

      // 4. Process the complete result at once
      setOutputImageUrls(result.editedImageUrls);
      
      // Store the prompt for history
      setLastUsedPrompt(result.constructedPrompt);
      
      const successCount = result.editedImageUrls.filter(url => url !== null).length;
      if (successCount > 0) {
        // Add to history
        if (currentUser && preparedImageUrl) {
          try {
            const newHistoryId = await addHistoryItem(currentImageGenParams, result.constructedPrompt, preparedImageUrl, result.editedImageUrls, settingsMode);
            setActiveHistoryItemId(newHistoryId);
            
            // Refresh history gallery if available
            if (typeof (window as any).refreshHistoryGallery === 'function') {
              (window as any).refreshHistoryGallery();
            }
          } catch (error) {
            console.error("Failed to save to history:", error);
          }
        }
        toast({
          title: "Generation Complete!",
          description: `${successCount} out of ${NUM_IMAGES_TO_GENERATE} images generated successfully.`
        });
      } else {
        toast({
          title: "All Generations Failed",
          description: "Please check the errors or try again.",
          variant: "destructive"
        });
      }
      if (result.errors) {
        setGenerationErrors(result.errors);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during generation.";
      console.error("Error calling generateImageEdit:", error);
      toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
      setGenerationErrors(Array(NUM_IMAGES_TO_GENERATE).fill(errorMessage));
    } finally {
      // 5. Reset all loading states
      setIsLoading(false);
      setIsGeneratingSlots([false, false, false]);
      // Keep randomization setting as-is until manually toggled by user
    }
  };

  // Re-roll functionality has been replaced with Face Retouch

  const handleUpscale = async (slotIndex: number) => {
    // Capture the URL to be upscaled at the beginning of the action.
    const imageUrlToUpscale = outputImageUrls[slotIndex];
    if (!imageUrlToUpscale) {
      toast({ title: "Image Not Available", variant: "destructive" });
      return;
    }
    setIsUpscalingSlot(slotIndex);
    try {
      // We pass undefined for hash as this is a generated image, not the original upload
      // PHASE 2 OPTIMIZATION: Pass the local file path directly to the server action.
      // The inefficient download/re-upload cycle is now eliminated.
      const { savedPath } = await upscaleImageAction(imageUrlToUpscale, undefined);

      if (activeHistoryItemId) {
        // The state isn't updated yet, so we build the arrays manually for the DB update
        const finalOriginals = [...originalOutputImageUrls];
        finalOriginals[slotIndex] = imageUrlToUpscale;
        const finalOutputs = [...outputImageUrls];
        finalOutputs[slotIndex] = savedPath;
        await updateHistoryItem(activeHistoryItemId, {
          editedImageUrls: finalOutputs,
          originalImageUrls: finalOriginals,
        });
      }

      // Use functional updates to prevent stale state issues in the UI.
      setOriginalOutputImageUrls(prev => {
        const newOriginals = [...prev];
        newOriginals[slotIndex] = imageUrlToUpscale;
        return newOriginals;
      });

      setOutputImageUrls(prev => {
        const newUrls = [...prev];
        newUrls[slotIndex] = savedPath;
        return newUrls;
      });

      toast({ title: `Image ${slotIndex + 1} Upscaled Successfully` });
    } catch (error) {
      console.error(`Error upscaling image ${slotIndex}:`, error);
      const errorMessage = (error as Error).message || "Unexpected error during upscaling.";
      toast({ title: "Upscaling Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUpscalingSlot(null);
    }
  };

  const handleFaceRetouch = async (slotIndex: number) => {
    // Capture the URL to be face retouched at the beginning of the action.
    const imageUrlToRetouch = outputImageUrls[slotIndex];
    if (!imageUrlToRetouch) {
      toast({ title: "Image Not Available", variant: "destructive" });
      return;
    }
    setIsFaceRetouchingSlot(slotIndex);
    try {
      // PHASE 2 OPTIMIZATION: Just like upscale, pass the path directly.
      const { savedPath } = await faceDetailerAction(imageUrlToRetouch, undefined);

      if (activeHistoryItemId) {
        // The state isn't updated yet, so we build the arrays manually for the DB update
        const finalOriginals = [...originalOutputImageUrls];
        finalOriginals[slotIndex] = imageUrlToRetouch;
        const finalOutputs = [...outputImageUrls];
        finalOutputs[slotIndex] = savedPath;
        await updateHistoryItem(activeHistoryItemId, {
          editedImageUrls: finalOutputs,
          originalImageUrls: finalOriginals,
        });
      }

      // Use functional updates to prevent stale state issues in the UI.
      setOriginalOutputImageUrls(prev => {
        const newOriginals = [...prev];
        newOriginals[slotIndex] = imageUrlToRetouch;
        return newOriginals;
      });

      setOutputImageUrls(prev => {
        const newUrls = [...prev];
        newUrls[slotIndex] = savedPath;
        return newUrls;
      });

      toast({ title: `Image ${slotIndex + 1} Face Retouched Successfully` });
    } catch (error) {
      console.error(`Error face retouching image ${slotIndex}:`, error);
      const errorMessage = (error as Error).message || "Unexpected error during face retouching.";
      toast({ title: "Face Retouch Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsFaceRetouchingSlot(null);
    }
  };

  const handleDownloadOutput = (imageUrl: string | null, index: number) => {
    if (!imageUrl) return;
    const downloadUrl = getDisplayableImageUrl(imageUrl);
    if (!downloadUrl) return;

    // CACHE-STRATEGY: Policy: Dynamic - This fetch is for downloading the current version of the file.
    // Use no-store to ensure we get the latest version, not a potentially stale cached version.
    fetch(downloadUrl, { cache: 'no-store' })
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

    // Add the generated image as a new version in the context
    const newVersionId = addVersion({
      imageUrl: imageUrl,
      label: 'Generated for Video',
      sourceVersionId: activeImage?.id || 'original',
      hash: `generated_${Date.now()}`, // Generate a unique hash for the generated image
    });

    // Switch to the video tab with the new image active
    setCurrentTab('video');
    
    // Smooth scroll to the image preparation container after a short delay
    setTimeout(() => {
      const imagePreparationElement = document.querySelector('[data-testid="image-preparation-container"]') ||
                                     document.querySelector('h1, h2, h3')?.closest('.space-y-6, .space-y-8') ||
                                     document.querySelector('.container');
      
      if (imagePreparationElement) {
        imagePreparationElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100); // Small delay to ensure tab switch is complete
    
    toast({
      title: "Switched to Video",
      description: "Ready to generate a video with your selected generated image.",
    });
  };

  // NEW: Wrapper for all parameter state changes to trigger customization mode
  const handleParamChange = useCallback((setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    handleFirstCustomization();
    setter(value);
  }, [handleFirstCustomization]);

  // Helper to render select components
  const renderSelect = ({ id, label, value, onChange, options, disabled }: {
    id: string; label: string; value: string; onChange: (value: string) => void; options: OptionWithPromptSegment[]; disabled?: boolean;
  }) => {
    // The original `onChange` is the state setter (e.g., `setGender`).
    // We wrap it with our new handler to trip the `isCustomized` wire.
    const wrappedOnChange = (newValue: string) => {
      handleParamChange(onChange, newValue);
    };

    return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={wrappedOnChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full text-sm">
          <SelectValue placeholder={options.find(o => o.value === value)?.displayLabel || `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (<SelectItem key={option.value} value={option.value} className="text-sm">{option.displayLabel}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
    )
  };

  // Animation variants for results grid
  const resultsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
      },
    },
  };
  const resultItemVariant = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: MOTION_TRANSITIONS.spring.standard },
  };
  
  const shouldReduceMotion = useReducedMotion();
  const containerAnim = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : resultsContainerVariants;
  const itemAnim = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : resultItemVariant;

  return (
    <div className="space-y-6">
      {/* --- RESTRUCTURED CARD --- */}
      <Card variant="glass">
        <CardHeader>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Style Your Model
            </CardTitle>
            <CardDescription>
              {isCustomized
                ? "Using your custom settings for generation."
                : "Using AI Creative mode with randomized styles for best results."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button onClick={handleSubmit} disabled={isLoading || !preparedImageUrl} className="w-full text-lg h-14">
              <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                  <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5" /> Generate {NUM_IMAGES_TO_GENERATE} Images
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </CardContent>
        <CardFooter className="flex-col items-stretch !pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="customize" className="border-b-0">
              <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground justify-center py-2 group">
                <Settings2 className="mr-2 h-4 w-4 transition-transform group-data-[state=open]:rotate-90"/>
                Customize
              </AccordionTrigger>
              <AccordionContent className="pt-6 space-y-6">

                {/* --- HEADER CONTROLS MOVED INSIDE ACCORDION --- */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/20">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="ai-prompt-switch" className="text-sm font-medium flex items-center gap-1">
                            <BrainCircuit className="h-4 w-4" /> AI Prompt
                          </Label>
                          <Switch id="ai-prompt-switch" checked={useAIPrompt} onCheckedChange={(c) => handleParamChange(setUseAIPrompt, c)} disabled={commonFormDisabled} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p className="max-w-xs">Enable AI to creatively write your prompt based on your settings.</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex items-center gap-2">
                      <Label htmlFor="settings-mode-switch" className="text-sm font-medium">
                          {settingsMode === 'basic' ? 'Basic' : 'Advanced'}
                      </Label>
                      <Switch id="settings-mode-switch" checked={settingsMode === 'advanced'} onCheckedChange={(c) => handleParamChange(setSettingsMode, c ? 'advanced' : 'basic')} disabled={commonFormDisabled} />
                  </div>
                </div>

                {/* --- PARAMETER CONTROLS --- */}
                {settingsMode === 'basic' ? (
                  <div className="space-y-4">
                    <RadioGroup value={gender} onValueChange={(v) => handleParamChange(setGender, v)} className="flex flex-row flex-wrap gap-2 pt-1" disabled={commonFormDisabled}>
                      {GENDER_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                          <Label htmlFor={`gender-${option.value}`}>{option.displayLabel}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {renderSelect({ id: "bodyShapeAndSize", label: "Body Shape & Size", value: bodyShapeAndSize, onChange: setBodyShapeAndSize, options: BODY_SHAPE_AND_SIZE_OPTIONS, disabled: commonFormDisabled })}
                      {renderSelect({ id: "ageRange", label: "Age Range", value: ageRange, onChange: setAgeRange, options: AGE_RANGE_OPTIONS, disabled: commonFormDisabled })}
                      {renderSelect({ id: "ethnicity", label: "Ethnicity", value: ethnicity, onChange: setEthnicity, options: ETHNICITY_OPTIONS, disabled: commonFormDisabled })}
                      {renderSelect({ id: "background", label: "Background Setting", value: background, onChange: setBackground, options: BACKGROUND_OPTIONS, disabled: commonFormDisabled })}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">Advanced settings will go here...</p>
                )}

                {/* --- UTILITY BUTTONS MOVED INSIDE ACCORDION --- */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t mt-4">
                  <Button variant="outline" onClick={() => { handleFirstCustomization(); handleSaveDefaults(); }} size="sm" disabled={commonFormDisabled}><Save className="mr-2 h-4 w-4"/>Save</Button>
                  <Button variant="ghost" onClick={() => { handleFirstCustomization(); handleClearDefaults(); }} size="sm" disabled={commonFormDisabled}><Trash2 className="mr-2 h-4 w-4"/>Clear</Button>
                  <Button variant="outline" onClick={() => { handleFirstCustomization(); handleRandomizeConfiguration(); }} size="sm" disabled={commonFormDisabled} className="ml-auto"><Shuffle className="mr-2 h-4 w-4"/>Randomize</Button>
                  <Button variant={showPromptPreview ? "secondary" : "outline"} onClick={() => setShowPromptPreview(!showPromptPreview)} size="sm" disabled={commonFormDisabled}>
                    <FileText className="mr-2 h-4 w-4"/>
                    {showPromptPreview ? 'Hide' : 'Show'} Prompt
                  </Button>
                </div>

                {/* --- PROMPT PREVIEW --- */}
                <AnimatePresence>
                  {showPromptPreview && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="space-y-2 pt-4 border-t">
                        <Textarea id="imagePromptTextarea" value={currentPrompt} onChange={(e) => handleParamChange(handlePromptChange, e.target.value)} rows={8} className="text-xs font-mono" disabled={commonFormDisabled} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardFooter>
      </Card>

      {/* Generated Images Display */}
      {(outputImageUrls.some(uri => uri !== null) || generationErrors.some(err => err !== null) || isGeneratingSlots.some(loading => loading)) && (
        <Card variant="glass" ref={resultsRef}>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Generated Images
            </CardTitle>
            <CardDescription className="hidden lg:block">Your AI-generated fashion model images.</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={containerAnim}
              initial="hidden"
              animate="visible"
            >
              {/* Render slots with independent loading states */}
              {Array.from({ length: NUM_IMAGES_TO_GENERATE }).map((_, index) => {
                const uri = outputImageUrls[index];
                const isSlotGenerating = isGeneratingSlots[index];
                const hasError = generationErrors[index] !== null;

                // Show loading state for this specific slot
                if (isSlotGenerating && uri === null) {
                  return (
                    <div key={`loader-${index}`} className="aspect-[3/4] bg-muted/50 rounded-md border animate-pulse flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Generating Image {index + 1}...</p>
                      </div>
                    </div>
                  );
                }

                // Show error state
                if (hasError && uri === null) {
                  return (
                    <div key={index} className="aspect-[3/4] bg-muted/30 rounded-md border border-muted-foreground/20 flex items-center justify-center">
                      <div className="text-center p-4 max-w-[80%]">
                        <AlertCircle className="h-5 w-5 text-muted-foreground/60 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground/80 mb-1">Generation incomplete</p>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed">{generationErrors[index]}</p>
                      </div>
                    </div>
                  );
                }

                // Show empty state (not started or failed without error)
                if (uri === null) {
                  return (
                    <div key={index} className="aspect-[3/4] bg-muted/50 rounded-md border flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Image {index + 1} pending...</p>
                    </div>
                  );
                }

                // Show completed image
                const displayUrl = getDisplayableImageUrl(comparingSlotIndex === index ? originalOutputImageUrls[index] : uri) || '';
                return (
                  <motion.div key={index} variants={itemAnim} className="group rounded-md overflow-hidden flex flex-col border border-border/20">
                    <div 
                      className="relative aspect-[2/3] w-full cursor-pointer"
                      onClick={() => handleImageClick(displayUrl || '', index)}
                    >
                      <Image
                        src={displayUrl || ''}
                        alt={`Generated Image ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-102 transition-transform duration-250"
                      />
                      {/* Loading overlay for face retouch/upscale */}
                      {(isFaceRetouchingSlot === index || isUpscalingSlot === index) && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-card/80 backdrop-blur-md space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Face Retouch button - only show if service is available */}
                        {isFaceDetailerServiceAvailable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFaceRetouch(index)}
                            disabled={isGeneratingSlots.some(loading => loading) || isFaceRetouchingSlot !== null || isUpscalingSlot !== null || !!originalOutputImageUrls[index]}
                          >
                            <UserCheck className="mr-2 h-4 w-4" /> Face Retouch
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpscale(index)}
                          disabled={isGeneratingSlots.some(loading => loading) || isUpscalingSlot !== null || isFaceRetouchingSlot !== null || !!originalOutputImageUrls[index]}
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Upscale
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadOutput(uri, index)}
                          className="flex-1"
                          disabled={isGeneratingSlots.some(loading => loading) || isFaceRetouchingSlot !== null || isUpscalingSlot !== null}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSendToVideoPage(uri)}
                          className="flex-1"
                          disabled={isGeneratingSlots.some(loading => loading) || isFaceRetouchingSlot !== null || isUpscalingSlot !== null}
                        >
                          <VideoIcon className="mr-2 h-4 w-4" /> Video
                        </Button>
                      </div>
                      {originalOutputImageUrls[index] && (
                        <Button variant="ghost" size="sm" className="w-full select-none"
                          onMouseDown={() => setComparingSlotIndex(index)}
                          onMouseUp={() => setComparingSlotIndex(null)}
                          onMouseLeave={() => setComparingSlotIndex(null)}
                          onTouchStart={(e) => { e.preventDefault(); setComparingSlotIndex(index); }}
                          onTouchEnd={() => setComparingSlotIndex(null)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Hold to Compare
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* Image Viewer Modal */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 border-0 bg-transparent shadow-none">
          <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={handleCloseImageViewer}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors duration-200"
              aria-label="Close image viewer"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Image container */}
            {selectedImageUrl && (
              <div className="relative max-w-full max-h-full">
                <Image
                  src={selectedImageUrl}
                  alt={`Generated Image ${(selectedImageIndex ?? 0) + 1} - Large View`}
                  width={1200}
                  height={1600}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                  quality={95}
                  priority
                />
                
                {/* Image info overlay */}
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
                  Image {(selectedImageIndex ?? 0) + 1} of {NUM_IMAGES_TO_GENERATE}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
