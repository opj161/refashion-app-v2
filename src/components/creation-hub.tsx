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
import { useImageStore } from "@/stores/imageStore";
import type { HistoryItem } from "@/lib/types";

export default function CreationHub() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [defaultTab, setDefaultTab] = useState<string>("image");
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [historyItemToLoad, setHistoryItemToLoad] = useState<HistoryItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  
  // Store state for prepared image
  const [preparedImageDataUri, setPreparedImageDataUri] = useState<string | null>(null);
  
  // Access store for debugging/monitoring
  const { reset } = useImageStore();

  // Handle URL parameters on component mount
  useEffect(() => {
    const historyItemId = searchParams.get('historyItemId');
    const defaultTabParam = searchParams.get('defaultTab');
    const sourceImageUrlParam = searchParams.get('sourceImageUrl');

    // Set default tab from URL parameter
    if (defaultTabParam && (defaultTabParam === 'image' || defaultTabParam === 'video')) {
      setDefaultTab(defaultTabParam);
    }

    // Set source image URL from URL parameter (for video navigation)
    if (sourceImageUrlParam) {
      setSourceImageUrl(sourceImageUrlParam);
    }

    // Load history item if historyItemId is present
    if (historyItemId && currentUser) {
      const loadHistoryData = async () => {
        setIsLoadingHistory(true);
        try {
          const { success, item, error } = await getHistoryItemById(historyItemId);
          if (success && item) {
            setHistoryItemToLoad(item);
            // Set the source image URL for the ImagePreparationContainer
            if (item.originalClothingUrl) {
              setSourceImageUrl(item.originalClothingUrl);
            }
            
            toast({
              title: "Configuration Loaded",
              description: "Previous settings have been restored successfully.",
            });
          } else if (!success && error) {
            console.warn('Failed to load history item:', error);
            toast({
              title: "Error Loading Configuration",
              description: "Failed to load the selected configuration.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error loading history item:', error);
          toast({
            title: "Error Loading Configuration", 
            description: "An unexpected error occurred while loading the configuration.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistoryData();
    }
  }, [searchParams, currentUser, toast]);

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
            onImageReady={setPreparedImageDataUri} 
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
            onImageReady={setPreparedImageDataUri} 
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
