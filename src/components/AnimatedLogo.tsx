// src/components/AnimatedLogo.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion, Variants, Transition } from 'framer-motion';
import LogoSvg from '../../public/refashion.svg'; // Used for the reduced-motion fallback

// --- Path data from the refashion.svg (remains unchanged) ---
const paths = {
  main: "M360.4,94.7l-.1-.2c-1.7-7.5-3.8-14.5-6.1-20.9-4.2-11.6-13.6-36.7-36.5-59.4-4.2-4.2-9.7-9.1-16.8-14.2-.01.02-.03.03-.04.05-.02-.02-.04-.03-.06-.05-28,33.8-53.2,58.1-69.8,73.3-43.6,39.8-115.1,94.9-160.9,136.5-8,7.2-24.1,23.5-38.7,48.3v.1c-2.6,4.5-5.9,10.4-9.2,17.4-.5,1-1,2.1-1.6,3.3-1.4,3.1-2.9,6.3-4.3,9.8-5.7,13.9-12.7,31.4-15,54.6-2,20.2.4,36.3,1.7,43.2.5,2.5,1,5,1.6,7.5,2,8.7,4.8,16.8,8.1,24.4,15.7,36.5,41.6,57.6,46,61.1,27.6,21.8,55.5,28.1,64.4,29.8,4.87.93,9.49,1.54,13.77,1.93,4.73.44,9.02.6,12.82.62,1.67,0,3.24-.01,4.71-.05l-.29-.35c-1.57-5.79-3.13-14.25-4.11-24.25-3.1-35.2,8.1-62.3,13.8-75.8,4.3-10.2,14.9-34.1,37.6-55.9,10.6-10.1,22-18.3,33.3-25.8,12.3-8.1,23-14.3,29.2-18.6.2-.1.6-.4.8-.5,21.5-15.9,63.8-51.8,85.8-109.7,2.6-6.8,4.6-13.4,4.6-13.4,6.9-21.6,13.7-54.9,5.3-92.8Z",
  middle: "M390.8,348.9c2.9-4.5,11-16.9,7.8-30.2-1.1-4.4-3.1-7.7-4.6-9.8-1.9-2.6-3.8-4.2-5.3-5.5-3.7-3.2-7.1-4.9-9.3-6-2.4-1.2-5.4-2.8-9.8-3.8-1.9-.4-3.5-.7-4.6-.8.78.05,1.63.11,2.51.17-.88-.12-1.73-.22-2.51-.27-16.6-1.5-31.6.8-46.8,3.3-13.7,2.3-32.4,6.4-53.9,14.5,0,0,0,0,0,0-7.2,4.5-18,10.9-31.4,16.1-23.2,9-43.6,11.1-56.5,11.5-5.7.2-22.7.4-44.1-4.3-31.7-7.1-52.6-20.5-57.1-23.4-10.3-6.8-23.6-15.8-34.4-32.7-4.9-7.6-7.8-14.6-9.6-19.5-4.2,7.1-9.7,17.5-15.1,30.6-5.7,13.9-12.7,31.4-15,54.6-2,20.2.4,36.3,1.7,43.2,10.3,56,50.2,88.5,55.7,92.9,27.6,21.8,55.5,28.1,64.4,29.8,12.6,2.4,23.5,2.7,31.3,2.5l17.1-1.2c5.6-.7,11.8-1.8,18.4-3.5,5.2-1.4,9.9-2.9,13.8-4.3l.56-.33c67.7-63.92,167.27-123.76,186.74-153.57Z",
  inner: "M509.6,405.7c-6.5-35.1-33.3-63.4-36-66.3,0,0-18.1-18.8-44.8-31.6-3.9-1.9-10.6-5.2-20.1-8-9.2-2.8-16.8-3.9-24.3-5-6.62-1.01-12.37-1.52-16.89-1.83-.88-.06-1.73-.12-2.51-.17,1.1.1,2.7.4,4.6.8,4.4,1,7.4,2.6,9.8,3.8,2.2,1.1,5.6,2.8,9.3,6,1.5,1.3,3.4,2.9,5.3,5.5,1.5,2.1,3.5,5.4,4.6,9.8,3.2,13.3-4.9,25.7-7.8,30.2-19.47,29.81-119.04,89.65-186.74,153.57-4.97,4.69-9.77,9.41-14.36,14.13-17.1,17.6-29.2,33.4-38.2,53.9-20.4,46.3-13.1,89.2-11.2,99.1,12.4,64.2,59,99,69.8,106.6,32.9-36.8,62-64.8,83.4-84.4,54.4-49.6,125.2-104.3,125.2-104.3,0,0,54.4-44,75.7-86.6l-.1-.3c9.6-19.2,13.8-39.4,13.8-39.4,1.1-5.2,2.6-12.8,3.3-22.2.6-8.5.2-22.3-1.8-33.3Z",
};

