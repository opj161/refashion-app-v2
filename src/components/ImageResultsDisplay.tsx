// src/components/ImageResultsDisplay.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette, Sparkles, Download, Video as VideoIcon, UserCheck, Eye, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { MOTION_TRANSITIONS } from '@/lib/motion-constants';
import Image from 'next/image';
import { getDisplayableImageUrl } from '@/lib/utils';
import { upscaleImageAction, faceDetailerAction, isFaceDetailerAvailable } from '@/ai/actions/upscale-image.action';
import { updateHistoryItem } from '@/actions/historyActions';
import { useImageStore } from '@/stores/imageStore';
import { UnifiedMediaModal, MediaSlot, SidebarSlot } from './UnifiedMediaModal';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { ImageGenerationFormState } from '@/actions/imageActions';

const NUM_IMAGES_TO_GENERATE = 3;

interface ImageResultsDisplayProps {
  formState: ImageGenerationFormState | null;
}

export function ImageResultsDisplay({ formState }: ImageResultsDisplayProps) {
  const { toast } = useToast();
  const setCurrentTab = useImageStore(state => state.setCurrentTab);
  const addVersion = useImageStore(state => state.addVersion);
  const activeImage = useImageStore(state => 
    state.activeVersionId ? state.versions[state.activeVersionId] : null
  );

  // Local state for post-generation operations (upscale, face detail)
  const [localOutputImageUrls, setLocalOutputImageUrls] = useState<(string | null)[]>(
    Array(NUM_IMAGES_TO_GENERATE).fill(null)
  );
  const [originalOutputImageUrls, setOriginalOutputImageUrls] = useState<(string | null)[]>(
    Array(NUM_IMAGES_TO_GENERATE).fill(null)
  );

  // Update local state when form state changes
  useEffect(() => {
    if (formState?.editedImageUrls) {
      setLocalOutputImageUrls(formState.editedImageUrls);
    }
  }, [formState?.editedImageUrls]);

  // Derive state for UI rendering
  const outputImageUrls = localOutputImageUrls;
  const generationErrors = formState?.errors || Array(NUM_IMAGES_TO_GENERATE).fill(null);
  const activeHistoryItemId = formState?.newHistoryId || null;

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

      const newVersionId = addVersion({
        imageUrl: imageUrl,
        label: 'Generated for Video',
        sourceVersionId: activeImage?.id || 'original',
        hash: `generated_${Date.now()}`,
      });

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
    [activeImage?.id, addVersion, setCurrentTab, toast]
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

  // Don't render anything if there are no results
  if (!outputImageUrls.some(uri => uri !== null) && !generationErrors.some(err => err !== null)) {
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerAnim}
            initial="hidden"
            animate="visible"
          >
            {/* Render slots */}
            {Array.from({ length: NUM_IMAGES_TO_GENERATE }).map((_, index) => {
              const uri = outputImageUrls[index];
              const hasError = generationErrors[index] !== null;

              // Show error state
              if (hasError && uri === null) {
                return (
                  <div
                    key={index}
                    className="aspect-[3/4] bg-muted/30 rounded-md border border-muted-foreground/20 flex items-center justify-center"
                  >
                    <div className="text-center p-4 max-w-[80%]">
                      <AlertCircle className="h-5 w-5 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/80 mb-1">Generation incomplete</p>
                      <p className="text-xs text-muted-foreground/60 leading-relaxed">
                        {generationErrors[index]}
                      </p>
                    </div>
                  </div>
                );
              }

              // Show empty state (not started or failed without error)
              if (uri === null) {
                return (
                  <div
                    key={index}
                    className="aspect-[3/4] bg-muted/50 rounded-md border flex items-center justify-center"
                  >
                    <p className="text-sm text-muted-foreground">Image {index + 1} pending...</p>
                  </div>
                );
              }

              // Show completed image
              const displayUrl =
                getDisplayableImageUrl(
                  comparingSlotIndex === index ? originalOutputImageUrls[index] : uri
                ) || '';
              return (
                <motion.div
                  key={index}
                  variants={itemAnim}
                  className="group rounded-md overflow-hidden flex flex-col border border-border/20"
                >
                  <div
                    className="relative aspect-[2/3] w-full cursor-pointer"
                    onClick={() => handleImageClick(displayUrl || '', index)}
                  >
                    <Image
                      src={displayUrl || ''}
                      alt={`Generated Image ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-102 transition-transform duration-250"
                    />
                    {/* Loading overlay for face retouch/upscale */}
                    {(isFaceRetouchingSlot === index || isUpscalingSlot === index) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-card/80 backdrop-blur-md space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Face Retouch button - only show if service is available */}
                      {isFaceDetailerServiceAvailable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFaceRetouch(index)}
                          disabled={
                            isFaceRetouchingSlot !== null ||
                            isUpscalingSlot !== null ||
                            !!originalOutputImageUrls[index]
                          }
                        >
                          <UserCheck className="mr-2 h-4 w-4" /> Face Retouch
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpscale(index)}
                        disabled={
                          isUpscalingSlot !== null ||
                          isFaceRetouchingSlot !== null ||
                          !!originalOutputImageUrls[index]
                        }
                      >
                        <Sparkles className="mr-2 h-4 w-4" /> Upscale
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadOutput(uri, index)}
                        className="flex-1"
                        disabled={isFaceRetouchingSlot !== null || isUpscalingSlot !== null}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSendToVideoPage(uri)}
                        className="flex-1"
                        disabled={isFaceRetouchingSlot !== null || isUpscalingSlot !== null}
                      >
                        <VideoIcon className="mr-2 h-4 w-4" /> Video
                      </Button>
                    </div>
                    {originalOutputImageUrls[index] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full select-none"
                        onMouseDown={() => setComparingSlotIndex(index)}
                        onMouseUp={() => setComparingSlotIndex(null)}
                        onMouseLeave={() => setComparingSlotIndex(null)}
                        onTouchStart={e => {
                          e.preventDefault();
                          setComparingSlotIndex(index);
                        }}
                        onTouchEnd={() => setComparingSlotIndex(null)}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Hold to Compare
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {isImageViewerOpen && selectedImageUrl && (
          <UnifiedMediaModal
            isOpen={isImageViewerOpen}
            onClose={handleCloseImageViewer}
            title={<DialogTitle>Image Viewer</DialogTitle>}
            description={
              <DialogDescription>
                Viewing generated image {(selectedImageIndex ?? 0) + 1} of {NUM_IMAGES_TO_GENERATE}.
              </DialogDescription>
            }
            footerRight={
              <>
                <Button variant="outline" onClick={handleCloseImageViewer}>
                  <X className="w-4 h-4 mr-2" /> Close
                </Button>
              </>
            }
          >
            <>
              <MediaSlot>
                <Image
                  src={selectedImageUrl}
                  alt={`Generated Image ${(selectedImageIndex ?? 0) + 1} - Large View`}
                  fill
                  className="object-contain"
                  quality={95}
                />
              </MediaSlot>
              <SidebarSlot>
                <div className="p-4 flex flex-col gap-4">
                  <h3 className="font-semibold">Actions</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {isFaceDetailerServiceAvailable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFaceRetouch(selectedImageIndex!)}
                        disabled={
                          isFaceRetouchingSlot !== null ||
                          isUpscalingSlot !== null ||
                          !!originalOutputImageUrls[selectedImageIndex!]
                        }
                      >
                        <UserCheck className="mr-2 h-4 w-4" /> Face Retouch
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpscale(selectedImageIndex!)}
                      disabled={
                        isUpscalingSlot !== null ||
                        isFaceRetouchingSlot !== null ||
                        !!originalOutputImageUrls[selectedImageIndex!]
                      }
                    >
                      <Sparkles className="mr-2 h-4 w-4" /> Upscale
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendToVideoPage(outputImageUrls[selectedImageIndex!])}
                      disabled={isUpscalingSlot !== null || isFaceRetouchingSlot !== null}
                    >
                      <VideoIcon className="mr-2 h-4 w-4" /> Use for Video
                    </Button>
                  </div>
                </div>
              </SidebarSlot>
            </>
          </UnifiedMediaModal>
        )}
      </AnimatePresence>
    </>
  );
}
