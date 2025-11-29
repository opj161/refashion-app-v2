// src/components/ui/SegmentedControl.tsx
"use client";

import * as React from "react";
import { motion, LayoutGroup } from "motion/react";
import { cn } from "@/lib/utils";

// 1. Context to provide the active value to child items
interface SegmentedControlContextType {
  activeValue: string;
  onValueChange: (value: string) => void;
}

const SegmentedControlContext = React.createContext<SegmentedControlContextType | undefined>(undefined);

const useSegmentedControl = () => {
  const context = React.useContext(SegmentedControlContext);
  if (!context) {
    throw new Error("useSegmentedControl must be used within a SegmentedControl");
  }
  return context;
};

// 2. The Root component that manages state
interface SegmentedControlProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
}

const SegmentedControl = ({ value, onValueChange, children, className, ...props }: SegmentedControlProps) => (
  <SegmentedControlContext.Provider value={{ activeValue: value, onValueChange }}>
    <div className={cn("relative flex items-center justify-center rounded-full", className)} {...props}>
      <LayoutGroup id={React.useId()}>{children}</LayoutGroup>
    </div>
  </SegmentedControlContext.Provider>
);

// 3. The Item component (the clickable button)
interface SegmentedControlItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  value: string;
}

const SegmentedControlItem = React.forwardRef<HTMLButtonElement, SegmentedControlItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { activeValue, onValueChange } = useSegmentedControl();
    const isActive = activeValue === value;

    return (
      <motion.button
        ref={ref}
        onClick={() => onValueChange(value)}
        className={cn(
          "relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "text-primary-foreground [text-shadow:0_1px_2px_theme(colors.black/60%)]"
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        {isActive && (
          <motion.div
            layoutId="active-segment-indicator"
            className="absolute inset-0 z-0 rounded-full bg-gradient-to-br from-primary to-primary-gradient-end"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </motion.button>
    );
  }
);
SegmentedControlItem.displayName = "SegmentedControlItem";

export { SegmentedControl, SegmentedControlItem };