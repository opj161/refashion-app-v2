'use client';

import React from "react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Film, Settings2 } from 'lucide-react';
import { useImageStore } from "@/stores/imageStore";
import { generateVideoAction, type VideoGenerationFormState } from '@/ai/actions/generate-video.action';
import { cn } from '@/lib/utils';
import VideoParameters from "@/components/video-parameters";
import { useStoreSubmission } from "@/hooks/useStoreSubmission";

interface VideoControlPanelProps {
    userModel?: string;
}

export function VideoControlPanel({ userModel }: VideoControlPanelProps) {
    const { versions, activeVersionId } = useImageStore();
    const activeImage = activeVersionId ? versions[activeVersionId] : null;
    const isImageReady = !!activeImage?.imageUrl;

    // Use custom hook for submission logic
    const { submit, isPending } = useStoreSubmission<VideoGenerationFormState>(
        generateVideoAction,
        { message: '' }
    );

    const isSubmitDisabled = isPending || !isImageReady;

    return (
        <div className="flex flex-col h-full min-h-0 relative bg-workspace-panel">

            {/* Header */}
            <div className="h-12 border-b border-workspace-border flex items-center px-5 shrink-0 justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                    <Settings2 className="h-3 w-3" /> Video Config
                </span>
            </div>

            {/* Parameters */}
            <ScrollArea className="flex-1">
                <div className="p-5 space-y-6">
                    <VideoParameters isPending={isPending} variant="sidebar" />
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-workspace-border bg-workspace-panel/95 backdrop-blur-lg shadow-2xl shrink-0">
                <Button
                    onClick={() => submit()}
                    disabled={isSubmitDisabled}
                    className={cn(
                        "w-full h-12 text-base font-semibold shadow-lg transition-all duration-300",
                        !isSubmitDisabled ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "opacity-50"
                    )}
                >
                    {isPending ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Queuing...</>
                    ) : (
                        <><Film className="mr-2 h-5 w-5 fill-current" /> Generate Video</>
                    )}
                </Button>
            </div>
        </div>
    );
}
