// src/components/video-parameters.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { uploadToFalStorage, isFalVideoGenerationAvailable } from '@/ai/actions/generate-video.action';
import { useAuth } from "@/contexts/AuthContext";
import { useActivePreparationImage } from "@/contexts/ImagePreparationContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    PREDEFINED_PROMPTS, MODEL_MOVEMENT_OPTIONS, FABRIC_MOTION_OPTIONS_VIDEO, // Use FABRIC_MOTION_OPTIONS_VIDEO
    CAMERA_ACTION_OPTIONS, AESTHETIC_VIBE_OPTIONS as AESTHETIC_STYLE_OPTIONS
} from "@/lib/prompt-builder";
import { AlertTriangle, CheckCircle, Download, Info, Loader2, PaletteIcon, Settings2, Shuffle, Video, Code, ChevronDown, ChevronUp } from "lucide-react";
import { OptionWithPromptSegment } from "@/lib/prompt-builder";
import { usePromptManager } from "@/hooks/usePromptManager";
import { getDisplayableImageUrl } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateVideoCost, formatPrice, VideoModel, VideoResolution, VideoDuration } from "@/lib/pricing";
import { motion, AnimatePresence } from 'motion/react';


// Type for video generation parameters
interface VideoGenerationParams {
  selectedPredefinedPrompt: string;
  modelMovement: string;
  fabricMotion: string;
  cameraAction: string;
  aestheticVibe: string;
}

