'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Crop as CropIcon,
    RotateCw,
    RotateCcw,
    FlipHorizontal,
    FlipVertical,
    Wand2,
    Undo2,
    Redo2,
    Trash2,
    Square,
    RectangleHorizontal,
    RectangleVertical,
    Monitor,
    Minus,
    Plus
} from 'lucide-react';
import { useImageStore } from '@/stores/imageStore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export function CanvasToolbar() {
    const {
        applyCrop,
        rotateImageLeft,
        rotateImageRight,
        flipHorizontal,
        flipVertical,
        removeBackground,
        undo,
        redo,
        historyIndex,
        versionHistory,
        crop,
        reset,
        setAspect,
        aspect,
        scale,
        setScale,
        setCrop
    } = useImageStore();

    const { toast } = useToast();

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < versionHistory.length - 1;
    const hasActiveCrop = crop && crop.width > 0 && crop.height > 0;
    const { versions, activeVersionId } = useImageStore();
    const activeImage = activeVersionId ? versions[activeVersionId] : null;
    const isCropping = !!crop;

    const handleBgRemoval = async () => {
        try {
            await removeBackground();
        } catch (e) {
            // Toast handled in store
        }
    };

    const handleZoom = (delta: number) => {
        setScale(Math.max(0.1, Math.min(3, scale + delta)));
    };

    const setIsCropping = (enable: boolean) => {
        if (!enable) {
            setCrop(undefined);
        } else {
            // Initialize crop if needed, or just let user drag
            setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
        }
    };

    const aspectOptions = [
        { label: "Free", value: undefined, icon: CropIcon },
        { label: "1:1", value: 1, icon: Square },
        { label: "16:9", value: 16 / 9, icon: Monitor },
        { label: "4:3", value: 4 / 3, icon: RectangleHorizontal },
        { label: "9:16", value: 9 / 16, icon: RectangleVertical },
    ];

    return (
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-workspace-panel/90 border border-white/10 shadow-2xl ring-1 ring-black/50 backdrop-blur-xl transition-all hover:scale-105 duration-300">
            <TooltipProvider delayDuration={0}>
                {/* Zoom Controls */}
                <div className="flex items-center gap-0.5 px-1">
                    <ToolbarBtn
                        icon={Minus}
                        label="Zoom Out"
                        onClick={() => handleZoom(-0.1)}
                        disabled={!activeImage}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground w-8 text-center select-none">
                        {Math.round(scale * 100)}%
                    </span>
                    <ToolbarBtn
                        icon={Plus}
                        label="Zoom In"
                        onClick={() => handleZoom(0.1)}
                        disabled={!activeImage}
                    />
                </div>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Crop Controls */}
                <div className="flex items-center gap-0.5 px-1">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-full transition-all ${hasActiveCrop ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                                disabled={!activeImage}
                            >
                                <CropIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-48 p-2 bg-black/90 border-white/10 backdrop-blur-xl mb-2">
                            <div className="grid grid-cols-3 gap-1">
                                {aspectOptions.map((opt) => (
                                    <Button
                                        key={opt.label}
                                        variant={aspect === opt.value ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-8 px-0"
                                        onClick={() => setAspect(opt.value)}
                                    >
                                        <opt.icon className="h-3 w-3 mr-1" />
                                        <span className="text-[10px]">{opt.label}</span>
                                    </Button>
                                ))}
                            </div>
                            <Separator className="my-2 bg-white/10" />
                            <Button
                                size="sm"
                                className="w-full h-8"
                                disabled={!hasActiveCrop}
                                onClick={() => {
                                    applyCrop();
                                }}
                            >
                                Apply Crop
                            </Button>
                        </PopoverContent>
                    </Popover>

                    <ToolbarBtn
                        icon={RotateCcw}
                        label="Reset Crop"
                        onClick={() => {
                            setCrop(undefined);
                        }}
                        disabled={!activeImage || !crop}
                    />
                </div>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Transform Group */}
                <div className="flex items-center gap-0.5 px-1">
                    <ToolbarBtn icon={RotateCcw} label="Rotate Left" onClick={rotateImageLeft} disabled={!activeImage} />
                    <ToolbarBtn icon={RotateCw} label="Rotate Right" onClick={rotateImageRight} disabled={!activeImage} />
                </div>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* History Controls */}
                <div className="flex items-center gap-0.5 px-1">
                    <ToolbarBtn
                        icon={Undo2}
                        label="Undo"
                        onClick={undo}
                        disabled={!canUndo}
                    />
                    <ToolbarBtn
                        icon={Redo2}
                        label="Redo"
                        onClick={redo}
                        disabled={!canRedo}
                    />
                </div>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Destructive */}
                <div className="flex items-center gap-0.5 px-1">
                    <ToolbarBtn icon={Trash2} label="Clear Image" onClick={reset} variant="destructive" disabled={!activeImage} />
                </div>

            </TooltipProvider>
        </div>
    );
}

interface ToolbarBtnProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    isActive?: boolean;
    variant?: 'ghost' | 'default' | 'destructive';
}

function ToolbarBtn({ icon: Icon, label, onClick, disabled, isActive, variant = 'ghost' }: ToolbarBtnProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClick}
                        disabled={disabled}
                        className={`
              h-8 w-8 rounded-full transition-all
              ${variant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
              ${variant === 'destructive' ? 'text-red-400 hover:bg-red-950/50 hover:text-red-300' : ''}
              ${variant === 'ghost' && isActive ? 'bg-white/20 text-white' : ''}
              ${variant === 'ghost' && !isActive ? 'text-white/70 hover:text-white hover:bg-white/10' : ''}
            `}
                    >
                        <Icon className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-black text-xs border-white/10">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
