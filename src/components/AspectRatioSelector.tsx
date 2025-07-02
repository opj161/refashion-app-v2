// src/components/AspectRatioSelector.tsx
"use client";

import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
      { name: "Free", value: "free", icon: <CropIcon /> },
      { name: "Square", value: (1 / 1).toString(), icon: <Square /> },
      { name: "Video (9:16)", value: (9 / 16).toString(), icon: <RectangleVertical /> },
      { name: "Portrait (3:4)", value: (3 / 4).toString(), icon: <RectangleVertical /> },
    ];
  }, []);

  const handleValueChange = (value: string) => {
    const newAspect = value === 'free' ? undefined : Number(value);
    onAspectChange(newAspect);
  };

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex justify-between items-center mb-2">
        <Label className="font-semibold">Aspect Ratio</Label>
      </div>
      <ToggleGroup 
        type="single" 
        value={aspect?.toString() || 'free'} 
        onValueChange={handleValueChange}
        className="flex flex-row gap-1 w-full"
        disabled={disabled}
      >
        {aspectRatios.map(ar => (
          <TooltipProvider key={ar.value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem 
                  value={ar.value} 
                  className="flex-col h-auto p-3 gap-1 text-xs flex-1"
                  disabled={disabled}
                >
                  {ar.icon}
                  <span>{ar.name}</span>
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>{ar.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </ToggleGroup>
    </div>
  );
}
