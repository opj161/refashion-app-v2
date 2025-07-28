"use client";

import React from 'react';
import type { HistoryItem } from '@/lib/types';
import { BaseMediaModal, MediaContainer, Sidebar, ParameterSection, ParameterRow } from './BaseMediaModal';
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

  // Use the local URL for the download link. This will be proxied by our API route
  // which correctly sets the Content-Disposition header to force a download.
  const downloadUrl = getDisplayableImageUrl(item.videoGenerationParams?.localVideoUrl || null);

  // For playback, we can prioritize the local URL but fall back to the remote one.
  const playbackUrl = getDisplayableImageUrl(item.videoGenerationParams?.localVideoUrl || item.generatedVideoUrls?.[0] || '');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Prompt has been copied to clipboard.' });
  };

  return (
    <BaseMediaModal
      isOpen={true}
      onClose={onClose}
      title="Video Details"
      description={`Playback and details for your generated video from ${new Date(item.timestamp).toLocaleString()}.`}
      layoutId={`video-card-${item.id}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
          <a href={downloadUrl || '#'} download={`RefashionAI_video_${item.id.substring(0,8)}.mp4`}>
            <Button disabled={!downloadUrl}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </a>
        </>
      }
    >
      {/* Optimal Video Container */}
      <MediaContainer aspectRatio="video">
        {playbackUrl ? (
          <video
            src={playbackUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain transition-opacity duration-200"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
            onLoadStart={() => console.log('Video loading started')}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground">
            <p>Video not available</p>
          </div>
        )}
      </MediaContainer>

      {/* Unified Sidebar */}
      <Sidebar>
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Full Prompt Section */}
          <ParameterSection title="Full Prompt" collapsible={false}>
            <div className="relative">
              <p className="text-xs leading-relaxed text-muted-foreground p-3 pr-10 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                {item.videoGenerationParams?.prompt || item.constructedPrompt}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 hover:bg-background/10"
                onClick={() => handleCopy(item.videoGenerationParams?.prompt || item.constructedPrompt)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </ParameterSection>

          {/* Generation Parameters */}
          <ParameterSection title="Generation Parameters">
            <div className="space-y-1">
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
            </div>
          </ParameterSection>

          {/* Metadata Section */}
          <ParameterSection title="Metadata">
            <div className="space-y-1">
              <ParameterRow label="Created" value={new Date(item.timestamp).toLocaleString()} />
              <ParameterRow label="User" value={item.username} />
              <ParameterRow label="ID" value={item.id.substring(0, 8)} />
            </div>
          </ParameterSection>
        </div>
      </Sidebar>
    </BaseMediaModal>
  );
}
