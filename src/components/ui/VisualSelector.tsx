'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface VisualOption {
    value: string;
    label: string;
    description?: string;
    icon?: React.ElementType;
}

interface VisualSelectorProps {
    options: VisualOption[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function VisualSelector({ options, value, onChange, disabled }: VisualSelectorProps) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {options.map((option) => {
                const isSelected = value === option.value;
                const Icon = option.icon;

                return (
                    <TooltipProvider key={option.value}>
                        <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onChange(option.value)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200",
                                        "hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary",
                                        isSelected
                                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary))]"
                                            : "border-white/10 bg-black/20 text-muted-foreground hover:border-white/20",
                                        disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {Icon && <Icon className={cn("h-5 w-5", isSelected ? "stroke-[2.5px]" : "stroke-2")} />}
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">{option.label}</span>

                                    {isSelected && (
                                        <div className="absolute top-1 right-1">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                            </TooltipTrigger>
                            {option.description && (
                                <TooltipContent className="max-w-[200px] text-xs">
                                    {option.description}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );
}
