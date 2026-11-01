import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePwaInstall } from "../../lib/usePwaInstall";

const M = { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" } as const;

/**
 * "Install app" affordance. Renders nothing when the app is already installed
 * (display-mode: standalone) or when no install path exists. On Chromium it
 * fires the saved beforeinstallprompt; on iOS Safari (no such event) it shows
 * a short "Share -> Add to Home Screen" hint instead.
 *
 * Styling uses the frozen design system only: `primary` = marigold fill,
 * `ghost` = outline ink. No shadows.
 */
export function InstallButton({
  variant = "ghost",
  className = "",
  label = "Install app",
}: {
  variant?: "primary" | "ghost";
  className?: string;
  label?: string;
}) {
  const { canInstall, isStandalone, isIOS, promptInstall } = usePwaInstall();
  const [showHint, setShowHint] = useState(false);

  // Installed already, or no install path on this browser — render nothing.
  if (isStandalone) return null;
  if (!canInstall && !isIOS) return null;

  const base =
    "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-1.5 text-sm font-semibold rounded-[7px] transition-colors";
  const styles =
    variant === "primary"
      ? "bg-[#E2A23B] text-[#1E1B16] border border-[#1E1B16]/15 hover:bg-[#CC8F28]"
      : "text-[#1E1B16] border border-[#1E1B16]/25 hover:border-[#1E1B16]/50";

  async function onClick() {
    if (isIOS) {
      setShowHint((v) => !v);
      return;
    }
    await promptInstall();
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button type="button" onClick={onClick} className={`${base} ${styles}`} aria-label={label}>
        <Download size={14} strokeWidth={1.75} />
        {label}
      </button>

      {/* iOS manual hint */}
      <AnimatePresence>
        {isIOS && showHint && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-[#1E1B16] leading-relaxed">
                Tap{" "}
                <Share size={12} strokeWidth={1.75} className="inline-block align-[-2px] text-[#E2A23B]" />{" "}
                <span className="font-semibold">Share</span>, then{" "}
                <span className="font-semibold">Add to Home Screen</span>.
              </p>
              <button
                type="button"
                onClick={() => setShowHint(false)}
                aria-label="Dismiss"
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#6B6355] hover:text-[#1E1B16] transition-colors"
              >
                <X size={13} strokeWidth={1.75} />
              </button>
            </div>
            <div className="text-[9px] text-[#6B6355] mt-1.5" style={M}>
              Field Book installs like a native app.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
