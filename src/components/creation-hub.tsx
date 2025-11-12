// src/components/creation-hub.tsx
"use client";

import React, { useCallback, useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import { motion, AnimatePresence } from "motion/react";
import ImagePreparationContainer from "./ImagePreparationContainer";
import { ImageGenerationWorkspace } from "./ImageGenerationWorkspace";
import VideoParameters from "./video-parameters";
import { useToast } from "@/hooks/use-toast";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { useShallow } from 'zustand/react/shallow';
import type { HistoryItem } from '@/lib/types';
import { ImagePreparationProvider } from '@/contexts/ImagePreparationContext';
import { Sparkles, Camera, Grid3x3, Image, Video } from 'lucide-react';

// Wrap the component content that uses useSearchParams
function CreationHubContent({
  children
}: {
  children: React.ReactElement;
}) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  // Manage currentTab as local state instead of global store
  const [currentTab, setCurrentTab] = useState<string>('image');
  
  // State for initialization from history
  const [initHistoryItem, setInitHistoryItem] = useState<HistoryItem | null>(null);
  const [initImageUrl, setInitImageUrl] = useState<string | null>(null);

  // Get generationMode and historyFilter state and actions from the store
  const { generationMode, setGenerationMode, historyFilter, setHistoryFilter } = useGenerationSettingsStore(
    useShallow((state) => ({
      generationMode: state.generationMode,
      setGenerationMode: state.setGenerationMode,
      historyFilter: state.historyFilter,
      setHistoryFilter: state.setHistoryFilter,
    }))
  );

  // Effect to read query params on initial load
  useEffect(() => {
    const historyId = searchParams.get('init_history_id');
    const imageUrl = searchParams.get('init_image_url');
    const tab = searchParams.get('target_tab');

    if (historyId) {
      // We pass a "fake" history item with just the ID to the context
      setInitHistoryItem({ id: historyId } as HistoryItem);
      if (tab) setCurrentTab(tab);
      // Clear the URL to avoid re-triggering on refresh
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/');
      }
    } else if (imageUrl) {
      setInitImageUrl(imageUrl);
      setCurrentTab('image');
      setGenerationMode('studio');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [searchParams, setGenerationMode]);

  // Handler to load from history - will be passed to HistoryCard components
  const handleLoadFromHistory = useCallback((item: HistoryItem) => {
    setInitHistoryItem(item);
    const targetTab = item.videoGenerationParams ? 'video' : 'image';
    setCurrentTab(targetTab);
  }, []);

  // Handler to load from image URL - will be passed to components that need it
  const handleLoadFromImageUrl = useCallback((imageUrl: string) => {
    setInitImageUrl(imageUrl);
    setGenerationMode('studio');
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
        {/* === START: INTEGRATED LAYOUT === */}
        <div className="bg-muted/30 p-1 rounded-lg flex flex-col items-center">
          {/* Main Tabs */}
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0">
            <TabsTrigger value="image">🖼️ Image</TabsTrigger>
            <TabsTrigger value="video">🎥 Video</TabsTrigger>
            <TabsTrigger value="history">📃 History</TabsTrigger>
          </TabsList>

          {/* Mode Switcher Container - Fixed height to prevent layout shift */}
          <div className="relative w-full h-[2.5rem] mt-2">
            <AnimatePresence mode="wait">
              {currentTab === 'image' && (
                <motion.div 
                  key="mode-selector"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <SegmentedControl
                    value={generationMode}
                    onValueChange={(mode) => {
                      if (mode) setGenerationMode(mode as 'creative' | 'studio');
                    }}
                  >
                    <SegmentedControlItem value="studio">
                      <Camera className="h-4 w-4" /> Studio Mode
                    </SegmentedControlItem>
                    <SegmentedControlItem value="creative">
                      <Sparkles className="h-4 w-4" /> Creative Mode
                    </SegmentedControlItem>
                  </SegmentedControl>
                </motion.div>
              )}
              {currentTab === 'history' && (
                <motion.div 
                  key="history-filter"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <SegmentedControl
                    value={historyFilter}
                    onValueChange={(value) => setHistoryFilter((value || 'all') as 'all' | 'image' | 'video')}
                    aria-label="Filter history items"
                  >
                    <SegmentedControlItem value="all">
                      <Grid3x3 className="h-4 w-4" /> All
                    </SegmentedControlItem>
                    <SegmentedControlItem value="image">
                      <Image className="h-4 w-4" /> Images
                    </SegmentedControlItem>
                    <SegmentedControlItem value="video">
                      <Video className="h-4 w-4" /> Videos
                    </SegmentedControlItem>
                  </SegmentedControl>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* === END: INTEGRATED LAYOUT === */}        <TabsContent value="image" className="space-y-6 mt-5" forceMount>
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

// The main export now wraps the content in Suspense
export default function CreationHub(props: { children: React.ReactElement }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreationHubContent {...props} />
    </Suspense>
  );
}
