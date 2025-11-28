'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { ASPECT_RATIOS } from '@/lib/prompt-builder';
import { VisualSelector } from '@/components/ui/VisualSelector';
import { Shirt, User, Layers } from 'lucide-react';

interface StudioParametersProps {
  isPending: boolean;
  maxImages?: number;
  userModel?: string;
  variant?: 'default' | 'sidebar';
}

export default function StudioParameters({ isPending, userModel, variant = 'default' }: StudioParametersProps) {
  const { studioFit, setStudioFit, studioAspectRatio, setStudioAspectRatio } = useGenerationSettingsStore(
    useShallow((state) => ({
      studioFit: state.studioFit,
      setStudioFit: state.setStudioFit,
      studioAspectRatio: state.studioAspectRatio,
      setStudioAspectRatio: state.setStudioAspectRatio,
    }))
  );

  const isNanoBanana = userModel === 'fal_nano_banana_pro';

  const FIT_OPTIONS = [
    { value: 'slim', label: 'Slim', icon: User, description: 'Tailored fit, close to body' },
    { value: 'regular', label: 'Regular', icon: Shirt, description: 'Standard fit, comfortable drape' },
    { value: 'relaxed', label: 'Relaxed', icon: Layers, description: 'Loose fit, oversized aesthetic' },
  ];

  const content = (
    <div className="space-y-8">
      {/* Hidden Inputs for Form Submission */}
      <input type="hidden" name="studioFit" value={studioFit} />
      {isNanoBanana && <input type="hidden" name="aspectRatio" value={studioAspectRatio} />}

      <div className="space-y-6">
        {/* Section 1: Fit */}
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
            Clothing Fit
          </Label>
          <VisualSelector
            options={FIT_OPTIONS}
            value={studioFit}
            onChange={(v) => setStudioFit(v as any)}
            disabled={isPending}
          />
        </div>

        {/* Section 2: Aspect Ratio (Only if model supports it) */}
        {isNanoBanana && (
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Frame Dimensions
            </Label>
            <Select
              value={studioAspectRatio}
              onValueChange={setStudioAspectRatio}
              disabled={isPending}
            >
              <SelectTrigger className="w-full bg-black/20 border-white/10">
                <SelectValue placeholder="Select aspect ratio..." />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'sidebar') return content;

  // Fallback for legacy usage
  return (
    <div className="p-4 border rounded-lg bg-card">
      {content}
    </div>
  );
}