// --- Shared Props & Components ---
const svgProps = {
  className: "h-48 w-48",
  viewBox: "0 0 512 776",
  xmlns: "http://www.w3.org/2000/svg",
  initial: "hidden",
  animate: "visible",
};

const Gradients = () => (
  <defs>
    <linearGradient id="linear-gradient" x1="64.36" y1="451.57" x2="323.11" y2="3.4" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#f5370e"/><stop offset=".2" stopColor="#eb3c15"/><stop offset=".51" stopColor="#886759"/><stop offset=".75" stopColor="#40878b"/><stop offset=".86" stopColor="#25949f"/></linearGradient>
    <linearGradient id="linear-gradient1" x1="89.7" y1="513.77" x2="255.94" y2="225.84" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#1b113d"/><stop offset=".69" stopColor="#46758f"/><stop offset="1" stopColor="#599fb1"/></linearGradient>
    <linearGradient id="linear-gradient2" x1="445.22" y1="323.23" x2="175.33" y2="790.69" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#1b7f89"/><stop offset=".09" stopColor="#387275"/><stop offset=".28" stopColor="#845142"/><stop offset=".48" stopColor="#dd2c07"/><stop offset=".52" stopColor="#c9270f"/><stop offset=".64" stopColor="#901928"/><stop offset=".76" stopColor="#630e3c"/><stop offset=".86" stopColor="#43064a"/><stop offset=".94" stopColor="#300152"/><stop offset="1" stopColor="#290056"/></linearGradient>
  </defs>
);

// IMPROVEMENT 5: Reusable LogoPaths component
const LogoPaths = ({ pathVariants, pathTransition }: { pathVariants: Variants, pathTransition?: Transition }) => (
  <>
    <Gradients />
    <motion.path custom={2} variants={pathVariants} transition={pathTransition} fill="url(#linear-gradient)" d={paths.main} />
    <motion.path custom={1} variants={pathVariants} transition={pathTransition} fill="url(#linear-gradient1)" d={paths.middle} />
    <motion.path custom={0} variants={pathVariants} transition={pathTransition} fill="url(#linear-gradient2)" d={paths.inner} />
  </>
);


