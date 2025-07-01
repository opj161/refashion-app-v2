"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// Add a global style for the animations
// This is not ideal for component-based structures but will work for now.
// A better approach would be to use CSS modules or a CSS-in-JS solution.
if (typeof window !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(`
    @keyframes progress-ribbings {
      0% { background-position: 100% 0; }
      100% { background-position: 0 0; }
    }
  `, styleSheet.cssRules.length);
  styleSheet.insertRule(`
    @keyframes progress-pulsation {
      0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(0, 123, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
    }
  `, styleSheet.cssRules.length);
  styleSheet.insertRule(`
    @keyframes progress-completion {
      0% { background-color: hsl(var(--primary)); }
      50% { background-color: hsl(142, 76%, 36%); box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
      100% { background-color: hsl(142, 76%, 36%); box-shadow: 0 0 10px rgba(34, 197, 94, 0.3); }
    }
  `, styleSheet.cssRules.length);
}


const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {isEstimating?: boolean; isCompleting?: boolean}
>(({ className, value, isEstimating = false, isCompleting = false, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all duration-300",
        isEstimating && "progress-indicator-estimating", // Custom class for styling
        isCompleting && "progress-indicator-completing"
      )}
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,        ...(isCompleting ? {
          animation: 'progress-completion 1s ease-in-out',
          backgroundColor: 'hsl(142, 76%, 36%)', // Green color for completion
        } : isEstimating ? {
          backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)',
          backgroundSize: '40px 40px',
          animation: 'progress-ribbings 2s linear infinite, progress-pulsation 1.5s infinite',
        } : {})
      }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
