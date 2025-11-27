// src/components/workspace/OutputGallery.tsx
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { useToast } from '@/hooks/use-toast';
import { getDisplayableImageUrl } from '@/lib/utils';
import { 
  Palette, 
  Download, 
  Maximize2, 
  RefreshCw, 
  AlertCircle,
  Loader2,
  ImageIcon,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageViewerModal } from '@/components/ImageViewerModal';
import type { HistoryItem, ModelAttributes } from '@/lib/types';

interface OutputGalleryProps {
  maxImages?: number;
}

/**
 * OutputGallery - The right column of the workspace.
 * Displays generated results and provides post-processing actions.
 */
export function OutputGallery({ maxImages = 3 }: OutputGalleryProps) {
  const { toast } = useToast();
  
  // Global State
  const currentResultId = useGenerationSettingsStore(state => state.currentResultId);
  const generationCount = useGenerationSettingsStore(state => state.generationCount);
  const activeView = useGenerationSettingsStore(state => state.activeView);
  const { initializeFromUrl } = useImageStore();

  // Local State for results
  const [outputImageUrls, setOutputImageUrls] = useState<(string | null)[]>(Array(maxImages).fill(null));
  const [localErrors, setLocalErrors] = useState<(string | null)[]>(Array(maxImages).fill(null));
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  
  // Modal State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Create a minimal HistoryItem for the viewer modal
  const modalHistoryItem: HistoryItem | null = useMemo(() => {
    if (!isImageViewerOpen || !selectedImageUrl) return null;
    
    // Create default empty attributes
    const defaultAttributes: ModelAttributes = {
      gender: 'female',
      bodyShapeAndSize: 'default',
      ageRange: 'default',
      ethnicity: 'default',
      poseStyle: 'default',
      background: 'default',
      fashionStyle: 'default_style',
      hairStyle: 'default',
      modelExpression: 'default',
      lightingType: 'default',
      lightQuality: 'default',
      modelAngle: 'front_facing',
      lensEffect: 'default',
      depthOfField: 'default',
      timeOfDay: 'default',
      overallMood: 'default',
    };
    
    return {
      id: currentResultId || 'preview',
      timestamp: Date.now(),
      constructedPrompt: '',
      originalClothingUrl: '',
      editedImageUrls: outputImageUrls,
      attributes: defaultAttributes,
      username: 'current',
    };
  }, [isImageViewerOpen, selectedImageUrl, currentResultId, outputImageUrls]);

  // Polling Effect - watches for currentResultId changes
  useEffect(() => {
    if (!currentResultId) return;

    // Reset state for new generation
    setOutputImageUrls(Array(maxImages).fill(null));
    setLocalErrors(Array(maxImages).fill(null));
    setPollingStatus('processing');

    let delay = 2000;
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/history/${currentResultId}/status`, { cache: 'no-store' });
        
        if (res.ok && isMounted) {
          const result = await res.json();
          
          // Update local state with whatever we have so far
          if (result.editedImageUrls) {
            setOutputImageUrls(prev => {
              const newUrls = [...prev];
              result.editedImageUrls.forEach((url: string | null, idx: number) => {
                if (idx < maxImages && url) newUrls[idx] = url;
              });
              return newUrls;
            });
          }
          
          // Check for terminal status
          if (result.status === 'completed') {
            setOutputImageUrls(result.editedImageUrls || []);
            setPollingStatus('completed');
            
            // If there are nulls, mark them as errors
            const urls = result.editedImageUrls || [];
            const newErrors = urls.map((url: string | null) => 
              url === null ? (result.error || 'Generation failed') : null
            );
            setLocalErrors(newErrors);
            return; // Stop polling
          } else if (result.status === 'failed') {
            setLocalErrors(Array(maxImages).fill(result.error || 'Generation failed'));
            setPollingStatus('failed');
            return; // Stop polling
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }

      // Exponential backoff: cap at 10 seconds
      if (isMounted) {
        delay = Math.min(delay * 1.2, 10000);
        timeoutId = setTimeout(poll, delay);
      }
    };

    poll(); // Start polling

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentResultId, maxImages]);

  // Handlers
  const handleDownload = useCallback((imageUrl: string | null, index: number) => {
    if (!imageUrl) return;
    const downloadUrl = getDisplayableImageUrl(imageUrl);
    if (!downloadUrl) return;

    fetch(downloadUrl, { cache: 'no-store' })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `RefashionAI_${index + 1}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        toast({ title: 'Download Error', variant: 'destructive' });
      });
  }, [toast]);

  const handleUseAsInput = useCallback((imageUrl: string) => {
    initializeFromUrl(imageUrl);
    toast({
      title: 'Image Loaded',
      description: 'Image loaded into Input Stage for further editing.',
    });
  }, [initializeFromUrl, toast]);

  const handleImageClick = useCallback((imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageViewerOpen(true);
  }, []);

  const handleCloseImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
    setSelectedImageUrl(null);
  }, []);

  // Check if we have any results
  const hasResults = outputImageUrls.some(url => url !== null);
  const hasErrors = localErrors.some(err => err !== null);
  const isProcessing = pollingStatus === 'processing';

  // Render empty state for video mode
  if (activeView !== 'image') {
    return (
      <section className="flex flex-col h-full bg-black/20 min-w-0 hidden lg:flex">
        <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Palette className="h-3 w-3" /> Generated Results
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Video results will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col h-full bg-black/20 min-w-0 hidden lg:flex">
      {/* Header */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 shrink-0 bg-background/50 justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Palette className="h-3 w-3" /> Generated Results
        </span>
        {isProcessing && (
          <span className="text-[10px] text-primary flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Generating...
          </span>
        )}
      </div>

      {/* Results Area */}
      <ScrollArea className="flex-1 p-4">
        {!hasResults && !isProcessing && !hasErrors ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">No Results Yet</h3>
            <p className="text-xs text-muted-foreground/60 max-w-[200px]">
              Upload an image and click Generate to create AI-powered fashion images.
            </p>
          </div>
        ) : (
          // Results Grid
          <motion.div 
            className="grid grid-cols-1 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: pollingStatus === 'completed' ? outputImageUrls.length : maxImages }).map((_, index) => {
              const imageUrl = outputImageUrls[index];
              const error = localErrors[index];
              const isLoading = isProcessing && !imageUrl && !error;

              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/5 bg-black/30 group"
                >
                  {/* Loading State */}
                  {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary/50" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Generating...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {!isLoading && error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-red-950/20">
                      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
                      <p className="text-xs text-red-400 font-medium">Failed</p>
                      <p className="text-[10px] text-red-400/70 mt-1 line-clamp-2">{error}</p>
                    </div>
                  )}

                  {/* Success State - Image Display */}
                  {!isLoading && !error && imageUrl && (
                    <>
                      <Image
                        src={imageUrl}
                        alt={`Generated ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-9 w-9 rounded-full shadow-lg"
                          onClick={() => handleImageClick(imageUrl)}
                          title="View Fullscreen"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-9 w-9 rounded-full shadow-lg"
                          onClick={() => handleDownload(imageUrl, index)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-9 w-9 rounded-full shadow-lg"
                          onClick={() => handleUseAsInput(imageUrl)}
                          title="Use as Input"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Empty Placeholder */}
                  {!isLoading && !error && !imageUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                      <ImageIcon className="h-8 w-8 mb-2" />
                      <p className="text-[10px]">Slot {index + 1}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </ScrollArea>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {isImageViewerOpen && selectedImageUrl && modalHistoryItem && (
          <ImageViewerModal
            isOpen={isImageViewerOpen}
            onClose={handleCloseImageViewer}
            initialImageUrl={selectedImageUrl}
            item={modalHistoryItem}
            onUpscale={() => {}}
            onFaceDetail={() => {}}
            onSendToVideo={() => {}}
            isUpscalingSlot={null}
            isFaceRetouchingSlot={null}
            isFaceDetailerAvailable={false}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

export default OutputGallery;
