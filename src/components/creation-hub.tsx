// src/components/creation-hub.tsx
"use client";

import React, { useCallback, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import { m, AnimatePresence } from "motion/react";
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

  const router = useRouter();
  const pathname = usePathname();

  // DERIVED STATE (Single Source of Truth)
  // Default to 'image' if param is missing
  const currentTab = searchParams.get('tab') || 'image';
  
  // Sync Store with URL
  const modeFromUrl = searchParams.get('mode');

  // State for initialization from history
  const [initHistoryItem, setInitHistoryItem] = useState<HistoryItem | null>(null);
  const [initImageUrl, setInitImageUrl] = useState<string | null>(null);

  // Get generationMode and historyFilter state and actions from the store
  const { 
    generationMode, 
    setGenerationMode, 
    historyFilter, 
    setHistoryFilter,
    setActiveVideoPrompt 
  } = useGenerationSettingsStore(
    useShallow((state) => ({
      generationMode: state.generationMode,
      setGenerationMode: state.setGenerationMode,
      historyFilter: state.historyFilter,
      setHistoryFilter: state.setHistoryFilter,
      setActiveVideoPrompt: state.setActiveVideoPrompt,
    }))
  );

  useEffect(() => {
    if (modeFromUrl === 'studio' || modeFromUrl === 'creative') {
      setGenerationMode(modeFromUrl);
    }
  }, [modeFromUrl, setGenerationMode]);

  // Effect to read query params on initial load
  useEffect(() => {
    const historyId = searchParams.get('init_history_id');
    const imageUrl = searchParams.get('init_image_url');
    // const tab = searchParams.get('target_tab'); // Handled by derived state now

    if (historyId) {
      // We pass a "fake" history item with just the ID to the context
      setInitHistoryItem({ id: historyId } as HistoryItem);
      // if (tab) setCurrentTab(tab); // Handled by URL
      
      // We do NOT clear URL anymore, we want it to persist
    } else if (imageUrl) {
      setInitImageUrl(imageUrl);
      
      // IMPROVEMENT: Capture prompt context for Video Generation if provided
      const prompt = searchParams.get('init_prompt');
      if (prompt) {
        setActiveVideoPrompt(prompt);
      }
      // setCurrentTab('image'); // Handled by URL if we update it
      // setGenerationMode('studio'); // Handled by URL if we update it
      
      // We do NOT clear URL anymore
    }
  }, [searchParams, setGenerationMode, setActiveVideoPrompt]);

  // Handler to load from history - will be passed to HistoryCard components
  const handleLoadFromHistory = useCallback((item: HistoryItem) => {
    setInitHistoryItem(item);
    const targetTab = item.videoGenerationParams ? 'video' : 'image';
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', targetTab);
    router.replace(`${pathname}?${params.toString()}` as any, { scroll: false });
  }, [pathname, router, searchParams]);

  // Handler to load from image URL - will be passed to components that need it
  const handleLoadFromImageUrl = useCallback((imageUrl: string) => {
    setInitImageUrl(imageUrl);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'image');
    params.set('mode', 'studio');
    router.replace(`${pathname}?${params.toString()}` as any, { scroll: false });
  }, [pathname, router, searchParams]);

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

  // Helper to update URL without reloading
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}` as any, { scroll: false });
  };

  // Clone children to pass initialization handlers
  const enhancedChildren = React.cloneElement(children, {
    onLoadFromHistory: handleLoadFromHistory,
    onLoadFromImageUrl: handleLoadFromImageUrl,
    currentTab,
    setCurrentTab: handleTabChange,
  } as any);

  return (
    <div className="space-y-8">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        {/* === START: INTEGRATED LAYOUT === */}
        <div className="flex flex-col">
          {/* Main Tabs - Refactored for Floating Pill Look with Grid Layout */}
          <TabsList className="w-full flex h-16 p-1 bg-muted/20 rounded-xl">
            <TabsTrigger 
              value="image" 
              className="flex-1 text-base font-medium h-full rounded-lg"
            >
              🖼️ Image
            </TabsTrigger>
            <TabsTrigger 
              value="video" 
              className="flex-1 text-base font-medium h-full rounded-lg"
            >
              🎥 Video
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-1 text-base font-medium h-full rounded-lg"
            >
              📃 History
            </TabsTrigger>
          </TabsList>

          {/* Mode Switcher Container - Refactored */}
          <div className="relative w-full min-h-[3rem] flex mt-2">
            <AnimatePresence mode="wait">
              {currentTab === 'image' && (
                <m.div 
                  key="mode-selector"
                  variants={COMMON_VARIANTS.slideDownAndFade}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full flex justify-center"
                >
                  <SegmentedControl
                    value={generationMode}
                    onValueChange={(mode) => {
                      if (mode) {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('mode', mode);
                        router.replace(`${pathname}?${params.toString()}` as any, { scroll: false });
                      }
                    }}
                    className="w-auto min-w-[300px] p-1 bg-muted/30 rounded-xl border border-white/5"
                  >
                    <SegmentedControlItem value="studio" className="flex-1 py-2">
                      <Camera className="h-4 w-4 mr-2" /> Studio Mode
                    </SegmentedControlItem>
                    <SegmentedControlItem value="creative" className="flex-1 py-2">
                      <Sparkles className="h-4 w-4 mr-2" /> Creative Mode
                    </SegmentedControlItem>
                  </SegmentedControl>
                </m.div>
              )}
              {currentTab === 'history' && (
                <m.div 
                  key="history-filter"
                  variants={COMMON_VARIANTS.slideDownAndFade}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full flex justify-center"
                >
                  <SegmentedControl
                    value={historyFilter}
                    onValueChange={(value) => setHistoryFilter((value || 'all') as 'all' | 'image' | 'video')}
                    className="w-auto min-w-[300px] p-1 bg-muted/30 rounded-xl border border-white/5"
                    aria-label="Filter history items"
                  >
                    <SegmentedControlItem value="all" className="flex-1 py-2">
                      <Grid3x3 className="h-4 w-4 mr-2" /> All
                    </SegmentedControlItem>
                    <SegmentedControlItem value="image" className="flex-1 py-2">
                      <ImageIcon className="h-4 w-4 mr-2" /> Images
                    </SegmentedControlItem>
                    <SegmentedControlItem value="video" className="flex-1 py-2">
                      <Video className="h-4 w-4 mr-2" /> Videos
                    </SegmentedControlItem>
                  </SegmentedControl>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* === END: INTEGRATED LAYOUT === */}        <TabsContent value="image" className="space-y-6 mt-8" forceMount>
          <ImagePreparationContainer
            preparationMode="image"
            onReset={handleReset}
            recentUploads={recentUploads}
          />

          {/* Unified workspace with both modes and results display */}
          <ImageGenerationWorkspace
            setCurrentTab={handleTabChange}
            onLoadImageUrl={handleLoadFromImageUrl}
            maxImages={maxImages}
            userModel={userModel} // NEW
          />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-8" forceMount>
          <ImagePreparationContainer
            preparationMode="video"
            onReset={handleReset}
            recentUploads={recentUploads}
          />
          <VideoParameters />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-8" forceMount>
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
