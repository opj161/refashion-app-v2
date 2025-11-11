// src/components/creation-hub.tsx
"use client";

import React, { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion, AnimatePresence } from "motion/react";
import ImagePreparationContainer from "./ImagePreparationContainer";
import { ImageGenerationWorkspace } from "./ImageGenerationWorkspace";
import VideoParameters from "./video-parameters";
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { useShallow } from 'zustand/react/shallow';

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

  // Get generationMode state and action from the store
  const { generationMode, setGenerationMode } = useGenerationSettingsStore(
    useShallow((state) => ({
      generationMode: state.generationMode,
      setGenerationMode: state.setGenerationMode,
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

        {/* Mode Switcher UI - only visible on Image tab */}
        <AnimatePresence>
          {currentTab === 'image' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center mt-4"
            >
              <ToggleGroup
                type="single"
                value={generationMode}
                onValueChange={(mode) => {
                  if (mode) setGenerationMode(mode as 'creative' | 'studio');
                }}
                className="bg-muted/30 p-1 rounded-lg"
              >
                <ToggleGroupItem value="creative">Creative Mode</ToggleGroupItem>
                <ToggleGroupItem value="studio">Studio Mode</ToggleGroupItem>
              </ToggleGroup>
            </motion.div>
          )}
        </AnimatePresence>

        <TabsContent value="image" className="space-y-6 mt-5" forceMount>
          <ImagePreparationContainer
            preparationMode="image"
            onReset={handleReset}
          />
          
          {/* Unified workspace with both modes and results display */}
          <ImageGenerationWorkspace />
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
