// src/components/creation-hub.tsx
"use client";

import React, { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion, AnimatePresence } from "motion/react";
import ImagePreparationContainer from "./ImagePreparationContainer";
import { ImageGenerationWorkspace } from "./ImageGenerationWorkspace";
import VideoParameters from "./video-parameters";
import { useToast } from "@/hooks/use-toast";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { useShallow } from 'zustand/react/shallow';
import type { HistoryItem } from '@/lib/types';
import { ImagePreparationProvider } from '@/contexts/ImagePreparationContext';

export default function CreationHub({
  children
}: {
  children: React.ReactElement;
}) {
  const { toast } = useToast();
  
  // Manage currentTab as local state instead of global store
  const [currentTab, setCurrentTab] = useState<string>('image');
  
  // State for initialization from history
  const [initHistoryItem, setInitHistoryItem] = useState<HistoryItem | null>(null);
  const [initImageUrl, setInitImageUrl] = useState<string | null>(null);

  // Get generationMode state and action from the store
  const { generationMode, setGenerationMode } = useGenerationSettingsStore(
    useShallow((state) => ({
      generationMode: state.generationMode,
      setGenerationMode: state.setGenerationMode,
    }))
  );

  // Handler to load from history - will be passed to HistoryCard components
  const handleLoadFromHistory = useCallback((item: HistoryItem) => {
    setInitHistoryItem(item);
    const targetTab = item.videoGenerationParams ? 'video' : 'image';
    setCurrentTab(targetTab);
  }, []);

  // Handler to load from image URL - will be passed to components that need it
  const handleLoadFromImageUrl = useCallback((imageUrl: string) => {
    setInitImageUrl(imageUrl);
    setGenerationMode('creative');
    setCurrentTab('image');
  }, [setGenerationMode]);

  // Reset initialization state after it's consumed
  const handleInitializationComplete = useCallback(() => {
    setInitHistoryItem(null);
    setInitImageUrl(null);
  }, []);

  // Ref tracking for reset handlers from each container
  const imageContainerResetRef = React.useRef<(() => void) | null>(null);
  const videoContainerResetRef = React.useRef<(() => void) | null>(null);

  // Pure client-side reset - calls the active container's reset
  const handleReset = useCallback(() => {
    if (currentTab === 'image' && imageContainerResetRef.current) {
      imageContainerResetRef.current();
    } else if (currentTab === 'video' && videoContainerResetRef.current) {
      videoContainerResetRef.current();
    }
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
  }, [currentTab, toast]);
  
  // Clone children to pass initialization handlers
  const enhancedChildren = React.cloneElement(children, {
    onLoadFromHistory: handleLoadFromHistory,
    onLoadFromImageUrl: handleLoadFromImageUrl,
    currentTab,
    setCurrentTab,
  } as any);
  
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
          <ImagePreparationProvider
            initialHistoryItem={currentTab === 'image' ? initHistoryItem : null}
            initialImageUrl={currentTab === 'image' ? initImageUrl : null}
            onInitializationComplete={handleInitializationComplete}
          >
            <ImagePreparationContainer
              preparationMode="image"
              onReset={handleReset}
              resetRef={imageContainerResetRef}
            />
            
            {/* Unified workspace with both modes and results display */}
            <ImageGenerationWorkspace 
              setCurrentTab={setCurrentTab}
              onLoadImageUrl={handleLoadFromImageUrl}
            />
          </ImagePreparationProvider>
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-5" forceMount>
          <ImagePreparationProvider
            initialHistoryItem={currentTab === 'video' ? initHistoryItem : null}
            initialImageUrl={null}
            onInitializationComplete={handleInitializationComplete}
          >
            <ImagePreparationContainer
              preparationMode="video"
              onReset={handleReset}
              resetRef={videoContainerResetRef}
            />
            <VideoParameters />
          </ImagePreparationProvider>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-5" forceMount>
          {enhancedChildren}
        </TabsContent>
      </Tabs>
    </div>
  );
}
