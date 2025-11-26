'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Video, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDisplayableImageUrl } from '@/lib/utils';
import type { VideoGenerationFormState } from '@/ai/actions/generate-video.action';

interface VideoResultsDisplayProps {
  formState: VideoGenerationFormState;
  isPending: boolean;
}

export function VideoResultsDisplay({ formState, isPending }: VideoResultsDisplayProps) {
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed' | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeHistoryItemId = formState.historyItemId;
  const videoRef = useRef<HTMLVideoElement>(null);

  // Polling Effect
  useEffect(() => {
    if (!activeHistoryItemId) return;

    // Reset state on new ID
    setStatus('processing');
    setVideoUrl(null);
    setError(null);

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/history/${activeHistoryItemId}/status`, { cache: 'no-store' });
        if (res.ok) {
          const result = await res.json();
          
          if (result.status === 'completed') {
             // Prefer local URL if available (proxied), else remote
             const url = result.localVideoUrl || result.videoUrl;
             setVideoUrl(url);
             setStatus('completed');
             clearInterval(intervalId);
          } else if (result.status === 'failed') {
             setError(result.error || 'Generation failed');
             setStatus('failed');
             clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error("Video polling error", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [activeHistoryItemId]);

  // Don't render if nothing is happening
  if (!isPending && !activeHistoryItemId) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mt-6"
      >
        <Card variant="glass">
          <CardHeader>
             <CardTitle className="text-xl flex items-center gap-2">
                <Video className="h-6 w-6 text-primary" />
                Video Generation
             </CardTitle>
             <CardDescription>
                {status === 'completed' ? 'Generation complete!' : 'Creating your video...'}
             </CardDescription>
          </CardHeader>
          <CardContent>
             {/* Loading State */}
             {(isPending || status === 'processing') && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-muted/30 rounded-lg border border-dashed">
                   <Loader2 className="h-10 w-10 animate-spin text-primary" />
                   <p className="text-sm text-muted-foreground animate-pulse">
                     AI is animating your image... (This takes ~30-60s)
                   </p>
                </div>
             )}

             {/* Failure State */}
             {status === 'failed' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-2 bg-destructive/10 rounded-lg border border-destructive/20 text-destructive">
                   <AlertCircle className="h-8 w-8" />
                   <p className="font-medium">Generation Failed</p>
                   <p className="text-xs opacity-80">{error}</p>
                </div>
             )}

             {/* Success State */}
             {status === 'completed' && videoUrl && (
                <div className="relative aspect-[9/16] max-h-[500px] w-full bg-black rounded-lg overflow-hidden shadow-2xl">
                   <video
                      ref={videoRef}
                      src={getDisplayableImageUrl(videoUrl)!}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-contain"
                   />
                </div>
             )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
