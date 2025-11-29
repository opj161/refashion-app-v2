// src/components/ImageProcessingTools.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useImageStore } from "@/stores/imageStore";
import { useToast } from "@/hooks/use-toast";
import { useShallow } from 'zustand/react/shallow';
import {
  isBackgroundRemovalAvailable as checkBgAvailable,
} from "@/ai/actions/remove-background.action";
import {
  isUpscaleServiceAvailable as checkUpscaleAvailable,
  isFaceDetailerAvailable as checkFaceDetailerAvailable
} from "@/ai/actions/upscale-image.action";
import {
  Wand2, Sparkles, UserCheck, CheckCircle, Loader2, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Undo2, Redo2
} from "lucide-react";


// --- Reusable Row Component for a consistent look ---
interface ProcessingToolRowProps {
  icon: React.ElementType;
  label: string;
  onApply: () => void;
  isApplied: boolean;
  isProcessing: boolean;
  isDisabled: boolean;
}

const ProcessingToolRow = ({
  icon: Icon, label, onApply, isApplied, isProcessing, isDisabled
}: ProcessingToolRowProps) => (
  <div 
    className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors gap-4"
  >
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
  
  // OPTIMIZATION: Use useShallow for granular selection
  const {
    versions,
    activeVersionId,
    versionHistory,
    historyIndex,
    removeBackground,
    upscaleImage,
    faceDetailer,
    rotateImageLeft,
    rotateImageRight,
    flipHorizontal,
    flipVertical,
    undo,
    redo,
  } = useImageStore(
    useShallow(state => ({
      versions: state.versions,
      activeVersionId: state.activeVersionId,
      versionHistory: state.versionHistory,
      historyIndex: state.historyIndex,
      removeBackground: state.removeBackground,
      upscaleImage: state.upscaleImage,
      faceDetailer: state.faceDetailer,
      rotateImageLeft: state.rotateImageLeft,
      rotateImageRight: state.rotateImageRight,
      flipHorizontal: state.flipHorizontal,
      flipVertical: state.flipVertical,
      undo: state.undo,
      redo: state.redo,
    }))
  );
  
  const activeImage = activeVersionId ? versions[activeVersionId] : null;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < versionHistory.length - 1;

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

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

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
    try {
      await removeBackground();
      // Toast is now handled by the optimistic action wrapper
    } catch (error) {
      // Error toast is also handled by the optimistic action wrapper
      console.error('Background removal error:', error);
    }
  };

  const handleUpscaleImage = async () => {
    try {
      await upscaleImage();
      // Toast is now handled by the optimistic action wrapper
    } catch (error) {
      // Error toast is also handled by the optimistic action wrapper
      console.error('Upscale error:', error);
    }
  };

  const handleFaceDetailer = async () => {
    try {
      await faceDetailer();
      // Toast is now handled by the optimistic action wrapper
    } catch (error) {
      // Error toast is also handled by the optimistic action wrapper
      console.error('Face detailer error:', error);
    }
  };

  // Check if ANY version is currently in an optimistic 'processing' state.
  const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');
  
  // The master disable flag
  const isToolDisabled = disabled || isAnyVersionProcessing;

  return (
    <div className="space-y-4">
      {/* --- Undo/Redo Tools --- */}
      <div>
        <h3 className="font-semibold text-sm mb-3">History</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={undo} 
            variant="outline" 
            size="sm" 
            disabled={!canUndo || isToolDisabled}
            className="flex items-center gap-2"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
            <kbd className="ml-auto text-[10px] bg-muted px-1 rounded-sm">Ctrl+Z</kbd>
          </Button>
          <Button 
            onClick={redo} 
            variant="outline" 
            size="sm" 
            disabled={!canRedo || isToolDisabled}
            className="flex items-center gap-2"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span>Redo</span>
            <kbd className="ml-auto text-[10px] bg-muted px-1 rounded-sm">Ctrl+Y</kbd>
          </Button>
        </div>
      </div>

      <Separator />

      {/* --- Rotation & Flip Tools --- */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Transform</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={rotateImageLeft} variant="outline" size="sm" disabled={isToolDisabled}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Rotate Left
            </Button>
            <Button onClick={rotateImageRight} variant="outline" size="sm" disabled={isToolDisabled}>
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              Rotate Right
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={flipHorizontal} variant="outline" size="sm" disabled={isToolDisabled}>
              <FlipHorizontal className="mr-1.5 h-3.5 w-3.5" />
              Flip H
            </Button>
            <Button onClick={flipVertical} variant="outline" size="sm" disabled={isToolDisabled}>
              <FlipVertical className="mr-1.5 h-3.5 w-3.5" />
              Flip V
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* --- AI Processing Tools --- */}
      <div>
        <h3 className="font-semibold text-sm mb-3">AI Processing</h3>
        <div className="space-y-2">
          {/* Background Removal */}
          {isBgRemovalAvailable && (
            <ProcessingToolRow
              icon={Wand2}
              label="Remove Background"
              onApply={handleApplyBackgroundRemoval}
              isApplied={isBgRemoved}
              isProcessing={false}
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
              isProcessing={false}
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
              isProcessing={false}
              isDisabled={isToolDisabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
