// src/components/creation-hub.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreparationContainer from "./ImagePreparationContainer";
import ImageParameters from "./image-parameters";
import VideoParameters from "./video-parameters";
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/stores/imageStore";

export default function CreationHub({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const { reset: resetStore } = useImageStore();
  const [defaultTab, setDefaultTab] = useState<string>("image");

  // Centralized reset function
  const handleReset = useCallback(() => {
    router.push('/', { scroll: false }); // Update URL first
    resetStore();
    toast({
      title: "Image Cleared",
      description: "You can now upload a new image to start over.",
    });
  }, [router, resetStore, toast]);

  return (
    <div className="space-y-8">
      {/* Tabs at the top */}
      <Tabs defaultValue="image" value={defaultTab} onValueChange={setDefaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image">Image Generation</TabsTrigger>
          <TabsTrigger value="video">Video Generation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-6 mt-8" forceMount>
          <ImagePreparationContainer preparationMode="image" onReset={handleReset} />
          <ImageParameters />
        </TabsContent>

        <TabsContent value="video" className="space-y-6 mt-8" forceMount>
          <ImagePreparationContainer preparationMode="video" onReset={handleReset} />
          <VideoParameters />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-8" forceMount>
          {/* The children prop is the server-rendered history gallery */}
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
