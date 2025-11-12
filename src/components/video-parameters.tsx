// src/components/video-parameters.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isFalVideoGenerationAvailable, generateVideoAction, type VideoGenerationFormState } from '@/ai/actions/generate-video.action';
import { useActivePreparationImage } from "@/contexts/ImagePreparationContext";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    PREDEFINED_PROMPTS, MODEL_MOVEMENT_OPTIONS, FABRIC_MOTION_OPTIONS_VIDEO, // Use FABRIC_MOTION_OPTIONS_VIDEO
    CAMERA_ACTION_OPTIONS, AESTHETIC_VIBE_OPTIONS as AESTHETIC_STYLE_OPTIONS
} from "@/lib/prompt-builder";
import { AlertTriangle, Info, Loader2, PaletteIcon, Settings2, Shuffle, Video, Code, ChevronDown, ChevronUp } from "lucide-react";
import { OptionWithPromptSegment } from "@/lib/prompt-builder";
import { usePromptManager } from "@/hooks/usePromptManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateVideoCost, formatPrice, VideoModel, VideoResolution, VideoDuration } from "@/lib/pricing";
import { motion, AnimatePresence } from 'motion/react';
import { COMMON_VARIANTS } from '@/lib/motion-constants';


// Type for video generation parameters
interface VideoGenerationParams {
  selectedPredefinedPrompt: string;
  modelMovement: string;
  fabricMotion: string;
  cameraAction: string;
  aestheticVibe: string;
}

// REMOVED: dataUriToBlob helper - server action handles image upload

// SubmitButton component using useFormStatus for pending state
function SubmitButton({ 
  preparedImageUrl, 
  currentPrompt, 
  estimatedCost 
}: { 
  preparedImageUrl: string | null; 
  currentPrompt: string;
  estimatedCost: number | null;
}) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="submit"
      variant="default"
      disabled={pending || !preparedImageUrl || !currentPrompt.trim()}
      className="w-full text-lg hover:animate-shimmer"
      size="lg"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Generating...
        </>
      ) : (
        <div className="flex items-center justify-center w-full relative">
          <div className="flex items-center justify-center">
            <Video className="mr-2 h-5 w-5" />
            <span>Generate Video</span>
          </div>
          {estimatedCost !== null && !pending && (
            <Badge variant="secondary" className="absolute right-0 text-base">
              {formatPrice(estimatedCost)}
            </Badge>
          )}
        </div>
      )}
    </Button>
  );
}

