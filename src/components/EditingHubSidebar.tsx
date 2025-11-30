// src/components/EditingHubSidebar.tsx
"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Crop as CropIcon,
  Wand2,
  Clock,
  X,
  Check,
} from "lucide-react";
import { m, AnimatePresence } from 'motion/react';

import AspectRatioSelector from "./AspectRatioSelector";
import ImageProcessingTools from "./ImageProcessingTools";
import ImageVersionStack from "./ImageVersionStack";

interface EditingHubSidebarProps {
  preparationMode: 'image' | 'video';
  isCropping: boolean;
  isProcessing: boolean;
  aspect: number | undefined;
  onAspectChange: (aspect?: number) => void;
  onConfirmCrop: () => void;
  onCancelCrop: () => void;
  versions: Record<string, any>; // Simplified for props, context has full type
  activeVersionId: string | null;
}

export default function EditingHubSidebar({
  preparationMode,
  isCropping,
  isProcessing,
  aspect,
  onAspectChange,
  onConfirmCrop,
  onCancelCrop,
  versions,
  activeVersionId,
}: EditingHubSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <Accordion type="multiple" defaultValue={['crop', 'enhancements', 'history']} className="w-full flex-grow flex flex-col">
        {/* --- CROP SECTION --- */}
        <AccordionItem value="crop">
          <AccordionTrigger className="text-base font-semibold">
            <CropIcon className="mr-2 h-5 w-5 text-primary" />
            Crop & Resize
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <AspectRatioSelector
              preparationMode={preparationMode}
              aspect={aspect}
              onAspectChange={onAspectChange}
              disabled={isProcessing}
            />
            <AnimatePresence>
              {isCropping && (
                <m.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2"
                >
                  <Button variant="outline" size="sm" className="flex-1" onClick={onCancelCrop} disabled={isProcessing}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button size="sm" className="flex-1" onClick={onConfirmCrop} disabled={isProcessing}>
                    <Check className="mr-2 h-4 w-4" /> Apply Crop
                  </Button>
                </m.div>
              )}
            </AnimatePresence>
          </AccordionContent>
        </AccordionItem>

        {/* --- ENHANCEMENTS SECTION --- */}
        <AccordionItem value="enhancements">
          <AccordionTrigger className="text-base font-semibold">
            <Wand2 className="mr-2 h-5 w-5 text-primary" />
            Enhancements
          </AccordionTrigger>
          <AccordionContent>
            <ImageProcessingTools
              preparationMode={preparationMode}
              disabled={isProcessing || isCropping}
            />
          </AccordionContent>
        </AccordionItem>
        
        {/* --- VERSION HISTORY SECTION --- */}
        {Object.keys(versions).length > 1 && (
          <AccordionItem value="history" className="flex-grow flex flex-col">
            <AccordionTrigger className="text-base font-semibold">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Version History
            </AccordionTrigger>
            <AccordionContent className="flex-grow">
               <ImageVersionStack
                  versions={versions}
                  activeVersionId={activeVersionId}
                  isProcessing={isProcessing}
                />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
