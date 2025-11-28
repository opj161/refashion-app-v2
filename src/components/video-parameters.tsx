'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import {
  PREDEFINED_PROMPTS, MODEL_MOVEMENT_OPTIONS, FABRIC_MOTION_OPTIONS_VIDEO,
  CAMERA_ACTION_OPTIONS, AESTHETIC_VIBE_OPTIONS
} from '@/lib/prompt-builder';

interface VideoParametersProps {
  isPending?: boolean;
  variant?: 'default' | 'sidebar';
}

export default function VideoParameters({ isPending, variant = 'default' }: VideoParametersProps) {
  const { videoSettings, setVideoSettings } = useGenerationSettingsStore(
    useShallow((state) => ({
      videoSettings: state.videoSettings,
      setVideoSettings: state.setVideoSettings,
    }))
  );

  const handleChange = (key: keyof typeof videoSettings, value: string | boolean) => {
    setVideoSettings({ [key]: value });
  };

  const content = (
    <div className="space-y-6">
      {/* Hidden Inputs for Form Submission */}
      <input type="hidden" name="selectedPredefinedPrompt" value={videoSettings.selectedPredefinedPrompt} />
      <input type="hidden" name="modelMovement" value={videoSettings.modelMovement} />
      <input type="hidden" name="fabricMotion" value={videoSettings.fabricMotion} />
      <input type="hidden" name="cameraAction" value={videoSettings.cameraAction} />
      <input type="hidden" name="aestheticVibe" value={videoSettings.aestheticVibe} />
      <input type="hidden" name="duration" value={videoSettings.duration} />
      <input type="hidden" name="resolution" value={videoSettings.resolution} />

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Motion Settings</Label>

        {/* Predefined Prompt / Scenario */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Scenario</Label>
          <Select
            value={videoSettings.selectedPredefinedPrompt}
            onValueChange={(v) => handleChange('selectedPredefinedPrompt', v)}
            disabled={isPending}
          >
            <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PREDEFINED_PROMPTS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.displayLabel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Movement */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Model Movement</Label>
          <Select
            value={videoSettings.modelMovement}
            onValueChange={(v) => handleChange('modelMovement', v)}
            disabled={isPending}
          >
            <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODEL_MOVEMENT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.displayLabel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fabric Motion */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Fabric Motion</Label>
          <Select
            value={videoSettings.fabricMotion}
            onValueChange={(v) => handleChange('fabricMotion', v)}
            disabled={isPending}
          >
            <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FABRIC_MOTION_OPTIONS_VIDEO.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.displayLabel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Camera Action */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Camera</Label>
          <Select
            value={videoSettings.cameraAction}
            onValueChange={(v) => handleChange('cameraAction', v)}
            disabled={isPending}
          >
            <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CAMERA_ACTION_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.displayLabel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration & Resolution */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Duration</Label>
            <Select
              value={videoSettings.duration}
              onValueChange={(v) => handleChange('duration', v as any)}
              disabled={isPending}
            >
              <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['5', '10'].map(d => (
                  <SelectItem key={d} value={d} className="text-xs">{d}s</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Quality</Label>
            <Select
              value={videoSettings.resolution}
              onValueChange={(v) => handleChange('resolution', v as any)}
              disabled={isPending}
            >
              <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['720p', '1080p'].map(r => (
                  <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === 'sidebar') return content;

  return (
    <div className="p-4 border rounded-lg bg-card">
      {content}
    </div>
  );
}
