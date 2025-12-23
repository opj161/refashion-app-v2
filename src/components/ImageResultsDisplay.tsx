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

interface ImageResultsDisplayProps {
  // Optional: kept for backward compatibility but logic prefers store
  formState?: any;
  isPending?: boolean;
  setCurrentTab?: (tab: string) => void;
  onLoadImageUrl?: (imageUrl: string) => void;
  maxImages?: number;
}

export function ImageResultsDisplay({
  onLoadImageUrl,
  maxImages = 3
}: ImageResultsDisplayProps) {
  // OPTIMIZATION: Select only needed action
  const initializeFromUrl = useImageStore(useShallow(state => state.initializeFromUrl));

  // 1. Bridge Pattern: Subscribe to global ID
  const currentResultId = useGenerationSettingsStore(state => state.currentResultId);

  // Local State
  const [resultData, setResultData] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  // Viewer State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // 2. Reset state when ID changes
  useEffect(() => {
    if (currentResultId) {
      setPollingStatus('processing');
      setResultData(null);
      setLocalErrors([]);
    }
  }, [currentResultId]);

  // 3. Smart Polling
  const { data: pollingData } = useSmartPolling(
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

  // Sync polling data for intermediate updates (e.g. 1 of 3 images done)
  useEffect(() => {
    if (pollingData) {
      setResultData(pollingData);
      if (pollingData.error) setLocalErrors([pollingData.error]);
    }
  }, [pollingData]);

  const handleImageClick = (url: string) => {
    setSelectedImageUrl(url);
    setIsImageViewerOpen(true);
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = getDisplayableImageUrl(url) || '';
    link.download = `Refashion_${index}_${Date.now()}.png`;
    link.click();
  };

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
          <div className={`grid grid-cols-1 ${maxImages > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'max-w-md mx-auto'} gap-4`}>
            {Array.from({ length: displayCount }).map((_, index) => {
              const url = urls[index];
              const isLoading = pollingStatus === 'processing' && !url;
              const isError = pollingStatus === 'failed';

              if (pollingStatus === 'completed' && !url && !isError) return null;

              return (
                <div key={index} className="relative aspect-[2/3] min-h-[280px] max-h-[500px] bg-muted/30 rounded-lg overflow-hidden group border border-white/5 flex items-center justify-center">
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
                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                        <Button size="icon" variant="secondary" onClick={() => handleImageClick(url)}><Maximize2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="secondary" onClick={() => handleDownload(url, index)}><Download className="h-4 w-4" /></Button>
                        <Button size="icon" variant="secondary" onClick={() => handleUseAsInput(url)}><RefreshCw className="h-4 w-4" /></Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal Reuse */}
      {selectedImageUrl && (
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          initialImageUrl={selectedImageUrl}
          item={{ id: currentResultId || 'preview', timestamp: Date.now(), constructedPrompt: '', originalClothingUrl: '', editedImageUrls: urls, attributes: {} as any, username: '' } as any}
        />
      )}
    </>
  );
}
