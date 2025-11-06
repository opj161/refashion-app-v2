// src/components/GenerationProgressIndicator.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface GenerationProgressIndicatorProps {
  /** Whether generation is currently in progress */
  isGenerating: boolean;
  /** Current generation stage */
  stage?: 'preparing' | 'processing' | 'finalizing' | 'complete';
  /** Progress percentage (0-100) */
  progress?: number;
  /** Custom message to display */
  message?: string;
  /** Number of images being generated */
  imageCount?: number;
}

const STAGE_MESSAGES = {
  preparing: 'Preparing your image...',
  processing: 'AI is creating your fashion photos...',
  finalizing: 'Applying final touches...',
  complete: 'Generation complete!',
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
  stage = 'processing',
  progress = 0,
  message,
  imageCount = 3,
}: GenerationProgressIndicatorProps) {
  const [estimatedProgress, setEstimatedProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<typeof stage>(stage);
  
  const Icon = STAGE_ICONS[currentStage];
  const displayMessage = message || STAGE_MESSAGES[currentStage];
  const isComplete = currentStage === 'complete';
  
  // Simulate progress estimation when actual progress is not provided
  useEffect(() => {
    if (!isGenerating) {
      setEstimatedProgress(0);
      return;
    }

    // Auto-advance stages based on progress
    if (progress === 0 && currentStage !== 'preparing') {
      setCurrentStage('preparing');
    } else if (progress > 0 && progress < 30 && currentStage === 'preparing') {
      setCurrentStage('processing');
    } else if (progress >= 30 && progress < 90 && currentStage !== 'processing') {
      setCurrentStage('processing');
    } else if (progress >= 90 && progress < 100) {
      setCurrentStage('finalizing');
    } else if (progress >= 100) {
      setCurrentStage('complete');
    }

    if (progress > 0) {
      setEstimatedProgress(progress);
      return;
    }
    
    // Gradual progress simulation for better UX when no real progress data
    const interval = setInterval(() => {
      setEstimatedProgress(prev => {
        if (prev >= 95) return prev; // Cap at 95% until actual completion
        return prev + Math.random() * 2; // Increment by 0-2%
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isGenerating, progress, currentStage]);

  if (!isGenerating && estimatedProgress === 0) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {(isGenerating || estimatedProgress > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="pt-6 pb-6 space-y-4">
              {/* Header with icon and message */}
              <div className="flex items-center gap-3">
                <Icon 
                  className={`h-5 w-5 ${isComplete ? 'text-green-500' : 'text-primary animate-spin'}`} 
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {displayMessage}
                  </p>
                  {imageCount > 1 && !isComplete && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Generating {imageCount} images
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-primary tabular-nums">
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
                <motion.p 
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  This usually takes 20-30 seconds
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact version for inline progress display
 */
export function CompactProgressIndicator({
  progress = 0,
  message = 'Processing...',
}: {
  progress?: number;
  message?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{message}</p>
        <Progress value={progress} className="h-1 mt-1" />
      </div>
      <span className="text-xs font-medium text-primary tabular-nums">
        {Math.round(progress)}%
      </span>
    </div>
  );
}
