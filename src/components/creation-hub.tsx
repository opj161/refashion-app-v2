// src/components/creation-hub.tsx
"use client";

import React, { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreparationContainer from "./ImagePreparationContainer";
import ImageParameters from "./image-parameters";
import VideoParameters from "./video-parameters";
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";
import { useShallow } from 'zustand/react/shallow';

// Main component - no context provider needed, uses Zustand directly
export default function CreationHub({
  children
}: {
  children: React.ReactElement;
}) {
  const { toast } = useToast();
  const { reset, currentTab, setCurrentTab } = useImageStore(
    useShallow((state) => ({
      reset: state.reset,
      currentTab: state.currentTab,
      setCurrentTab: state.setCurrentTab,
    }))
  );

  // Pure client-side reset - no URL manipulation
  const handleReset = useCallback(() => {
    reset(); // Reset the store state
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
  }, [reset, toast]);
  
  return (
    <div className="space-y-8">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image">🖼️ Image</TabsTrigger>
          <TabsTrigger value="video">🎥 Video</TabsTrigger>
          <TabsTrigger value="history">📃 History</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-6 mt-5" forceMount>
          <ImagePreparationContainer
            preparationMode="image"
            onReset={handleReset}
          />
          <ImageParameters />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-5" forceMount>
          <ImagePreparationContainer
            preparationMode="video"
            onReset={handleReset}
          />
          <VideoParameters />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-5" forceMount>
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
