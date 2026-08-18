import { useState, useEffect, useId, useRef, Component } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  QrCode, Award, BarChart3, Compass,
  Check, ArrowRight, BookMarked,
  Calendar, MapPin, GraduationCap,
  ClipboardList, Settings2, ChevronRight,
  Scan, Shield, ArrowLeft, Eye, EyeOff, Bell, Home, Search,
  Download, Share2, X, Users, User, Plus, LogOut, Menu,
  Upload, Pencil, Copy, TrendingUp, ChevronDown,
  UserCheck, FileText, CheckCircle2, AlertTriangle, Settings, RefreshCw, ExternalLink,
  XCircle, Clock, ChevronLeft, MessageSquare,
  MoreHorizontal, UserPlus, Ban, ShieldCheck, Mail, Filter,
  LayoutTemplate, Star, Eye as EyeIcon, Trash2, GripVertical, Move,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { toast, Toaster } from "sonner";
import { signUpWithProfile, roleToScreen, signOutUser, getCurrentUserProfile, signInWithGoogle, verifySignupOtp, resendSignupOtp, requestPasswordReset, type SignupRole, type AuthedProfile } from "../lib/auth";

// ─── Typography shorthand ───────────────────────────────────────────────────
export const F = { fontFamily: "'Fraunces', Georgia, serif" } as const;
export const M = { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" } as const;

export const dotGrid = {
  backgroundImage: "radial-gradient(circle, rgba(30,27,22,0.09) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
} as const;

// ─── Error Boundary ──────────────────────────────────────────────────────────

type EBState = { hasError: boolean };

export class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="h-screen flex items-center justify-center bg-[#F6F1E7]"
        style={dotGrid}
      >
        <div
          className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[10px] px-8 py-7 flex flex-col items-center gap-4 text-center w-full max-w-[360px] mx-4"
          style={{ boxShadow: "0 2px 16px rgba(30,27,22,0.07)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(181,67,46,0.10)", border: "1px solid rgba(181,67,46,0.25)" }}
          >
            <AlertTriangle size={16} strokeWidth={1.75} style={{ color: "#B5432E" }} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1E1B16] mb-1" style={F}>
              Something went wrong
            </p>
            <p className="text-[12px] text-[#9C8E7E]"
              style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
              An unexpected error occurred in this screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-80 active:opacity-60"
            style={{ background: "#1E1B16", color: "#F6F1E7", fontFamily: "'Public Sans', system-ui, sans-serif" }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

// ─── Screen type ────────────────────────────────────────────────────────────
export type Screen = "landing" | "signup" | "forgot" | "dashboard" | "explore" | "details" | "myevents" | "scanner" | "certs" | "notifs" | "org-dashboard" | "org-events" | "org-events-create" | "org-qr" | "org-attendees" | "org-analytics" | "org-certs" | "admin-login" | "admin-role-confirm" | "admin-dashboard" | "admin-approvals" | "admin-users" | "admin-role-requests" | "admin-templates" | "admin-analytics" | "admin-settings" | "admin-notifs" | "profile";

// ─── Scan demo data ─────────────────────────────────────────────────────────
const SCAN_ROWS = [
  { name: "Sarah Chen",      id: "SCH-4421", time: "09:02 AM" },
  { name: "Marcus Williams", id: "MWI-3387", time: "09:04 AM" },
  { name: "Priya Patel",     id: "PPA-7702", time: "09:07 AM" },
  { name: "James Rodriguez", id: "JRO-9915", time: "09:11 AM" },
];

// ─── QR pattern — 17 × 17, hand-drawn with correct finder patterns ─────────
const QR_PATTERN = [
  [1,1,1,1,1,1,1,0,0,1,0,0,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0],
  [0,1,0,1,1,0,1,1,0,1,0,1,0,1,0,1,1],
  [1,0,1,0,0,1,0,0,1,0,1,0,0,0,1,0,0],
  [0,1,1,0,1,0,1,0,0,1,0,0,1,1,0,0,1],
  [0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0],
  [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,1,0],
  [1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,1,0],
  [1,0,1,1,1,0,1,1,0,1,0,0,1,1,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,0,0,1,0,0],
  [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,1,1],
];

// ─── Numeric utilities ──────────────────────────────────────────────────────
export function parseMetricNum(v: string): number {
  return parseInt(v.replace(/,/g, ""), 10) || 0;
}

export function CountUp({ target, duration = 550, delay = 0, reanimDuration = 300, color, formatted, suffix = "", onComplete }: {
  target: number; duration?: number; delay?: number; reanimDuration?: number;
  color: string; formatted: string; suffix?: string; onComplete?: () => void;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef     = useRef(0);
  const startRef    = useRef<number | null>(null);
  const rafRef      = useRef<number>(0);
  const mountRef    = useRef(true);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  function runAnim(from: number, to: number, dur: number, delayMs: number) {
    cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    fromRef.current = from;
    const t = setTimeout(() => {
      function tick(ts: number) {
        if (startRef.current === null) startRef.current = ts;
        const progress = Math.min((ts - startRef.current) / dur, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = Math.round(from + eased * (to - from));
        setDisplay(val);
        fromRef.current = val;
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          completeRef.current?.();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);
    return t;
  }

  useEffect(() => {
    if (mountRef.current) {
      mountRef.current = false;
      const t = runAnim(0, target, duration, delay);
      return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
    } else {
      const t = runAnim(display, target, reanimDuration, 0);
      return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
    }
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasComma = formatted.includes(",");
  const displayStr = (hasComma ? display.toLocaleString("en-US") : String(display)) + suffix;
  return <span style={{ color }}>{displayStr}</span>;
}

export function StatMetricNumber({ target, formatted, color, duration = 550, delay = 0, suffix = "" }: {
  target: number; formatted: string; color: string;
  duration?: number; delay?: number; suffix?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <span className="relative inline-block">
      <CountUp
        target={target}
        formatted={formatted}
        color={color}
        duration={duration}
        delay={delay}
        suffix={suffix}
        onComplete={() => setDone(true)}
      />
      <motion.span
        className="absolute left-0 bg-[#E2A23B]"
        style={{ bottom: 0, height: "1px" }}
        initial={{ width: "0%" }}
        animate={{ width: done ? "100%" : "0%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </span>
  );
}

// ─── SVG QR Visual ──────────────────────────────────────────────────────────
export function MockQR({ size = 96 }: { size?: number }) {
  const cell = size / 17;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      {QR_PATTERN.flatMap((row, ri) =>
        row.map((v, ci) =>
          v ? (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cell}
              y={ri * cell}
              width={cell - 0.3}
              height={cell - 0.3}
              fill="#1E1B16"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ─── Certificate Seal ───────────────────────────────────────────────────────
export function CertificateSeal({
  size = 88,
  rotate = -8,
  delay = 0.3,
}: {
  size?: number;
  rotate?: number;
  delay?: number;
}) {
  const rawId = useId();
  const uid = "s" + rawId.replace(/[^a-z0-9]/gi, "");
  const r = size / 2;

  const pts = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r - 1 : r - 5.5;
    return `${(r + Math.cos(a) * rad).toFixed(2)},${(r + Math.sin(a) * rad).toFixed(2)}`;
  }).join(" ");

  const arcR = r - 14;
  const topArc = `M ${(r - arcR).toFixed(2)},${r} A ${arcR},${arcR} 0 0,0 ${(r + arcR).toFixed(2)},${r}`;
  const fs = Math.max(4.5, size * 0.061);
  const sw = Math.max(1.5, size * 0.027);

  return (
    <motion.div
      style={{ width: size, height: size, display: "inline-block", flexShrink: 0 }}
      initial={{ scale: 0, rotate: rotate - 22, opacity: 0 }}
      animate={{ scale: 1, rotate, opacity: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 22, delay }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <path id={uid} d={topArc} />
        </defs>
        <polygon points={pts} fill="#E2A23B" />
        <circle cx={r} cy={r} r={r - 8} fill="#E2A23B" />
        <circle cx={r} cy={r} r={r - 10.5} fill="none" stroke="#1E1B16" strokeWidth="0.75" />
        <circle cx={r} cy={r} r={r - 17.5} fill="none" stroke="#1E1B16" strokeWidth="0.75" strokeDasharray="2 1.5" />
        <text fill="#1E1B16" fontSize={fs} fontFamily="'IBM Plex Mono',monospace" fontWeight="500" letterSpacing="1.1">
          <textPath href={`#${uid}`} startOffset="50%" textAnchor="middle">
            · FIELDBOOK · VERIFIED ·
          </textPath>
        </text>
        <path
          d={`M${(r-r*.22).toFixed(2)},${(r+r*.04).toFixed(2)} L${(r-r*.03).toFixed(2)},${(r+r*.22).toFixed(2)} L${(r+r*.26).toFixed(2)},${(r-r*.18).toFixed(2)}`}
          stroke="#1E1B16" strokeWidth={sw}
          strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
      </svg>
    </motion.div>
  );
}

// ─── Demo Step: Create Event ─────────────────────────────────────────────────
export function DemoCreate() {
  return (
    <motion.div
      key="create"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col md:flex-row gap-5"
    >
      {/* Form card */}
      <div className="flex-1 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] p-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[9px] tracking-widest text-[#6B6355] uppercase" style={M}>New Event</span>
          <ClipboardList size={13} className="text-[#6B6355]" strokeWidth={1.5} />
        </div>
        <div className="space-y-3 mb-5">
          {[
            { label: "TITLE",     val: "Environmental Policy Symposium", font: F },
            { label: "DATE",      val: "November 14, 2024",              font: M },
            { label: "LOCATION",  val: "Whitman Hall, Room 204",          font: M },
            { label: "ORGANIZER", val: "Prof. Andrei Volkov",             font: undefined },
          ].map(({ label, val, font }) => (
            <div key={label}>
              <div className="text-[8px] text-[#6B6355] tracking-widest uppercase mb-1.5" style={M}>{label}</div>
              <div
                className="border border-[#DCD4C2] rounded-[5px] px-3 py-2 text-xs text-[#1E1B16]"
                style={font}
              >
                {val}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#DCD4C2] pt-4 flex items-center justify-between">
          <div className="text-[9px] text-[#6B6355]" style={M}>Max Capacity: 120</div>
          <div className="text-[9px] text-[#2E6B4C]" style={M}>● Certificates Enabled</div>
        </div>
      </div>

      {/* Generated QR card */}
      <div className="flex-shrink-0 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] p-5 flex flex-col items-center justify-between gap-4 min-w-[160px]">
        <div className="text-[9px] tracking-widest text-[#6B6355] uppercase w-full" style={M}>Generated QR</div>
        <div className="p-2.5 border border-[#DCD4C2] rounded-[6px] bg-white">
          <MockQR size={100} />
        </div>
        <div className="w-full text-center">
          <div className="text-[10px] font-medium text-[#1E1B16] mb-0.5" style={M}>ENV-POL-2024</div>
          <div className="inline-flex items-center gap-1 text-[8px] text-[#2E6B4C]" style={M}>
            <span className="w-1 h-1 rounded-full bg-[#2E6B4C]" /> Active · Time-locked
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Demo Step: Students Scan ────────────────────────────────────────────────
export function DemoScan() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const timers = SCAN_ROWS.map((_, i) =>
      setTimeout(() => setCount(i + 1), 700 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      key="scan"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col md:flex-row gap-5"
    >
      {/* QR + scan line */}
      <div className="flex-shrink-0 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] p-5 flex flex-col items-center gap-4 min-w-[160px]">
        <div className="text-[9px] tracking-widest text-[#6B6355] uppercase w-full" style={M}>Scan to Attend</div>
        <div className="relative p-2.5 border border-[#DCD4C2] rounded-[6px] bg-white overflow-hidden">
          <MockQR size={100} />
          <motion.div
            className="absolute left-2 right-2 h-[1.5px] bg-[#E2A23B]"
            style={{ top: "8px" }}
            animate={{ top: ["8px", "calc(100% - 8px)", "8px"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="w-full text-center">
          <div className="text-[10px] font-medium text-[#1E1B16] mb-0.5" style={M}>ENV-POL-2024</div>
          <div className="text-[8px] text-[#6B6355]" style={M}>Point camera to QR code</div>
        </div>
      </div>

      {/* Live attendance list */}
      <div className="flex-1 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#DCD4C2] flex items-center justify-between">
          <span className="text-[9px] tracking-widest text-[#6B6355] uppercase" style={M}>Live Attendance</span>
          <span className="text-[9px] text-[#2E6B4C]" style={M}>{count} / 4 Verified</span>
        </div>

        {SCAN_ROWS.slice(0, count).map((row) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-2.5 border-b border-[#DCD4C2] flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C] flex-shrink-0" />
              <div>
                <div className="text-xs text-[#1E1B16]">{row.name}</div>
                <div className="text-[9px] text-[#6B6355]" style={M}>{row.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#6B6355]" style={M}>{row.time}</span>
              <Check size={10} className="text-[#2E6B4C]" />
            </div>
          </motion.div>
        ))}

        {count < SCAN_ROWS.length && (
          <div className="px-4 py-3 flex items-center gap-2.5">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-[#DCD4C2]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-[9px] text-[#DCD4C2]" style={M}>Waiting for next scan…</span>
          </div>
        )}

        {count === SCAN_ROWS.length && (
          <div className="px-4 py-3 flex items-center gap-2 border-t border-[#DCD4C2]">
            <Shield size={11} className="text-[#2E6B4C]" strokeWidth={1.5} />
            <span className="text-[9px] text-[#2E6B4C]" style={M}>All scans verified — certificates queued</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Demo Step: Certificate ──────────────────────────────────────────────────
export function DemoCert() {
  return (
    <motion.div
      key="cert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex justify-center"
    >
      <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] w-full max-w-[480px] overflow-hidden">
        <div className="h-[3px] bg-[#E2A23B]" />
        <div className="px-8 py-5 border-b border-[#DCD4C2] text-center">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <BookMarked size={11} className="text-[#E2A23B]" />
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={M}>Fieldbook</span>
          </div>
          <p className="text-[8px] text-[#6B6355] tracking-widest uppercase" style={M}>
            Certificate of Participation
          </p>
        </div>

        <div className="px-8 py-7 border-b border-[#DCD4C2] grid grid-cols-[1fr,auto] gap-6 items-center">
          <div>
            <p className="text-[8px] text-[#6B6355] tracking-widest uppercase mb-2" style={M}>
              This Certifies That
            </p>
            <h2 className="text-3xl font-semibold text-[#1E1B16] mb-0.5" style={F}>
              Sarah Chen
            </h2>
            <p className="text-[9px] text-[#6B6355] mb-6" style={M}>Student ID: SCH-4421</p>

            <p className="text-[8px] text-[#6B6355] tracking-widest uppercase mb-1.5" style={M}>
              Has Attended
            </p>
            <p className="text-base font-semibold text-[#1E1B16] mb-0.5" style={F}>
              Environmental Policy Symposium
            </p>
            <p className="text-[10px] text-[#6B6355]">November 14, 2024 · Whitman Hall, Rm 204</p>
          </div>
          <CertificateSeal size={88} rotate={-9} delay={0.4} />
        </div>

        <div className="px-8 py-4 flex items-end justify-between">
          <div>
            <div className="w-24 border-b border-[#1E1B16]/25 mb-1.5" />
            <p className="text-[8px] text-[#6B6355] tracking-wide" style={M}>DR. HELENA MARSH</p>
            <p className="text-[7px] text-[#6B6355]" style={M}>DEAN OF STUDENT AFFAIRS</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] text-[#6B6355] mb-0.5" style={M}>CERT-FB-2024-089142</p>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#2E6B4C] rounded-full">
              <span className="w-1 h-1 rounded-full bg-[#2E6B4C]" />
              <span className="text-[7px] text-[#2E6B4C]" style={M}>Verified</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hero ledger card ────────────────────────────────────────────────────────
export function HeroLedger() {
  const rows = [
    { name: "Sarah Chen",      id: "SCH-4421", time: "09:02", ok: true  },
    { name: "Marcus Williams", id: "MWI-3387", time: "09:04", ok: true  },
    { name: "Priya Patel",     id: "PPA-7702", time: "09:07", ok: true  },
    { name: "James Rodriguez", id: "JRO-9915", time: "09:11", ok: true  },
    { name: "Aisha Thompson",  id: "ATH-2246", time: "—",     ok: false },
  ];

  return (
    <div className="bg-[#FCFAF3] border border-[#1E1B16]/18 rounded-[8px] w-[308px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#DCD4C2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked size={11} className="text-[#E2A23B]" strokeWidth={1.75} />
          <span className="text-[9px] font-semibold tracking-widest uppercase" style={M}>Event Ledger</span>
        </div>
        <span className="text-[8px] text-[#6B6355]" style={M}>#FB-2024-0891</span>
      </div>

      {/* Event info */}
      <div className="px-4 py-3 border-b border-[#DCD4C2]">
        <div className="text-sm font-semibold text-[#1E1B16] leading-tight mb-1.5" style={F}>
          Environmental Policy Symposium
        </div>
        <div className="flex items-center gap-3 text-[8px] text-[#6B6355]" style={M}>
          <span className="flex items-center gap-1"><Calendar size={8} />Nov 14, 2024</span>
          <span className="flex items-center gap-1"><MapPin size={8} />Whitman Hall, Rm 204</span>
        </div>
      </div>

      {/* Column head */}
      <div className="px-4 py-1.5 border-b border-[#DCD4C2] grid grid-cols-[1fr,auto,auto] gap-3">
        <span className="text-[8px] tracking-widest text-[#6B6355] uppercase" style={M}>Name</span>
        <span className="text-[8px] text-[#6B6355]" style={M}>Time</span>
        <span className="text-[8px] text-[#6B6355]" style={M}>Status</span>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={`px-4 py-2 grid grid-cols-[1fr,auto,auto] gap-3 items-center${i < rows.length - 1 ? " border-b border-[#DCD4C2]" : ""}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.ok ? "bg-[#2E6B4C]" : "bg-[#DCD4C2]"}`} />
            <div className="min-w-0">
              <div className="text-[11px] text-[#1E1B16] truncate">{row.name}</div>
              <div className="text-[8px] text-[#6B6355]" style={M}>{row.id}</div>
            </div>
          </div>
          <span className={`text-[9px] ${row.ok ? "text-[#6B6355]" : "text-[#DCD4C2]"} flex-shrink-0`} style={M}>
            {row.time}
          </span>
          {row.ok ? (
            <Check size={10} className="text-[#2E6B4C] flex-shrink-0" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full border border-[#DCD4C2] flex-shrink-0" />
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[#DCD4C2] bg-[#F6F1E7] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 border border-[#DCD4C2] rounded-[5px] bg-[#FCFAF3]">
            <QrCode size={24} className="text-[#1E1B16]" strokeWidth={1.25} />
          </div>
          <div>
            <div className="text-[7px] text-[#6B6355] uppercase tracking-wider" style={M}>Scan to attend</div>
            <div className="text-[9px] font-medium text-[#1E1B16]" style={M}>ENV-POL-2024</div>
          </div>
        </div>
        <CertificateSeal size={44} rotate={-11} delay={0.8} />
      </div>
    </div>
  );
}

// ─── Auth: shared header ─────────────────────────────────────────────────────
export function AuthHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="bg-[#F6F1E7] border-b border-[#DCD4C2]">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          <BookMarked size={15} className="text-[#E2A23B]" strokeWidth={1.75} />
          <span className="text-base font-semibold text-[#1E1B16] tracking-tight" style={F}>Fieldbook</span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#6B6355] hover:text-[#1E1B16] transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Back to home
        </button>
      </div>
    </header>
  );
}

// ─── Auth: reusable card shell ───────────────────────────────────────────────
export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="px-8 pt-8 pb-6 border-b border-[#DCD4C2]">
        {eyebrow && (
          <p className="text-[9px] tracking-widest uppercase text-[#6B6355] mb-3" style={M}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-[1.5rem] font-semibold text-[#1E1B16] leading-tight mb-2" style={F}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#6B6355] leading-relaxed">{subtitle}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Auth: Google wordmark glyph ─────────────────────────────────────────────
export function GoogleGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
      <text
        x="6.5" y="10.5"
        textAnchor="middle"
        fontSize="11"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fill="#1E1B16"
      >
        G
      </text>
    </svg>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────
export function getPasswordScore(p: string): 0 | 1 | 2 | 3 {
  if (!p) return 0;
  let n = 0;
  if (p.length >= 8)          n++;
  if (/[A-Z]/.test(p))        n++;
  if (/[0-9]/.test(p))        n++;
  if (/[^A-Za-z0-9]/.test(p)) n++;
  if (n <= 1) return 1;
  if (n <= 3) return 2;
  return 3;
}

export function StrengthMeter({ password }: { password: string }) {
  const score = getPasswordScore(password);
  if (!password) return null;
  const barColor  = ["", "#DCD4C2", "#6B6355", "#2E6B4C"][score] as string;
  const label     = ["", "Weak",    "Medium",  "Strong" ][score] as string;
  const textColor = ["", "#6B6355", "#6B6355", "#2E6B4C"][score] as string;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((seg) => (
          <div
            key={seg}
            className="flex-1 h-[3px] rounded-full transition-colors duration-300"
            style={{ backgroundColor: seg <= score ? barColor : "rgba(30,27,22,0.08)" }}
          />
        ))}
      </div>
      <span className="text-[9px]" style={{ ...M, color: textColor }}>{label}</span>
    </div>
  );
}

// ─── Signup page ─────────────────────────────────────────────────────────────
export function SignupPage({ onNavigate, onAuthenticated }: { onNavigate: (s: Screen) => void; onAuthenticated?: (p: AuthedProfile) => void }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [terms, setTerms]       = useState(false);
  const [role, setRole]         = useState<SignupRole | null>(null);
  const [errors, setErrors]     = useState({
    name: "", email: "", password: "", confirm: "", terms: "", role: "",
  });
  // "otp": signUp succeeded but email confirmation is required — waiting for
  // the 6-digit code. "verifying": that code was submitted and is being
  // checked. Both are new; "idle"/"loading"/"success" are unchanged from
  // before OTP verification existed.
  const [phase, setPhase] = useState<"idle" | "loading" | "otp" | "verifying" | "success">("idle");
  const [authErr, setAuthErr] = useState("");
  const [googleErr, setGoogleErr] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  // The 6-digit code the user is entering, one character per box.
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpErr, setOtpErr] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState("");
  // The role actually confirmed by signUpWithProfile's success result, used
  // for the post-signup navigation target (kept separate from `role` state
  // just for clarity of what actually succeeded vs. what's currently selected).
  const [confirmedRole, setConfirmedRole] = useState<SignupRole | null>(null);

  // Resend cooldown countdown, one second at a time — same pattern as
  // ForgotPage's existing cooldown timer below in this file.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function validateEmail(v: string) {
    if (!v) return "College email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    return "";
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const next = {
      name:     name.trim()    ? "" : "Full name is required.",
      email:    validateEmail(email),
      password: password.length >= 8 ? "" : "Password must be at least 8 characters.",
      confirm:  confirm === password ? "" : "Passwords do not match.",
      terms:    terms ? "" : "You must accept the terms to continue.",
      role:     role ? "" : "Choose a role to continue.",
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setAuthErr("");
    setPhase("loading");

    const result = await signUpWithProfile({ email, password, fullName: name, role: role! });

    if (result.status === "error") {
      setAuthErr(result.message);
      setPhase("idle");
      return;
    }

    if (result.status === "confirmation_required") {
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpErr("");
      setResendCooldown(60);
      setPhase("otp");
      return;
    }

    // Immediate-session case: signUpWithProfile only tells us the role, but
    // the on_auth_user_created trigger has already written the real
    // profiles row by now, so fetch it once here to get id/fullName/email
    // for App.tsx's single source of truth (same pattern as
    // AdminLoginScreen's onAuthenticated call).
    const freshProfile = await getCurrentUserProfile();
    if (freshProfile) onAuthenticated?.(freshProfile);

    setConfirmedRole(result.role);
    setPhase("success");
  }

  async function handleGoogleSignIn() {
    setGoogleErr("");
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    // Only reachable if the redirect itself failed to start — a successful
    // call navigates the browser away before this line runs. Same pattern
    // as AdminLoginScreen.handleGoogleSignIn.
    if (error) {
      setGoogleErr(error.message);
      setGoogleLoading(false);
    }
  }

  const clearErr = (field: keyof typeof errors) =>
    setErrors(prev => ({ ...prev, [field]: "" }));

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => onNavigate(roleToScreen(confirmedRole ?? "student")), 2000);
    return () => clearTimeout(t);
  }, [phase, confirmedRole]);

  function handleOtpDigitChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setOtpDigits(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (otpErr) setOtpErr("");
    if (digit && index < 5) {
      document.getElementById(`su-otp-${index + 1}`)?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      document.getElementById(`su-otp-${index - 1}`)?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    setOtpDigits(prev => {
      const next = [...prev];
      for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? next[i] ?? "";
      return next;
    });
    if (otpErr) setOtpErr("");
    document.getElementById(`su-otp-${Math.min(pasted.length, 5)}`)?.focus();
  }

  async function handleVerifyOtp(ev: React.FormEvent) {
    ev.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setOtpErr("Enter all 6 digits.");
      return;
    }

    setOtpErr("");
    setPhase("verifying");

    const result = await verifySignupOtp(email, code);
    if (result.status === "error") {
      setOtpErr(result.message);
      setPhase("otp");
      return;
    }

    // Same as the immediate-session branch below: the on_auth_user_created
    // trigger has already written the profiles row (it fires on the
    // auth.users insert at signUp() time, independent of confirmation), so
    // fetch it now that verifyOtp has produced a real session.
    const freshProfile = await getCurrentUserProfile();
    if (freshProfile) onAuthenticated?.(freshProfile);

    setConfirmedRole(role);
    setPhase("success");
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setResendNotice("");
    setOtpErr("");
    const result = await resendSignupOtp(email);
    if (result.status === "error") {
      setOtpErr(result.message);
      return;
    }
    setResendCooldown(60);
    setResendNotice("A new code is on its way.");
  }

  const inputClass = (err: string) =>
    `w-full bg-[#F6F1E7] border rounded-[7px] px-3 py-2.5 text-sm text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none transition-colors ${
      err ? "border-[#B5432E]" : "border-[#DCD4C2] focus:border-[#1E1B16]/40"
    }`;

  const wrapperClass = (err: string) =>
    `flex items-center bg-[#F6F1E7] border rounded-[7px] transition-colors ${
      err ? "border-[#B5432E]" : "border-[#DCD4C2] focus-within:border-[#1E1B16]/40"
    }`;

  return (
    <div className="bg-[#F6F1E7] min-h-screen flex flex-col" style={dotGrid}>
      <AuthHeader onBack={() => onNavigate("landing")} />

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px]">
          <AuthCard
            eyebrow="Student · Organizer · Admin"
            title="Create your account."
            subtitle="Choose your role below to get started."
          >
            <AnimatePresence mode="wait">

              {/* ── Success ── */}
              {phase === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-10 flex flex-col items-center text-center"
                >
                  <CertificateSeal size={80} rotate={-9} delay={0.15} />
                  <h2 className="text-[1.35rem] font-semibold text-[#1E1B16] mt-6 mb-1.5" style={F}>
                    Account created.
                  </h2>
                  <p className="text-sm text-[#6B6355] mb-6">
                    Welcome to Fieldbook. Setting up your record…
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F6F1E7] border border-[#DCD4C2] rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C] flex-shrink-0" />
                    <span className="text-[9px] text-[#6B6355] max-w-[280px] truncate" style={M}>
                      {email}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── Email verification (6-digit code) ── */}
              {(phase === "otp" || phase === "verifying") && (
                <motion.form
                  key="otp"
                  onSubmit={handleVerifyOtp}
                  noValidate
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-9 flex flex-col items-center text-center"
                >
                  <div className="w-10 h-10 rounded-[6px] border border-[#DCD4C2] flex items-center justify-center mb-4">
                    <Mail size={18} strokeWidth={1.5} className="text-[#6B6355]" />
                  </div>
                  <h2 className="text-[1.2rem] font-semibold text-[#1E1B16] mb-1.5" style={F}>
                    Check your email.
                  </h2>
                  <p className="text-sm text-[#6B6355] mb-1">
                    We sent a 6-digit code to
                  </p>
                  <p className="text-xs text-[#1E1B16] font-medium mb-6" style={M}>{email}</p>

                  <div className="flex gap-2 mb-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        id={`su-otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        value={digit}
                        disabled={phase === "verifying"}
                        onChange={e => handleOtpDigitChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        aria-label={`Digit ${i + 1} of 6`}
                        className={`w-10 h-12 text-center text-lg font-semibold bg-[#F6F1E7] border rounded-[7px] text-[#1E1B16] outline-none transition-colors disabled:opacity-60 ${
                          otpErr ? "border-[#B5432E]" : "border-[#DCD4C2] focus:border-[#1E1B16]/40"
                        }`}
                        style={M}
                      />
                    ))}
                  </div>

                  {otpErr && (
                    <p className="text-[10px] text-[#B5432E] mb-4" style={M}>{otpErr}</p>
                  )}
                  {!otpErr && resendNotice && (
                    <p className="text-[10px] text-[#2E6B4C] mb-4" style={M}>{resendNotice}</p>
                  )}
                  {!otpErr && !resendNotice && <div className="mb-4" />}

                  <button
                    type="submit"
                    disabled={phase === "verifying" || otpDigits.join("").length !== 6}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {phase === "verifying" ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <><span>Verify</span><ArrowRight size={13} /></>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className={`mt-4 text-xs font-medium transition-colors ${
                      resendCooldown > 0
                        ? "text-[#DCD4C2] cursor-not-allowed"
                        : "text-[#1E1B16] hover:text-[#E2A23B]"
                    }`}
                  >
                    {resendCooldown > 0 ? (
                      <span style={M} className="text-[9px]">Resend code in {resendCooldown}s</span>
                    ) : (
                      "Resend code →"
                    )}
                  </button>
                </motion.form>
              )}

              {/* ── Form ── */}
              {phase !== "success" && phase !== "otp" && phase !== "verifying" && (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  noValidate
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-7 space-y-4"
                >
                  {/* Full name */}
                  <div>
                    <label
                      htmlFor="su-name"
                      className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5"
                      style={M}
                    >
                      Full Name
                    </label>
                    <input
                      id="su-name"
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value); clearErr("name"); }}
                      onBlur={() => setErrors(prev => ({
                        ...prev, name: name.trim() ? "" : "Full name is required.",
                      }))}
                      placeholder="Alex Rivera"
                      autoComplete="name"
                      className={inputClass(errors.name)}
                    />
                    {errors.name && (
                      <p className="text-[9px] text-[#B5432E] mt-1.5" style={M}>{errors.name}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5" style={M}>
                      I'm signing up as
                    </label>
                    <div className="flex gap-2">
                      {(["student", "organizer"] as const).map(r => {
                        const selected = role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => { setRole(r); clearErr("role"); }}
                            aria-pressed={selected}
                            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-[7px] border transition-colors ${
                              selected
                                ? "bg-[#E2A23B] text-[#1E1B16] border-[#1E1B16]/15"
                                : "bg-[#F6F1E7] text-[#1E1B16] border-[#1E1B16]/25 hover:border-[#1E1B16]/50"
                            }`}
                          >
                            {r === "student" ? "I'm a Student" : "I'm an Organizer"}
                          </button>
                        );
                      })}
                    </div>
                    {errors.role && (
                      <p className="text-[9px] text-[#B5432E] mt-1.5" style={M}>{errors.role}</p>
                    )}
                  </div>

                  {/* College email */}
                  <div>
                    <label
                      htmlFor="su-email"
                      className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5"
                      style={M}
                    >
                      College Email
                    </label>
                    <input
                      id="su-email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); clearErr("email"); }}
                      onBlur={() => setErrors(prev => ({ ...prev, email: validateEmail(email) }))}
                      placeholder="alex@university.edu"
                      autoComplete="email"
                      className={inputClass(errors.email)}
                    />
                    {errors.email && (
                      <p className="text-[9px] text-[#B5432E] mt-1.5" style={M}>{errors.email}</p>
                    )}
                  </div>

                  {/* Password + strength meter */}
                  <div>
                    <label
                      htmlFor="su-password"
                      className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5"
                      style={M}
                    >
                      Password
                    </label>
                    <div className={wrapperClass(errors.password)}>
                      <input
                        id="su-password"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); clearErr("password"); }}
                        onBlur={() => setErrors(prev => ({
                          ...prev, password: password.length >= 8 ? "" : "Password must be at least 8 characters.",
                        }))}
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                        className="px-3 text-[#6B6355] hover:text-[#1E1B16] transition-colors flex-shrink-0 flex items-center"
                        tabIndex={-1}
                      >
                        {showPass ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                      </button>
                    </div>
                    <StrengthMeter password={password} />
                    {errors.password && (
                      <p className="text-[9px] text-[#B5432E] mt-1.5" style={M}>{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label
                      htmlFor="su-confirm"
                      className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5"
                      style={M}
                    >
                      Confirm Password
                    </label>
                    <div
                      className={`flex items-center bg-[#F6F1E7] border rounded-[7px] transition-colors ${
                        errors.confirm
                          ? "border-[#B5432E]"
                          : confirm && confirm === password
                          ? "border-[#2E6B4C]/40"
                          : "border-[#DCD4C2] focus-within:border-[#1E1B16]/40"
                      }`}
                    >
                      <input
                        id="su-confirm"
                        type={showConf ? "text" : "password"}
                        value={confirm}
                        onChange={e => { setConfirm(e.target.value); clearErr("confirm"); }}
                        onBlur={() => {
                          if (confirm && confirm !== password) {
                            setErrors(prev => ({ ...prev, confirm: "Passwords do not match." }));
                          }
                        }}
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConf(v => !v)}
                        aria-label={showConf ? "Hide password" : "Show password"}
                        className="px-3 text-[#6B6355] hover:text-[#1E1B16] transition-colors flex-shrink-0 flex items-center"
                        tabIndex={-1}
                      >
                        {showConf ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                      </button>
                    </div>
                    {errors.confirm && (
                      <p className="text-[9px] text-[#B5432E] mt-1.5" style={M}>{errors.confirm}</p>
                    )}
                    {!errors.confirm && confirm && confirm === password && (
                      <p className="text-[9px] text-[#2E6B4C] mt-1.5 flex items-center gap-1" style={M}>
                        <Check size={9} className="text-[#2E6B4C]" /> Passwords match
                      </p>
                    )}
                  </div>

                  {/* Terms checkbox */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div
                        role="checkbox"
                        aria-checked={terms}
                        tabIndex={0}
                        onClick={() => { setTerms(v => !v); clearErr("terms"); }}
                        onKeyDown={e => { if (e.key === " ") { e.preventDefault(); setTerms(v => !v); clearErr("terms"); }}}
                        className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-[3px] border transition-colors cursor-pointer flex items-center justify-center ${
                          terms
                            ? "bg-[#E2A23B] border-[#E2A23B]"
                            : errors.terms
                            ? "border-[#B5432E]"
                            : "border-[#DCD4C2] group-hover:border-[#6B6355]"
                        }`}
                      >
                        {terms && <Check size={9} className="text-[#1E1B16]" strokeWidth={2.5} />}
                      </div>
                      <span className="text-xs text-[#6B6355] leading-relaxed select-none">
                        {"I agree to the "}
                        <button type="button" className="text-[#1E1B16] underline underline-offset-2 hover:text-[#E2A23B] transition-colors">
                          Terms of Service
                        </button>
                        {" and "}
                        <button type="button" className="text-[#1E1B16] underline underline-offset-2 hover:text-[#E2A23B] transition-colors">
                          Privacy Policy
                        </button>
                        .
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-[9px] text-[#B5432E] mt-1.5 ml-7" style={M}>{errors.terms}</p>
                    )}
                  </div>

                  {authErr && (
                    <p className="text-[9px] text-[#B5432E] -mt-1" style={M}>{authErr}</p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={phase === "loading"}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {phase === "loading" ? "Creating account…" : <><span>Create Account</span><ArrowRight size={13} /></>}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-[#DCD4C2]" />
                    <span className="text-[9px] text-[#6B6355] tracking-widest uppercase" style={M}>or</span>
                    <div className="flex-1 border-t border-[#DCD4C2]" />
                  </div>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px] text-sm text-[#1E1B16] hover:border-[#1E1B16]/35 disabled:opacity-60 transition-colors"
                  >
                    {googleLoading ? <RefreshCw size={13} className="animate-spin" /> : <GoogleGlyph />}
                    {googleLoading ? "Redirecting…" : "Sign up with Google"}
                  </button>

                  {googleErr && (
                    <p className="text-[9px] text-[#B5432E] -mt-1" style={M}>{googleErr}</p>
                  )}

                  {/* Login link */}
                  <p className="text-center text-xs text-[#6B6355] pt-0.5">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => onNavigate("admin-login")}
                      className="text-[#1E1B16] font-medium hover:text-[#E2A23B] transition-colors"
                    >
                      Sign in →
                    </button>
                  </p>
                </motion.form>
              )}

            </AnimatePresence>
          </AuthCard>

          <p className="text-center text-[9px] text-[#6B6355] mt-5" style={M}>
            Shared authentication — role is assigned after sign-in.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Forgot Password page ────────────────────────────────────────────────────
export function ForgotPage({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [email, setEmail]       = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [phase, setPhase]       = useState<"request" | "sending" | "sent">("request");
  const [cooldown, setCooldown] = useState(0);
  const [resendErr, setResendErr] = useState("");

  // Decrement countdown one second at a time
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function validateEmail(v: string) {
    if (!v) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    return "";
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const err = validateEmail(email);
    setEmailErr(err);
    if (err) return;

    setPhase("sending");
    const result = await requestPasswordReset(email);

    if (result.status === "error") {
      setEmailErr(result.message);
      setPhase("request");
      return;
    }

    setPhase("sent");
    setCooldown(60);
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setResendErr("");
    const result = await requestPasswordReset(email);
    if (result.status === "error") {
      setResendErr(result.message);
      return;
    }
    setCooldown(60);
  }

  return (
    <div className="bg-[#F6F1E7] min-h-screen flex flex-col" style={dotGrid}>
      <AuthHeader onBack={() => onNavigate("landing")} />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <AuthCard
            eyebrow="Account Recovery"
            title={phase === "request" || phase === "sending" ? "Reset your password." : "Check your email."}
            subtitle={
              phase === "request" || phase === "sending"
                ? "Enter your college email and we'll send a reset link directly to your inbox."
                : undefined
            }
          >
            <AnimatePresence mode="wait">

              {/* ── Request form ── */}
              {(phase === "request" || phase === "sending") && (
                <motion.form
                  key="request"
                  onSubmit={handleSubmit}
                  noValidate
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-7 space-y-5"
                >
                  {/* Email field */}
                  <div>
                    <label
                      htmlFor="fp-email"
                      className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5"
                      style={M}
                    >
                      College Email
                    </label>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      disabled={phase === "sending"}
                      onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr(""); }}
                      onBlur={() => setEmailErr(validateEmail(email))}
                      placeholder="you@university.edu"
                      autoComplete="email"
                      className={`w-full bg-[#F6F1E7] border rounded-[7px] px-3 py-2.5 text-sm text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none transition-colors ${
                        emailErr
                          ? "border-[#B5432E]"
                          : "border-[#DCD4C2] focus:border-[#1E1B16]/40"
                      }`}
                    />
                    {emailErr && (
                      <p className="text-[9px] text-[#B5432E] mt-1.5" style={M}>{emailErr}</p>
                    )}
                  </div>

                  {/* Primary action */}
                  <button
                    type="submit"
                    disabled={phase === "sending"}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {phase === "sending" ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <><span>Send Reset Link</span><ArrowRight size={13} /></>
                    )}
                  </button>

                  {/* Back to login */}
                  <p className="text-center text-xs text-[#6B6355]">
                    <button
                      type="button"
                      onClick={() => onNavigate("admin-login")}
                      className="text-[#1E1B16] font-medium hover:text-[#E2A23B] transition-colors"
                    >
                      ← Back to sign in
                    </button>
                  </p>
                </motion.form>
              )}

              {/* ── Confirmation state ── */}
              {phase === "sent" && (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-9 flex flex-col items-center text-center"
                >
                  <CertificateSeal size={72} rotate={-8} delay={0.15} />

                  <p className="text-sm text-[#6B6355] mt-6 mb-4 leading-relaxed">
                    A reset link is on its way to
                  </p>

                  {/* Email badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F6F1E7] border border-[#DCD4C2] rounded-full mb-7">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C] flex-shrink-0" />
                    <span className="text-[9px] text-[#6B6355] max-w-[250px] truncate" style={M}>
                      {email}
                    </span>
                  </div>

                  {/* Resend section */}
                  <div className="w-full border-t border-[#DCD4C2] pt-5 space-y-3">
                    <p className="text-xs text-[#6B6355]">{"Didn't receive it?"}</p>
                    <button
                      onClick={handleResend}
                      disabled={cooldown > 0}
                      className={`text-xs font-medium transition-colors ${
                        cooldown > 0
                          ? "text-[#DCD4C2] cursor-not-allowed"
                          : "text-[#1E1B16] hover:text-[#E2A23B]"
                      }`}
                    >
                      {cooldown > 0 ? (
                        <span style={M} className="text-[9px]">Resend in {cooldown}s</span>
                      ) : (
                        "Resend email →"
                      )}
                    </button>
                    {resendErr && (
                      <p className="text-[9px] text-[#B5432E]" style={M}>{resendErr}</p>
                    )}
                  </div>

                  {/* Back to login */}
                  <div className="w-full border-t border-[#DCD4C2] mt-5 pt-5">
                    <button
                      onClick={() => onNavigate("admin-login")}
                      className="text-xs text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                    >
                      ← Back to sign in
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </AuthCard>

          {/* Footnote */}
          <p className="text-center text-[9px] text-[#6B6355] mt-5" style={M}>
            {"Check your spam folder if the link doesn't arrive within a minute."}
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── App shell nav items ──────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",      icon: Home     },
  { id: "explore",   label: "Explore Events", icon: Compass  },
  { id: "events",    label: "My Events",      icon: Calendar },
  { id: "scanner",   label: "Attendance",     icon: Scan     },
  { id: "certs",     label: "Certificates",   icon: Award    },
  { id: "notifs",    label: "Notifications",  icon: Bell     },
] as const;

// ─── Shared sidebar state hook ───────────────────────────────────────────────
export function useSidebarState() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    function check() {
      const w = window.innerWidth;
      const mobile = w < 768;
      setIsMobile(mobile);
      if (!mobile && w < 1024) setCollapsed(true);
      if (!mobile) setMobileOpen(false);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function handleMenuToggle() {
    if (window.innerWidth < 768) setMobileOpen(v => !v);
    else setCollapsed(v => !v);
  }

  const sidebarCollapsed = isMobile ? false : collapsed;
  return { isMobile, mobileOpen, setMobileOpen, sidebarCollapsed, handleMenuToggle };
}

// ─── Shared sidebar frame (backdrop + motion.aside + main column) ─────────────
export function SidebarFrame({
  isMobile, mobileOpen, setMobileOpen, sidebarCollapsed, sidebar, children,
}: {
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarCollapsed: boolean;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F6F1E7] overflow-hidden">
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-[#1E1B16]/30"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
      <motion.aside
        animate={
          isMobile
            ? { width: 208, x: mobileOpen ? 0 : -208 }
            : { width: sidebarCollapsed ? 64 : 208, x: 0 }
        }
        initial={false}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`bg-[#FCFAF3] border-r border-[#DCD4C2] flex flex-col overflow-hidden flex-shrink-0 ${
          isMobile ? "fixed inset-y-0 left-0 z-50" : ""
        }`}
      >
        {sidebar}
      </motion.aside>
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {children}
      </div>
    </div>
  );
}

// ─── App shell (reusable layout for all Student screens) ─────────────────────
export function AppShell({
  activeNav,
  notifCount,
  studentName,
  studentId,
  onNav,
  onNavigate,
  topBarLeft,
  isGuest,
  children,
}: {
  activeNav: string;
  notifCount: number;
  studentName: string;
  studentId: string;
  onNav?: (id: string) => void;
  onNavigate?: (s: Screen) => void;
  topBarLeft?: React.ReactNode;
  isGuest?: boolean;
  children: React.ReactNode;
}) {
  const firstName = studentName.split(" ")[0];
  const initials  = studentName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const { isMobile, mobileOpen, setMobileOpen, sidebarCollapsed, handleMenuToggle } = useSidebarState();
  const [avatarMenuOpen,  setAvatarMenuOpen]  = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);

  return (
    <SidebarFrame isMobile={isMobile} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} sidebarCollapsed={sidebarCollapsed}
      sidebar={<>
        {/* Logo + toggle */}
        <div className={`h-14 border-b border-[#DCD4C2] flex-shrink-0 flex items-center ${sidebarCollapsed ? "justify-center px-3" : "px-3 gap-2"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookMarked size={15} className="text-[#E2A23B] flex-shrink-0" strokeWidth={1.75} />
              <span className="text-base font-semibold text-[#1E1B16] tracking-tight whitespace-nowrap" style={F}>Fieldbook</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleMenuToggle}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors flex-shrink-0"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <Menu size={14} strokeWidth={1.75} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id;
            const hasBadge = id === "notifs" && notifCount > 0;
            return (
              <div key={id} className="relative group">
                <button
                  onClick={() => { onNav?.(id); if (isMobile) setMobileOpen(false); }}
                  className={`w-full flex items-center rounded-[6px] text-sm transition-colors ${
                    sidebarCollapsed ? "justify-center py-2" : "gap-3 px-3 py-2 text-left"
                  } ${active ? "bg-[#1E1B16] text-[#F6F1E7]" : "text-[#6B6355] hover:bg-[#F6F1E7] hover:text-[#1E1B16]"}`}
                >
                  <div className="relative flex-shrink-0">
                    <Icon size={14} strokeWidth={1.5}
                      style={{ color: active ? "#E2A23B" : undefined }} />
                    {sidebarCollapsed && hasBadge && (
                      <span className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-[#E2A23B]" />
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{label}</span>
                      {hasBadge && (
                        <span className="w-[18px] h-[18px] rounded-full bg-[#E2A23B] text-[#1E1B16] text-[8px] font-semibold flex items-center justify-center flex-shrink-0" style={M}>
                          {notifCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
                {sidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[5px] px-2.5 py-1.5 whitespace-nowrap"
                      style={{ boxShadow: "0 2px 8px rgba(30,27,22,0.10)" }}>
                      <span className="text-[11px] text-[#1E1B16]"
                        style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>{label}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Student profile with dropdown */}
        <div className="relative border-t border-[#DCD4C2] p-3 flex-shrink-0">
          <button
            type="button"
            aria-label="Profile menu"
            onClick={() => setSidebarMenuOpen(v => !v)}
            className={`w-full flex items-center rounded-[6px] hover:bg-[#EDE7DA] transition-colors p-1 ${sidebarCollapsed ? "justify-center" : "gap-3"}`}
          >
            <div className="w-8 h-8 rounded-full bg-[#DCD4C2] border border-[#1E1B16]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-semibold text-[#1E1B16]">{initials}</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 text-left">
                <div className="text-xs font-medium text-[#1E1B16] truncate">{studentName}</div>
                <div className="text-[9px] text-[#6B6355] truncate" style={M}>{studentId}</div>
              </div>
            )}
          </button>

          {/* Backdrop */}
          <AnimatePresence>
            {sidebarMenuOpen && (
              <motion.div key="sb-profile-bd" className="fixed inset-0 z-40"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }} onClick={() => setSidebarMenuOpen(false)} />
            )}
          </AnimatePresence>

          {/* Dropdown — opens upward */}
          <AnimatePresence>
            {sidebarMenuOpen && (
              <motion.div key="sb-profile-menu"
                className="absolute left-2 right-2 bottom-[calc(100%+4px)] z-50 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
                style={{ boxShadow: "0 4px 20px rgba(30,27,22,0.10)" }}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}>
                <div className="px-4 py-3 border-b border-[#DCD4C2]">
                  <div className="text-[12px] font-semibold text-[#1E1B16] truncate"
                    style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>{studentName}</div>
                  <div className="text-[9px] mt-[1px] truncate" style={{ ...M, color: "#6B6355" }}>{studentId}</div>
                </div>
                <div className="py-1">
                  {([
                    { label: "My Profile", icon: User,   action: () => { setSidebarMenuOpen(false); onNavigate?.("profile"); }, danger: false },
                    { label: "Log Out",    icon: LogOut, action: () => { setSidebarMenuOpen(false); void signOutUser(); onNavigate?.("landing"); }, danger: true  },
                  ] as const).map(row => (
                    <button key={row.label} type="button" onClick={row.action}
                      className={`w-full flex items-center gap-3 px-4 py-[9px] text-[12px] text-left transition-colors ${
                        row.danger ? "text-[#B5432E] hover:bg-[#F6F1E7]" : "text-[#1E1B16] hover:bg-[#F6F1E7]"
                      }`}
                      style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                      <row.icon size={13} strokeWidth={1.5} className="flex-shrink-0" />
                      {row.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>}>
      {/* ── Top bar ── */}
      <header className="h-14 flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileOpen(v => !v)}
                aria-label="Open navigation menu"
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-[6px] text-[#1E1B16] hover:bg-[#EDE7DA] transition-colors">
                <Menu size={14} strokeWidth={1.75} />
              </button>
            )}
            {topBarLeft ?? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#6B6355]">Welcome back,</span>
                <span className="text-sm font-semibold text-[#1E1B16]" style={F}>{firstName}.</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {isGuest && (
              <div className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full border border-[#DCD4C2] flex-shrink-0"
                style={{ background:"rgba(107,99,85,0.08)" }}>
                <Eye size={10} strokeWidth={1.75} style={{ color:"#6B6355" }} />
                <span className="text-[9px] font-medium tracking-wide" style={{ ...M, color:"#6B6355" }}>Viewing as Guest</span>
              </div>
            )}
            <button className="relative p-1" aria-label="Notifications">
              <Bell size={15} strokeWidth={1.5} className="text-[#6B6355]" />
              {notifCount > 0 && (
                <span className="absolute top-0 right-0 w-[7px] h-[7px] rounded-full bg-[#E2A23B] border border-[#F6F1E7]" />
              )}
            </button>
              <div className="relative flex-shrink-0">
                <button type="button" aria-label="Profile menu"
                  onClick={() => setAvatarMenuOpen(v => !v)}
                  className="w-8 h-8 rounded-full bg-[#DCD4C2] border border-[#1E1B16]/10 flex items-center justify-center transition-opacity hover:opacity-80">
                  <span className="text-[10px] font-semibold text-[#1E1B16]">{initials}</span>
                </button>
                <AnimatePresence>
                  {avatarMenuOpen && (
                    <motion.div key="bd-stu" className="fixed inset-0 z-40"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }} onClick={() => setAvatarMenuOpen(false)} />
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {avatarMenuOpen && (
                    <motion.div key="stu-menu"
                      className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
                      style={{ boxShadow: "0 4px 20px rgba(30,27,22,0.10)" }}
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}>
                      <div className="px-4 py-3 border-b border-[#DCD4C2]">
                        <div className="text-[12px] font-semibold text-[#1E1B16] truncate"
                          style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>{studentName}</div>
                        <div className="text-[9px] mt-[1px] truncate" style={{ ...M, color: "#6B6355" }}>{studentId}</div>
                      </div>
                      <div className="py-1">
                        {[
                          { label: "My Profile", icon: User,   action: () => { setAvatarMenuOpen(false); onNavigate?.("profile"); }, danger: false },
                          { label: "Log Out",    icon: LogOut, action: () => { setAvatarMenuOpen(false); void signOutUser(); onNavigate?.("landing"); }, danger: true  },
                        ].map(row => (
                          <button key={row.label} type="button" onClick={row.action}
                            className={`w-full flex items-center gap-3 px-4 py-[9px] text-[12px] text-left transition-colors ${
                              row.danger ? "text-[#B5432E] hover:bg-[#F6F1E7]" : "text-[#1E1B16] hover:bg-[#F6F1E7]"
                            }`}
                            style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                            <row.icon size={13} strokeWidth={1.5} className="flex-shrink-0" />
                            {row.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </header>

      {/* Page content */}
      {children}
    </SidebarFrame>
  );
}

// ─── Notification group type ─────────────────────────────────────────────────
export type NotifGroup = "today" | "week" | "older";

export const NOTIF_GROUPS: { label: string; key: NotifGroup }[] = [
  { label: "Today",             key: "today" },
  { label: "Earlier this week", key: "week"  },
  { label: "Older",             key: "older" },
];

// ─── Inline Seal ─────────────────────────────────────────────────────────────
export function InlineSeal() {
  const r2 = 17;
  const pts = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r2 - 0.5 : r2 - 3;
    return `${(r2 + Math.cos(a) * rad).toFixed(2)},${(r2 + Math.sin(a) * rad).toFixed(2)}`;
  }).join(" ");
  return (
    <svg width="34" height="34" viewBox="0 0 34 34">
      <polygon points={pts} fill="#E2A23B" />
      <circle cx={r2} cy={r2} r={r2 - 5} fill="#E2A23B" />
      <circle cx={r2} cy={r2} r={r2 - 6.5} fill="none" stroke="#1E1B16" strokeWidth="0.5" />
      <path d={`M${(r2-r2*.22).toFixed(2)},${(r2+r2*.04).toFixed(2)} L${(r2-r2*.03).toFixed(2)},${(r2+r2*.22).toFixed(2)} L${(r2+r2*.26).toFixed(2)},${(r2-r2*.18).toFixed(2)}`}
        stroke="#1E1B16" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
