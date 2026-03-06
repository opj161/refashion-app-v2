// src/components/creation-hub.tsx
"use client";

import React, { useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { Route } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import { m, AnimatePresence } from "motion/react";
import ImagePreparationContainer from "./ImagePreparationContainer";
import { ImageGenerationWorkspace } from "./ImageGenerationWorkspace";
import VideoParameters from "./video-parameters";
import { useToast } from "@/hooks/use-toast";
import { useGenerationSettingsStore } from "@/stores/generationSettingsStore";
import { useShallow } from 'zustand/react/shallow';
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
  children: React.ReactNode;
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

  // Get actions from image store
  const { initializeFromHistory, initializeFromUrl, reset } = useImageStore();
  const initializedParamsRef = useRef<string | null>(null);

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

  // Initialize from URL params (history ID or image URL) on load
  useEffect(() => {
    const historyId = searchParams.get('init_history_id');
    const imageUrl = searchParams.get('init_image_url');
    const paramsKey = `${historyId || ''}-${imageUrl || ''}`;
    if (paramsKey === initializedParamsRef.current || (!historyId && !imageUrl)) return;
    initializedParamsRef.current = paramsKey;

    if (historyId) {
      initializeFromHistory({ id: historyId });
    } else if (imageUrl) {
      initializeFromUrl(imageUrl);
      const prompt = searchParams.get('init_prompt');
      if (prompt) {
        setActiveVideoPrompt(prompt);
      }
    }
  }, [searchParams, initializeFromHistory, initializeFromUrl, setActiveVideoPrompt]);

  // Handler to load from image URL - will be passed to components that need it
  const handleLoadFromImageUrl = useCallback((imageUrl: string) => {
    initializeFromUrl(imageUrl);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'image');
    params.set('mode', 'studio');
    router.replace(`${pathname}?${params.toString()}` as Route, { scroll: false });
  }, [pathname, router, searchParams, initializeFromUrl]);

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
    router.replace(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

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
              <span aria-hidden="true">🖼️</span> Image
            </TabsTrigger>
            <TabsTrigger 
              value="video" 
              className="flex-1 text-base font-medium h-full rounded-lg"
            >
              <span aria-hidden="true">🎥</span> Video
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-1 text-base font-medium h-full rounded-lg"
            >
              <span aria-hidden="true">📃</span> History
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
                        router.replace(`${pathname}?${params.toString()}` as Route, { scroll: false });
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
        {/* === END: INTEGRATED LAYOUT === */}        <TabsContent value="image" className="space-y-6 mt-8">
          <ImagePreparationContainer
            preparationMode="image"
            onReset={handleReset}
            recentUploads={recentUploads}
          />

          {/* Unified workspace with both modes and results display */}
          <ImageGenerationWorkspace
            onLoadImageUrl={handleLoadFromImageUrl}
            maxImages={maxImages}
            userModel={userModel} // NEW
          />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-8">
          <ImagePreparationContainer
            preparationMode="video"
            onReset={handleReset}
            recentUploads={recentUploads}
          />
          <VideoParameters />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-8">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// The main export now wraps the content in Suspense
export default function CreationHub(props: { children: React.ReactNode; maxImages?: number; recentUploads?: string[]; userModel?: string }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreationHubContent {...props} />
    </Suspense>
  );
}
