// src/components/HistoryCard.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HistoryItem } from "@/lib/types";
import { getDisplayableImageUrl } from "@/lib/utils";
import { Eye, RefreshCw, Video, Image as ImageIcon, AlertTriangle, Loader2, PlayCircle, MoreVertical, MoreHorizontal, Trash2, Download, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { m } from 'motion/react';
import { useToast } from "@/hooks/use-toast";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useRouter } from 'next/navigation';


interface HistoryCardProps {
  item: HistoryItem;
  onViewDetails: (item: HistoryItem) => void;
  onDeleteItem: (item: HistoryItem) => void;
  username?: string;
  onLoadFromHistory?: (item: HistoryItem) => void;
  onLoadFromImageUrl?: (imageUrl: string) => void;
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

// Memoize HistoryCard to prevent unnecessary re-renders when gallery updates
// REMOVED: React.memo wrapper.
export default function HistoryCard({
  item,
  onViewDetails,
  onDeleteItem,
  username,
  onLoadFromHistory,
  onLoadFromImageUrl,
  currentTab,
  setCurrentTab
}: HistoryCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const loadFromHistory = useGenerationSettingsStore(state => state.loadFromHistory);
  const setGenerationMode = useGenerationSettingsStore(state => state.setGenerationMode);
  const [isInView, setIsInView] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState<'reload' | 'send' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isVideoItem = !!(item.videoGenerationParams || (item.generatedVideoUrls && item.generatedVideoUrls.some(url => !!url)));
  const primaryImageUrl = item.editedImageUrls?.[0] || item.originalClothingUrl;
  const videoUrl = item.generatedVideoUrls?.[0];


  // IntersectionObserver for autoplay-in-view
  useEffect(() => {
    const currentCard = cardRef.current;
    if (!currentCard || !isVideoItem || !videoUrl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
      }
    );
    observer.observe(currentCard);
    return () => {
      if (currentCard) {
        observer.unobserve(currentCard);
      }
    };
  }, [isVideoItem, videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoItem || !videoUrl) return;
    if (isInView) {
      video.play().catch(error => { if (error.name !== 'AbortError') console.error("Video play failed:", error); });
    } else {
      video.pause();
    }
  }, [isInView, isVideoItem, videoUrl]);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  const handleCardClick = () => {
    onViewDetails(item);
  };
  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewDetails(item);
    }
  };

  // REMOVED: useCallback
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const triggerDownload = (url: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    if (isVideoItem) {
      const localVideoUrl = item.videoGenerationParams?.localVideoUrl;
      if (localVideoUrl) {
        const downloadUrl = getDisplayableImageUrl(localVideoUrl);
        if (downloadUrl) {
          triggerDownload(downloadUrl, `RefashionAI_video_${item.id.slice(0, 8)}.mp4`);
        }
      }
    } else {
      const imageUrls = item.editedImageUrls.filter((url): url is string => !!url);
      if (imageUrls.length > 0) {
        const downloadUrl = getDisplayableImageUrl(imageUrls[0]);
        if (downloadUrl) {
          triggerDownload(downloadUrl, `RefashionAI_image_${item.id.slice(0, 8)}.png`);
        }
      } else {
        toast({ title: "No images to download", variant: "destructive" });
      }
    }
  };

  // REMOVED: useCallback
  const handleReload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    setIsLoadingAction('reload');
    try {
      // Navigate to the main page with a query param
      const targetTab = item.videoGenerationParams ? 'video' : 'image';
      router.push(`/?init_history_id=${item.id}&target_tab=${targetTab}`);

      // If onLoadFromHistory is available (on main page), use it for immediate feedback
      if (onLoadFromHistory) {
        onLoadFromHistory(item);
        loadFromHistory(item);
        toast({
          title: "Configuration Loaded",
          description: "Image and settings restored from history.",
        });
      }
    } catch (error) {
      console.error('Failed to reload config:', error);
      toast({
        title: "Error",
        description: "Could not load configuration from this item.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(null);
    }
  };

  // REMOVED: useCallback
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteItem(item);
  };

  // REMOVED: useCallback
  const handleSendToCreative = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Find the first valid generated image to send
    const imageUrlToSend = item.editedImageUrls?.find(url => !!url);

    if (!imageUrlToSend) {
      toast({
        title: "No Image Available",
        description: "This history item does not have a valid generated image to edit.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAction('send');
    try {
      // Navigate with a different query param
      router.push(`/?init_image_url=${encodeURIComponent(imageUrlToSend)}`);

      // If onLoadFromImageUrl is available (on main page), use it for immediate feedback
      if (onLoadFromImageUrl) {
        onLoadFromImageUrl(imageUrlToSend);
        setGenerationMode('creative');
      }
    } catch (error) {
      console.error("Failed to send image to Creative Studio:", error);
      toast({ title: "Error", description: "Failed to load image", variant: "destructive" });
    } finally {
      setIsLoadingAction(null);
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <m.div
      layout
      layoutId={`history-card-${item.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="h-full"
    >
      <Card
        ref={cardRef}
        variant="glass"
        className={cn(
          "h-full group overflow-hidden transition-all duration-300 border-white/5 shadow-md",
          "hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20"
        )}
      >
        <div
          className="relative aspect-[2/3] w-full bg-muted/20 rounded-md overflow-hidden cursor-pointer group"
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${item.constructedPrompt || (isVideoItem ? "Video" : "Image")}`}
        >
          {/* Media Content */}
          {isVideoItem && videoUrl ? (
            <>
              <m.div layout className="relative w-full h-full">
                <Image
                  src={getDisplayableImageUrl(primaryImageUrl) || '/placeholder.png'}
                  alt="Video thumbnail"
                  fill
                  sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 30vw"
                  decoding="async"
                  className={cn(`object-cover object-top transition-opacity duration-300`, isInView ? 'opacity-0' : 'opacity-100')}
                />
              </m.div>
              <video
                ref={videoRef}
                src={getDisplayableImageUrl(videoUrl) || undefined}
                loop muted playsInline preload="metadata"
                className={cn(`w-full h-full object-cover object-top absolute inset-0 transition-opacity duration-300`, isInView ? 'opacity-100' : 'opacity-0')}
              />
            </>
          ) : primaryImageUrl ? (
            <m.div layout className="relative w-full h-full">
              <Image
                src={getDisplayableImageUrl(primaryImageUrl) || '/placeholder.png'}
                alt={item.constructedPrompt || "Generated image"}
                fill
                sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 30vw"
                className="object-cover object-top transition-transform duration-300 ease-in-out group-hover:scale-105"
              />
            </m.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/30">
              <ImageIcon size={40} />
              <p className="mt-2 text-xs">No preview</p>
            </div>
          )}

          {/* FIX: Consolidate Badges to Top Left Container */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5 items-start">
            {/* REFACTOR: h-3 w-3 -> size-3 */}
            <Badge variant="secondary" className="text-xs font-medium shadow-sm bg-white/80 text-foreground dark:bg-black/60 dark:text-white/90 backdrop-blur-md border border-black/5 dark:border-white/10">
              {isVideoItem ? <Video className="size-3 mr-1.5" /> : <ImageIcon className="size-3 mr-1.5" />}
              {isVideoItem ? "Video" : "Image"}
            </Badge>
          </div>

          {/* Overlay Actions */}
          <div className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300 flex flex-col justify-end",
            "opacity-0 group-hover:opacity-100",
            "focus-within:opacity-100"
          )}>
            <div className="w-full p-2 flex justify-end items-start gap-1 bg-gradient-to-b from-black/60 via-black/20 to-transparent pb-8">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* REFACTOR: h-9 w-9 -> size-9, h-4 w-4 -> size-4 */}
                    <Button variant="ghost" size="icon" className="size-9 bg-black/40 text-white hover:bg-primary hover:text-white backdrop-blur-md rounded-full" onClick={handleDownload} aria-label="Download">
                      <Download className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 bg-black/40 text-white hover:bg-white hover:text-black backdrop-blur-md rounded-full" aria-label="More options">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDeleteItem(item)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 size-4" /> Delete
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleReload} disabled={!!isLoadingAction}>
                    {isLoadingAction === 'reload' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    <span>{isLoadingAction === 'reload' ? 'Loading...' : 'Reload Config'}</span>
                  </DropdownMenuItem>

                  {/* Conditionally render the "Use in Creative" action for Studio Mode items */}
                  {item.generation_mode === 'studio' && (
                    <DropdownMenuItem onClick={handleSendToCreative} disabled={!!isLoadingAction}>
                      {isLoadingAction === 'send' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4 text-primary" />
                      )}
                      <span>{isLoadingAction === 'send' ? 'Loading...' : 'Use in Creative'}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bottom Metadata - Always visible gradient for readability */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white">
            <p className="text-sm font-semibold truncate tracking-tight text-white/95" title={item.constructedPrompt}>
              {item.constructedPrompt || "Untitled Generation"}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-white/70 font-medium" suppressHydrationWarning>
                {new Date(item.timestamp).toLocaleDateString()}
                {username && <span className="ml-1">by {username}</span>}
              </p>
              {/* Mobile-friendly indicator that this is clickable */}
              <Eye className="size-3 text-white/50 lg:hidden" />
            </div>
          </div>
        </div>
      </Card>
    </m.div>
  );
}
