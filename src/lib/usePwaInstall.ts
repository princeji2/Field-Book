import { useEffect, useState } from "react";

/**
 * The beforeinstallprompt event (Chromium only — not in the lib.dom types).
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallState = {
  /** True when a native install prompt is available (Chromium, not installed). */
  canInstall: boolean;
  /** True when running as an installed app (standalone/fullscreen) — hide UI. */
  isStandalone: boolean;
  /** True on iOS Safari, where there is no prompt — show the manual hint. */
  isIOS: boolean;
  /** Fires the saved native prompt. Resolves to the user's choice. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)")?.matches;
  // iOS Safari exposes navigator.standalone instead of display-mode.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mql || iosStandalone);
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac; detect via touch points.
  const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;
  const isWebkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return (iOSDevice || iPadOS) && isWebkit;
}

/**
 * Tracks PWA installability. Listens for beforeinstallprompt (Chromium),
 * stashes the event so a user gesture can fire it later, and clears state on
 * appinstalled. iOS has neither event, so callers show a manual "Add to Home
 * Screen" hint based on isIOS instead.
 */
export function usePwaInstall(): InstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone);
  const isIOS = detectIOS();

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault(); // stop the mini-infobar; we drive the prompt ourselves
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setDeferred(null);
      setIsStandalone(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const mql = window.matchMedia?.("(display-mode: standalone)");
    const onDisplayChange = () => setIsStandalone(detectStandalone());
    mql?.addEventListener?.("change", onDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      mql?.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
    if (!deferred) return "unavailable";
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null); // a prompt can only be used once
    return choice.outcome;
  }

  return {
    canInstall: deferred !== null && !isStandalone,
    isStandalone,
    isIOS,
    promptInstall,
  };
}
