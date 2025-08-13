// src/components/creation-hub.tsx
"use client";

import React, { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreparationContainer from "./ImagePreparationContainer";
import ImageParameters from "./image-parameters";
import VideoParameters from "./video-parameters";
import { useToast } from "@/hooks/use-toast";
import { ImagePreparationProvider, useImagePreparation } from "@/contexts/ImagePreparationContext";
import { CreativeStudioHeader } from "./CreativeStudioHeader"; // Import the new header

// Internal component that uses the context
function CreationHubInternal({
  children
}: {
  children: React.ReactElement;
}) {
  const { toast } = useToast();
  const { reset, currentTab, setCurrentTab } = useImagePreparation(); // GET tab state from context

  // Pure client-side reset - no URL manipulation
  const handleReset = useCallback(() => {
    reset(); // Reset the context state
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
  }, [reset, toast]);
  
  return (
    <div className="space-y-4"> {/* Reduced vertical spacing for a tighter layout */}
      {/* The new header is now part of the hub, creating a cohesive unit */}
      <CreativeStudioHeader />

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image">Create Image</TabsTrigger>
          <TabsTrigger value="video">Create Video</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-6 mt-6" forceMount>
          <ImagePreparationContainer
            preparationMode="image"
            onReset={handleReset}
          />
          <ImageParameters />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-6" forceMount>
          <ImagePreparationContainer
            preparationMode="video"
            onReset={handleReset}
          />
          <VideoParameters />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6" forceMount>
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main component that provides the context
export default function CreationHub({
  children
}: {
  children: React.ReactElement;
}) {
  return (
    <ImagePreparationProvider>
      <CreationHubInternal>
        {children}
      </CreationHubInternal>
    </ImagePreparationProvider>
  );
}
