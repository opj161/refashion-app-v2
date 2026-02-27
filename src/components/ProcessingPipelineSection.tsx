'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Wand2 } from 'lucide-react';

interface ProcessingPipelineSectionProps {
  isPending: boolean;
  backgroundRemovalEnabled: boolean;
  upscaleEnabled: boolean;
  faceDetailEnabled: boolean;
  onBackgroundRemovalChange: (enabled: boolean) => void;
  onUpscaleChange: (enabled: boolean) => void;
  onFaceDetailChange: (enabled: boolean) => void;
  isBackgroundRemovalAvailable: boolean;
  isUpscaleAvailable: boolean;
  isFaceDetailAvailable: boolean;
}

export function ProcessingPipelineSection({
  isPending,
  backgroundRemovalEnabled,
  upscaleEnabled,
  faceDetailEnabled,
  onBackgroundRemovalChange,
  onUpscaleChange,
  onFaceDetailChange,
  isBackgroundRemovalAvailable,
  isUpscaleAvailable,
  isFaceDetailAvailable,
}: ProcessingPipelineSectionProps) {
  // Don't render the section if no services are available
  if (!isBackgroundRemovalAvailable && !isUpscaleAvailable && !isFaceDetailAvailable) {
    return null;
  }

  return (
    <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-muted/30 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Image Processing Options</h3>
      </div>

      {isBackgroundRemovalAvailable && (
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="bg-removal-switch" className="text-sm font-medium cursor-pointer">Remove Background</Label>
          <Switch id="bg-removal-switch" checked={backgroundRemovalEnabled} onCheckedChange={onBackgroundRemovalChange} disabled={isPending} />
        </div>
      )}

      {isUpscaleAvailable && (
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="upscale-switch" className="text-sm font-medium cursor-pointer">Upscale Image</Label>
          <Switch id="upscale-switch" checked={upscaleEnabled} onCheckedChange={onUpscaleChange} disabled={isPending} />
        </div>
      )}

      {isFaceDetailAvailable && (
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="face-detail-switch" className="text-sm font-medium cursor-pointer">Enhance Face Details</Label>
          <Switch id="face-detail-switch" checked={faceDetailEnabled} onCheckedChange={onFaceDetailChange} disabled={isPending} />
        </div>
      )}
    </div>
  );
}
