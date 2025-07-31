// src/components/creation-hub.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreparationContainer from "./ImagePreparationContainer";
import ImageParameters from "./image-parameters";
import VideoParameters from "./video-parameters";
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";
import type { HistoryItem } from "@/lib/types";

export default function CreationHub({ 
  children,
  historyItemToLoad 
}: { 
  children: React.ReactNode;
  historyItemToLoad: HistoryItem | null; 
}) {
  const { toast } = useToast();
  const router = useRouter();
  const { reset: resetStore, loadImageFromUrl } = useImageStore();
  
  // Determine the default tab based on the pre-fetched data
  const [currentTab, setCurrentTab] = useState<string>(
    historyItemToLoad?.videoGenerationParams ? 'video' : 'image'
  );

  // When the history item prop changes, update the active tab
  useEffect(() => {
    if (historyItemToLoad) {
      setCurrentTab(historyItemToLoad.videoGenerationParams ? 'video' : 'image');
    }
  }, [historyItemToLoad]);

  // Load the original image when history item changes
  useEffect(() => {
    if (historyItemToLoad) {
      const isVideoItem = !!historyItemToLoad.videoGenerationParams;
      
      // For video items, try sourceImageUrl first, then fallback to originalClothingUrl
      // For image items, use originalClothingUrl
      const primaryUrl = isVideoItem 
        ? historyItemToLoad.videoGenerationParams?.sourceImageUrl 
        : historyItemToLoad.originalClothingUrl;
      const fallbackUrl = historyItemToLoad.originalClothingUrl;
      
      console.log('Loading image from history:', {
        isVideoItem,
        videoSourceUrl: historyItemToLoad.videoGenerationParams?.sourceImageUrl,
        originalClothingUrl: historyItemToLoad.originalClothingUrl,
        primaryUrl,
        fallbackUrl,
        historyItemId: historyItemToLoad.id
      });
      
      const tryLoadImage = async (url: string, isFallback = false) => {
        try {
          await loadImageFromUrl(url);
          console.log(`Successfully loaded image from ${isFallback ? 'fallback' : 'primary'} URL:`, url);
        } catch (error) {
          console.error(`Failed to load image from ${isFallback ? 'fallback' : 'primary'} URL:`, {
            url,
            isVideoItem,
            isFallback,
            error: error instanceof Error ? error.message : String(error),
            historyItemId: historyItemToLoad.id
          });
          
          if (!isFallback && isVideoItem && fallbackUrl && fallbackUrl !== url) {
            // Try fallback URL for video items
            console.log('Trying fallback URL for video item:', fallbackUrl);
            await tryLoadImage(fallbackUrl, true);
          } else {
            // Show error toast
            toast({
              title: "Failed to Load Image",
              description: `Could not load the original image from history.${isFallback ? ' (tried fallback)' : ''}`,
              variant: "destructive",
            });
            throw error;
          }
        }
      };
      
      if (primaryUrl) {
        tryLoadImage(primaryUrl);
      } else if (fallbackUrl) {
        console.log('No primary URL, using fallback:', fallbackUrl);
        tryLoadImage(fallbackUrl, true);
      } else {
        console.warn('No image URL found in history item:', historyItemToLoad);
      }
    }
  }, [historyItemToLoad, loadImageFromUrl, toast]);

  const handleReset = useCallback(() => {
    router.push('/', { scroll: false }); // Clear URL params
    resetStore();
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
  }, [router, resetStore, toast]);
  
  const isVideoItem = !!historyItemToLoad?.videoGenerationParams;

  return (
    <div className="space-y-8">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image">Create Image</TabsTrigger>
          <TabsTrigger value="video">Create Video</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-6 mt-8" forceMount>
          <ImagePreparationContainer 
            preparationMode="image" 
            onReset={handleReset}
          />
          <ImageParameters 
            historyItemToLoad={!isVideoItem ? historyItemToLoad : null}
            isLoadingHistory={false}
          />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-8" forceMount>
          <ImagePreparationContainer 
            preparationMode="video" 
            onReset={handleReset}
          />
          <VideoParameters 
            historyItemToLoad={isVideoItem ? historyItemToLoad : null}
            isLoadingHistory={false}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-8" forceMount>
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
