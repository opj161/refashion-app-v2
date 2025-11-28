'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import { useImageStore } from '@/stores/imageStore';
import { generateImageAction, type ImageGenerationFormState } from '@/actions/imageActions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import StudioParameters from '@/components/studio-parameters';
import ImageParameters from '@/components/image-parameters';
import { useStoreSubmission } from '@/hooks/useStoreSubmission';

interface ImageControlPanelProps {
    userModel?: string;
    maxImages?: number;
}

export function ImageControlPanel({ userModel, maxImages = 3 }: ImageControlPanelProps) {
    const generationMode = useGenerationSettingsStore(state => state.generationMode);
    const { versions, activeVersionId } = useImageStore();

    const activeImage = activeVersionId ? versions[activeVersionId] : null;
    const isImageReady = !!activeImage?.imageUrl;
    const isAnyVersionProcessing = Object.values(versions).some(v => v.status === 'processing');

    const { submit, isPending } = useStoreSubmission<ImageGenerationFormState>(
        generateImageAction,
        { message: '' }
    );

    const isSubmitDisabled = isPending || !isImageReady || isAnyVersionProcessing;

    return (
        <div className="flex flex-col h-full min-h-0 bg-workspace-panel relative group">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-5 shrink-0 border-b border-workspace-border">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/70 shadow-[0_0_8px_hsl(var(--primary))] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                        Configuration
                    </span>
                </div>
                <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-white/10 bg-white/5 text-muted-foreground">
                    V2.5
                </Badge>
            </div>

            {/* Scrollable Form Area */}
            <ScrollArea className="flex-1">
                <div className="p-5">
                    {generationMode === 'studio' ? (
                        <StudioParameters isPending={isPending} userModel={userModel} variant="sidebar" />
                    ) : (
                        <ImageParameters isPending={isPending} userModel={userModel} variant="sidebar" />
                    )}
                </div>
            </ScrollArea>

            {/* Footer Actions - Gradient border top */}
            <div className="p-4 bg-workspace-panel border-t border-workspace-border relative z-20">
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                <Button
                    onClick={() => submit()}
                    disabled={isSubmitDisabled}
                    size="lg"
                    className={cn(
                        "w-full h-12 text-sm font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden",
                        !isSubmitDisabled
                            ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] border border-white/10"
                            : "bg-muted/20 text-muted-foreground border border-white/5"
                    )}
                >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className={cn("h-4 w-4", !isSubmitDisabled && "animate-pulse")} />
                        )}
                        {isPending ? "Generating..." : "Generate"}
                    </div>

                    {/* Button Glint Effect */}
                    {!isSubmitDisabled && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                    )}
                </Button>

                <div className="text-center mt-3">
                    <span className="text-[10px] text-muted-foreground/40">
                        {isImageReady ? "Ready to dream" : "Upload an image to begin"}
                    </span>
                </div>
            </div>
        </div>
    );
}
