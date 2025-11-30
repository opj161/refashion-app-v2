"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { HistoryItem } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, PlayCircle, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { getDisplayableImageUrl, cn } from "@/lib/utils";
import { VideoPlaybackModal } from "@/components/VideoPlaybackModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { m, AnimatePresence } from "motion/react";

interface VideoHistoryCardProps {
  item: HistoryItem;
}

export function VideoHistoryCard({ item }: VideoHistoryCardProps) {
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const thumbnailUrl = getDisplayableImageUrl(
    item.videoGenerationParams?.sourceImageUrl || item.originalClothingUrl || ""
  );
  const videoUrl = getDisplayableImageUrl(item.generatedVideoUrls?.[0] || "");
  const status = (item.videoGenerationParams as any)?.status;
  const error = (item.videoGenerationParams as any)?.error;

  // IntersectionObserver for autoplay-in-view
  useEffect(() => {
    const currentCard = cardRef.current;
    if (!currentCard || !videoUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting);
      },
      {
        root: null, // viewport
        rootMargin: "0px",
        threshold: 0.5, // Play when 50% of the card is visible
      }
    );

    observer.observe(currentCard);

    return () => {
      observer.unobserve(currentCard);
    };
  }, [videoUrl]);

  // Handle video play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    // OPTIMIZATION: Only autoplay if in view AND (not mobile OR user enabled data saver override)
    // For now, we disable autoplay on mobile for data safety unless explicitly clicked
    const shouldPlay = isInView && !isMobile;

    if (shouldPlay) {
      video.play().catch((error) => {
        if (error.name !== "AbortError") console.error("Video play failed:", error);
      });
    } else {
      video.pause();
    }
  }, [isInView, videoUrl, isMobile]);

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Clock className="h-4 w-4 animate-pulse text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "completed":
        return videoUrl ? <CheckCircle className="h-4 w-4 text-green-500" /> : null;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "processing":
        return "Processing...";
      case "failed":
        return error || "Generation failed";
      case "completed":
        return videoUrl ? "Ready" : "Completed";
      default:
        return "";
    }
  };

  const canPlayVideo = status === "completed" && videoUrl;

  return (
    <m.div layout>
      <Card
        ref={cardRef}
        className="group cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg"
        onClick={() => canPlayVideo && setIsModalOpen(true)}
      >
        <CardContent className="p-0">
          <m.div
            layoutId={`video-card-${item.id}`}
            className="relative aspect-[9/16] w-full bg-muted"
          >
            {thumbnailUrl && (
              <Image
                src={thumbnailUrl}
                alt="Video thumbnail"
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  isInView ? "opacity-0" : "opacity-100"
                )}
              />
            )}
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                loop
                muted
                playsInline
                preload="metadata"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                  isInView ? "opacity-100" : "opacity-0"
                )}
              />
            )}
            {/* Status overlay */}
            {status && (
              <div className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5">
                {getStatusIcon()}
              </div>
            )}
            {/* Play button overlay - only show for completed videos */}
            {!isInView && canPlayVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <PlayCircle className="h-16 w-16 text-white/80" />
              </div>
            )}
            {/* Processing overlay for incomplete videos */}
            {status === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center text-white">
                  <Clock className="mx-auto mb-2 h-8 w-8 animate-pulse" />
                  <p className="text-sm">Processing...</p>
                </div>
              </div>
            )}
            {/* Error overlay */}
            {status === "failed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="p-4 text-center text-white">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
                  <p className="text-sm">Generation Failed</p>
                  {error && <p className="mt-1 text-xs opacity-80">{error}</p>}
                </div>
              </div>
            )}
          </m.div>
        </CardContent>
        <CardFooter className="flex-col items-start bg-card-foreground/5 p-3">
          <div className="flex w-full items-center gap-2">
            <p className="flex-1 truncate text-sm font-medium" title={item.constructedPrompt}>
              {item.constructedPrompt}
            </p>
            {status && (
              <div className="flex items-center gap-1 text-xs">
                {getStatusIcon()}
                <span
                  className={cn({
                    "text-blue-600": status === "processing",
                    "text-red-600": status === "failed",
                    "text-green-600": status === "completed",
                  })}
                >
                  {getStatusText()}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(item.timestamp).toLocaleDateString()}
          </p>
        </CardFooter>
      </Card>
      <AnimatePresence>
        {isModalOpen && <VideoPlaybackModal item={item} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>
    </m.div>
  );
}
