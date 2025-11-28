'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Maximize2, Download, RefreshCw, Image as ImageIcon, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { getDisplayableImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { ImageResultSkeleton } from './ImageResultSkeleton';
import { ImageViewerModal } from './ImageViewerModal';
import { isFaceDetailerAvailable } from '@/ai/actions/upscale-image.action';
import { useSmartPolling } from '@/hooks/useSmartPolling';

interface ImageResultsDisplayProps {
  userId?: string;
  mode?: 'image' | 'video';
  forcedHistoryId?: string | null;
}

export default function ImageResultsDisplay({ userId, mode = 'image', forcedHistoryId }: ImageResultsDisplayProps) {
  const { toast } = useToast();

  // Store Access
  // Use forcedHistoryId if provided (Pro Tool Mode), otherwise use store ID (Legacy Mode)
  const storeResultId = useGenerationSettingsStore(state => state.currentResultId);
  const activeId = forcedHistoryId || storeResultId;

  const imageSettings = useGenerationSettingsStore(state => state.imageSettings);
  const { initializeFromUrl } = useImageStore();

  // Local State
  const [resultData, setResultData] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  // Viewer State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isFaceDetailerServiceAvailable, setIsFaceDetailerServiceAvailable] = useState(false);

  useEffect(() => {
    isFaceDetailerAvailable().then(setIsFaceDetailerServiceAvailable);
  }, []);

  // Reset state when ID changes
  useEffect(() => {
    if (activeId) {
      setPollingStatus('processing');
      setResultData(null);
      setLocalErrors([]);
    } else {
      setPollingStatus('idle');
    }
  }, [activeId]);

  // Polling Logic
  const { data: pollingData, error: pollingError } = useSmartPolling(
    activeId ? `/api/history/${activeId}/status` : null,
    !!activeId && pollingStatus === 'processing',
    {
      onSuccess: (data) => {
        setResultData(data);
        if (data.status === 'completed') {
          setPollingStatus('completed');
        } else if (data.status === 'failed') {
          setPollingStatus('failed');
          setLocalErrors([data.error || 'Generation failed']);
        }
      },
      onFailure: (err) => {
        setPollingStatus('failed');
        setLocalErrors([err.message]);
      }
    }
  );

  // Sync polling data to local state for rendering intermediate updates
  useEffect(() => {
    if (pollingData) {
      setResultData(pollingData);
      if (pollingData.error) {
        setLocalErrors([pollingData.error]);
      }
    }
  }, [pollingData]);

  const handleImageClick = (url: string) => {
    setSelectedImageUrl(url);
    setIsImageViewerOpen(true);
  };

  const handleDownload = (url: string, index: number) => {
    const displayUrl = getDisplayableImageUrl(url);
    if (!displayUrl) return;
    const link = document.createElement('a');
    link.href = displayUrl;
    link.download = `refashion_${index}_${Date.now()}.png`;
    link.click();
  };

  const handleUseAsInput = (url: string) => {
    initializeFromUrl(url);
    toast({ title: "Image Loaded", description: "Image set as input for next generation." });
  };

  // Render Logic
  if (!activeId && pollingStatus === 'idle') {
    return null; // Parent handles empty state
  }

  // Video Mode Check
  if (resultData?.videoUrl || resultData?.localVideoUrl) {
    const videoUrl = resultData.localVideoUrl || resultData.videoUrl;
    return (
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[9/16] w-full bg-black rounded-lg overflow-hidden border border-white/10 shadow-lg group">
          {videoUrl ? (
            <video
              src={getDisplayableImageUrl(videoUrl)!}
              controls autoPlay loop className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/10">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Rendering Video...</p>
            </div>
          )}
        </div>
        {/* Metadata Card */}
        {resultData?.error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-xs">{resultData.error}</div>
          </div>
        )}
      </div>
    );
  }

  // Image Mode
  const urls = resultData?.editedImageUrls || [];
  // Determine display count: If we have URLs, use length. If processing, assume 3 (or 1 if specified elsewhere, but 3 is safe default for skeleton)
  const displayCount = urls.length > 0 ? urls.length : 3;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {Array.from({ length: displayCount }).map((_, index) => {
          const url = urls[index];
          const isLoading = pollingStatus === 'processing' && !url;
          const isError = pollingStatus === 'failed';

          // Skip rendering empty slots if completed and no URL (handling Nano Banana 1-image vs 3-image slots)
          if (pollingStatus === 'completed' && !url && !isError) return null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10 group shadow-md"
            >
              {isLoading && <ImageResultSkeleton />}

              {isError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center bg-red-950/10">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">Generation Failed</p>
                  <p className="text-xs opacity-70">{localErrors[0]}</p>
                </div>
              )}

              {url && (
                <>
                  <Image
                    src={getDisplayableImageUrl(url) || ''}
                    alt="Result"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    <Button size="icon" variant="secondary" onClick={() => handleImageClick(url)}>
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" onClick={() => handleDownload(url, index)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" onClick={() => handleUseAsInput(url)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Modal Re-use */}
      {selectedImageUrl && (
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          initialImageUrl={selectedImageUrl}
          item={{
            id: activeId!,
            timestamp: Date.now(),
            constructedPrompt: resultData?.constructedPrompt || 'Prompt unavailable',
            originalClothingUrl: resultData?.originalImageUrls?.[0] || '',
            editedImageUrls: urls,
            attributes: imageSettings, // Use current settings as proxy for what generated this
            username: 'current'
          } as any}
          // Pass handlers if needed for modal actions
          onUpscale={() => { }}
          onFaceDetail={() => { }}
          isUpscalingSlot={null}
          isFaceRetouchingSlot={null}
          isFaceDetailerAvailable={isFaceDetailerServiceAvailable}
        />
      )}
    </div>
  );
}
