"use client";

import * as React from "react";
import { motion, LayoutGroup } from "motion/react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ElementType;
}

interface SegmentedControlProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedControlOption[];
  className?: string;
}

export function SegmentedControl({ value, onValueChange, options, className }: SegmentedControlProps) {
  return (
    <div className={cn("relative flex items-center justify-center bg-black/20 p-1 rounded-lg border border-white/5", className)}>
      <LayoutGroup id={React.useId()}>
        {options.map((option) => {
          const isActive = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              onClick={() => onValueChange(option.value)}
              className={cn(
                "relative flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                isActive
                  ? "text-white shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-segment-indicator"
                  className="absolute inset-0 z-0 rounded-md bg-white/10 border border-white/10 backdrop-blur-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {option.label}
              </span>
            </button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
