"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { HistoryItem } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, PlayCircle, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { getDisplayableImageUrl } from '@/lib/utils';
import { VideoPlaybackModal } from '@/components/VideoPlaybackModal';

interface VideoHistoryCardProps {
  item: HistoryItem;
}

export function VideoHistoryCard({ item }: VideoHistoryCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailUrl = getDisplayableImageUrl(
    item.videoGenerationParams?.sourceImageUrl || item.originalClothingUrl || ''
  );
  const videoUrl = getDisplayableImageUrl(item.generatedVideoUrls?.[0] || '');
  const status = item.videoGenerationParams?.status;
  const error = item.videoGenerationParams?.error;

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return videoUrl ? <CheckCircle className="h-4 w-4 text-green-500" /> : null;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'failed':
        return error || 'Generation failed';
      case 'completed':
        return videoUrl ? 'Ready' : 'Completed';
      default:
        return '';
    }
  };

  const canPlayVideo = status === 'completed' && videoUrl;

  return (
    <>
      <Card className="overflow-hidden group transition-all hover:shadow-lg hover:border-primary/50">
        <CardContent className="p-0">
          <div
            className={`relative aspect-[9/16] w-full bg-muted ${
              canPlayVideo ? 'cursor-pointer' : 'cursor-default'
            }`}
            onClick={() => canPlayVideo && setIsModalOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {!isHovered && thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt="Video thumbnail"
                fill
                className="object-cover"
              />
            ) : null}
            {isHovered && videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : isHovered && !videoUrl && thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt="Video thumbnail"
                fill
                className="object-cover"
              />
            ) : null}
            
            {/* Status overlay */}
            {status && (
              <div className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5">
                {getStatusIcon()}
              </div>
            )}
            
            {/* Play button overlay - only show for completed videos */}
            {!isHovered && canPlayVideo && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle className="h-16 w-16 text-white/80" />
              </div>
            )}
            
            {/* Processing overlay for incomplete videos */}
            {status === 'processing' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-white text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Processing...</p>
                </div>
              </div>
            )}
            
            {/* Error overlay */}
            {status === 'failed' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-white text-center p-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                  <p className="text-sm">Generation Failed</p>
                  {error && <p className="text-xs mt-1 opacity-80">{error}</p>}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-3 bg-card-foreground/5 flex-col items-start">
          <div className="flex items-center gap-2 w-full">
            <p className="text-sm font-medium truncate flex-1" title={item.constructedPrompt}>
              {item.constructedPrompt}
            </p>
            {status && (
              <div className="flex items-center gap-1 text-xs">
                {getStatusIcon()}
                <span className={`
                  ${status === 'processing' ? 'text-blue-600' : ''}
                  ${status === 'failed' ? 'text-red-600' : ''}
                  ${status === 'completed' ? 'text-green-600' : ''}
                `}>
                  {getStatusText()}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(item.timestamp).toLocaleDateString()}
          </p>
        </CardFooter>
      </Card>
      {isModalOpen && canPlayVideo && <VideoPlaybackModal item={item} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
