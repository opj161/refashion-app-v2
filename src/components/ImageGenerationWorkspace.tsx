// src/components/ImageGenerationWorkspace.tsx
'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useGenerationSettingsStore } from '@/stores/generationSettingsStore';
import ImageParameters from './image-parameters';
import StudioParameters from './studio-parameters';

export function ImageGenerationWorkspace() {
  const generationMode = useGenerationSettingsStore(state => state.generationMode);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={generationMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
        >
          {generationMode === 'creative' ? <ImageParameters /> : <StudioParameters />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
