// src/components/AspectRatioSelector.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Crop as CropIcon, Square, RectangleVertical, RectangleHorizontal, Monitor, Film, Smartphone, Camera
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
  const [customWidth, setCustomWidth] = useState<string>("16");
  const [customHeight, setCustomHeight] = useState<string>("9");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const aspectRatios = useMemo(() => {
    return [
      // Freeform
      { name: "Free", tooltip: "Free Crop", value: undefined, icon: <CropIcon className="h-4 w-4" />, category: "basic" },
      
      // Social Media & Common
      { name: "1:1", tooltip: "Square - Instagram Post", value: 1, icon: <Square className="h-4 w-4" />, category: "social" },
      { name: "4:5", tooltip: "Portrait - Instagram", value: 4 / 5, icon: <Smartphone className="h-4 w-4" />, category: "social" },
      { name: "9:16", tooltip: "Stories/Reels - Vertical", value: 9 / 16, icon: <RectangleVertical className="h-4 w-4" />, category: "social" },
      
      // Photography Standards
      { name: "3:4", tooltip: "Portrait Photography", value: 3 / 4, icon: <Camera className="h-4 w-4" />, category: "photo" },
      { name: "2:3", tooltip: "Classic 35mm Film", value: 2 / 3, icon: <Camera className="h-4 w-4" />, category: "photo" },
      { name: "4:3", tooltip: "Standard Photography", value: 4 / 3, icon: <RectangleHorizontal className="h-4 w-4" />, category: "photo" },
      { name: "5:4", tooltip: "Large Format", value: 5 / 4, icon: <RectangleHorizontal className="h-4 w-4" />, category: "photo" },
      
      // Video/Cinema
      { name: "16:9", tooltip: "HD Video/YouTube", value: 16 / 9, icon: <Monitor className="h-4 w-4" />, category: "video" },
      { name: "21:9", tooltip: "Ultrawide Cinema", value: 21 / 9, icon: <Monitor className="h-4 w-4" />, category: "video" },
      { name: "1.91:1", tooltip: "Classic Film", value: 1.91, icon: <Film className="h-4 w-4" />, category: "video" },
      { name: "2.39:1", tooltip: "Anamorphic Widescreen", value: 2.39, icon: <Film className="h-4 w-4" />, category: "video" },
    ];
  }, []);

  const handleCustomRatio = () => {
    const width = parseFloat(customWidth);
    const height = parseFloat(customHeight);
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      return; // Invalid input
    }
    
    const ratio = width / height;
    onAspectChange(ratio);
    setShowCustomInput(false);
  };

  // Helper to check if current aspect matches any preset (with tolerance for floating point)
  const getActivePreset = () => {
    if (!aspect) return undefined;
    return aspectRatios.find(ar => ar.value && Math.abs(ar.value - aspect) < 0.001);
  };

  const activePreset = getActivePreset();

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex justify-between items-center mb-3">
        <Label className="font-semibold text-sm">Aspect Ratio</Label>
      </div>
      
      {/* Compact grid layout */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {aspectRatios.map(ar => {
          const isActive = ar.value === aspect || (activePreset?.name === ar.name);
          return (
            <TooltipProvider key={ar.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    onClick={() => onAspectChange(ar.value)}
                    className="flex-col h-auto p-2 gap-0.5 text-[10px] leading-tight"
                    disabled={disabled}
                    size="sm"
                  >
                    {ar.icon}
                    <span className="font-medium">{ar.name}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{ar.tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Custom Ratio Input */}
      {!showCustomInput ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomInput(true)}
          disabled={disabled}
          className="w-full text-xs"
        >
          Custom Ratio
        </Button>
      ) : (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="W"
            value={customWidth}
            onChange={(e) => setCustomWidth(e.target.value)}
            className="h-8 text-xs"
            min="1"
            step="0.1"
          />
          <span className="text-xs text-muted-foreground">:</span>
          <Input
            type="number"
            placeholder="H"
            value={customHeight}
            onChange={(e) => setCustomHeight(e.target.value)}
            className="h-8 text-xs"
            min="1"
            step="0.1"
          />
          <Button
            size="sm"
            onClick={handleCustomRatio}
            className="h-8 text-xs"
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCustomInput(false)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
