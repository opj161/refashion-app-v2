// src/components/creation-hub.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreparation from "./image-preparation";
import ImageParameters from "./image-parameters";
import VideoParameters from "./video-parameters";
import { getHistoryItemById } from "@/actions/historyActions";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function CreationHub() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [preparedImageDataUri, setPreparedImageDataUri] = useState<string | null>(null);
  const [defaultTab, setDefaultTab] = useState<string>("image");
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);

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
      const loadHistoryImage = async () => {
        try {
          const { success, item, error } = await getHistoryItemById(historyItemId);
          if (success && item && item.originalClothingUrl) {
            setSourceImageUrl(item.originalClothingUrl);
          } else if (!success && error) {
            console.warn('Failed to load history item:', error);
          }
        } catch (error) {
          console.error('Error loading history item:', error);
        }
      };
      loadHistoryImage();
    }
  }, [searchParams, currentUser]);

  return (
    <div className="space-y-8">
      {/* Tabs at the top */}
      <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image">Image Generation</TabsTrigger>
          <TabsTrigger value="video">Video Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-6">
          <ImagePreparation onImageReady={setPreparedImageDataUri} sourceImageUrl={sourceImageUrl} preparationMode="image" />
          <ImageParameters preparedImageUrl={preparedImageDataUri} />
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <ImagePreparation onImageReady={setPreparedImageDataUri} sourceImageUrl={sourceImageUrl} preparationMode="video" />
          <VideoParameters preparedImageUrl={preparedImageDataUri} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
