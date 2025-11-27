// src/components/workspace/CanvasToolbar.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Crop as CropIcon, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Wand2,
  Undo2,
  Redo2,
  Trash2
} from 'lucide-react';
import { useImageStore } from '@/stores/imageStore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * CanvasToolbar - A floating pill-shaped toolbar for image manipulation.
 * Positioned at the bottom-center of the input canvas.
 */
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
    reset
  } = useImageStore();
  
  const { toast } = useToast();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < versionHistory.length - 1;
  const hasActiveCrop = crop && crop.width > 0 && crop.height > 0;

  const handleBgRemoval = async () => {
    try {
      await removeBackground();
    } catch {
      // Toast handled in store
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1 p-1.5 rounded-full bg-black/70 border border-white/10 backdrop-blur-xl shadow-2xl">
        
        {/* History Group */}
        <div className="flex items-center gap-1 px-1">
          <ToolbarBtn icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} />
          <ToolbarBtn icon={Redo2} label="Redo" onClick={redo} disabled={!canRedo} />
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Transform Group */}
        <div className="flex items-center gap-1 px-1">
          <ToolbarBtn icon={RotateCcw} label="Rotate Left" onClick={rotateImageLeft} />
          <ToolbarBtn icon={RotateCw} label="Rotate Right" onClick={rotateImageRight} />
          <ToolbarBtn icon={FlipHorizontal} label="Flip Horizontal" onClick={flipHorizontal} />
          <ToolbarBtn icon={FlipVertical} label="Flip Vertical" onClick={flipVertical} />
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* AI & Edit Group */}
        <div className="flex items-center gap-1 px-1">
          <ToolbarBtn 
            icon={CropIcon} 
            label={hasActiveCrop ? "Apply Crop" : "Crop"} 
            onClick={applyCrop} 
            active={!!hasActiveCrop}
            variant={hasActiveCrop ? "default" : "ghost"}
          />
          <ToolbarBtn icon={Wand2} label="Remove Background" onClick={handleBgRemoval} />
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Destructive */}
        <div className="flex items-center gap-1 px-1">
          <ToolbarBtn icon={Trash2} label="Clear Image" onClick={reset} variant="destructive" />
        </div>

      </div>
    </div>
  );
}

interface ToolbarBtnProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'ghost' | 'default' | 'destructive';
}

function ToolbarBtn({ icon: Icon, label, onClick, disabled, active, variant = 'ghost' }: ToolbarBtnProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-9 w-9 rounded-full transition-all",
              variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90",
              variant === 'destructive' && "text-red-400 hover:bg-red-950/50 hover:text-red-300",
              variant === 'ghost' && active && "bg-white/20 text-white",
              variant === 'ghost' && !active && "text-white/70 hover:text-white hover:bg-white/10",
              disabled && "opacity-40 cursor-not-allowed"
            )}
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

export default CanvasToolbar;
