// src/lib/design-tokens.ts
/**
 * Design tokens for consistent spacing, typography, and visual hierarchy
 * Following 8px grid system for modern, uncluttered design
 */

export const spacing = {
  '0': '0',
  '1': '0.5rem',  // 8px
  '2': '1rem',    // 16px
  '3': '1.5rem',  // 24px
  '4': '2rem',    // 32px
  '5': '2.5rem',  // 40px
  '6': '3rem',    // 48px
  '8': '4rem',    // 64px
  '10': '5rem',   // 80px
  '12': '6rem',   // 96px
} as const;

export const typography = {
  display: 'text-5xl md:text-6xl font-bold tracking-tight',
  hero: 'text-4xl md:text-5xl font-bold tracking-tight',
  h1: 'text-3xl md:text-4xl font-bold tracking-tight',
  h2: 'text-2xl md:text-3xl font-semibold',
  h3: 'text-xl md:text-2xl font-semibold',
  h4: 'text-lg md:text-xl font-semibold',
  'body-lg': 'text-lg leading-relaxed',
  body: 'text-base leading-relaxed',
  'body-sm': 'text-sm leading-relaxed',
  caption: 'text-xs text-muted-foreground',
  label: 'text-sm font-medium',
} as const;

export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;

export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

export const transitions = {
  fast: 'transition-all duration-150 ease-out',
  base: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
} as const;
