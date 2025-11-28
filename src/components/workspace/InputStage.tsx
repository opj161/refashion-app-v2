'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useImageStore } from '@/stores/imageStore';
import ImageUploader from '@/components/ImageUploader';
import { CanvasToolbar } from './CanvasToolbar';
import { AssetStrip } from './AssetStrip';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

const ImageEditorCanvas = dynamic(() => import('@/components/ImageEditorCanvas'), {
    loading: () => (
        <div className="flex items-center justify-center h-full w-full text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Initializing Editor...
        </div>
    ),
    ssr: false
});

interface InputStageProps {
    recentUploads?: string[];
}

export function InputStage({ recentUploads = [] }: InputStageProps) {
    const { versions, activeVersionId } = useImageStore();
    const activeImage = activeVersionId ? versions[activeVersionId] : null;

    return (
        <section className="flex flex-col h-full w-full bg-workspace-canvas">

            {/* 1. Header Bar */}
            <div className="h-14 border-b border-white/5 flex items-center px-5 shrink-0 bg-workspace-canvas justify-between z-20">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500/50" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 select-none">
                        Source
                    </span>
                </div>
            </div>

            {/* 2. Main Canvas Area (Flex Grow) */}
            <div className="flex-1 relative min-h-0 w-full bg-dot-pattern overflow-hidden">
                <AnimatePresence mode="wait">
                    {!activeImage ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center p-6"
                        >
                            <div className="w-full max-w-md">
                                <ImageUploader recentUploads={[]} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="canvas"
                            className="w-full h-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {/* Canvas container with padding */}
                            <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
                                <ImageEditorCanvas image={activeImage} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toolbar - Bottom Overlay */}
                {activeImage && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                        <CanvasToolbar />
                    </div>
                )}
            </div>

            {/* 3. Asset Strip (Docked Footer) */}
            <div className="shrink-0 border-t border-white/5 bg-workspace-panel/30 z-20">
                <AssetStrip recentUploads={recentUploads} />
            </div>
        </section>
    );
}