// Helper function to convert data URI to Blob
function dataUriToBlob(dataUri: string): Blob {
  const arr = dataUri.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const byteString = atob(arr[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

export default function VideoParameters() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get the active image from the context
  const activeImage = useActivePreparationImage();
  const preparedImageUrl = activeImage?.imageUrl || null;

  // Service availability state
  const [isServiceAvailable, setIsServiceAvailable] = useState(true); // Assume available initially

  // State for video parameters
  const [videoModel, setVideoModel] = useState<VideoModel>('lite');
  const [resolution, setResolution] = useState<VideoResolution>('480p');
  const [duration, setDuration] = useState<VideoDuration>('5');
  const [seed, setSeed] = useState<string>("-1");
  const [cameraFixed, setCameraFixed] = useState<boolean>(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(calculateVideoCost('lite', '480p', '5'));

  // State for preset button selection and accordions
  const [activePreset, setActivePreset] = useState<string | null>(PREDEFINED_PROMPTS[0]?.value || null);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  // Prompt builder states
  const [selectedPredefinedPrompt, setSelectedPredefinedPrompt] = useState<string>(PREDEFINED_PROMPTS[0]?.value || 'custom');
  const [modelMovement, setModelMovement] = useState<string>(MODEL_MOVEMENT_OPTIONS[0].value);
  const [fabricMotion, setFabricMotion] = useState<string>(FABRIC_MOTION_OPTIONS_VIDEO[0].value);
  const [cameraAction, setCameraAction] = useState<string>(CAMERA_ACTION_OPTIONS[0].value);
  const [aestheticVibe, setAestheticVibe] = useState<string>(AESTHETIC_STYLE_OPTIONS[0].value);

  // Generation states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isUploadingToFal, setIsUploadingToFal] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedLocalVideoUrl, setGeneratedLocalVideoUrl] = useState<string | null>(null);

  // Ref for auto-scroll to results
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when generation starts
  useEffect(() => {
    if (isGenerating && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100); // Small delay to ensure the results section is rendered
      return () => clearTimeout(timer);
    }
  }, [isGenerating]);

  // Video parameters are now managed entirely on the client side
  const [generatedSeedValue, setGeneratedSeedValue] = useState<number | null>(null);

  // For webhook-based flow
  const [generationTaskId, setGenerationTaskId] = useState<string | null>(null);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);

  // Check if data URI is provided (not a server URL)
  const isDataUri = preparedImageUrl?.startsWith('data:') || false;
  const commonFormDisabled = isGenerating || isUploadingToFal || !isServiceAvailable || !preparedImageUrl;

  const currentVideoGenParams = React.useMemo((): VideoGenerationParams => ({
    selectedPredefinedPrompt,
    modelMovement,
    fabricMotion, // Ensure this is the video-specific one from prompt-builder if names differ
    cameraAction,
    aestheticVibe,
  }), [selectedPredefinedPrompt, modelMovement, fabricMotion, cameraAction, aestheticVibe]);

  // Handler for when a preset button is clicked
  const handlePresetChange = useCallback((presetValue: string) => {
    setActivePreset(presetValue);
    setSelectedPredefinedPrompt(presetValue);
  }, []);

  // Handler for when a granular animation control is changed
  const handleGranularChange = useCallback( <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
      setter(value);
      setActivePreset(null); // Deselect any active preset button
      setSelectedPredefinedPrompt('custom');
    },
    []
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
    const cost = calculateVideoCost(videoModel, resolution, duration);
    setEstimatedCost(cost);
  }, [videoModel, resolution, duration]);

  // Dynamic resolution options based on the selected model
  const resolutionOptions = React.useMemo(() => {
    if (videoModel === 'pro') {
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
  }, [videoModel]);

  // Effect to reset resolution if it becomes invalid after a model change
  useEffect(() => {
    if (!resolutionOptions.some(opt => opt.value === resolution)) {
      setResolution('480p');
    }
  }, [videoModel, resolution, resolutionOptions]);

  // History loading is now handled by the client-side store

  const handleRandomSeed = () => setSeed("-1");

  const handleGenerateVideo = async () => {
    if (!preparedImageUrl) {
      toast({ title: "Image Not Prepared", description: "Please prepare an image in the previous step.", variant: "destructive" });
      return;
    }
    if (!currentPrompt.trim()) {
      toast({ title: "Missing Prompt", description: "Prompt is empty. Please select options or modify it.", variant: "destructive" });
      return;
    }
    if (!user?.username) {
        toast({ title: "Authentication Error", description: "Could not determine current user. Please log in again.", variant: "destructive" });
        return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedVideoUrl(null);
    setGeneratedLocalVideoUrl(null);
    setGeneratedSeedValue(null);
    setGenerationTaskId(null);
    setHistoryItemId(null);

    try {
      let imageUrlForVideo: string = preparedImageUrl || '';

      // If we have a data URI, convert it to a Fal storage URL
      if (isDataUri) {
        setIsUploadingToFal(true);
        // Use a single toast and update it after upload
        const { update, dismiss, id: toastId } = toast({ 
          title: "Uploading Image...", 
          description: "Preparing your image for video generation." 
        });
        try {
          // Convert data URI to Blob
          const imageBlob = dataUriToBlob(preparedImageUrl);
          const imageFile = new File([imageBlob], "prepared-image.jpg", { type: "image/jpeg" });
          // Upload to Fal storage
          const uploadedUrl = await uploadToFalStorage(imageFile, user.username);
          imageUrlForVideo = uploadedUrl;
          update({ id: toastId, title: "Image Uploaded!", description: "Starting video generation..." });
        } catch (uploadError) {
          console.error("Error uploading to Fal storage:", uploadError);
          update({ id: toastId, title: "Upload Failed", description: "Failed to upload image to Fal.ai storage.", variant: "destructive" });
          setIsGenerating(false);
          setIsUploadingToFal(false);
          return;
        } finally {
          setIsUploadingToFal(false);
        }
      }

      const videoInput = {
        prompt: currentPrompt,
        image_url: imageUrlForVideo,
        local_image_path: preparedImageUrl, // Always pass the original local path for history storage
        videoModel,
        resolution,
        duration,
        seed: seed === "-1" ? -1 : parseInt(seed),
        camera_fixed: cameraFixed,
        selectedPredefinedPrompt,
        modelMovement,
        fabricMotion,
        cameraAction,
        aestheticVibe,
      };

      // CACHE-STRATEGY: Policy: Dynamic - This is a client-side POST request to initiate a server action. It must never be cached.
      const response = await fetch('/api/video/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoInput),
        // Explicitly set no-store to satisfy the linter for this dynamic action.
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to start generation: ${response.statusText}` }));
        throw new Error(errorData.error || `Failed to start generation: ${response.statusText}`);
      }

      const { taskId, historyItemId: hId } = await response.json();
      setGenerationTaskId(taskId);
      setHistoryItemId(hId);

      toast({
        title: "Video Generation Started",
        description: "Processing in background. Result will appear here and in history.",
        duration: 5000
      });

    } catch (error) {
      console.error('Error initiating video generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
      setGenerationError(errorMessage);
      toast({ title: "Generation Error", description: errorMessage, variant: "destructive" });
      setIsGenerating(false); // Set to false only on error
    }
  };

  const handleCancelGeneration = useCallback(() => {
    setIsGenerating(false);
    setGenerationTaskId(null);
    setHistoryItemId(null);
    // TODO: If there's a way to cancel on the backend via taskId, implement here
    toast({ title: "Generation Cancelled", description: "Video generation stopped by user." });
  }, [toast]);


  // Efficient video status polling using dedicated endpoint
  useEffect(() => {
    if (!historyItemId || !isGenerating) return;

    let isCancelled = false;
    const poll = async () => {
      if (isCancelled) return;

      try {
        // Call the new, specific endpoint
        const response = await fetch(`/api/history/${historyItemId}/status`, { cache: 'no-store' });

        if (!response.ok) {
          // Stop polling on server errors like 404 or 500
          console.error(`Status check failed: ${response.status}`);
          setGenerationError(`Status check failed: ${response.statusText}`);
          setIsGenerating(false);
          return;
        }

        const data: import('@/services/database.service').VideoStatusPayload = await response.json();

        if (data.status === 'completed') {
          setGeneratedVideoUrl(data.videoUrl || null);
          setGeneratedLocalVideoUrl(data.localVideoUrl || null);
          setGeneratedSeedValue(data.seed || null);
          setIsGenerating(false);
          toast({ title: "Video Generated!", description: "Video is ready." });
          
          // Refresh history gallery if available
          if (typeof (window as any).refreshHistoryGallery === 'function') {
            (window as any).refreshHistoryGallery();
          }
        } else if (data.status === 'failed') {
          setGenerationError(data.error || 'Video generation failed');
          setIsGenerating(false);
          toast({ title: "Generation Failed", description: data.error || 'An unknown error occurred.', variant: "destructive" });
        } else {
          // Still processing, schedule the next poll
          setTimeout(poll, 5000); 
        }

      } catch (error) {
        console.error("Error checking video status:", error);
        // Don't stop polling on network errors, just try again
        setTimeout(poll, 5000);
      }
    };

    // Start the first poll
    poll();

    // Safety timeout
    const timeout = setTimeout(() => {
      if (isGenerating) {
          isCancelled = true;
          setIsGenerating(false);
          toast({ title: "Generation Timed Out", description: "Taking too long. Check history later." });
      }
    }, 10 * 60 * 1000); // 10 min timeout

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [historyItemId, isGenerating, toast]);

  // Effect to simulate progress during generation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | undefined;
    if (isGenerating && !generatedVideoUrl) {
      setProgressValue(10); // Start with a small amount
      progressInterval = setInterval(() => {
        setProgressValue(prev => {
          if (prev >= 95) { // Cap progress before completion
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 3) + 1; // Increment slowly and randomly
        });
      }, 800);
    } else {
      setProgressValue(0);
    }
    return () => clearInterval(progressInterval);
  }, [isGenerating, generatedVideoUrl]);


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
        <CardContent className="space-y-6">
          {!preparedImageUrl && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Start with an Image</AlertTitle>
              <AlertDescription>
                First, upload and prepare an image to bring it to life with video.
              </AlertDescription>
            </Alert>
          )}

          <div className={commonFormDisabled ? 'opacity-50 pointer-events-none' : ''}>
            <div>
              <Label className="text-sm font-medium">Select a starting point for your video&apos;s motion:</Label>
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
                      <Select value={modelMovement} onValueChange={(v) => handleGranularChange(setModelMovement, v)} disabled={commonFormDisabled}>
                        <SelectTrigger id="model-movement" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{MODEL_MOVEMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fabric-motion" className="text-sm">Fabric Motion</Label>
                      <Select value={fabricMotion} onValueChange={(v) => handleGranularChange(setFabricMotion, v)} disabled={commonFormDisabled}>
                        <SelectTrigger id="fabric-motion" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{FABRIC_MOTION_OPTIONS_VIDEO.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="camera-action" className="text-sm">Camera Action</Label>
                      <Select value={cameraAction} onValueChange={(v) => handleGranularChange(setCameraAction, v)} disabled={commonFormDisabled}>
                        <SelectTrigger id="camera-action" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{CAMERA_ACTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="aesthetic-vibe" className="text-sm">Aesthetic Vibe</Label>
                      <Select value={aestheticVibe} onValueChange={(v) => handleGranularChange(setAestheticVibe, v)} disabled={commonFormDisabled}>
                        <SelectTrigger id="aesthetic-vibe" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{AESTHETIC_STYLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.displayLabel}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="cameraFixed" checked={cameraFixed} onCheckedChange={setCameraFixed} disabled={commonFormDisabled} />
                    <Label htmlFor="cameraFixed" className="text-sm cursor-pointer">Fix Camera Position</Label>
                  </div>
                   <div className="pt-2">
                     <div className="flex justify-between items-center">
                       <Label htmlFor="fullVideoPrompt" className="text-sm">Full Prompt</Label>
                       {isManualPromptOutOfSync() && (
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
                    <Select value={videoModel} onValueChange={(v: string) => setVideoModel(v as VideoModel)} disabled={commonFormDisabled}>
                      <SelectTrigger id="video-model" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lite">Seedance Lite (Default)</SelectItem>
                        <SelectItem value="pro">Seedance Pro (Higher Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resolution" className="text-sm">Resolution</Label>
                    <Select value={resolution} onValueChange={(v: string) => setResolution(v as VideoResolution)} disabled={commonFormDisabled}>
                      <SelectTrigger id="resolution" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {resolutionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-sm">
                            <div className="flex justify-between w-full items-center">
                              <span>{option.displayLabel}</span>
                              <span className="text-xs text-muted-foreground ml-2">{formatPrice(calculateVideoCost(videoModel, option.value as VideoResolution, duration))}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-sm">Duration</Label>
                    <Select value={duration} onValueChange={(v: string) => setDuration(v as VideoDuration)} disabled={commonFormDisabled}>
                      <SelectTrigger id="duration" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(d => (
                           <SelectItem key={d} value={d} className="text-sm">
                             <div className="flex justify-between w-full items-center">
                               <span>{d} seconds</span>
                               <span className="text-xs text-muted-foreground ml-2">{formatPrice(calculateVideoCost(videoModel, resolution, d as VideoDuration))}</span>
                             </div>
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="seed" className="text-sm">Seed</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="seed" type="text" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="-1 for random" disabled={commonFormDisabled} className="text-sm"/>
                      <Button variant="outline" size="icon" onClick={handleRandomSeed} disabled={commonFormDisabled} title="Use Random Seed"><Shuffle className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="default"
            onClick={handleGenerateVideo}
            disabled={commonFormDisabled || isGenerating || !currentPrompt.trim()}
            className="w-full text-lg hover:animate-shimmer"
            size="lg"
          >
            {isGenerating ? (
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
                {estimatedCost !== null && !isGenerating && (
                  <Badge variant="secondary" className="absolute right-0 text-base">
                    {formatPrice(estimatedCost)}
                  </Badge>
                )}
              </div>
            )}
          </Button>
        </CardFooter>
      </Card>

      {!isServiceAvailable && (
        <Card variant="glass" className="border-amber-500 bg-amber-50 text-amber-700">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle /> Service Not Available</CardTitle></CardHeader>
          <CardContent><p>Video generation service is not configured.</p></CardContent>
        </Card>
      )}

      {generationError && (
        <Card variant="glass" className="border-destructive bg-destructive/10 text-destructive">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle /> Generation Failed</CardTitle></CardHeader>
          <CardContent><p>{generationError}</p></CardContent>
        </Card>
      )}

      {isGenerating && !generatedVideoUrl && (
        <Card ref={resultsRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              {isUploadingToFal ? "Uploading Image..." : "Generating Video..."}
            </CardTitle>
            <CardDescription>
              Your video is being processed. This may take a minute. Please wait.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-10">
            <div className="w-full max-w-md space-y-4">
              <div className="aspect-video bg-muted/50 rounded-md flex items-center justify-center relative overflow-hidden">
                <Video className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <Progress 
                value={progressValue}
                isEstimating={true}
                className="h-2"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelGeneration}
              className="w-full text-muted-foreground hover:text-destructive"
            >
              Cancel Generation
            </Button>
          </CardFooter>
        </Card>
      )}

      {generatedVideoUrl && !isGenerating && ( // Ensure isGenerating is false to show result
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600"><CheckCircle /> Video Ready!</CardTitle>
            {generatedSeedValue !== null && (<CardDescription>Seed used: {generatedSeedValue}</CardDescription>)}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md overflow-hidden w-full aspect-video">
              <video src={getDisplayableImageUrl(generatedVideoUrl) || undefined} controls autoPlay loop playsInline className="w-full h-full object-contain" />
            </div>
            <Button asChild variant="outline" className="w-full">
              <a href={getDisplayableImageUrl(generatedLocalVideoUrl || generatedVideoUrl) || undefined} download={`RefashionAI_video_${generatedSeedValue || Date.now()}.mp4`}><Download className="h-4 w-4 mr-2" />Download Video</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
