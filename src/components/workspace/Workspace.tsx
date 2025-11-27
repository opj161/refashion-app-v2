// src/components/workspace/Workspace.tsx
'use client';

import React from 'react';
import { InputStage } from './InputStage';
import { ControlRack } from './ControlRack';
import { OutputGallery } from './OutputGallery';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useIsMobile } from '@/hooks/use-mobile';

// Mobile view imports
import CreationHub from '@/components/creation-hub';
import HistoryGallery from '@/components/history-gallery';
import type { HistoryItem } from '@/lib/types';

interface WorkspaceProps {
  maxImages?: number;
  recentUploads?: string[];
  userModel?: string;
  initialHistory?: {
    items: HistoryItem[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
  };
}

/**
 * Workspace - The main workspace component that decides between mobile and desktop layouts.
 * 
 * On desktop (lg+): Shows the 3-column pro-tool layout
 * On mobile: Falls back to the existing CreationHub tab-based interface
 */
export function Workspace({ 
  maxImages = 3, 
  recentUploads = [], 
  userModel,
  initialHistory
}: WorkspaceProps) {
  const isMobile = useIsMobile();
  const activeView = useGenerationSettingsStore(state => state.activeView);

  // For mobile, use the existing CreationHub component
  if (isMobile === true) {
    return (
      <div className="container mx-auto max-w-7xl px-4 pt-5 pb-10 space-y-8">
        <CreationHub maxImages={maxImages} recentUploads={recentUploads} userModel={userModel}>
          <HistoryGallery initialHistory={initialHistory || { items: [], totalCount: 0, hasMore: false, currentPage: 1 }} />
        </CreationHub>
      </div>
    );
  }

  // Still loading (isMobile is undefined during SSR)
  if (isMobile === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Desktop: 3-column workspace
  return (
    <WorkspaceShell>
      {/* Left Column: Input Stage */}
      <InputStage recentUploads={recentUploads} />
      
      {/* Center Column: Control Rack */}
      <ControlRack maxImages={maxImages} userModel={userModel} />
      
      {/* Right Column: Output Gallery */}
      <OutputGallery maxImages={maxImages} />
    </WorkspaceShell>
  );
}

export default Workspace;
