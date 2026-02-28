// src/components/GenerationProgressIndicator.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { m, AnimatePresence } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GenerationProgressIndicatorProps {
  /** Whether generation is currently in progress */
  isGenerating: boolean;
  /** Current generation stage */
  stage?: "preparing" | "processing" | "finalizing" | "complete";
  /** Progress percentage (0-100) */
  progress?: number;
  /** Custom message to display */
  message?: string;
  /** Number of images being generated */
  imageCount?: number;
}

const STAGE_MESSAGES = {
  preparing: "Preparing your image...",
  processing: "AI is creating your fashion photos...",
  finalizing: "Applying final touches...",
  complete: "Generation complete!",
};

const STAGE_ICONS = {
  preparing: Loader2,
  processing: Sparkles,
  finalizing: Loader2,
  complete: CheckCircle2,
};

/**
 * A comprehensive progress indicator for image generation operations
 * Shows real-time progress with stage-based messaging and visual feedback
 */
export function GenerationProgressIndicator({
  isGenerating,
  stage = "processing",
  progress = 0,
  message,
  imageCount = 3,
}: GenerationProgressIndicatorProps) {
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Reset simulation during render when generation stops (avoids setState in effect)
  const [prevIsGenerating, setPrevIsGenerating] = useState(false);
  if (isGenerating !== prevIsGenerating) {
    setPrevIsGenerating(isGenerating);
    if (!isGenerating) {
      setSimulatedProgress(0);
    }
  }

  // Derive display progress: real progress takes precedence, then simulation, then 0
  const estimatedProgress = !isGenerating ? 0 : progress > 0 ? progress : simulatedProgress;

  // Derive stage from progress and isGenerating — no useEffect cycle
  const currentStage = useMemo((): typeof stage => {
    if (!isGenerating) return "preparing";
    if (progress >= 100) return "complete";
    if (progress >= 90) return "finalizing";
    if (progress >= 30) return "processing";
    if (progress > 0) return "processing";
    return "preparing";
  }, [isGenerating, progress]);

  const Icon = STAGE_ICONS[currentStage];
  const displayMessage = message || STAGE_MESSAGES[currentStage];
  const isComplete = currentStage === "complete";

  // Simulate gradual progress when no real progress data is available
  useEffect(() => {
    if (!isGenerating || progress > 0) return;

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 2;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isGenerating, progress]);

  if (!isGenerating && estimatedProgress === 0) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {(isGenerating || estimatedProgress > 0) && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="space-y-4 pb-6 pt-6" aria-live="polite">
              {/* Header with icon and message */}
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isComplete ? "text-green-500" : "animate-spin text-primary"
                  )}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{displayMessage}</p>
                  {imageCount > 1 && !isComplete && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Generating {imageCount} images
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {Math.round(estimatedProgress)}%
                </span>
              </div>

              {/* Progress bar */}
              <Progress
                value={estimatedProgress}
                className="h-2"
                isEstimating={estimatedProgress < 10 && !isComplete}
                isCompleting={isComplete}
              />

              {/* Optional detailed stage info */}
              {!isComplete && (
                <m.p
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  This usually takes 20-30 seconds
                </m.p>
              )}
            </CardContent>
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact version for inline progress display
 */
export function CompactProgressIndicator({
  progress = 0,
  message = "Processing...",
}: {
  progress?: number;
  message?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-muted-foreground">{message}</p>
        <Progress value={progress} className="mt-1 h-1" />
      </div>
      <span className="text-xs font-medium tabular-nums text-primary">{Math.round(progress)}%</span>
    </div>
  );
}
