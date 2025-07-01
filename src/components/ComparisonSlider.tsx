// src/components/ComparisonSlider.tsx
"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight } from "lucide-react";

interface ComparisonSliderProps {
  leftImage: string;
  rightImage: string;
  leftLabel?: string;
  rightLabel?: string;
  onClose: () => void;
}

export default function ComparisonSlider({ 
  leftImage, 
  rightImage, 
  leftLabel = "Before", 
  rightLabel = "After",
  onClose 
}: ComparisonSliderProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">{leftLabel}</span>
            <ArrowRight className="h-5 w-5 text-primary" />
            <span className="text-primary">{rightLabel}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative border rounded-lg overflow-hidden bg-muted/20">
          <div className="grid grid-cols-2 gap-0">
            <div className="relative">
              <Image 
                src={leftImage} 
                alt={leftLabel || "Left comparison image"}
                width={400}
                height={400}
                className="w-full h-auto object-contain max-h-[400px]"
                unoptimized
              />
              <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1">
                <span className="text-xs font-medium">{leftLabel}</span>
              </div>
            </div>
            
            <div className="relative border-l">
              <Image 
                src={rightImage} 
                alt={rightLabel || "Right comparison image"}
                width={400}
                height={400}
                className="w-full h-auto object-contain max-h-[400px]"
                unoptimized
              />
              <div className="absolute bottom-2 right-2 bg-primary/90 backdrop-blur-sm rounded px-2 py-1 text-primary-foreground">
                <span className="text-xs font-medium">{rightLabel}</span>
              </div>
            </div>
          </div>
          
          {/* Center divider line */}
          <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-0.5 w-1 bg-border"></div>
        </div>
      </CardContent>
    </Card>
  );
}
