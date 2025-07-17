// src/components/creation-hub.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreparationContainer from "./ImagePreparationContainer";
import ImageParameters from "./image-parameters"; // Keep this
import VideoParameters from "./video-parameters"; // Keep this
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";
import type { HistoryItem } from "@/lib/types";

interface CreationHubProps {
  historyItemToLoad: HistoryItem | null;
  sourceImageUrl?: string | null;
}

export default function CreationHub({ historyItemToLoad, sourceImageUrl }: CreationHubProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { reset: resetStore } = useImageStore();
  const [defaultTab, setDefaultTab] = useState<string>("image");

  // This effect runs only when the component mounts on the client
  // to set the correct tab from the URL.
  useEffect(() => {
    const tab = searchParams.get('defaultTab');
    if (tab && (tab === 'image' || tab === 'video')) {
      setDefaultTab(tab);
    }
  }, [searchParams]);

  // Centralized reset function
  const handleReset = useCallback(() => {
    resetStore();
    router.push('/create', { scroll: false });
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
  }, [router, resetStore, toast]);

  return (
    <div className="space-y-8">
      {/* Tabs at the top */}
      <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image">Image Generation</TabsTrigger>
          <TabsTrigger value="video">Video Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-6 mt-8" forceMount>
          <ImagePreparationContainer 
            sourceImageUrl={sourceImageUrl || historyItemToLoad?.originalClothingUrl} 
            preparationMode="image" 
            onReset={handleReset}
          />
          <ImageParameters 
            historyItemToLoad={historyItemToLoad}
          />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-8" forceMount>
          <ImagePreparationContainer 
            sourceImageUrl={sourceImageUrl || historyItemToLoad?.videoGenerationParams?.sourceImageUrl || historyItemToLoad?.originalClothingUrl}
            preparationMode="video" 
            onReset={handleReset}
          />
          <VideoParameters 
            historyItemToLoad={historyItemToLoad}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
