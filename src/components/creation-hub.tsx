// src/components/creation-hub.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreparationContainer from "./ImagePreparationContainer";
import ImageParameters from "./image-parameters";
import VideoParameters from "./video-parameters";
import { getHistoryItemById } from "@/actions/historyActions";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { HistoryItem } from "@/lib/types";

export default function CreationHub() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [defaultTab, setDefaultTab] = useState<string>("image");
  const [processedContextId, setProcessedContextId] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [historyItemToLoad, setHistoryItemToLoad] = useState<HistoryItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Handle URL parameters and state synchronization on component mount
  useEffect(() => {
    const historyItemId = searchParams.get('historyItemId');
    const defaultTabParam = searchParams.get('defaultTab');
    const sourceImageUrlParam = searchParams.get('sourceImageUrl');
    const currentContextId = historyItemId || sourceImageUrlParam;

    // Set default tab from URL parameter, but only if it's different to avoid re-renders
    if (defaultTabParam && (defaultTabParam === 'image' || defaultTabParam === 'video')) {
      if (defaultTab !== defaultTabParam) {
        setDefaultTab(defaultTabParam);
      }
    }

    // If there's no context, and nothing was processed, do nothing.
    if (!currentContextId && !processedContextId) {
      return;
    }

    // Reset and load history item or source image URL based on URL parameters
    if (currentContextId && currentContextId !== processedContextId) {
      setHistoryItemToLoad(null);
      if (historyItemId) {
        const loadHistoryData = async () => {
          setIsLoadingHistory(true);
          try {
            const { success, item, error } = await getHistoryItemById(historyItemId);
            if (success && item) {
              setHistoryItemToLoad(item);
              setSourceImageUrl(item.originalClothingUrl || item.videoGenerationParams?.sourceImageUrl || null);
            } else if (!success && error) {
              toast({ title: "Error Loading Configuration", description: error, variant: "destructive" });
            }
          } catch (e) {
            toast({ title: "Error Loading Configuration", description: "An unexpected error occurred.", variant: "destructive" });
          } finally {
            setIsLoadingHistory(false);
          }
        };
        loadHistoryData();
      } else if (sourceImageUrlParam) {
        setSourceImageUrl(sourceImageUrlParam);
      }
      setProcessedContextId(currentContextId);
    } else if (!currentContextId && processedContextId) {
      setSourceImageUrl(null);
      setHistoryItemToLoad(null);
      setProcessedContextId(null);
    }
  }, [searchParams, currentUser, toast, processedContextId, defaultTab]);

  return (
    <div className="space-y-8">
      {/* Tabs at the top */}
      <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image">Image Generation</TabsTrigger>
          <TabsTrigger value="video">Video Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-6 mt-8">
          <ImagePreparationContainer 
            sourceImageUrl={sourceImageUrl} 
            preparationMode="image" 
          />
          <ImageParameters 
            historyItemToLoad={historyItemToLoad}
            isLoadingHistory={isLoadingHistory}
          />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-8">
          <ImagePreparationContainer 
            sourceImageUrl={sourceImageUrl} 
            preparationMode="video" 
          />
          <VideoParameters 
            historyItemToLoad={historyItemToLoad}
            isLoadingHistory={isLoadingHistory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
