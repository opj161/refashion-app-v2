"use client";

import React from 'react';
import { ResponsiveMediaModal } from './ResponsiveMediaModal';
import { cn } from '@/lib/utils';

interface BaseMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  footer: React.ReactNode;
  layoutId?: string;
  children: React.ReactNode;
}

interface MediaContainerProps {
  children: React.ReactNode;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto';
  className?: string;
}

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

interface ParameterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}

interface ParameterRowProps {
  label: string;
  value: string | number | boolean;
  className?: string;
}

// Optimal media container with aspect ratio intelligence and performance optimizations
export function MediaContainer({ children, aspectRatio = 'auto', className }: MediaContainerProps) {
  const aspectClasses = {
    video: 'aspect-video', // 16:9
    square: 'aspect-square', // 1:1
    portrait: 'aspect-[3/4]', // 3:4
    auto: '' // Let content determine
  };

  return (
    <div 
      className={cn(
        "flex-1 bg-black/10 md:rounded-l-lg relative",
        "transition-colors duration-200 hover:bg-black/15",
        "backdrop-blur-sm supports-[backdrop-filter]:bg-black/5",
        aspectRatio !== 'auto' && aspectClasses[aspectRatio],
        className
      )}
      style={{
        // Hardware acceleration for smoother performance
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
}

// Unified sidebar with optimal scrolling
export function Sidebar({ children, className }: SidebarProps) {
  return (
    <div className={cn(
      "md:w-[350px] lg:w-[400px] flex-shrink-0 md:border-l border-border/20",
      "transition-all duration-200",
      className
    )}
    style={{
      minHeight: 0,
      height: '100%'
    }}>
      <div className="h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}

// Unified parameter section component with performance optimizations
export function ParameterSection({ title, children, defaultOpen = true, collapsible = true }: ParameterSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  // Memoize children for better performance
  const memoizedChildren = React.useMemo(() => children, [children]);

  if (!collapsible) {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-foreground/90">{title}</h4>
        <div className="bg-muted/30 p-4 rounded-lg border border-border/20 transition-colors duration-200 hover:bg-muted/40 backdrop-blur-sm">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left p-3 rounded-lg border border-border/20 transition-all duration-200 hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-[0.98]"
        aria-expanded={isOpen}
        aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <h4 className="font-semibold text-sm text-foreground/90">{title}</h4>
        <svg
          className={cn(
            "h-4 w-4 transition-transform duration-200 flex-shrink-0",
            isOpen ? 'rotate-180' : 'rotate-0'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div 
          id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="bg-muted/30 p-4 rounded-lg border border-border/20 transition-all duration-200 animate-in slide-in-from-top-2 backdrop-blur-sm"
        >
          {memoizedChildren}
        </div>
      )}
    </div>
  );
}

// Unified parameter row component
export function ParameterRow({ label, value, className }: ParameterRowProps) {
  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  
  return (
    <div className={cn("flex justify-between items-center py-2 border-b border-border/10 last:border-0", className)}>
      <span className="text-xs text-muted-foreground font-medium">{label}:</span>
      <span className="text-xs font-semibold text-right max-w-[60%] break-words text-foreground/80">
        {displayValue}
      </span>
    </div>
  );
}

// Base media modal with unified layout
export function BaseMediaModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  footer, 
  layoutId, 
  children 
}: BaseMediaModalProps) {
  return (
    <ResponsiveMediaModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      layoutId={layoutId}
    >
      {/* Unified responsive layout - fix height flow */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {children}
      </div>
    </ResponsiveMediaModal>
  );
}

// Export all components
export { BaseMediaModal as default };