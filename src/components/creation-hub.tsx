// src/components/creation-hub.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreparation from "./image-preparation";
import ImageParameters from "./image-parameters";
import VideoParameters from "./video-parameters";

export default function CreationHub() {
  const [preparedImageDataUri, setPreparedImageDataUri] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Tabs at the top */}
      <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image">Image Generation</TabsTrigger>
          <TabsTrigger value="video">Video Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-6">
          <ImagePreparation onImageReady={setPreparedImageDataUri} />
          <ImageParameters preparedImageUrl={preparedImageDataUri} />
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <ImagePreparation onImageReady={setPreparedImageDataUri} />
          <VideoParameters preparedImageUrl={preparedImageDataUri} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
