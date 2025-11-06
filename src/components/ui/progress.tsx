"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { isEstimating?: boolean; isCompleting?: boolean }
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
        "h-full w-full flex-1 bg-primary transition-all",
        {
          'bg-green-500 dark:bg-green-600': isCompleting,
          'animate-pulse': isEstimating,
        }
      )}
      style={{ 
        transform: `translateX(-${100 - (value || 0)}%)`,
        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
    {/* Striped overlay for estimating state */}
    {isEstimating && (
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)',
          backgroundSize: '40px 40px',
          animation: 'progress-stripes 1s linear infinite',
        }}
      />
    )}
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
