// src/components/ImageProcessingTools.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useImagePreparation, useActivePreparationImage } from "@/contexts/ImagePreparationContext";
import { useToast } from "@/hooks/use-toast";
import {
  isBackgroundRemovalAvailable as checkBgAvailable,
} from "@/ai/actions/remove-background.action";
import {
  isUpscaleServiceAvailable as checkUpscaleAvailable,
  isFaceDetailerAvailable as checkFaceDetailerAvailable
} from "@/ai/actions/upscale-image.action";
import { 
  Wand2, Sparkles, UserCheck, CheckCircle, Loader2 
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

// --- Reusable Row Component for a consistent look ---
interface ProcessingToolRowProps {
  icon: React.ElementType;
  label: string;
  onApply: () => void;
  isApplied: boolean;
  isProcessing: boolean;
  isDisabled: boolean;
}

const ProcessingToolRow: React.FC<ProcessingToolRowProps> = ({
  icon: Icon, label, onApply, isApplied, isProcessing, isDisabled
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
    <Label className="flex items-center gap-2 font-medium">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Label>
    {isApplied ? (
      <Badge variant="secondary" className="pointer-events-none">
        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
        Applied
      </Badge>
    ) : (
      <Button onClick={onApply} variant="secondary" size="sm" disabled={isProcessing || isDisabled}>
        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
      </Button>
    )}
  </div>
);


interface ImageProcessingToolsProps {
  preparationMode: 'image' | 'video';
  disabled?: boolean;
}

export default function ImageProcessingTools({ preparationMode, disabled = false }: ImageProcessingToolsProps) {
  const { toast } = useToast();
  const {
    removeBackground,
    upscaleImage,
    faceDetailer,
    isProcessing,
    processingStep,
    setActiveVersion,
    versions
  } = useImagePreparation();
  
  const activeImage = useActivePreparationImage();
  const { user } = useAuth();

  // Service availability state
  const [isBgRemovalAvailable, setIsBgRemovalAvailable] = useState(false);
  const [isUpscalingAvailable, setIsUpscalingAvailable] = useState(false);
  const [isFaceDetailerAvailable, setIsFaceDetailerAvailable] = useState(false);

  // --- Effects ---
  useEffect(() => {
    // Check service availability on mount
    checkBgAvailable().then(setIsBgRemovalAvailable);
    checkUpscaleAvailable().then(setIsUpscalingAvailable);
    checkFaceDetailerAvailable().then(setIsFaceDetailerAvailable);
  }, []);

  // Don't render if no active image
  if (!activeImage) {
    return null;
  }

  // Computed states based on version labels
  const isBgRemoved = activeImage.label.includes('Background Removed');
  const isUpscaled = activeImage.label.includes('Upscaled');
  const isFaceDetailed = activeImage.label.includes('Face Enhanced');

  // --- Event Handlers ---
  const handleApplyBackgroundRemoval = async () => {
    if (!user?.username) return toast({ title: 'Authentication Error', variant: 'destructive' });
    try {
      await removeBackground(user.username);
      toast({ title: 'Background Removed', description: 'A new version has been created.' });
    } catch (error) {
      toast({
        title: 'Background Removal Failed',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  };

  const handleUpscaleImage = async () => {
    if (!user?.username) return toast({ title: 'Authentication Error', variant: 'destructive' });
    try {
      await upscaleImage(user.username);
      toast({ title: 'Image Upscaled', description: 'Your image has been upscaled successfully.' });
    } catch (error) {
      toast({ 
        title: 'Upscaling Failed', 
        description: (error as Error).message, 
        variant: 'destructive' 
      });
    }
  };

  const handleFaceDetailer = async () => {
    if (!user?.username) return toast({ title: 'Authentication Error', variant: 'destructive' });
    try {
      await faceDetailer(user.username);
      toast({ title: 'Face Details Enhanced', description: 'Face details have been enhanced successfully.' });
    } catch (error) {
      toast({ 
        title: 'Face Enhancement Failed', 
        description: (error as Error).message, 
        variant: 'destructive' 
      });
    }
  };

  const isToolDisabled = disabled || isProcessing;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Processing Tools</h3>
      <div className="space-y-2">
        {/* Background Removal */}
        {isBgRemovalAvailable && (
          <ProcessingToolRow
            icon={Wand2}
            label="Remove Background"
            onApply={handleApplyBackgroundRemoval}
            isApplied={isBgRemoved}
            isProcessing={isProcessing && processingStep === 'bg'}
            isDisabled={isToolDisabled || isUpscaled} // Can't remove BG after upscaling
          />
        )}
  
        {/* Upscale Image - Only for video mode */}
        {preparationMode === 'video' && isUpscalingAvailable && (
          <ProcessingToolRow
            icon={Sparkles}
            label="Upscale Image"
            onApply={handleUpscaleImage}
            isApplied={isUpscaled}
            isProcessing={isProcessing && processingStep === 'upscale'}
            isDisabled={isToolDisabled}
          />
        )}
  
        {/* Face Detailer - Only for video mode */}
        {preparationMode === 'video' && isFaceDetailerAvailable && (
          <ProcessingToolRow
            icon={UserCheck}
            label="Face Detailer"
            onApply={handleFaceDetailer}
            isApplied={isFaceDetailed}
            isProcessing={isProcessing && processingStep === 'face'}
            isDisabled={isToolDisabled}
          />
        )}
      </div>
    </div>
  );
}
