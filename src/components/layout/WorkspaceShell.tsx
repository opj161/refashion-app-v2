'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Layers, Settings2, LayoutGrid } from 'lucide-react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';

interface WorkspaceShellProps {
    inputPanel: React.ReactNode;
    controlPanel: React.ReactNode;
    outputPanel: React.ReactNode;
    className?: string;
}

type MobileTab = 'input' | 'controls' | 'output';

export function WorkspaceShell({
    inputPanel,
    controlPanel,
    outputPanel,
    className
}: WorkspaceShellProps) {
    const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('input');
    const [unread, setUnread] = useState(false);
    const currentResultId = useGenerationSettingsStore(state => state.currentResultId);
    const prevResultId = useRef<string | null>(null);

    // Notifications for mobile
    useEffect(() => {
        if (currentResultId && currentResultId !== prevResultId.current) {
            if (activeMobileTab !== 'output') setUnread(true);
            prevResultId.current = currentResultId;
        }
    }, [currentResultId, activeMobileTab]);

    useEffect(() => {
        if (activeMobileTab === 'output') setUnread(false);
    }, [activeMobileTab]);

    return (
        <div className={cn("flex flex-col h-[calc(100vh-var(--header-height))] w-full bg-background overflow-hidden", className)}>

            {/* DESKTOP LAYOUT: CSS Grid */}
            {/* Input (Fluid) | Controls (Fixed) | Output (Fluid) */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_340px_1fr] h-full w-full">

                {/* Left: Input Stage */}
                <div className="relative h-full min-h-0 min-w-0 bg-workspace-canvas overflow-hidden flex flex-col border-r border-workspace-border">
                    {inputPanel}
                </div>

                {/* Center: Studio Controls (Fixed Width) */}
                <div className="h-full min-h-0 min-w-0 bg-workspace-panel z-20 shadow-2xl relative flex flex-col border-r border-workspace-border">
                    {controlPanel}
                </div>

                {/* Right: Results Gallery */}
                <div className="relative h-full min-h-0 min-w-0 bg-workspace-canvas bg-dot-pattern flex flex-col">
                    {outputPanel}
                </div>
            </div>

            {/* MOBILE LAYOUT: Stacked with Tab Bar */}
            <div className="lg:hidden flex-1 flex flex-col min-h-0">
                <div className={cn(
                    "flex-1 min-h-0",
                    activeMobileTab !== 'input' && "hidden"
                )}>
                    {inputPanel}
                </div>
                <div className={cn(
                    "flex-1 min-h-0",
                    activeMobileTab !== 'controls' && "hidden"
                )}>
                    {controlPanel}
                </div>
                <div className={cn(
                    "flex-1 min-h-0",
                    activeMobileTab !== 'output' && "hidden"
                )}>
                    {outputPanel}
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden h-16 border-t border-white/10 bg-workspace-panel flex items-center justify-around px-2 shrink-0 z-50 pb-safe">
                <MobileTab icon={Layers} label="Input" isActive={activeMobileTab === 'input'} onClick={() => setActiveMobileTab('input')} />
                <MobileTab icon={Settings2} label="Studio" isActive={activeMobileTab === 'controls'} onClick={() => setActiveMobileTab('controls')} />
                <div className="relative h-full flex items-center">
                    <MobileTab icon={LayoutGrid} label="Results" isActive={activeMobileTab === 'output'} onClick={() => setActiveMobileTab('output')} />
                    {unread && <span className="absolute top-3 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />}
                </div>
            </div>
        </div>
    );
}

function MobileTab({ icon: Icon, label, isActive, onClick }: { icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-1 w-20 h-full transition-all active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}
