'use client';

import { motion, useReducedMotion } from 'motion/react';

export function LightSignal() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      initial={reduceMotion ? false : { x: '-12vw', opacity: 0 }}
      animate={
        reduceMotion
          ? { opacity: 0 }
          : { x: ['-12vw', '12vw'], opacity: [0, 1, 1, 0] }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }
      }
    />
  );
}
