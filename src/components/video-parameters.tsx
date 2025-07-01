// src/components/video-parameters.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; // Added for prompt editing
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings2, Shuffle, Video, AlertTriangle, CheckCircle, Download, PencilLine, Palette as PaletteIcon } from "lucide-react"; // PaletteIcon for Animation & Style section
import { getDisplayableImageUrl } from "@/lib/utils";
import Image from "next/image"; // For displaying prepared image
import { usePromptManager } from '@/hooks/usePromptManager'; // Import the hook
import { uploadToFalStorage } from '@/ai/actions/generate-video';
import {
    PREDEFINED_PROMPTS, MODEL_MOVEMENT_OPTIONS, FABRIC_MOTION_OPTIONS_VIDEO, // Use FABRIC_MOTION_OPTIONS_VIDEO
    CAMERA_ACTION_OPTIONS, AESTHETIC_VIBE_OPTIONS, OptionWithPromptSegment
} from '@/lib/prompt-builder'; // Import all option constants

// Type for video generation parameters
interface VideoGenerationParams {
  selectedPredefinedPrompt: string;
  modelMovement: string;
  fabricMotion: string;
  cameraAction: string;
  aestheticVibe: string;
}

// Types and constants from video-generation/page.tsx
// interface VideoPromptOption { // Now OptionWithPromptSegment from prompt-builder
//   value: string;
//   displayLabel: string;
//   promptSegment: string;
// }

// interface PredefinedPromptOption { // Now OptionWithPromptSegment from prompt-builder
//   value: string;
//   displayLabel: string;
//   promptText: string;
// }

// --- Options & Constants are now imported from prompt-builder.ts ---

const isVideoServiceAvailable = !!process.env.NEXT_PUBLIC_FAL_KEY; // Or however it's determined globally

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


interface RenderSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionWithPromptSegment[]; // Use the imported type
  disabled?: boolean;
  placeholder?: string;
}

