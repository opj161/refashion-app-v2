// src/components/layout/WorkspaceShell.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * WorkspaceShell - The main 3-column grid layout for the pro-tool workspace.
 * 
 * This component creates a fixed-viewport layout with:
 * - Left Column: Input Stage (flexible width)
 * - Center Column: Control Rack (fixed 320px width)
 * - Right Column: Output Gallery (flexible width)
 * 
 * On mobile, it stacks vertically.
 */
export function WorkspaceShell({ children, className }: WorkspaceShellProps) {
  return (
    <div 
      className={cn(
        // Fixed viewport height calculation (accounts for header)
        "flex-1 h-[calc(100dvh-var(--header-height))] min-h-0 w-full overflow-hidden",
        // Desktop: 3-column grid layout
        "lg:grid lg:grid-cols-[1fr_320px_1fr]",
        // Mobile: Flex column stack
        "flex flex-col",
        // Visual styling
        "divide-x divide-white/5 bg-background",
        className
      )}
    >
      {children}
    </div>
  );
}

export default WorkspaceShell;