export default function VideoParameters() {
  const { toast } = useToast();
  const incrementGenerationCount = useGenerationSettingsStore(state => state.incrementGenerationCount);
  // REMOVED: useAuth - authentication handled by server action
  
  // Get the active image from the context
  const activeImage = useActivePreparationImage();
  const preparedImageUrl = activeImage?.imageUrl || null;

  // Get video settings from Zustand store - read and write directly
  const videoSettings = useGenerationSettingsStore(state => state.videoSettings);
  const setVideoSettings = useGenerationSettingsStore(state => state.setVideoSettings);

  // NEW: useActionState for form-based video generation
  const initialState: VideoGenerationFormState = { message: '' };
  const [formState, formAction, isPending] = useActionState(generateVideoAction, initialState);

  // Service availability state
  const [isServiceAvailable, setIsServiceAvailable] = useState(true); // Assume available initially

  // Local UI state only (not duplicating store values)
  const [estimatedCost, setEstimatedCost] = useState<number | null>(calculateVideoCost(videoSettings.videoModel, videoSettings.resolution, videoSettings.duration as VideoDuration));
  const [activePreset, setActivePreset] = useState<string | null>(videoSettings.selectedPredefinedPrompt);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  // REMOVED: Manual generation states - replaced with isPending from useActionState
  // const [isGenerating, setIsGenerating] = useState<boolean>(false);
  // const [isUploadingToFal, setIsUploadingToFal] = useState<boolean>(false);
  // const [generationError, setGenerationError] = useState<string | null>(null);
  // const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  // const [generatedLocalVideoUrl, setGeneratedLocalVideoUrl] = useState<string | null>(null);

  // Ref for auto-scroll to results
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when generation starts
  useEffect(() => {
    if (isPending && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100); // Small delay to ensure the results section is rendered
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  // Video parameters are now managed entirely on the client side
  // REMOVED: const [generatedSeedValue, setGeneratedSeedValue] = useState<number | null>(null);

  // Webhook-based flow - task tracking removed (webhook updates DB directly)

  // REMOVED: isDataUri check - server action handles all image formats
  const commonFormDisabled = isPending || !isServiceAvailable || !preparedImageUrl;

  const currentVideoGenParams = React.useMemo((): VideoGenerationParams => ({
    selectedPredefinedPrompt: videoSettings.selectedPredefinedPrompt,
    modelMovement: videoSettings.modelMovement,
    fabricMotion: videoSettings.fabricMotion,
    cameraAction: videoSettings.cameraAction,
    aestheticVibe: videoSettings.aestheticVibe,
  }), [videoSettings.selectedPredefinedPrompt, videoSettings.modelMovement, videoSettings.fabricMotion, videoSettings.cameraAction, videoSettings.aestheticVibe]);

  // Handler for when a preset button is clicked
  const handlePresetChange = useCallback((presetValue: string) => {
    setActivePreset(presetValue);
    setVideoSettings({ selectedPredefinedPrompt: presetValue });
  }, [setVideoSettings]);

  // Handler for when a granular animation control is changed
  const handleGranularChange = useCallback((key: string, value: string) => {
      setVideoSettings({ [key]: value });
      setActivePreset(null); // Deselect any active preset button
      setVideoSettings({ selectedPredefinedPrompt: 'custom' });
    },
    [setVideoSettings]
  );

  // Effect to automatically select the first preset on mount or image change
  useEffect(() => {
    const firstPreset = PREDEFINED_PROMPTS[0];
    if (firstPreset) {
      handlePresetChange(firstPreset.value);
    }
  }, [preparedImageUrl, handlePresetChange]);

  const {
    currentPrompt,
    isPromptManuallyEdited,
    handlePromptChange,
    resetPromptToAuto,
    isManualPromptOutOfSync,
  } = usePromptManager({
    generationType: 'video',
    generationParams: currentVideoGenParams,
  });

  // Effect to check for service availability on the server
  useEffect(() => {
    isFalVideoGenerationAvailable().then(result => {
      setIsServiceAvailable(result.available);
    });
  }, []);

  // Effect to calculate and update the estimated cost  
  useEffect(() => {
    const cost = calculateVideoCost(videoSettings.videoModel, videoSettings.resolution, videoSettings.duration as VideoDuration);
    setEstimatedCost(cost);
  }, [videoSettings.videoModel, videoSettings.resolution, videoSettings.duration]);

  // Dynamic resolution options based on the selected model
  const resolutionOptions = React.useMemo(() => {
    if (videoSettings.videoModel === 'pro') {
      return [
        { value: '480p', displayLabel: '480p (Faster)', promptSegment: '' },
        { value: '1080p', displayLabel: '1080p (Higher Quality)', promptSegment: '' },
      ];
    }
    // Default to 'lite' model resolutions
    return [
      { value: '480p', displayLabel: '480p (Faster)', promptSegment: '' },
      { value: '720p', displayLabel: '720p (Higher Quality)', promptSegment: '' },
    ];
  }, [videoSettings.videoModel]);

  // Effect to reset resolution if it becomes invalid after a model change
  useEffect(() => {
    if (!resolutionOptions.some(opt => opt.value === videoSettings.resolution)) {
      setVideoSettings({ resolution: '480p' });
    }
  }, [videoSettings.videoModel, videoSettings.resolution, resolutionOptions, setVideoSettings]);

  // History loading is now handled by the client-side store

  const handleRandomSeed = () => setVideoSettings({ seed: "-1" });

  // REMOVED: handleGenerateVideo - replaced with form-based submission via useActionState
  // The form action will be handled by formAction from useActionState

  // Effect to handle form submission results
  useEffect(() => {
    if (formState.message) {
      if (formState.error) {
        // Error case
        toast({ 
          title: "Video Generation Failed", 
          description: formState.error, 
          variant: "destructive" 
        });
      } else if (formState.taskId && formState.historyItemId) {
        // Success case - trigger history gallery refresh
        incrementGenerationCount();
        toast({
          title: "Video Generation Started",
          description: formState.message,
          duration: 5000
        });
      }
    }
  }, [formState, toast, incrementGenerationCount]);

  // REMOVED: handleCancelGeneration and progress simulation
  // Webhook-based completion means no client-side polling needed


  return (
    <div className="space-y-6">
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <PaletteIcon className="h-6 w-6 text-primary" />
              Animation & Video Settings
            </CardTitle>
            <CardDescription>Define your video&apos;s motion, style, and technical details.</CardDescription>
          </div>
        </CardHeader>
        <form action={formAction}>
          {/* Hidden inputs for all video generation parameters */}
          <input type="hidden" name="prompt" value={currentPrompt} />
          <input type="hidden" name="imageUrl" value={preparedImageUrl || ''} />
          <input type="hidden" name="localImagePath" value={preparedImageUrl || ''} />
          <input type="hidden" name="videoModel" value={videoSettings.videoModel} />
          <input type="hidden" name="resolution" value={videoSettings.resolution} />
          <input type="hidden" name="duration" value={videoSettings.duration} />
          <input type="hidden" name="seed" value={videoSettings.seed} />
          <input type="hidden" name="cameraFixed" value={String(videoSettings.cameraFixed)} />
          <input type="hidden" name="selectedPredefinedPrompt" value={videoSettings.selectedPredefinedPrompt} />
          <input type="hidden" name="modelMovement" value={videoSettings.modelMovement} />
          <input type="hidden" name="fabricMotion" value={videoSettings.fabricMotion} />
          <input type="hidden" name="cameraAction" value={videoSettings.cameraAction} />
          <input type="hidden" name="aestheticVibe" value={videoSettings.aestheticVibe} />
          
        <CardContent className="space-y-6">
          <AnimatePresence>
            {!preparedImageUrl && (
              <motion.div
                key="image-required-alert"
                variants={COMMON_VARIANTS.slideDownAndFade}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Start with an Image</AlertTitle>
                  <AlertDescription>
                    First, upload and prepare an image to bring it to life with video.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={commonFormDisabled ? 'opacity-50 pointer-events-none' : ''}>
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {PREDEFINED_PROMPTS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={activePreset === preset.value ? 'secondary' : 'outline'}
                    onClick={() => handlePresetChange(preset.value)}
                    className="h-auto py-2 px-3 text-xs sm:text-sm whitespace-normal"
                  >
                    {preset.displayLabel}
                  </Button>
                ))}
              </div>
            </div>

            <Accordion type="multiple" value={openAccordions} onValueChange={setOpenAccordions} className="w-full mt-4">
              <AccordionItem value="advanced-animation">
                <AccordionTrigger>Advanced Animation & Style</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="model-movement" className="text-sm">Model Movement</Label>
                      <Select value={videoSettings.modelMovement} onValueChange={(v) => handleGranularChange('modelMovement', v)} disabled={commonFormDisabled}>
                        <SelectTrigger id="model-movement" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{MODEL_MOVEMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fabric-motion" className="text-sm">Fabric Motion</Label>
                      <Select value={videoSettings.fabricMotion} onValueChange={(v) => handleGranularChange('fabricMotion', v)} disabled={commonFormDisabled}>
                        <SelectTrigger id="fabric-motion" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{FABRIC_MOTION_OPTIONS_VIDEO.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="camera-action" className="text-sm">Camera Action</Label>
                      <Select value={videoSettings.cameraAction} onValueChange={(v) => handleGranularChange('cameraAction', v)} disabled={commonFormDisabled}>
                        <SelectTrigger id="camera-action" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{CAMERA_ACTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="aesthetic-vibe" className="text-sm">Aesthetic Vibe</Label>
                      <Select value={videoSettings.aestheticVibe} onValueChange={(v) => handleGranularChange('aestheticVibe', v)} disabled={commonFormDisabled}>
                        <SelectTrigger id="aesthetic-vibe" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{AESTHETIC_STYLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="cameraFixed" checked={videoSettings.cameraFixed} onCheckedChange={(checked) => setVideoSettings({ cameraFixed: checked })} disabled={commonFormDisabled} />
                    <Label htmlFor="cameraFixed" className="text-sm cursor-pointer">Fix Camera Position</Label>
                  </div>
                   <div className="pt-2">
                     <div className="flex justify-between items-center">
                       <Label htmlFor="fullVideoPrompt" className="text-sm">Full Prompt</Label>
                       {isManualPromptOutOfSync && (
                         <Button variant="link" size="sm" onClick={resetPromptToAuto} className="text-xs text-amber-600 hover:text-amber-700 p-0 h-auto">
                           <AlertTriangle className="h-3 w-3 mr-1" /> Settings changed. Reset prompt?
                         </Button>
                       )}
                     </div>
                     <Textarea
                       id="fullVideoPrompt"
                       value={currentPrompt}
                       onChange={(e) => handlePromptChange(e.target.value)}
                       rows={3}
                       className="text-xs font-mono mt-1"
                       placeholder="Prompt will be generated here based on your selections, or you can type your own."
                       disabled={commonFormDisabled}
                     />
                   </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="video-settings">
                <AccordionTrigger>Video Settings</AccordionTrigger>
                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="video-model" className="text-sm">Video Model</Label>
                    <Select value={videoSettings.videoModel} onValueChange={(v: string) => setVideoSettings({ videoModel: v as VideoModel })} disabled={commonFormDisabled}>
                      <SelectTrigger id="video-model" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lite">Seedance Lite (Default)</SelectItem>
                        <SelectItem value="pro">Seedance Pro (Higher Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resolution" className="text-sm">Resolution</Label>
                    <Select value={videoSettings.resolution} onValueChange={(v: string) => setVideoSettings({ resolution: v as VideoResolution })} disabled={commonFormDisabled}>
                      <SelectTrigger id="resolution" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {resolutionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-sm">
                            <div className="flex justify-between w-full items-center">
                              <span>{option.displayLabel}</span>
                              <span className="text-xs text-muted-foreground ml-2">{formatPrice(calculateVideoCost(videoSettings.videoModel, option.value as VideoResolution, videoSettings.duration as VideoDuration))}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-sm">Duration</Label>
                    <Select value={videoSettings.duration} onValueChange={(v: string) => setVideoSettings({ duration: v as VideoDuration })} disabled={commonFormDisabled}>
                      <SelectTrigger id="duration" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(d => (
                           <SelectItem key={d} value={d} className="text-sm">
                             <div className="flex justify-between w-full items-center">
                               <span>{d} seconds</span>
                               <span className="text-xs text-muted-foreground ml-2">{formatPrice(calculateVideoCost(videoSettings.videoModel, videoSettings.resolution, d as VideoDuration))}</span>
                             </div>
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="seed" className="text-sm">Seed</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="seed" type="text" value={videoSettings.seed} onChange={(e) => setVideoSettings({ seed: e.target.value })} placeholder="-1 for random" disabled={commonFormDisabled} className="text-sm"/>
                      <Button variant="outline" size="icon" onClick={handleRandomSeed} disabled={commonFormDisabled} title="Use Random Seed"><Shuffle className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton 
            preparedImageUrl={preparedImageUrl} 
            currentPrompt={currentPrompt}
            estimatedCost={estimatedCost}
          />
        </CardFooter>
        </form>
      </Card>

      {!isServiceAvailable && (
        <Card variant="glass" className="border-amber-500 bg-amber-50 text-amber-700">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle /> Service Not Available</CardTitle></CardHeader>
          <CardContent><p>Video generation service is not configured.</p></CardContent>
        </Card>
      )}

      {/* REMOVED: Error, processing, and result display sections
          Video generation is webhook-based - results appear in History tab */}
    </div>
  );
}