const RenderSelectComponent: React.FC<RenderSelectProps> = ({ id, label, value, onChange, options, disabled, placeholder }) => {
  return (
    <div>
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="mt-1 text-sm">
          <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value} className="text-sm">
              {option.displayLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


interface VideoParametersProps {
  preparedImageUrl: string | null; // This is now a data URI
}

export default function VideoParameters({ preparedImageUrl }: VideoParametersProps) {
  const { toast } = useToast();

  // State for video parameters
  const [resolution, setResolution] = useState<'480p' | '720p'>('480p');
  const [duration, setDuration] = useState<'5' | '10'>('5');
  const [seed, setSeed] = useState<string>("-1");
  const [cameraFixed, setCameraFixed] = useState<boolean>(false);

  // Prompt builder states
  const [selectedPredefinedPrompt, setSelectedPredefinedPrompt] = useState<string>('custom');
  const [modelMovement, setModelMovement] = useState<string>(MODEL_MOVEMENT_OPTIONS[0].value);
  const [fabricMotion, setFabricMotion] = useState<string>(FABRIC_MOTION_OPTIONS_VIDEO[0].value);
  const [cameraAction, setCameraAction] = useState<string>(CAMERA_ACTION_OPTIONS[0].value);
  const [aestheticVibe, setAestheticVibe] = useState<string>(AESTHETIC_VIBE_OPTIONS[0].value);

  // Generation states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isUploadingToFal, setIsUploadingToFal] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedSeedValue, setGeneratedSeedValue] = useState<number | null>(null);

  // For webhook-based flow
  const [generationTaskId, setGenerationTaskId] = useState<string | null>(null);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);

  // Check if data URI is provided (not a server URL)
  const isDataUri = preparedImageUrl?.startsWith('data:') || false;
  const commonFormDisabled = isGenerating || isUploadingToFal || !isVideoServiceAvailable || !preparedImageUrl;

  const currentVideoGenParams = React.useMemo((): VideoGenerationParams => ({
    selectedPredefinedPrompt,
    modelMovement,
    fabricMotion, // Ensure this is the video-specific one from prompt-builder if names differ
    cameraAction,
    aestheticVibe,
  }), [selectedPredefinedPrompt, modelMovement, fabricMotion, cameraAction, aestheticVibe]);

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

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedVideoUrl(null);
    setGeneratedSeedValue(null);
    setGenerationTaskId(null);
    setHistoryItemId(null);

    try {
      let imageUrlForVideo = preparedImageUrl;

      // If we have a data URI, convert it to a Fal storage URL
      if (isDataUri) {
        setIsUploadingToFal(true);
        toast({ title: "Uploading Image", description: "Uploading image to Fal.ai storage..." });
        
        try {
          // Convert data URI to Blob
          const imageBlob = dataUriToBlob(preparedImageUrl);
          const imageFile = new File([imageBlob], "prepared-image.jpg", { type: "image/jpeg" });
          
          // Upload to Fal storage
          imageUrlForVideo = await uploadToFalStorage(imageFile);
          toast({ title: "Image Uploaded", description: "Image uploaded successfully. Starting video generation..." });
        } catch (uploadError) {
          console.error("Error uploading to Fal storage:", uploadError);
          toast({ title: "Upload Failed", description: "Failed to upload image to Fal.ai storage.", variant: "destructive" });
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

      const response = await fetch('/api/video/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoInput),
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
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelGeneration = useCallback(() => {
    setIsGenerating(false);
    setGenerationTaskId(null);
    setHistoryItemId(null);
    // TODO: If there's a way to cancel on the backend via taskId, implement here
    toast({ title: "Generation Cancelled", description: "Video generation stopped by user." });
  }, [toast]);


  // Polling for webhook completion (copied from video-generation/page.tsx and simplified)
  useEffect(() => {
    if (!historyItemId || !isGenerating) return;

    const interval = setInterval(async () => {
      try {
        const historyResponse = await fetch('/api/history', { cache: 'no-store' }); // Assuming /api/history fetches all history types
        if (!historyResponse.ok) return;

        const historyData = await historyResponse.json();
        // The history item might be in `videoHistory` or a general list depending on your history structure.
        // Let's assume videoHistory is the primary place, but adapt if needed.
        const targetItem = historyData.videoHistory?.find((item: any) => item.id === historyItemId);

        if (targetItem?.videoGenerationParams?.status === 'completed') {
          clearInterval(interval);
          const finalLocalVideoUrl = targetItem.videoGenerationParams?.localVideoUrl;
          const finalRemoteVideoUrl = targetItem.generatedVideoUrls?.[0] || null;
          setGeneratedVideoUrl(finalLocalVideoUrl || finalRemoteVideoUrl || null);
          setGeneratedSeedValue(targetItem.videoGenerationParams?.seed || null);
          setIsGenerating(false);
          toast({ title: "Video Generated!", description: "Video is ready." });
        } else if (targetItem?.videoGenerationParams?.status === 'failed') {
          clearInterval(interval);
          const errorMessage = targetItem.videoGenerationParams?.error || 'Video generation failed';
          setGenerationError(errorMessage);
          setIsGenerating(false);
          toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
        }
      } catch (error) { console.error("Error checking history:", error); }
    }, 5000); // Check every 5 seconds

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (isGenerating) {
        setIsGenerating(false);
        toast({title: "Generation Timed Out", description: "Taking too long. Check history later.", variant: "default"});
      }
    }, 10 * 60 * 1000); // 10 min timeout

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [historyItemId, isGenerating, toast]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <PaletteIcon className="h-6 w-6 text-primary" />
              Animation & Style
            </CardTitle>
            <CardDescription>Define the video&apos;s motion and aesthetic.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!preparedImageUrl && (
            <div className="md:col-span-2 mb-2 p-3 border rounded-md bg-amber-50 border-amber-200 text-amber-700">
                <p className="text-sm font-medium">Please prepare an image in the previous step to enable video generation.</p>
            </div>
          )}

          <div className="md:col-span-2">
            <RenderSelectComponent
              id="predefinedPrompt" label="Predefined Animation"
              value={selectedPredefinedPrompt} onChange={setSelectedPredefinedPrompt}
              options={PREDEFINED_PROMPTS}
              disabled={commonFormDisabled}
            />
          </div>
          <RenderSelectComponent id="modelMovement" label="Model Movement" value={modelMovement} onChange={setModelMovement} options={MODEL_MOVEMENT_OPTIONS} disabled={commonFormDisabled || selectedPredefinedPrompt !== 'custom'} />
          <RenderSelectComponent id="fabricMotion" label="Fabric Motion" value={fabricMotion} onChange={setFabricMotion} options={FABRIC_MOTION_OPTIONS_VIDEO} disabled={commonFormDisabled || selectedPredefinedPrompt !== 'custom'} />
          <RenderSelectComponent id="cameraAction" label="Camera Action" value={cameraAction} onChange={setCameraAction} options={CAMERA_ACTION_OPTIONS} disabled={commonFormDisabled || selectedPredefinedPrompt !== 'custom'} />
          <RenderSelectComponent id="aestheticVibe" label="Aesthetic Vibe" value={aestheticVibe} onChange={setAestheticVibe} options={AESTHETIC_VIBE_OPTIONS} disabled={commonFormDisabled || selectedPredefinedPrompt !== 'custom'} />

          <div className="md:col-span-2 pt-2 space-y-2">
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
              className="text-xs font-mono"
              placeholder="Prompt will be generated here based on your selections, or you can type your own."
              disabled={commonFormDisabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            Technical Parameters
          </CardTitle>
          <CardDescription>Configure resolution, duration, and other technical settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resolution" className="text-sm">Resolution</Label>
              <Select value={resolution} onValueChange={(v) => setResolution(v as '480p' | '720p')} disabled={commonFormDisabled}>
                <SelectTrigger id="resolution" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="480p" className="text-sm">480p (Faster)</SelectItem><SelectItem value="720p" className="text-sm">720p (Higher Quality)</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration" className="text-sm">Duration</Label>
              <Select value={duration} onValueChange={(v) => setDuration(v as '5' | '10')} disabled={commonFormDisabled}>
                <SelectTrigger id="duration" className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="5" className="text-sm">5 seconds</SelectItem><SelectItem value="10" className="text-sm">10 seconds</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="seed" className="text-sm">Seed</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input id="seed" type="text" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="-1 for random" disabled={commonFormDisabled} className="text-sm"/>
                <Button variant="outline" size="icon" onClick={handleRandomSeed} disabled={commonFormDisabled} title="Use Random Seed"><Shuffle className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:self-center md:pt-5"> {/* Adjusted alignment for switch */}
              <Switch id="cameraFixed" checked={cameraFixed} onCheckedChange={setCameraFixed} disabled={commonFormDisabled} />
              <Label htmlFor="cameraFixed" className="text-sm cursor-pointer">Fix Camera Position</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {!isGenerating ? (
            <Button onClick={handleGenerateVideo} disabled={commonFormDisabled || !currentPrompt.trim()} className="w-full text-lg" size="lg">
              <Video className="mr-2 h-5 w-5" /> Generate Video
            </Button>
          ) : (
            <div className="w-full">
                <div className="flex items-center justify-center text-center space-x-3 p-4 bg-muted rounded-md">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                          {isUploadingToFal ? "Uploading Image..." : "Generating Video..."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isUploadingToFal ? "Uploading to Fal.ai storage..." : "This may take a minute. Check history for results."}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancelGeneration} className="w-full mt-2 text-muted-foreground hover:text-destructive">
                    Cancel Generation
                </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {!isVideoServiceAvailable && (
        <Card className="border-amber-500 bg-amber-50 text-amber-700">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle /> Service Not Available</CardTitle></CardHeader>
          <CardContent><p>Video generation service is not configured.</p></CardContent>
        </Card>
      )}

      {generationError && (
        <Card className="border-destructive bg-destructive/10 text-destructive">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle /> Generation Failed</CardTitle></CardHeader>
          <CardContent><p>{generationError}</p></CardContent>
        </Card>
      )}

      {isGenerating && !generatedVideoUrl && (
        <Card>
            <CardHeader>
                <CardTitle>Generating Video...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-10">
                <div className="aspect-video w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
            </CardContent>
        </Card>
      )}

      {generatedVideoUrl && !isGenerating && ( // Ensure isGenerating is false to show result
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600"><CheckCircle /> Video Ready!</CardTitle>
            {generatedSeedValue !== null && (<CardDescription>Seed used: {generatedSeedValue}</CardDescription>)}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-md overflow-hidden w-full aspect-video">
              <video src={getDisplayableImageUrl(generatedVideoUrl) || undefined} controls autoPlay loop playsInline className="w-full h-full object-contain" />
            </div>
            <Button asChild variant="outline" className="w-full">
              <a href={getDisplayableImageUrl(generatedVideoUrl) || undefined} download={`RefashionAI_video_${generatedSeedValue || Date.now()}.mp4`}><Download className="h-4 w-4 mr-2" />Download Video</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
