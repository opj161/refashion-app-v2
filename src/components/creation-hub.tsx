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
import { useImageStore } from '@/stores/imageStore';
import { Sparkles, Camera, Grid3x3, Image as ImageIcon, Video } from 'lucide-react';
import { COMMON_VARIANTS } from "@/lib/motion-constants";

// Wrap the component content that uses useSearchParams
function CreationHubContent({
  children,
  maxImages = 3,
  recentUploads = [],
  userModel, // NEW
}: {
  children: React.ReactElement;
  maxImages?: number;
  recentUploads?: string[];
  userModel?: string; // NEW
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

  // Get actions from store
  const { initializeFromHistory, initializeFromUrl, reset } = useImageStore();

  // Effect to handle initialization
  useEffect(() => {
    if (initHistoryItem) {
      // Only initialize if we have a valid item and it's for the current tab (or we just switched)
      // Actually, since the store is global, we just initialize.
      // But we should check if we are already initialized to avoid loops?
      // The store actions are async but we don't await them here.
      initializeFromHistory(initHistoryItem);
      handleInitializationComplete();
    } else if (initImageUrl) {
      initializeFromUrl(initImageUrl);
      handleInitializationComplete();
    }
  }, [initHistoryItem, initImageUrl, initializeFromHistory, initializeFromUrl, handleInitializationComplete]);

  // Pure client-side reset - calls the store reset
  const handleReset = useCallback(() => {
    reset();
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
  }, [reset, toast]);
  
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
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-14">
            <TabsTrigger value="image" className="h-full text-sm sm:text-base data-[state=active]:bg-background/80">🖼️ Image</TabsTrigger>
            <TabsTrigger value="video" className="h-full text-sm sm:text-base data-[state=active]:bg-background/80">🎥 Video</TabsTrigger>
            <TabsTrigger value="history" className="h-full text-sm sm:text-base data-[state=active]:bg-background/80">📃 History</TabsTrigger>
          </TabsList>

          {/* Mode Switcher Container - Fixed height to prevent layout shift */}
          <div className="relative w-full h-[3rem] mt-2">
            <AnimatePresence mode="wait">
              {currentTab === 'image' && (
                <motion.div 
                  key="mode-selector"
                  variants={COMMON_VARIANTS.slideDownAndFade}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
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
                  variants={COMMON_VARIANTS.slideDownAndFade}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
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
                      <ImageIcon className="h-4 w-4" /> Images
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
            <ImagePreparationContainer
              preparationMode="image"
              onReset={handleReset}
              recentUploads={recentUploads}
            />
            
            {/* Unified workspace with both modes and results display */}
            <ImageGenerationWorkspace 
              setCurrentTab={setCurrentTab}
              onLoadImageUrl={handleLoadFromImageUrl}
              maxImages={maxImages}
              userModel={userModel} // NEW
            />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-5" forceMount>
            <ImagePreparationContainer
              preparationMode="video"
              onReset={handleReset}
              recentUploads={recentUploads}
            />
            <VideoParameters />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-5" forceMount>
          {enhancedChildren}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// The main export now wraps the content in Suspense
export default function CreationHub(props: { children: React.ReactElement; maxImages?: number; recentUploads?: string[]; userModel?: string }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreationHubContent {...props} />
    </Suspense>
  );
}
