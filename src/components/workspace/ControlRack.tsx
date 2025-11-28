'use client';

import React from 'react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { ImageControlPanel } from './ImageControlPanel';
import { VideoControlPanel } from './VideoControlPanel';

interface ControlRackProps {
    maxImages?: number;
    userModel?: string;
}

export function ControlRack({ maxImages = 3, userModel }: ControlRackProps) {
    const activeView = useGenerationSettingsStore(state => state.activeView);

    return (
        <aside className="w-[320px] border-r border-white/5 bg-card/30 flex flex-col h-full shrink-0 z-10 relative">
            {/* Removed Header from here. Child panels own their headers. */}

            {/* Content Switcher */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeView === 'image' ? (
                    <ImageControlPanel userModel={userModel} />
                ) : (
                    <VideoControlPanel userModel={userModel} />
                )}
            </div>
        </aside>
    );
}
