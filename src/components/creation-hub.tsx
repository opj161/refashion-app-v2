// src/components/creation-hub.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const { reset: resetStore, loadImageFromUrl, original } = useImageStore();
  // Tab state is now controlled client-side, updated by URL or props.
  const [currentTab, setCurrentTab] = useState<string>(historyItemToLoad?.videoGenerationParams ? 'video' : 'image');

  // Effect to react to URL search parameters for client-side navigation.
  useEffect(() => {
    const sourceImageUrl = searchParams.get('sourceImageUrl');
    const defaultTab = searchParams.get('defaultTab');

    if (defaultTab) {
      setCurrentTab(defaultTab);
    }
    if (sourceImageUrl && sourceImageUrl !== original?.imageUrl) {
      // Reset state ONLY when loading a new image from URL.
      resetStore();
      loadImageFromUrl(sourceImageUrl).catch(error => {
        toast({
          title: "Failed to Load Image from URL",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      });
    }
  }, [searchParams, loadImageFromUrl, resetStore, toast, original?.imageUrl]);

  // Effect to react to server-provided props on initial load.
  useEffect(() => {
    if (historyItemToLoad) {
      const isVideoItem = !!historyItemToLoad.videoGenerationParams;
      setCurrentTab(isVideoItem ? 'video' : 'image');

      const imageUrl = historyItemToLoad.videoGenerationParams?.sourceImageUrl || historyItemToLoad.originalClothingUrl;
      if (imageUrl && imageUrl !== original?.imageUrl) {
        loadImageFromUrl(imageUrl).catch(error => {
          console.error(`Failed to load image from history item:`, {
            url: imageUrl,
            error: error instanceof Error ? error.message : String(error),
            historyItemId: historyItemToLoad.id
          });
          toast({
            title: "Failed to Load Image",
            description: `Could not load the original image from history.`,
            variant: "destructive",
          });
        });
      }
    }
  }, [historyItemToLoad, loadImageFromUrl, toast, original?.imageUrl]);

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
