// src/components/image-parameters.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; 
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, PersonStanding, Settings2, Sparkles, FileText, Shuffle, Save, Trash2, Eye, RefreshCw, Download, Video as VideoIcon, UserCheck, UploadCloud, AlertTriangle, BrainCircuit, X, AlertCircle, Code, ChevronDown, ChevronUp, Camera, Wand2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UnifiedMediaModal, MediaSlot, SidebarSlot } from "./UnifiedMediaModal";
import { GenerationProgressIndicator } from "./GenerationProgressIndicator";
import { generateImageEdit, type GenerateImageEditInput, type GenerateMultipleImagesOutput } from "@/ai/flows/generate-image-edit";
import { upscaleImageAction, faceDetailerAction, isFaceDetailerAvailable, isUpscaleServiceAvailable } from "@/ai/actions/upscale-image.action";
import { isBackgroundRemovalAvailable } from "@/ai/actions/remove-background.action";
import { addHistoryItem, updateHistoryItem, getHistoryItemById } from "@/actions/historyActions";
import { useAuth } from "@/contexts/AuthContext";
import type { ModelAttributes, HistoryItem } from "@/lib/types";
import { getDisplayableImageUrl } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { usePromptManager } from '@/hooks/usePromptManager';
import { Textarea } from '@/components/ui/textarea';
import { useActivePreparationImage } from "@/stores/imageStore";
import { useImageStore } from "@/stores/imageStore";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import {
    FASHION_STYLE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS,
    BODY_SHAPE_AND_SIZE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS,
    POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS, MODEL_ANGLE_OPTIONS,
    LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, CAMERA_ANGLE_OPTIONS, LENS_EFFECT_OPTIONS,
    DEPTH_OF_FIELD_OPTIONS, OptionWithPromptSegment
} from '@/lib/prompt-builder';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'motion/react';
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
  
  // Get the active image and tab state from store
  const activeImage = useActivePreparationImage();
  const setCurrentTab = useImageStore(state => state.setCurrentTab);
  const addVersion = useImageStore(state => state.addVersion);
  const preparedImageUrl = activeImage?.imageUrl || null;

  // Get settings from Zustand store - read and write directly to store
  const imageSettings = useGenerationSettingsStore(state => state.imageSettings);
  const settingsMode = useGenerationSettingsStore(state => state.settingsMode);
  const setImageSettings = useGenerationSettingsStore(state => state.setImageSettings);
  const setSettingsModeStore = useGenerationSettingsStore(state => state.setSettingsMode);
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
  
  // Get preparation options from Zustand store
  const backgroundRemovalEnabled = useGenerationSettingsStore(state => state.backgroundRemovalEnabled);
  const upscaleEnabled = useGenerationSettingsStore(state => state.upscaleEnabled);
  const faceDetailEnabled = useGenerationSettingsStore(state => state.faceDetailEnabled);
  const setBackgroundRemovalEnabled = useGenerationSettingsStore(state => state.setBackgroundRemovalEnabled);
  const setUpscaleEnabled = useGenerationSettingsStore(state => state.setUpscaleEnabled);
  const setFaceDetailEnabled = useGenerationSettingsStore(state => state.setFaceDetailEnabled);

  const [loadedHistoryItemId, setLoadedHistoryItemId] = useState<string | null>(null);

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

  // State for generation results
  const [outputImageUrls, setOutputImageUrls] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));
  const [originalOutputImageUrls, setOriginalOutputImageUrls] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));

  // Ref for auto-scroll to results
  const resultsRef = useRef<HTMLDivElement>(null);

  // When a history item is loaded directly via props (legacy), disable creative mode
  // Note: History loading is now primarily handled by the Zustand store via HistoryCard
  useEffect(() => {
    if (historyItemToLoad) {
      setUseRandomization(false);
    }
  }, [historyItemToLoad]);
  
  const [generationErrors, setGenerationErrors] = useState<(string | null)[]>(Array(NUM_IMAGES_TO_GENERATE).fill(null));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingSlots, setIsGeneratingSlots] = useState<boolean[]>([false, false, false]); // Track each slot independently
  const [isUpscalingSlot, setIsUpscalingSlot] = useState<number | null>(null);
  const [isFaceRetouchingSlot, setIsFaceRetouchingSlot] = useState<number | null>(null);
  const [isFaceDetailerServiceAvailable, setIsFaceDetailerServiceAvailable] = useState<boolean>(false);
  const [isBackgroundRemovalServiceAvailable, setIsBackgroundRemovalServiceAvailable] = useState<boolean>(false);
  const [isUpscaleServiceAvailableState, setIsUpscaleServiceAvailableState] = useState<boolean>(false);
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

  // Handler for opening image viewer modal - memoized
  const handleImageClick = useCallback((imageUrl: string, index: number) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageIndex(index);
    setIsImageViewerOpen(true);
  }, []);

  // Handler for closing image viewer modal - memoized
  const handleCloseImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
    setSelectedImageUrl(null);
    setSelectedImageIndex(null);
  }, []);

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

    const generationInput: GenerateImageEditInput = {
      prompt: isPromptManuallyEdited ? currentPrompt : undefined,
      imageDataUriOrUrl: preparedImageUrl,
      parameters: currentImageGenParams,
      settingsMode: settingsMode,
      useAIPrompt: useAIPrompt,
      useRandomization: useRandomization, // Pass the new, decoupled randomization flag
      removeBackground: backgroundRemovalEnabled,
      upscale: upscaleEnabled,
      enhanceFace: faceDetailEnabled,
    };

    toast({ title: useRandomization ? "Starting Creative Generation..." : "Starting Generation...", description: useRandomization ? "Using randomized styles for variety." : "Using your selected settings." });

    try {
  const result: GenerateMultipleImagesOutput & { newHistoryId?: string } = await generateImageEdit(generationInput, currentUser?.username || '');
  setOutputImageUrls(result.editedImageUrls);
      
      // Store the prompt for history
      setLastUsedPrompt(result.constructedPrompt);
      
      const successCount = result.editedImageUrls.filter(url => url !== null).length;
      if (successCount > 0) {
        // generateImageEdit already created the history item on the server and returns its id (newHistoryId).
        if (result.newHistoryId) {
          setActiveHistoryItemId(result.newHistoryId);
        }
        // Trigger history gallery refresh via Zustand store
        incrementGenerationCount();
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
      setIsLoading(false);
      setIsGeneratingSlots([false, false, false]);
    }
  };

  // Re-roll functionality has been replaced with Face Retouch

  const handleUpscale = async (slotIndex: number) => {    
    const imageUrlToUpscale = outputImageUrls[slotIndex];    
    if (!imageUrlToUpscale) return toast({ title: "Image Not Available", variant: "destructive" });    
    setIsUpscalingSlot(slotIndex);
    try {
      // We pass undefined for hash as this is a generated image, not the original upload
      // PHASE 2 OPTIMIZATION: Pass the local file path directly to the server action.
      // The inefficient download/re-upload cycle is now eliminated.
      const { savedPath } = await upscaleImageAction(imageUrlToUpscale, undefined);

      if (activeHistoryItemId) {
        // The state isn't updated yet, so we build the arrays manually for the DB update
        const finalOriginals = [...originalOutputImageUrls]; finalOriginals[slotIndex] = imageUrlToUpscale;
        const finalOutputs = [...outputImageUrls]; finalOutputs[slotIndex] = savedPath;
        await updateHistoryItem(activeHistoryItemId, {
          editedImageUrls: finalOutputs,
          originalImageUrls: finalOriginals,
        });
      }

      setOriginalOutputImageUrls(prev => {
        const newOriginals = [...prev]; newOriginals[slotIndex] = imageUrlToUpscale;
        return newOriginals;
      });

      setOutputImageUrls(prev => {
        const newUrls = [...prev]; newUrls[slotIndex] = savedPath;
        return newUrls;
      });

      toast({ title: `Image ${slotIndex + 1} Upscaled Successfully` });
    } catch (error) {
      console.error(`Error upscaling image ${slotIndex}:`, error);
      toast({ title: "Upscaling Failed", description: (error as Error).message || "Unexpected error during upscaling.", variant: "destructive" });
    } finally {
      setIsUpscalingSlot(null);
    }
  };

  const handleFaceRetouch = async (slotIndex: number) => {
    const imageUrlToRetouch = outputImageUrls[slotIndex];    
    if (!imageUrlToRetouch) return toast({ title: "Image Not Available", variant: "destructive" });    
    setIsFaceRetouchingSlot(slotIndex);
    try {
      // PHASE 2 OPTIMIZATION: Just like upscale, pass the path directly.
      const { savedPath } = await faceDetailerAction(imageUrlToRetouch, undefined);

      if (activeHistoryItemId) {
        const finalOriginals = [...originalOutputImageUrls]; finalOriginals[slotIndex] = imageUrlToRetouch;
        const finalOutputs = [...outputImageUrls]; finalOutputs[slotIndex] = savedPath;
        await updateHistoryItem(activeHistoryItemId, {
          editedImageUrls: finalOutputs,
          originalImageUrls: finalOriginals,
        });
      }

      setOriginalOutputImageUrls(prev => {
        const newOriginals = [...prev]; newOriginals[slotIndex] = imageUrlToRetouch;
        return newOriginals;
      });

      setOutputImageUrls(prev => {
        const newUrls = [...prev]; newUrls[slotIndex] = savedPath;
        return newUrls;
      });

      toast({ title: `Image ${slotIndex + 1} Face Retouched Successfully` });
    } catch (error) {
      console.error(`Error face retouching image ${slotIndex}:`, error);
      toast({ title: "Face Retouch Failed", description: (error as Error).message || "Unexpected error during face retouching.", variant: "destructive" });
    } finally {
      setIsFaceRetouchingSlot(null);
    }
  };

  const handleDownloadOutput = useCallback((imageUrl: string | null, index: number) => {
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
  }, [toast]);

  const handleSendToVideoPage = useCallback((imageUrl: string | null) => {
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
  }, [activeImage?.id, addVersion, setCurrentTab, toast]);

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
              Image Generation Settings
            </CardTitle>
            <CardDescription>{useRandomization ? 'Using automatic style randomization for variety. Change any setting to switch to manual mode.' : 'Fine-tune every detail to match your vision.'}</CardDescription>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                              disabled={isLoading || !preparedImageUrl}>
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
                        disabled={!preparedImageUrl || isLoading}
                        className="h-9 px-3 border-muted/60 hover:border-muted-foreground/40"
                      >
                        <Save className="mr-2 h-4 w-4"/>
                        Save Current
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={handleClearDefaults} 
                        size="sm" 
                        disabled={!preparedImageUrl || isLoading}
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
                      disabled={!preparedImageUrl || isLoading} 
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

      {/* Progress Indicator - Shows during generation */}
      {isLoading && (
        <GenerationProgressIndicator
          isGenerating={isLoading}
          stage={isGeneratingSlots.every(s => s) ? 'finalizing' : 'processing'}
          progress={Math.round((isGeneratingSlots.filter(s => !s && outputImageUrls[isGeneratingSlots.indexOf(s)] !== null).length / NUM_IMAGES_TO_GENERATE) * 100)}
          imageCount={NUM_IMAGES_TO_GENERATE}
        />
      )}

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
      <AnimatePresence>
        {isImageViewerOpen && selectedImageUrl && (
          <UnifiedMediaModal
            isOpen={isImageViewerOpen}
            onClose={handleCloseImageViewer}
            title={<DialogTitle>Image Viewer</DialogTitle>}
            description={<DialogDescription>Viewing generated image {(selectedImageIndex ?? 0) + 1} of {NUM_IMAGES_TO_GENERATE}.</DialogDescription>}
            footerRight={
              <>
                <Button variant="outline" onClick={handleCloseImageViewer}>
                  <X className="w-4 h-4 mr-2" /> Close
                </Button>
              </>
            }
          >
            <>
              <MediaSlot>
                <Image
                  src={selectedImageUrl}
                  alt={`Generated Image ${(selectedImageIndex ?? 0) + 1} - Large View`}
                  fill
                  className="object-contain"
                  quality={95}
                />
              </MediaSlot>
              <SidebarSlot>
                <div className="p-4 flex flex-col gap-4">
                  <h3 className="font-semibold">Actions</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {isFaceDetailerServiceAvailable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFaceRetouch(selectedImageIndex!)}
                        disabled={isGeneratingSlots.some(loading => loading) || isFaceRetouchingSlot !== null || isUpscalingSlot !== null || !!originalOutputImageUrls[selectedImageIndex!]}
                      >
                        <UserCheck className="mr-2 h-4 w-4" /> Face Retouch
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpscale(selectedImageIndex!)}
                      disabled={isGeneratingSlots.some(loading => loading) || isUpscalingSlot !== null || isFaceRetouchingSlot !== null || !!originalOutputImageUrls[selectedImageIndex!]}
                    >
                      <Sparkles className="mr-2 h-4 w-4" /> Upscale
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendToVideoPage(outputImageUrls[selectedImageIndex!])}
                      disabled={isGeneratingSlots.some(loading => loading) || isUpscalingSlot !== null || isFaceRetouchingSlot !== null}
                    >
                      <VideoIcon className="mr-2 h-4 w-4" /> Use for Video
                    </Button>
                  </div>
                </div>
              </SidebarSlot>
            </>
          </UnifiedMediaModal>
        )}
      </AnimatePresence>
    </div>
  );
}
