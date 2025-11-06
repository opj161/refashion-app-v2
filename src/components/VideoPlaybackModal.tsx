"use client";

import React from 'react';
import type { HistoryItem } from '@/lib/types';
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UnifiedMediaModal, MediaSlot, SidebarSlot } from './UnifiedMediaModal';
import { ParameterSection, ParameterRow } from './ParameterDisplay';
import { Button } from '@/components/ui/button';
import { Download, Copy, X } from 'lucide-react';
import { getDisplayableImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VideoPlaybackModalProps {
  item: HistoryItem;
  onClose: () => void;
}

export function VideoPlaybackModal({ item, onClose }: VideoPlaybackModalProps) {
  const { toast } = useToast();

  // Use the local URL for the download link
  const downloadUrl = getDisplayableImageUrl(item.videoGenerationParams?.localVideoUrl || null);
  
  // For playback, prioritize local URL but fall back to remote
  const playbackUrl = getDisplayableImageUrl(item.videoGenerationParams?.localVideoUrl || item.generatedVideoUrls?.[0] || '');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Prompt has been copied to clipboard.' });
  };

  return (
    <UnifiedMediaModal
      isOpen={true}
      onClose={onClose}
      title={<DialogTitle>Video Details</DialogTitle>}
      description={<DialogDescription>{`Playback and details for your generated video from ${new Date(item.timestamp).toLocaleString()}.`}</DialogDescription>}
      layoutId={`history-card-${item.id}`}
      footerRight={
        <>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
          <a href={downloadUrl || '#'} download={`RefashionAI_video_${item.id.slice(0, 8)}.mp4`}>
            <Button disabled={!downloadUrl}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </a>
        </>
      }
    >
      <MediaSlot>
        {playbackUrl ? (
          <video
            src={playbackUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-w-full max-h-full object-contain rounded-md"
            onLoadStart={() => console.log('Video loading started')}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground">
            <p>Video not available</p>
          </div>
        )}
      </MediaSlot>
      <SidebarSlot>
        <ParameterSection title="Full Prompt">
          <div className="relative">
            <p className="text-xs leading-relaxed text-foreground/80 pr-8 whitespace-pre-wrap break-words">
              {item.videoGenerationParams?.prompt || item.constructedPrompt}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 hover:bg-background/10"
              onClick={() => handleCopy(item.videoGenerationParams?.prompt || item.constructedPrompt)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </ParameterSection>
        <ParameterSection title="Generation Parameters">
          <ParameterRow label="Seed" value={item.videoGenerationParams?.seed || 'N/A'} />
          <ParameterRow label="Resolution" value={item.videoGenerationParams?.resolution || 'N/A'} />
          <ParameterRow label="Duration" value={`${item.videoGenerationParams?.duration || 'N/A'}s`} />
          <ParameterRow label="Fixed Camera" value={item.videoGenerationParams?.cameraFixed || false} />
          {item.videoGenerationParams?.modelMovement && (
            <ParameterRow label="Model Movement" value={item.videoGenerationParams.modelMovement} />
          )}
          {item.videoGenerationParams?.fabricMotion && (
            <ParameterRow label="Fabric Motion" value={item.videoGenerationParams.fabricMotion} />
          )}
          {item.videoGenerationParams?.cameraAction && (
            <ParameterRow label="Camera Action" value={item.videoGenerationParams.cameraAction} />
          )}
          {item.videoGenerationParams?.aestheticVibe && (
            <ParameterRow label="Aesthetic Vibe" value={item.videoGenerationParams.aestheticVibe} />
          )}
        </ParameterSection>
        <ParameterSection title="Metadata">
          <ParameterRow label="Created" value={new Date(item.timestamp).toLocaleString()} />
          <ParameterRow label="User" value={item.username} />
          <ParameterRow label="ID" value={item.id.slice(0, 8)} />
        </ParameterSection>
      </SidebarSlot>
    </UnifiedMediaModal>
  );
}