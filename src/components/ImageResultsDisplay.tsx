'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, Maximize2, Download, RefreshCw, AlertCircle, Video } from 'lucide-react';
import { m, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { getDisplayableImageUrl } from '@/lib/utils';
import { ImageViewerModal } from './ImageViewerModal';
import { ImageResultSkeleton } from './ImageResultSkeleton';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import { useShallow } from 'zustand/react/shallow';
import type { ModelAttributes } from '@/lib/types';

/** Shape of polling response from /api/history/[id]/status */
interface PollingResultData {
  status?: 'processing' | 'completed' | 'failed';
  error?: string;
  editedImageUrls?: (string | null)[];
  videoUrl?: string;
  localVideoUrl?: string;
}

interface ImageResultsDisplayProps {
  onLoadImageUrl?: (imageUrl: string) => void;
  maxImages?: number;
}

/** Download an image via programmatic anchor click (module-level to satisfy purity) */
function triggerImageDownload(url: string, index: number) {
  const link = document.createElement('a');
  link.href = getDisplayableImageUrl(url) || '';
  link.download = `Refashion_${index}_${Date.now()}.png`;
  link.click();
}

export function ImageResultsDisplay({
  onLoadImageUrl,
  maxImages = 3
}: ImageResultsDisplayProps) {
  // OPTIMIZATION: Select only needed action
  const initializeFromUrl = useImageStore(useShallow(state => state.initializeFromUrl));

  // 1. Bridge Pattern: Subscribe to global ID and aspect ratio
  const { currentResultId, studioAspectRatio } = useGenerationSettingsStore(
    useShallow(state => ({ currentResultId: state.currentResultId, studioAspectRatio: state.studioAspectRatio }))
  );

  // Dynamic aspect ratio class based on user selection
  const aspectClass = {
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
    '3:4': 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    '2:3': 'aspect-[2/3]',
    '4:5': 'aspect-[4/5]',
  }[studioAspectRatio] || 'aspect-[2/3]';

  // Local State
  const [resultData, setResultData] = useState<PollingResultData | null>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  // Viewer State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // 2. Reset state when ID changes (render-phase adjustment)
  const [prevResultId, setPrevResultId] = useState(currentResultId);
  if (currentResultId !== prevResultId) {
    setPrevResultId(currentResultId);
    if (currentResultId) {
      setPollingStatus('processing');
      setResultData(null);
      setLocalErrors([]);
    }
  }

  // 3. Smart Polling
  const { data: pollingData } = useSmartPolling<PollingResultData>(
    currentResultId ? `/api/history/${currentResultId}/status` : null,
    !!currentResultId && pollingStatus === 'processing',
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

  // Sync polling data for intermediate updates (render-phase adjustment)
  const [prevPollingData, setPrevPollingData] = useState(pollingData);
  if (pollingData !== prevPollingData) {
    setPrevPollingData(pollingData);
    if (pollingData) {
      setResultData(pollingData);
      if (pollingData.error) setLocalErrors([pollingData.error]);
    }
  }

  const handleImageClick = (url: string) => {
    setSelectedImageUrl(url);
    setIsImageViewerOpen(true);
  };

  const handleDownload = triggerImageDownload;

  const handleUseAsInput = (url: string) => {
    initializeFromUrl(url);
    if (onLoadImageUrl) onLoadImageUrl(url);
  };

  // Render Empty State
  if (!currentResultId && pollingStatus === 'idle') {
    return null;
  }

  // === VIDEO MODE RENDER ===
  if (resultData?.videoUrl || resultData?.localVideoUrl) {
    const videoUrl = resultData.localVideoUrl || resultData.videoUrl;
    return (
      <Card variant="glass" className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" /> Video Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[9/16] w-full md:max-w-sm mx-auto bg-black rounded-lg overflow-hidden shadow-lg">
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
          {resultData?.error && <div className="mt-4 text-destructive text-sm">{resultData.error}</div>}
        </CardContent>
      </Card>
    );
  }

  // === IMAGE MODE RENDER ===
  const urls = resultData?.editedImageUrls || [];
  const displayCount = urls.length > 0 ? urls.length : maxImages;
  const isSingleImage = displayCount === 1;

  // Build the image cell for a given index
  const renderImageCell = (index: number) => {
    const url = urls[index];
    const isLoading = pollingStatus === 'processing' && !url;
    const isError = pollingStatus === 'failed';

    if (pollingStatus === 'completed' && !url && !isError) return null;

    return (
      <m.div
        key={index}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className={`relative ${aspectClass} ${isSingleImage ? 'w-full max-w-sm' : 'w-full'} bg-muted/30 rounded-lg overflow-hidden group border border-white/5`}
      >
        {isLoading && <div className="absolute inset-0 z-10"><ImageResultSkeleton /></div>}

        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8 mb-2" />
            <span className="text-xs">Failed</span>
          </div>
        )}

        {url && (
          <>
            <Image
              src={getDisplayableImageUrl(url)!} alt="Result" fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={isSingleImage ? '(max-width: 640px) 100vw, 384px' : '(max-width: 768px) 100vw, 33vw'}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
              <Button size="icon" variant="secondary" aria-label="Expand image" onClick={() => handleImageClick(url)}><Maximize2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary" aria-label="Download image" onClick={() => handleDownload(url, index)}><Download className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary" aria-label="Use as input" onClick={() => handleUseAsInput(url)}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </m.div>
    );
  };

  return (
    <>
      <Card variant="glass" className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" /> Generated Images
          </CardTitle>
          <CardDescription>Your AI-generated fashion model images.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSingleImage ? (
            /* Single image: flex-center the cell — no grid, no auto-margin asymmetry */
            <div className="flex justify-center">
              {renderImageCell(0)}
            </div>
          ) : (
            /* Multiple images: responsive grid */
            <div className={`grid grid-cols-1 ${displayCount === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              {Array.from({ length: displayCount }).map((_, index) => renderImageCell(index))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Reuse */}
      {selectedImageUrl && (
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          initialImageUrl={selectedImageUrl}
          item={{ id: currentResultId || 'preview', timestamp: 0, constructedPrompt: '', originalClothingUrl: '', editedImageUrls: urls, attributes: {} as ModelAttributes, username: '' }}
        />
      )}
    </>
  );
}
