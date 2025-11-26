// src/components/ImageResultsDisplay.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette, Sparkles, Download, Video as VideoIcon, UserCheck, Eye, X, AlertCircle, Maximize2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { MOTION_TRANSITIONS } from '@/lib/motion-constants';
import Image from 'next/image';
import { getDisplayableImageUrl } from '@/lib/utils';
import { upscaleImageAction, faceDetailerAction, isFaceDetailerAvailable } from '@/ai/actions/upscale-image.action';
import { updateHistoryItem } from '@/actions/historyActions';
import { ImageViewerModal } from './ImageViewerModal';
import { ImageResultSkeleton } from './ImageResultSkeleton';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import type { ImageGenerationFormState } from '@/actions/imageActions';

interface ImageResultsDisplayProps {
  formState: ImageGenerationFormState | null;
  isPending: boolean;
  setCurrentTab?: (tab: string) => void;
  onLoadImageUrl?: (imageUrl: string) => void;
  maxImages?: number;
}

export function ImageResultsDisplay({ 
  formState, 
  isPending,
  setCurrentTab,
  onLoadImageUrl,
  maxImages = 3
}: ImageResultsDisplayProps) {
  const { toast } = useToast();
  const imageSettings = useGenerationSettingsStore(state => state.imageSettings);

  // Local state for post-generation operations (upscale, face detail)
  const [localOutputImageUrls, setLocalOutputImageUrls] = useState<(string | null)[]>(
    Array(maxImages).fill(null)
  );
  const [originalOutputImageUrls, setOriginalOutputImageUrls] = useState<(string | null)[]>(
    Array(maxImages).fill(null)
  );
  // Local state for errors
  const [localErrors, setLocalErrors] = useState<(string | null)[]>(
    Array(maxImages).fill(null)
  );
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');

  // Update local state when form state changes
  useEffect(() => {
    if (formState?.editedImageUrls) {
      // Ensure we respect maxImages
      setLocalOutputImageUrls(formState.editedImageUrls.slice(0, maxImages));
      setPollingStatus('completed');
    }
    if (formState?.errors) {
      setLocalErrors(formState.errors.slice(0, maxImages));
      setPollingStatus('failed');
    } else {
      setLocalErrors(Array(maxImages).fill(null));
    }
    if (formState?.newHistoryId) {
      setPollingStatus('processing');
    }
  }, [formState, maxImages]);

  // Derive state for UI rendering
  const outputImageUrls = localOutputImageUrls;
  const generationErrors = localErrors;
  const activeHistoryItemId = formState?.newHistoryId || null;

  // Polling Effect with Exponential Backoff
  useEffect(() => {
    if (!activeHistoryItemId) return;

    let delay = 2000; 
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/history/${activeHistoryItemId}/status`, { cache: 'no-store' });
        
        if (res.ok && isMounted) {
            const result = await res.json();
            
            // Update local state with whatever we have so far
            if (result.editedImageUrls) {
                setLocalOutputImageUrls(prev => {
                    // Merge with existing to avoid flickering
                    const newUrls = [...prev];
                    result.editedImageUrls.forEach((url: string | null, idx: number) => {
                        if (idx < maxImages && url) newUrls[idx] = url;
                    });
                    return newUrls;
                });
            }
            
            // Check for terminal status
            if (result.status === 'completed') {
                setLocalOutputImageUrls(result.editedImageUrls || []);
                setPollingStatus('completed');
                
                // If there are nulls in editedImageUrls, mark them as errors if we don't have specific messages
                const urls = result.editedImageUrls || [];
                const newErrors = urls.map((url: string | null) => 
                  url === null ? (result.error || 'Generation failed') : null
                );
                setLocalErrors(newErrors);
                // Stop polling - don't schedule next poll
                return;
            } else if (result.status === 'failed') {
                setLocalErrors(Array(maxImages).fill(result.error || 'Generation failed'));
                setPollingStatus('failed');
                // Stop polling - don't schedule next poll
                return;
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
  }, [activeHistoryItemId, maxImages]); 

  // Local state for loading indicators
  const [isUpscalingSlot, setIsUpscalingSlot] = useState<number | null>(null);
  const [isFaceRetouchingSlot, setIsFaceRetouchingSlot] = useState<number | null>(null);
  const [isFaceDetailerServiceAvailable, setIsFaceDetailerServiceAvailable] = useState<boolean>(false);
  const [comparingSlotIndex, setComparingSlotIndex] = useState<number | null>(null);

  // Image viewer modal state
  const [isImageViewerOpen, setIsImageViewerOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Check Face Detailer service availability on mount
  useEffect(() => {
    isFaceDetailerAvailable().then(setIsFaceDetailerServiceAvailable);
  }, []);

  const handleUpscale = async (slotIndex: number) => {
    const imageUrlToUpscale = outputImageUrls[slotIndex];
    if (!imageUrlToUpscale) return toast({ title: 'Image Not Available', variant: 'destructive' });
    setIsUpscalingSlot(slotIndex);
    try {
      const { savedPath } = await upscaleImageAction(imageUrlToUpscale, undefined);

      if (activeHistoryItemId) {
        const finalOriginals = [...originalOutputImageUrls];
        finalOriginals[slotIndex] = imageUrlToUpscale;
        const finalOutputs = [...outputImageUrls];
        finalOutputs[slotIndex] = savedPath;
        await updateHistoryItem(activeHistoryItemId, {
          editedImageUrls: finalOutputs,
          originalImageUrls: finalOriginals,
        });
      }

      setOriginalOutputImageUrls(prev => {
        const newOriginals = [...prev];
        newOriginals[slotIndex] = imageUrlToUpscale;
        return newOriginals;
      });

      setLocalOutputImageUrls(prev => {
        const newUrls = [...prev];
        newUrls[slotIndex] = savedPath;
        return newUrls;
      });

      toast({ title: `Image ${slotIndex + 1} Upscaled Successfully` });
    } catch (error) {
      console.error(`Error upscaling image ${slotIndex}:`, error);
      toast({
        title: 'Upscaling Failed',
        description: (error as Error).message || 'Unexpected error during upscaling.',
        variant: 'destructive',
      });
    } finally {
      setIsUpscalingSlot(null);
    }
  };

  const handleFaceRetouch = async (slotIndex: number) => {
    const imageUrlToRetouch = outputImageUrls[slotIndex];
    if (!imageUrlToRetouch) return toast({ title: 'Image Not Available', variant: 'destructive' });
    setIsFaceRetouchingSlot(slotIndex);
    try {
      const { savedPath } = await faceDetailerAction(imageUrlToRetouch, undefined);

      if (activeHistoryItemId) {
        const finalOriginals = [...originalOutputImageUrls];
        finalOriginals[slotIndex] = imageUrlToRetouch;
        const finalOutputs = [...outputImageUrls];
        finalOutputs[slotIndex] = savedPath;
        await updateHistoryItem(activeHistoryItemId, {
          editedImageUrls: finalOutputs,
          originalImageUrls: finalOriginals,
        });
      }

      setOriginalOutputImageUrls(prev => {
        const newOriginals = [...prev];
        newOriginals[slotIndex] = imageUrlToRetouch;
        return newOriginals;
      });

      setLocalOutputImageUrls(prev => {
        const newUrls = [...prev];
        newUrls[slotIndex] = savedPath;
        return newUrls;
      });

      toast({ title: `Image ${slotIndex + 1} Face Retouched Successfully` });
    } catch (error) {
      console.error(`Error face retouching image ${slotIndex}:`, error);
      toast({
        title: 'Face Retouch Failed',
        description: (error as Error).message || 'Unexpected error during face retouching.',
        variant: 'destructive',
      });
    } finally {
      setIsFaceRetouchingSlot(null);
    }
  };

  const handleDownloadOutput = useCallback(
    (imageUrl: string | null, index: number) => {
      if (!imageUrl) return;
      const downloadUrl = getDisplayableImageUrl(imageUrl);
      if (!downloadUrl) return;

      // CACHE-STRATEGY: Policy: Dynamic - This fetch is for downloading the current version of the file.
      // Use no-store to ensure we get the latest version, not a potentially stale cached version.
      fetch(downloadUrl, { cache: 'no-store' })
        .then(res => res.blob())
        .then(blob => {
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.download = `RefashionAI_image_${index + 1}_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        })
        .catch(err => {
          toast({ title: 'Download Error', variant: 'destructive' });
        });
    },
    [toast]
  );

  const handleSendToVideoPage = useCallback(
    (imageUrl: string | null) => {
      if (!imageUrl) return;

      if (!setCurrentTab || !onLoadImageUrl) {
        toast({
          title: 'Error',
          description: 'Cannot switch to video page',
          variant: 'destructive'
        });
        return;
      }

      // Load the generated image into the video tab's preparation workflow
      onLoadImageUrl(imageUrl);
      setCurrentTab('video');

      setTimeout(() => {
        const imagePreparationElement =
          document.querySelector('[data-testid="image-preparation-container"]') ||
          document.querySelector('h1, h2, h3')?.closest('.space-y-6, .space-y-8') ||
          document.querySelector('.container');

        if (imagePreparationElement) {
          imagePreparationElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });
        }
      }, 100);

      toast({
        title: 'Switched to Video',
        description: 'Ready to generate a video with your selected generated image.',
      });
    },
    [setCurrentTab, onLoadImageUrl, toast]
  );

  const handleImageClick = useCallback((imageUrl: string, index: number) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageIndex(index);
    setIsImageViewerOpen(true);
  }, []);

  const handleCloseImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
    setSelectedImageUrl(null);
    setSelectedImageIndex(null);
  }, []);

  // Keyboard support for image viewer modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isImageViewerOpen && event.key === 'Escape') {
        handleCloseImageViewer();
      }
    };

    if (isImageViewerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isImageViewerOpen, handleCloseImageViewer]);

  // Animation variants for results grid
  const resultsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
      },
    },
  };
  const resultItemVariant = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: MOTION_TRANSITIONS.spring.standard },
  };

  const shouldReduceMotion = useReducedMotion();
  const containerAnim = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : resultsContainerVariants;
  const itemAnim = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : resultItemVariant;

  // Don't render anything if there are no results and not currently generating
  // FIX: Added check for activeHistoryItemId. If we have an ID but no results yet, we are in the "background processing" phase.
  if (!outputImageUrls.some(uri => uri !== null) && !generationErrors.some(err => err !== null) && !isPending && !activeHistoryItemId) {
    return null;
  }

  return (
    <>
      {/* Generated Images Display */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Generated Images
          </CardTitle>
          <CardDescription className="hidden lg:block">
            Your AI-generated fashion model images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            className={`grid grid-cols-1 ${maxImages > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'max-w-md mx-auto'} gap-4`}
            variants={containerAnim}
            initial="hidden"
            animate="visible"
          >
            {/* Render slots */}
            {Array.from({ length: pollingStatus === 'completed' ? outputImageUrls.length : maxImages }).map((_, index) => {
              const imageUrl = outputImageUrls[index];
              const error = generationErrors[index];
              
              // Determine if this specific slot is loading
              // It's loading if we are pending OR if we have an active history item but no URL/error yet AND we are not complete
              const isLoading = isPending || (!!activeHistoryItemId && !imageUrl && !error && pollingStatus !== 'completed' && pollingStatus !== 'failed');

              return (
                <Card key={index} className="overflow-hidden border-muted bg-muted/20">
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4] bg-muted/30 flex items-center justify-center group">
                      
                      {/* Loading State - Replaced Spinner with Skeleton */}
                      {isLoading && (
                         <div className="absolute inset-0 z-20">
                           <ImageResultSkeleton />
                         </div>
                      )}

                      {/* Error State */}
                      {!isLoading && error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-destructive/10">
                          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                          <p className="text-sm text-destructive font-medium">Generation Failed</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={error}>
                            {error}
                          </p>
                        </div>
                      )}

                      {/* Success State - Image Display */}
                      {!isLoading && !error && imageUrl && (
                        <>
                          <Image
                            src={imageUrl}
                            alt={`Generated variation ${index + 1}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-10 w-10 rounded-full shadow-lg hover:scale-110 transition-transform"
                              onClick={() => handleImageClick(imageUrl, index)}
                              title="View Fullscreen"
                            >
                              <Maximize2 className="h-5 w-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-10 w-10 rounded-full shadow-lg hover:scale-110 transition-transform"
                              onClick={() => handleDownloadOutput(imageUrl, index)}
                              title="Download"
                            >
                              <Download className="h-5 w-5" />
                            </Button>
                            {onLoadImageUrl && (
                               <Button
                               size="icon"
                               variant="secondary"
                               className="h-10 w-10 rounded-full shadow-lg hover:scale-110 transition-transform"
                               onClick={() => {
                                 onLoadImageUrl(imageUrl);
                                 toast({
                                   title: "Image Loaded",
                                   description: "Image loaded into Studio Mode for further editing.",
                                 });
                               }}
                               title="Use as Input"
                             >
                               <RefreshCw className="h-5 w-5" />
                             </Button>
                            )}
                          </div>
                        </>
                      )}

                      {/* Empty State (Initial) */}
                      {!isLoading && !error && !imageUrl && (
                        <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                          <ImageIcon className="h-12 w-12 mb-2" />
                          <p className="text-sm">Waiting for generation...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {isImageViewerOpen && selectedImageUrl && (
          <ImageViewerModal
            isOpen={isImageViewerOpen}
            onClose={handleCloseImageViewer}
            initialImageUrl={selectedImageUrl}
            item={{
                id: activeHistoryItemId || 'preview',
                timestamp: Date.now(),
                constructedPrompt: formState?.constructedPrompt || '',
                originalClothingUrl: originalOutputImageUrls.find(u => u) || '', 
                editedImageUrls: outputImageUrls,
                attributes: imageSettings,
                username: 'current',
            } as any}
            
            onUpscale={(idx) => handleUpscale(idx)}
            onFaceDetail={(idx) => handleFaceRetouch(idx)}
            onSendToVideo={(url) => handleSendToVideoPage(url)}
            
            isUpscalingSlot={isUpscalingSlot}
            isFaceRetouchingSlot={isFaceRetouchingSlot}
            isFaceDetailerAvailable={isFaceDetailerServiceAvailable}
          />
        )}
      </AnimatePresence>
    </>
  );
}

