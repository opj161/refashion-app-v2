'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import ImageResultsDisplay from '@/components/ImageResultsDisplay';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface OutputGalleryProps {
    userId?: string;
    maxImages?: number;
}

export function OutputGallery({ userId, maxImages = 3 }: OutputGalleryProps) {
    const searchParams = useSearchParams();
    const storeResultId = useGenerationSettingsStore(state => state.currentResultId);
    const activeResultId = searchParams.get('jobId') || storeResultId;

    return (
        <section className="flex flex-col h-full min-w-0 bg-workspace-canvas relative">

            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-workspace-border bg-workspace-canvas z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    Generations
                </span>
                {activeResultId && (
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-primary" asChild>
                        <Link href="/history">View All History</Link>
                    </Button>
                )}
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1">
                <div className="p-6 min-h-full flex flex-col">
                    {activeResultId ? (
                        <ImageResultsDisplay
                            key={activeResultId}
                            userId={userId}
                            forcedHistoryId={activeResultId}
                        />
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </ScrollArea>
        </section>
    );
}

function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-center p-4">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                <div className="relative h-24 w-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl rotate-3">
                    <ImageIcon className="h-10 w-10 text-white/40" />
                </div>
                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl -rotate-6">
                    <Sparkles className="h-8 w-8 text-primary/50 animate-pulse" style={{ animationDuration: '3s' }} />
                </div>
            </div>

            <div className="mt-8 max-w-xs space-y-2">
                <h3 className="text-base font-medium text-foreground/80">Creative Canvas</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Your generated assets will appear here. <br />
                    Configure settings and press <span className="font-semibold text-primary">Generate</span>.
                </p>
            </div>

            <div className="mt-12 flex gap-2 text-[10px] text-muted-foreground/30 uppercase tracking-widest font-bold">
                <ArrowLeft className="h-3 w-3" /> Start Here
            </div>
        </div>
    );
}
