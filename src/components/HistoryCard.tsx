// src/components/HistoryCard.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HistoryItem } from "@/lib/types";
import { getDisplayableImageUrl } from "@/lib/utils";
import { Eye, RefreshCw, Video, Image as ImageIcon, AlertTriangle, Loader2, PlayCircle } from "lucide-react";

interface HistoryCardProps {
  item: HistoryItem;
  onViewDetails: (item: HistoryItem) => void;
  onReloadConfig: (item: HistoryItem) => void;
  // Add other action handlers as needed, e.g., onPlayVideo
}

export default function HistoryCard({ item, onViewDetails, onReloadConfig }: HistoryCardProps) {
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isVideoItem = !!(item.videoGenerationParams || (item.generatedVideoUrls && item.generatedVideoUrls.some(url => !!url)));
  const primaryImageUrl = item.editedImageUrls?.[0] || item.originalClothingUrl;
  const videoUrl = item.generatedVideoUrls?.[0];

  let status: 'completed' | 'processing' | 'failed' | null = null;
  let statusText = "";

  if (isVideoItem && item.videoGenerationParams?.status) {
    status = item.videoGenerationParams.status;
    statusText = status.charAt(0).toUpperCase() + status.slice(1);
  } else if (!isVideoItem && item.editedImageUrls && item.editedImageUrls.every(url => url === null) && item.constructedPrompt) {
    // This is a basic heuristic for failed image jobs if all URLs are null but a prompt existed.
    // More robust status would require adding it to HistoryItem for images.
    status = 'failed';
    statusText = 'Failed';
  } else if (item.editedImageUrls && item.editedImageUrls.some(url => !!url) || primaryImageUrl) {
    status = 'completed';
    // For completed images, we don't usually show a "Completed" badge unless it's a specific design choice.
    // statusText = "Completed";
  }

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
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.5 // Play when 50% of the card is visible
      }
    );

    observer.observe(currentCard);

    return () => {
      observer.unobserve(currentCard);
    };
  }, [isVideoItem, videoUrl]);

  // Handle video play/pause based on visibility
  useEffect(() => {
    if (!videoRef.current || !isVideoItem || !videoUrl) return;

    if (isInView) {
      videoRef.current.play().catch(error => console.error("Video autoplay failed:", error));
    } else {
      videoRef.current.pause();
    }
  }, [isInView, isVideoItem, videoUrl]);

  // Add more sophisticated status detection if needed, e.g. for image processing steps

  return (
    <Card ref={cardRef} className="flex flex-col h-full group shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold truncate" title={item.constructedPrompt?.substring(0,100) || (isVideoItem ? "Video Generation" : "Image Generation")}>
            {item.constructedPrompt?.substring(0, 40) || (isVideoItem ? "Video Generation" : "Image Generation")}
            {item.constructedPrompt && item.constructedPrompt.length > 40 ? "..." : ""}
          </CardTitle>
          <Badge variant={
            status === 'completed' ? 'default' : // 'success' if you have it
            status === 'processing' ? 'secondary' :
            status === 'failed' ? 'destructive' : 'outline'
          } className="ml-2 text-xs whitespace-nowrap">
            {isVideoItem ? <Video className="h-3 w-3 mr-1.5" /> : <ImageIcon className="h-3 w-3 mr-1.5" />}
            {isVideoItem ? "Video" : "Image"}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-grow relative">
        <div 
          className="aspect-[2/3] w-full bg-muted rounded-md overflow-hidden relative"
        >
          {isVideoItem && videoUrl ? (
            <>
              <Image
                src={getDisplayableImageUrl(primaryImageUrl) || '/placeholder.png'}
                alt="Video thumbnail"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-cover object-top transition-opacity duration-300 ${isInView ? 'opacity-0' : 'opacity-100'}`}
              />
              <video
                ref={videoRef}
                src={getDisplayableImageUrl(videoUrl) || undefined}
                loop
                muted
                playsInline
                preload="metadata"
                className={`w-full h-full object-cover object-top absolute inset-0 transition-opacity duration-300 ${isInView ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          ) : primaryImageUrl ? (
            <Image
              src={getDisplayableImageUrl(primaryImageUrl) || '/placeholder.png'}
              alt={isVideoItem ? "Video thumbnail" : "Generated image"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover object-top ${!isVideoItem ? "group-hover:scale-105 transition-transform duration-300 ease-in-out" : ""}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ImageIcon size={48} />
              <p className="mt-2 text-sm">No preview available</p>
            </div>
          )}
          {!isInView && isVideoItem && videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity">
              <PlayCircle className="h-12 w-12 text-white/80" />
            </div>
          )}
           {status && status !== 'completed' && (
             <div className="absolute top-2 right-2">
                <Badge variant={status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                    {status === 'processing' && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                    {status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1.5" />}
                    {statusText}
                </Badge>
             </div>
           )}
        </div>

        {/* Display a few key parameters if available */}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {item.attributes?.fashionStyle && item.attributes.fashionStyle !== "default_style" && (
            <p className="truncate">Style: {item.attributes.fashionStyle.replace(/_/g, ' ')}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 flex gap-2 bg-muted/30 border-t">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(item)} className="flex-1">
          <Eye className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">View Details</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onReloadConfig(item)} className="flex-1">
          <RefreshCw className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Reload Config</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