// --- Variants for the main wrapper component ---
const wrapperVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  enter: {
    opacity: 1,
    scale: 2, // Changed from 2 to 1 for a more standard entry
    transition: {
      scale: { type: 'spring', stiffness: 200, damping: 20 },
      opacity: { duration: 0.8, ease: 'easeOut' },
      // IMPROVEMENT 3: Decoupled by removing `when: 'beforeChildren'`
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8, // Exit mirrors entry
    transition: {
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
};

interface AnimationComponentProps {
  transitionConfig: {
    duration: number;
    delay: number;
    stagger: number;
  };
}

// --- Animation Implementations (Refactored) ---

const LiquidWeaveAnimation = ({ transitionConfig }: AnimationComponentProps) => {
  const { duration, stagger } = transitionConfig;
  const pathVariants: Variants = {
    hidden: { pathLength: 0, fillOpacity: 0 },
    visible: {
      pathLength: 1,
      fillOpacity: 1,
      transition: {
        pathLength: { type: "tween", duration, ease: "easeInOut" },
        fillOpacity: { type: "tween", duration: duration * 0.8, ease: "easeOut" }
      }
    }
  };
  return (
    <motion.svg {...svgProps} variants={{ visible: { transition: { staggerChildren: stagger } } }}>
      <LogoPaths pathVariants={pathVariants} />
    </motion.svg>
  );
};

const GradientBloomAnimation = ({ transitionConfig }: AnimationComponentProps) => {
  const { duration } = transitionConfig;
  return (
    <motion.svg {...svgProps}>
      <defs>
        <mask id="bloom-mask">
          <motion.circle
            cx="256" cy="388" fill="white"
            initial={{ r: 0 }}
            animate={{ r: 600 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          />
        </mask>
      </defs>
      <motion.g mask="url(#bloom-mask)">
        <LogoPaths pathVariants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} />
      </motion.g>
    </motion.svg>
  );
};

const FragmentAssemblyAnimation = ({ transitionConfig }: AnimationComponentProps) => {
  const { duration, stagger } = transitionConfig;
  return (
    <motion.svg {...svgProps}>
      <defs>
        <clipPath id="assembly-clip">
          <motion.rect initial={{ x: -512 }} animate={{ x: 0 }} transition={{ duration: duration * 0.7, ease: [0.76, 0, 0.24, 1], delay: stagger * 0 }} width="512" height="259" />
          <motion.rect y="259" initial={{ x: 512 }} animate={{ x: 0 }} transition={{ duration: duration * 0.7, ease: [0.76, 0, 0.24, 1], delay: stagger * 1 }} width="512" height="258" />
          <motion.rect y="517" initial={{ y: 776 }} animate={{ y: 517 }} transition={{ duration: duration * 0.7, ease: [0.76, 0, 0.24, 1], delay: stagger * 2 }} width="512" height="259" />
        </clipPath>
      </defs>
      <motion.g clipPath="url(#assembly-clip)" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration, ease: 'easeOut' }}>
        <LogoPaths pathVariants={{ visible: { opacity: 1 } }} />
      </motion.g>
    </motion.svg>
  );
};

const AuroraFlowAnimation = ({ transitionConfig }: AnimationComponentProps) => {
  const { duration } = transitionConfig;
  return (
    <motion.svg {...svgProps}>
      <defs>
        {/* FIX: Added x1, y1, x2, y2, and gradientUnits to match the static gradients */}
        {/* This ensures the final state (rotate(0)) is visually correct. */}
        <motion.linearGradient
          id="aurora-flow-0"
          x1="64.36" y1="451.57" x2="323.11" y2="3.4" gradientUnits="userSpaceOnUse"
          initial={{ gradientTransform: "rotate(-150 256 388)" }}
          animate={{ gradientTransform: "rotate(0 256 388)" }}
          transition={{ duration: duration * 1.2, ease: "easeInOut" }}
        >
          <stop offset="0" stopColor="#f5370e"/><stop offset=".2" stopColor="#eb3c15"/><stop offset=".51" stopColor="#886759"/><stop offset=".75" stopColor="#40878b"/><stop offset=".86" stopColor="#25949f"/>
        </motion.linearGradient>
        
        <motion.linearGradient
          id="aurora-flow-1"
          x1="89.7" y1="513.77" x2="255.94" y2="225.84" gradientUnits="userSpaceOnUse"
          initial={{ gradientTransform: "rotate(120 256 388)" }}
          animate={{ gradientTransform: "rotate(0 256 388)" }}
          transition={{ duration: duration * 1.3, ease: "easeInOut" }}
        >
          <stop offset="0" stopColor="#1b113d"/><stop offset=".69" stopColor="#46758f"/><stop offset="1" stopColor="#599fb1"/>
        </motion.linearGradient>
        
        <motion.linearGradient
          id="aurora-flow-2"
          x1="445.22" y1="323.23" x2="175.33" y2="790.69" gradientUnits="userSpaceOnUse"
          initial={{ gradientTransform: "rotate(180 256 388)" }}
          animate={{ gradientTransform: "rotate(0 256 388)" }}
          transition={{ duration: duration * 1.4, ease: "easeInOut" }}
        >
          <stop offset="0" stopColor="#1b7f89"/><stop offset=".09" stopColor="#387275"/><stop offset=".28" stopColor="#845142"/><stop offset=".48" stopColor="#dd2c07"/><stop offset=".52" stopColor="#c9270f"/><stop offset=".64" stopColor="#901928"/><stop offset=".76" stopColor="#630e3c"/><stop offset=".86" stopColor="#43064a"/><stop offset=".94" stopColor="#300152"/><stop offset="1" stopColor="#290056"/>
        </motion.linearGradient>
      </defs>
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration, ease: "easeOut" }}>
        <path fill="url(#aurora-flow-0)" d={paths.main} />
        <path fill="url(#aurora-flow-1)" d={paths.middle} />
        <path fill="url(#aurora-flow-2)" d={paths.inner} />
      </motion.g>
    </motion.svg>
  );
};

