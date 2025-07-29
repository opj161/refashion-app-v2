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
      const imageUrl = historyItemToLoad.videoGenerationParams?.sourceImageUrl || historyItemToLoad.originalClothingUrl;
      if (imageUrl) {
        loadImageFromUrl(imageUrl).catch((error) => {
          console.error('Failed to load image from history:', error);
          toast({
            title: "Failed to Load Image",
            description: "Could not load the original image from history.",
            variant: "destructive",
          });
        });
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
