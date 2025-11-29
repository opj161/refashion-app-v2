"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export function ParameterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 first:mt-0">
      <h3 className="font-semibold text-sm text-foreground/90 mb-2">{title}</h3>
      <div 
        className="bg-muted/30 border border-border/20 transition-colors duration-200 hover:bg-muted/40 backdrop-blur-xs p-4 rounded-lg"
      >
        {children}
      </div>
    </section>
  );
}

export function ParameterRow({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/10 last:border-0">
      <span className="text-xs text-muted-foreground font-medium">{label}:</span>
      <span className="text-xs font-semibold text-right max-w-[60%] break-words text-foreground/80">
        {String(value)}
      </span>
    </div>
  );
}
