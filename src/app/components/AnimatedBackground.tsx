import { motion } from "motion/react";
import { dotGrid } from "../shared";

/**
 * Subtle animated background for the LandingPage hero.
 *
 * Two slow-drifting blurred blobs (gold + forest green) at low opacity sit
 * behind content, with the existing dot-grid overlay breathing on top.
 * Designed to be invisible enough that text remains fully readable while
 * adding depth to the warm parchment base.
 *
 * Render inside a `relative` parent — this component is absolutely positioned
 * behind all content.
 */
export function AnimatedBackground() {
  return (
    <div
      className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Gold blob — drifts top-right area */}
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full"
        style={{
          background: "#E2A23B",
          opacity: 0.12,
          filter: "blur(130px)",
          top: "8%",
          right: "12%",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Forest green blob — drifts bottom-left area */}
      <motion.div
        className="absolute w-[360px] h-[360px] rounded-full"
        style={{
          background: "#2E6B4C",
          opacity: 0.10,
          filter: "blur(140px)",
          bottom: "10%",
          left: "8%",
        }}
        animate={{
          x: [0, -30, 25, 0],
          y: [0, 25, -35, 0],
        }}
        transition={{
          duration: 34,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Dot-grid overlay with breathing opacity */}
      <motion.div
        className="absolute inset-0"
        style={dotGrid}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
