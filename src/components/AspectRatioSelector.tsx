// src/components/AspectRatioSelector.tsx
"use client";

import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Crop as CropIcon, Square, RectangleVertical, RectangleHorizontal
} from "lucide-react";

interface AspectRatioSelectorProps {
  preparationMode: 'image' | 'video';
  aspect: number | undefined;
  onAspectChange: (aspect: number | undefined) => void;
  disabled?: boolean;
}

export default function AspectRatioSelector({ 
  preparationMode, 
  aspect, 
  onAspectChange, 
  disabled = false 
}: AspectRatioSelectorProps) {
  const aspectRatios = useMemo(() => {
    return [
      { name: "Free", tooltip: "Free Crop", value: undefined, icon: <CropIcon /> },
      { name: "Square", tooltip: "Square (1:1)", value: 1, icon: <Square /> },
      { name: "9:16", tooltip: "Video (9:16)", value: 9 / 16, icon: <RectangleVertical /> },
      { name: "3:4", tooltip: "Portrait (3:4)", value: 3 / 4, icon: <RectangleVertical /> },
    ];
  }, []);

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex justify-between items-center mb-2">
        <Label className="font-semibold">Aspect Ratio</Label>
      </div>
      <div className="flex flex-row gap-2 w-full">
        {aspectRatios.map(ar => {
          const isActive = ar.value === aspect;
          return (
            <TooltipProvider key={ar.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    onClick={() => onAspectChange(ar.value)}
                    className="flex-col h-auto p-3 gap-1 text-xs flex-1"
                    disabled={disabled}
                  >
                    {ar.icon}
                    <span>{ar.name}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{ar.tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