const ThreeDFlipAnimation = ({ transitionConfig }: AnimationComponentProps) => (
  <motion.svg {...svgProps} variants={{ hidden: { opacity: 0, rotateY: -90 }, visible: { opacity: 1, rotateY: 0, transition: { duration: transitionConfig.duration, ease: [0.34, 1.56, 0.64, 1] } } }} style={{ transformPerspective: '800px' }}>
    <LogoPaths pathVariants={{}} />
  </motion.svg>
);

// IMPROVEMENT 4: Performant Glitch Animation
const GlitchSettleAnimation = ({ transitionConfig }: AnimationComponentProps) => {
  const { duration } = transitionConfig;
  const clipPaths = [
    "inset(0% 100% 0% 0%)", "inset(0% 0% 100% 0%)", "inset(100% 0% 0% 0%)", "inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"
  ];

  // The 'variants' constant is explicitly typed with 'Variants' for better type safety.
  const variants: Variants = {
    hidden: { opacity: 0, clipPath: clipPaths[0] },
    visible: {
      opacity: 1,
      clipPath: clipPaths,
      transition: {
        duration,
        times: [0, 0.3, 0.6, 0.8, 1],
        // FIX: The 'ease' property is now an array matching the keyframe segments.
        ease: ["easeInOut", "easeInOut", "easeInOut", "easeInOut"],
      },
    },
  };
  
  return (
    <motion.svg {...svgProps} variants={variants}>
      <LogoPaths pathVariants={{}} />
    </motion.svg>
  );
};

// --- Main Component ---
type AnimationType = 'weave' | 'bloom' | 'assembly' | 'aurora' | 'flip' | 'glitch';
type AnimationState = 'enter' | 'exit';

// IMPROVEMENT 1: Prop-driven transition config
interface AnimatedLogoProps {
  animationType?: AnimationType;
  state?: AnimationState;
  transitionConfig?: {
    duration?: number;
    delay?: number;
    stagger?: number;
  };
}

export function AnimatedLogo({
  animationType = 'weave',
  state = 'enter',
  transitionConfig: customTransitions,
}: AnimatedLogoProps) {
  const shouldReduceMotion = useReducedMotion();

  // Set default values and merge with custom props
  const transitionConfig = {
    duration: 1.2,
    delay: 0.1,
    stagger: 0.2,
    ...customTransitions,
  };

  if (shouldReduceMotion) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <LogoSvg className="h-48 w-48" />
      </motion.div>
    );
  }

  const renderAnimation = () => {
    const props = { transitionConfig };
    switch (animationType) {
      case 'bloom': return <GradientBloomAnimation {...props} />;
      case 'assembly': return <FragmentAssemblyAnimation {...props} />;
      case 'aurora': return <AuroraFlowAnimation {...props} />;
      case 'flip': return <ThreeDFlipAnimation {...props} />;
      case 'glitch': return <GlitchSettleAnimation {...props} />;
      case 'weave':
      default:
        return <LiquidWeaveAnimation {...props} />;
    }
  };

  return (
    <motion.div
      variants={wrapperVariants}
      initial="initial"
      animate={state}
      exit="exit"
      // IMPROVEMENT 2: Hover interaction - more subtle
      whileHover={{
        scale: 1.02,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      }}
    >
      {renderAnimation()}
    </motion.div>
  );
}