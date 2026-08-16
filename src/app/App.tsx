import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router";
import { Smartphone, Monitor } from "lucide-react";
import { Toaster } from "sonner";
import { AuthProvider } from "../lib/AuthContext";
import { AnimatedRoutes } from "./routes";

export default function App() {
  const [mobilePreview, setMobilePreview] = useState(false);
  const [mobileScale,   setMobileScale]   = useState(1);
  // Detect when this instance is running inside the preview iframe
  const isEmbedded = window.self !== window.top;

  useEffect(() => {
    function calc() {
      const s = Math.min(1, (window.innerHeight - 80) / 844, (window.innerWidth - 80) / 390);
      setMobileScale(Math.round(s * 1000) / 1000);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <>
    {/* ── Dev-only: mobile preview toggle (suppressed inside the preview iframe) ── */}
    {!isEmbedded && (
      <button
        type="button"
        onClick={() => setMobilePreview(p => !p)}
        title={mobilePreview ? "Switch to desktop view" : "Simulate 390 px mobile viewport"}
        style={{
          position: "fixed", bottom: 16, left: 16, zIndex: 99999,
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 6, cursor: "pointer",
          background: mobilePreview ? "#1E1B16" : "#FCFAF3",
          border: `1px solid ${mobilePreview ? "rgba(255,255,255,0.10)" : "rgba(30,27,22,0.18)"}`,
          color: mobilePreview ? "#F6F1E7" : "#6B6355",
          fontSize: 11, fontFamily: "'Public Sans',system-ui,sans-serif",
          boxShadow: "0 1px 6px rgba(30,27,22,0.14)",
          letterSpacing: "0.02em", whiteSpace: "nowrap",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {mobilePreview
          ? <><Monitor    size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />Desktop</>
          : <><Smartphone size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />390px</>}
      </button>
    )}

    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>

    {/* ── Mobile preview: true 390 px iframe viewport ── */}
    {!isEmbedded && mobilePreview && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9990,
        background: "#19140F",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <iframe
          src={window.location.href}
          title="Mobile preview — 390 px viewport"
          style={{
            width: 390, height: 844,
            border: "none", display: "block", flexShrink: 0,
            borderRadius: 10,
            boxShadow: "0 0 0 1.5px rgba(255,255,255,0.08), 0 32px 90px rgba(0,0,0,0.6)",
            transform: `scale(${mobileScale})`,
            transformOrigin: "center center",
          }}
        />
      </div>
    )}
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#FCFAF3",
          color: "#1E1B16",
          border: "1px solid rgba(30,27,22,0.15)",
          fontFamily: "'Public Sans', system-ui, sans-serif",
          fontSize: "13px",
        },
      }}
    />
    </>
  );
}
