import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Reproduces the per-screen fade (and occasional slide) transition every
 * `{screen === "x" && <motion.div initial exit>...}` block used to apply in
 * the old App.tsx AnimatePresence. Used inside each route element so page
 * transitions look the same as before, just driven by the URL instead of a
 * `screen` state string (see AnimatedRoutes in App.tsx, which wraps <Routes>
 * in <AnimatePresence mode="wait"> keyed by location.pathname).
 */
export function Fade({
  duration = 0.22,
  y,
  style,
  children,
}: {
  duration?: number;
  /** Vertical slide distance in px — omit for a plain opacity fade. */
  y?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const hasSlide = y !== undefined;
  return (
    <motion.div
      style={style}
      initial={hasSlide ? { opacity: 0, y } : { opacity: 0 }}
      animate={hasSlide ? { opacity: 1, y: 0 } : { opacity: 1 }}
      exit={hasSlide ? { opacity: 0, y: -y! } : { opacity: 0 }}
      transition={hasSlide ? { duration, ease: "easeOut" } : { duration }}
    >
      {children}
    </motion.div>
  );
}
