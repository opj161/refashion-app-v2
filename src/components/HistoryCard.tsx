// src/components/HistoryCard.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HistoryItem } from "@/lib/types";
import { getDisplayableImageUrl } from "@/lib/utils";
import { Eye, RefreshCw, Video, Image as ImageIcon, AlertTriangle, Loader2, PlayCircle, MoreVertical, Trash2, Download, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from 'motion/react';
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { transitions, shadows } from "@/lib/design-tokens";
import { useRouter } from 'next/navigation';


interface HistoryCardProps {
  item: HistoryItem;
  onViewDetails: (item: HistoryItem) => void;
  onDeleteItem: (item: HistoryItem) => void;
  username?: string;
}

export default function HistoryCard({ item, onViewDetails, onDeleteItem, username }: HistoryCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const initializeFromHistory = useImageStore(state => state.initializeFromHistory);
  const initializeFromImageUrl = useImageStore(state => state.initializeFromImageUrl);
  const setCurrentTab = useImageStore(state => state.setCurrentTab);
  const loadFromHistory = useGenerationSettingsStore(state => state.loadFromHistory);
  const setGenerationMode = useGenerationSettingsStore(state => state.setGenerationMode);
  const [isInView, setIsInView] = useState(false);
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

  const handleDownload = useCallback((e: React.MouseEvent) => {
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
  }, [item, isVideoItem, toast]);

  const handleReload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // 1. Initialize image from history (existing functionality)
      await initializeFromHistory(item);
      
      // 2. Load generation settings into Zustand store - now takes full HistoryItem
      loadFromHistory(item);
      
      // 3. Switch to the appropriate tab
      const targetTab = item.videoGenerationParams ? 'video' : 'image';
      setCurrentTab(targetTab);
      
      toast({
        title: "Configuration Loaded",
        description: "Image and settings restored from history.",
      });
    } catch (error) {
      console.error('Failed to reload config:', error);
      toast({
        title: "Error",
        description: "Could not load configuration from this item.",
        variant: "destructive",
      });
    }
  }, [initializeFromHistory, loadFromHistory, item, setCurrentTab, toast]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteItem(item);
  }, [onDeleteItem, item]);

  const handleSendToCreative = useCallback(async (e: React.MouseEvent) => {
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

    try {
      // 1. Load the generated image into the preparation workflow
      await initializeFromImageUrl(imageUrlToSend);
      
      // 2. Switch the UI state to Creative Mode on the Image tab
      setGenerationMode('creative');
      setCurrentTab('image');

      // 3. Navigate to the main page to ensure CreationHub is visible
      router.push('/');
    } catch (error) {
      // Errors are already handled with toasts inside the store action,
      // but we can log them here for debugging.
      console.error("Failed to send image to Creative Studio:", error);
    }
  }, [item, initializeFromImageUrl, setGenerationMode, setCurrentTab, router, toast]);

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      layout
      layoutId={`history-card-${item.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="h-full"
    >
      <Card
        ref={cardRef}
        variant="glass"
        className={cn(
          "h-full group overflow-hidden",
          transitions.base,
          shadows.md,
          "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40"
        )}
      >
        <div
          className="relative aspect-[2/3] w-full bg-muted rounded-md overflow-hidden cursor-pointer group"
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${item.constructedPrompt || (isVideoItem ? "Video" : "Image")}`}
        >
          {/* Media Content */}
          {isVideoItem && videoUrl ? (
            <>
              <Image
                src={getDisplayableImageUrl(primaryImageUrl) || '/placeholder.png'}
                alt="Video thumbnail"
                fill
                sizes="(max-width: 640px) 100vw, 320px"
                className={cn(`object-cover object-top transition-opacity duration-300`, isInView ? 'opacity-0' : 'opacity-100')}
              />
              <video
                ref={videoRef}
                src={getDisplayableImageUrl(videoUrl) || undefined}
                loop muted playsInline preload="metadata"
                className={cn(`w-full h-full object-cover object-top absolute inset-0 transition-opacity duration-300`, isInView ? 'opacity-100' : 'opacity-0')}
              />
            </>
          ) : primaryImageUrl ? (
            <Image
              src={getDisplayableImageUrl(primaryImageUrl) || '/placeholder.png'}
              alt={item.constructedPrompt || "Generated image"}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover object-top transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/30">
              <ImageIcon size={40} />
              <p className="mt-2 text-xs">No preview</p>
            </div>
          )}

          {/* Type Badge */}
          <Badge variant={isVideoItem ? 'default' : 'secondary'} className="absolute top-2 left-2 z-10 text-xs">
            {isVideoItem ? <Video className="h-3 w-3 mr-1.5" /> : <ImageIcon className="h-3 w-3 mr-1.5" />}
            {isVideoItem ? "Video" : "Image"}
          </Badge>

          {/* Studio Mode Badge */}
          {item.generation_mode === 'studio' && (
            <Badge variant="outline" className="absolute top-2 right-2 z-10 text-xs bg-black/50 border-white/30 text-white">
              Studio
            </Badge>
          )}

          {/* Hover/Focus Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 ease-in-out">
            {/* Top Actions */}
            <div className="flex justify-end items-start gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 text-white hover:bg-black/70 hover:text-white" onClick={handleDownload} aria-label="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 text-white hover:bg-black/70 hover:text-white" onClick={handleActionClick} aria-label="More options">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>More</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end" onClick={handleActionClick}>
                  <DropdownMenuItem onClick={handleReload}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Reload Config</span>
                  </DropdownMenuItem>
                  
                  {/* Conditionally render the "Use in Creative" action for Studio Mode items */}
                  {item.generation_mode === 'studio' && (
                    <DropdownMenuItem onClick={handleSendToCreative}>
                      <Sparkles className="mr-2 h-4 w-4 text-primary" />
                      <span>Use in Creative</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bottom Metadata */}
            <div className="text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
              <p className="text-sm font-semibold truncate" title={item.constructedPrompt}>
                {item.constructedPrompt}
              </p>
              <p className="text-xs text-white/80" suppressHydrationWarning>
                {new Date(item.timestamp).toLocaleString()}
                {username && <span className="font-semibold"> by {username}</span>}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
