// Motion constants with optimized easing functions
// Generated using professional motion tools for better UX

export const MOTION_CONFIG = {
  // Spring animations for interactive elements - optimized for modern smooth UX
  springs: {
    // Quick, smooth spring for buttons and small interactions
    quick: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Standard spring for cards and medium interactions
    standard: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Bounce animation for special effects - more subtle and modern
  bounce: {
    // Gentle bounce for upload drop zones and success states
    subtle: '300ms cubic-bezier(0.34, 1.2, 0.64, 1)',
  },
  
  // Standard durations for consistency
  durations: {
    fast: '100ms',
    quick: '200ms',
    standard: '300ms',
    slow: '500ms',
  },
  
  // Timing function utilities - modern, smooth easing
  timing: {
    // For opacity and color transitions
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    
    // For scale and transform transitions - Material Design standard
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // For gentle bounce-like effects
    anticipate: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
  }
} as const;

// CSS custom properties for easier usage
export const MOTION_CSS_VARS = `
  :root {
    --motion-spring-quick: ${MOTION_CONFIG.springs.quick};
    --motion-spring-standard: ${MOTION_CONFIG.springs.standard};
    --motion-bounce-subtle: ${MOTION_CONFIG.bounce.subtle};
    --motion-duration-fast: ${MOTION_CONFIG.durations.fast};
    --motion-duration-quick: ${MOTION_CONFIG.durations.quick};
    --motion-duration-standard: ${MOTION_CONFIG.durations.standard};
    --motion-duration-slow: ${MOTION_CONFIG.durations.slow};
    --motion-ease-out: ${MOTION_CONFIG.timing.easeOut};
    --motion-ease-in-out: ${MOTION_CONFIG.timing.easeInOut};
    --motion-ease-anticipate: ${MOTION_CONFIG.timing.anticipate};
  }
`;

// React Motion variants for Framer Motion
export const MOTION_VARIANTS = {
  // Page transitions
  page: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  
  // Card animations - modern, subtle
  card: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    hover: { scale: 1.01 },
    tap: { scale: 0.99 },
  },
  
  // Image animations
  image: {
    initial: { opacity: 0, scale: 1.1 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  
  // List item animations
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  
  // Upload zone animations - more subtle
  uploadZone: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    dragOver: { scale: 1.02, borderColor: 'hsl(var(--primary))' },
    dragLeave: { scale: 1, borderColor: 'hsl(var(--border))' },
  },
} as const;

// Motion transitions - modern, smooth settings
export const MOTION_TRANSITIONS = {
  // Spring-based transitions with higher damping for smoothness
  spring: {
    quick: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.5,
    },
    standard: {
      type: 'spring',
      stiffness: 250,
      damping: 28,
      mass: 0.8,
    },
    gentle: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 1,
    },
  },
  
  // Tween-based transitions
  tween: {
    fast: {
      duration: 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
    quick: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
    standard: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
    slow: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  
  // Stagger for lists
  stagger: {
    children: 0.1,
    delayChildren: 0.1,
  },
} as const;

/**
 * Reusable variants for common animation patterns across the application.
 * These centralized variants ensure consistency and simplify maintenance.
 */
export const COMMON_VARIANTS = {
  // Simple fade-in
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: MOTION_TRANSITIONS.tween.standard },
  },
  
  // Slide down and fade in (for dropdowns, conditional UI)
  slideDownAndFade: {
    hidden: { opacity: 0, y: -15 },
    visible: { opacity: 1, y: 0, transition: MOTION_TRANSITIONS.tween.quick },
    exit: { opacity: 0, y: -15, transition: MOTION_TRANSITIONS.tween.fast },
  },

  // Page transition effect
  pageTransition: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },

  // For staggering list animations (e.g., history gallery)
  staggeredListContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.1,
      },
    },
  },

  staggeredListItem: {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: MOTION_TRANSITIONS.spring.gentle,
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  },
} as const;
