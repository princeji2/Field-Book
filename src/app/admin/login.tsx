import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookMarked, Eye, EyeOff, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen, CertificateSeal } from "../shared";
import { AdminAppShell, ROLE_CONFIG, type UserRole } from "./shell";
import { ENGAGEMENT_BY_ROLE } from "./analytics";
import { ProfileScreen } from "../profile";
import { signIn, getCurrentUserProfile, roleToScreen, signOutUser, signInWithGoogle, type AuthedProfile } from "../../lib/auth";

// ─── Login Mascots ────────────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

// Body clip region, eye positions, and per-character color tokens
// Colors are scoped exclusively to these mascot SVGs — nowhere else in the app.
const MASCOT_DEFS = [
  { clipR: { x: 2, y: 4, w: 28, h: 26, r: 8  }, lEx: 11, lEy: 16, rEx: 21, rEy: 16,
    body: "#8FBBB3", soft: "#C0DDD9", outline: "#5D8F88" }, // squat cat — dusty teal
  { clipR: { x: 3, y: 2, w: 26, h: 28, r: 13 }, lEx: 11, lEy: 15, rEx: 21, rEy: 15,
    body: "#C4856C", soft: "#DDBDB0", outline: "#9A5D48" }, // tall bunny — warm terracotta
  { clipR: { x: 5, y: 3, w: 22, h: 27, r: 11 }, lEx: 11, lEy: 14, rEx: 21, rEy: 14,
    body: "#859F7E", soft: "#B6C9B2", outline: "#5A7A55" }, // narrow bug — soft moss
] as const;

const PAW_HIDDEN_Y  = 22;
const PAW_EASE      = [0.25, 0, 0.25, 1] as [number, number, number, number];
const PAW_DURATION  = 0.2;

function Mascot({ variant, eyeOffset, coverEyes, reducedMotion }: {
  variant: 0 | 1 | 2;
  eyeOffset: { x: number; y: number };
  coverEyes: boolean;
  reducedMotion: boolean;
}) {
  const rawId = useId();
  const uid   = rawId.replace(/[^a-z0-9]/gi, "");
  const def   = MASCOT_DEFS[variant];
  const { clipR: c, lEx, lEy, rEx, rEy, body, soft, outline } = def;
  const clipId = `mc${uid}`;

  const tx = eyeOffset.x;
  const ty = eyeOffset.y;
  // In reduced-motion + covered state, skip paws and show static arc eyes instead
  const showClosed = coverEyes && reducedMotion;
  const pawY  = coverEyes ? 0 : PAW_HIDDEN_Y;
  const pawTr = reducedMotion
    ? { duration: 0 }
    : { duration: PAW_DURATION, ease: PAW_EASE };

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={c.r} />
        </clipPath>
      </defs>

      {/* Outer features — drawn before the clip group so the body fill covers their bases,
          leaving only the protruding tips (ears / antennae) visible above/beside the body. */}
      {variant === 0 && <>
        {/* Cat ears: pointed triangles above the body top edge (y=4) */}
        <path d="M 5 5 L 4 1 L 10 4 Z"       fill={body} />
        <path d="M 27 5 L 28 1 L 22 4 Z"      fill={body} />
        <path d="M 5.5 4.5 L 5 2 L 8.5 4.5 Z" fill={soft} />
        <path d="M 26.5 4.5 L 27 2 L 23.5 4.5 Z" fill={soft} />
      </>}
      {variant === 1 && <>
        {/* Bunny lop ears: side ovals, bases hidden by body fill, outer nubs visible */}
        <ellipse cx="2"    cy="9" rx="3.5" ry="5.5" fill={body} />
        <ellipse cx="30"   cy="9" rx="3.5" ry="5.5" fill={body} />
        <ellipse cx="1.5"  cy="9" rx="1.8" ry="3.5" fill={soft} />
        <ellipse cx="30.5" cy="9" rx="1.8" ry="3.5" fill={soft} />
      </>}
      {variant === 2 && <>
        {/* Antennae: moss-colored stems, marigold ball tips (the 10% accent for this character) */}
        <line x1="12" y1="5" x2="9"  y2="1" stroke={body} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="5" x2="23" y2="1" stroke={body} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9"  cy="1" r="1.8" fill="#E2A23B" />
        <circle cx="23" cy="1" r="1.8" fill="#E2A23B" />
      </>}

      {/* Clipped body group: fill → belly → nose → cheeks → eyes → paws */}
      <g clipPath={`url(#${clipId})`}>
        {/* 60% body color */}
        <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={c.r} fill={body} />

        {/* 30% belly patch */}
        {variant === 0 && <ellipse cx="16" cy="24"   rx="10"  ry="4.5" fill={soft} />}
        {variant === 1 && <ellipse cx="16" cy="24"   rx="9"   ry="7"   fill={soft} />}
        {variant === 2 && <ellipse cx="16" cy="23"   rx="7.5" ry="6"   fill={soft} />}

        {/* 10% marigold nose — cat and bunny; bug uses antenna tips instead */}
        {variant === 0 && <ellipse cx="16" cy="20"   rx="2"  ry="1.5" fill="#E2A23B" opacity="0.85" />}
        {variant === 1 && <circle  cx="16" cy="18.5" r="1.5"          fill="#E2A23B" opacity="0.85" />}

        {/* Cheek blush — very faint marigold tint, static (doesn't track cursor) */}
        <circle cx={lEx - 2} cy={lEy + 3} r="2.5" fill="#E2A23B" opacity="0.14" />
        <circle cx={rEx + 2} cy={rEy + 3} r="2.5" fill="#E2A23B" opacity="0.14" />

        {showClosed ? (
          // reduced-motion password focus: static closed-eye arcs
          <>
            <path d={`M${lEx-2.5} ${lEy} Q${lEx} ${lEy-3} ${lEx+2.5} ${lEy}`}
              stroke="#1E1B16" strokeWidth="1.25" strokeLinecap="round" fill="none" />
            <path d={`M${rEx-2.5} ${rEy} Q${rEx} ${rEy-3} ${rEx+2.5} ${rEy}`}
              stroke="#1E1B16" strokeWidth="1.25" strokeLinecap="round" fill="none" />
          </>
        ) : (
          // open tracking eyes — big dot with white specular highlight
          <>
            <circle cx={lEx + tx}       cy={lEy + ty}       r="2.5" fill="#1E1B16" />
            <circle cx={lEx + tx + 0.9} cy={lEy + ty - 0.9} r="0.9" fill="white" />
            <circle cx={rEx + tx}       cy={rEy + ty}       r="2.5" fill="#1E1B16" />
            <circle cx={rEx + tx + 0.9} cy={rEy + ty - 0.9} r="0.9" fill="white" />
          </>
        )}

        {/* Paws — suppressed entirely in reduced-motion covered state */}
        {!showClosed && (
          <>
            <motion.g animate={{ y: pawY }} initial={false} transition={pawTr}>
              <rect x={lEx-4} y={lEy-5} width="8" height="9" rx="3.5"
                fill={body} stroke={outline} strokeWidth="1" />
            </motion.g>
            <motion.g animate={{ y: pawY }} initial={false} transition={pawTr}>
              <rect x={rEx-4} y={rEy-5} width="8" height="9" rx="3.5"
                fill={body} stroke={outline} strokeWidth="1" />
            </motion.g>
          </>
        )}
      </g>

      {/* Body outline — drawn last so it sits on top of paws */}
      <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={c.r}
        fill="none" stroke={outline} strokeWidth="1.25" />
    </svg>
  );
}

function MascotTrio({ passwordFocused }: { passwordFocused: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [off, setOff]  = useState({ x: 0, y: 0 });
  const rm = usePrefersReducedMotion();

  useEffect(() => {
    if (rm) return;
    function onMove(e: MouseEvent) {
      if (!containerRef.current) return;
      const r   = containerRef.current.getBoundingClientRect();
      const dx  = e.clientX - (r.left + r.width  / 2);
      const dy  = e.clientY - (r.top  + r.height / 2);
      const d   = Math.hypot(dx, dy) || 1;
      const str = Math.min(d / 80, 1);
      const MAX = 2.5;
      setOff({ x: (dx / d) * str * MAX, y: (dy / d) * str * MAX });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [rm]);

  // Snap eyes back to neutral the moment password field is focused
  useEffect(() => { if (passwordFocused) setOff({ x: 0, y: 0 }); }, [passwordFocused]);

  const eyeOffset = passwordFocused ? { x: 0, y: 0 } : off;

  return (
    <div ref={containerRef} className="flex items-end justify-center gap-3" aria-hidden="true">
      {([0, 1, 2] as const).map(v => (
        <Mascot key={v} variant={v}
          eyeOffset={eyeOffset}
          coverEyes={passwordFocused}
          reducedMotion={rm}
        />
      ))}
    </div>
  );
}

// ─── Admin Login ─────────────────────────────────────────────────────────────

export function AdminLoginScreen({ onNavigate, onGuestLogin, onAuthenticated }: { onNavigate: (s: Screen) => void; onGuestLogin?: () => void; onAuthenticated?: (p: AuthedProfile) => void }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passErr,  setPassErr]  = useState("");
  const [authErr,  setAuthErr]  = useState("");
  const [googleErr, setGoogleErr] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phase,    setPhase]    = useState<"idle" | "loading" | "success">("idle");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [resolvedScreen, setResolvedScreen] = useState<Screen>("admin-role-confirm");

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => onNavigate(resolvedScreen), 1600);
    return () => clearTimeout(t);
  }, [phase, resolvedScreen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ee = email.trim()    ? (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Enter a valid email address." : "") : "Email is required.";
    const pe = password.trim() ? "" : "Password is required.";
    setEmailErr(ee); setPassErr(pe);
    if (ee || pe) return;

    setAuthErr("");
    setPhase("loading");

    const { error } = await signIn(email, password);
    if (error) {
      setAuthErr(error.message);
      setPhase("idle");
      return;
    }

    const profile = await getCurrentUserProfile();
    if (!profile) {
      setAuthErr("We couldn't find an account profile for this login. Contact an administrator.");
      setPhase("idle");
      return;
    }

    onAuthenticated?.(profile);
    setResolvedScreen(roleToScreen(profile.role));
    setPhase("success");
  }

  async function handleGoogleSignIn() {
    setGoogleErr("");
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    // Only reachable if the redirect itself failed to start (e.g. the
    // Google provider isn't enabled in the Supabase dashboard yet) — a
    // successful call navigates the browser away before this line runs.
    if (error) {
      setGoogleErr(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center px-6 py-12" style={dotGrid}>
      <motion.div
        className="w-full max-w-[400px]"
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.25, ease:"easeOut" }}>

        <div className="flex items-center justify-center gap-2.5 mb-8">
          <BookMarked size={18} className="text-[#E2A23B]" strokeWidth={1.75} />
          <div className="text-center">
            <div className="text-[1.25rem] font-semibold text-[#1E1B16] tracking-tight leading-tight" style={F}>Fieldbook</div>
            <div className="text-[7px] tracking-[0.16em] uppercase leading-none mt-[2px] text-center"
              style={{ ...M, color:"#9C8E7E" }}>Admin</div>
          </div>
        </div>

        <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden">

          <AnimatePresence mode="wait">

            {phase === "success" && (
              <motion.div key="success"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                transition={{ duration:0.22 }}
                className="px-8 py-10 flex flex-col items-center text-center">
                <CertificateSeal size={72} rotate={-8} delay={0.1} />
                <h2 className="text-[1.2rem] font-semibold text-[#1E1B16] mt-6 mb-1.5" style={F}>
                  Authenticated.
                </h2>
                <p className="text-[12px] text-[#6B6355] mb-5"
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  Authenticated. Select your role…
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F6F1E7] border border-[#DCD4C2] rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C] flex-shrink-0" />
                  <span className="text-[9px] text-[#6B6355] max-w-[240px] truncate" style={M}>{email}</span>
                </div>
              </motion.div>
            )}

            {phase !== "success" && (
              <motion.form key="form" onSubmit={handleSubmit} noValidate
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.22 }}
                className="px-5 sm:px-8 py-7 space-y-5">

                <div className="mb-1">
                  <p className="text-[9px] tracking-widest uppercase mb-1" style={{ ...M, color:"#9C8E7E" }}>
                    Admin Portal
                  </p>
                  <h1 className="text-[1.35rem] font-semibold text-[#1E1B16] leading-[1.2]" style={F}>
                    Sign in to Fieldbook.
                  </h1>
                </div>

                <MascotTrio passwordFocused={isPasswordFocused} />

                <div>
                  <label htmlFor="adm-email"
                    className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5" style={M}>
                    Email Address
                  </label>
                  <input
                    id="adm-email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr(""); }}
                    placeholder="admin@university.edu"
                    className={`w-full px-3 py-[9px] text-[12px] bg-[#F6F1E7] border rounded-[6px] text-[#1E1B16] placeholder:text-[#9C8E7E] focus:outline-none transition-colors ${
                      emailErr ? "border-[#B5432E]" : "border-[#DCD4C2] focus:border-[#1E1B16]/40"
                    }`}
                    style={M}
                  />
                  {emailErr && (
                    <p className="mt-1 text-[10px] text-[#B5432E]"
                      style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{emailErr}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="adm-pass"
                    className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5" style={M}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="adm-pass"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); if (passErr) setPassErr(""); }}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      placeholder="••••••••"
                      className={`w-full pl-3 pr-10 py-[9px] text-[12px] bg-[#F6F1E7] border rounded-[6px] text-[#1E1B16] placeholder:text-[#9C8E7E] focus:outline-none transition-colors ${
                        passErr ? "border-[#B5432E]" : "border-[#DCD4C2] focus:border-[#1E1B16]/40"
                      }`}
                      style={M}
                    />
                    <button type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8E7E] hover:text-[#6B6355] transition-colors">
                      {showPass ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                    </button>
                  </div>
                  {passErr && (
                    <p className="mt-1 text-[10px] text-[#B5432E]"
                      style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{passErr}</p>
                  )}
                </div>

                {authErr && (
                  <p className="text-[10px] text-[#B5432E] -mt-1"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{authErr}</p>
                )}

                <button type="submit"
                  disabled={phase === "loading"}
                  className="w-full flex items-center justify-center gap-2 py-[10px] rounded-[6px] text-[12px] font-semibold bg-[#1E1B16] text-[#F6F1E7] hover:bg-[#2E2A24] disabled:opacity-60 transition-colors"
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  {phase === "loading" ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Signing in…
                    </>
                  ) : "Sign In"}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#DCD4C2]" />
                  <span className="text-[9px] tracking-[0.12em] uppercase flex-shrink-0"
                    style={{ ...M, color:"#9C8E7E" }}>or</span>
                  <div className="flex-1 h-px bg-[#DCD4C2]" />
                </div>

                <button type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-[10px] rounded-[6px] text-[12px] border border-[#DCD4C2] bg-[#FCFAF3] text-[#1E1B16] hover:bg-[#F6F1E7] disabled:opacity-60 transition-colors"
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  {googleLoading ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
                      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                  )}
                  {googleLoading ? "Redirecting…" : "Continue with Google"}
                </button>

                {googleErr && (
                  <p className="text-[10px] text-[#B5432E] -mt-1"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{googleErr}</p>
                )}

                <button type="button"
                  onClick={onGuestLogin}
                  className="w-full flex items-center justify-center gap-2 py-[9px] rounded-[6px] text-[12px] border border-[#DCD4C2] text-[#6B6355] hover:border-[#9C8E7E] hover:text-[#1E1B16] transition-colors"
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  <Eye size={12} strokeWidth={1.5} />
                  Continue as Guest (View Only)
                </button>

                <div className="text-center pt-1 space-y-2">
                  <button type="button"
                    onClick={() => onNavigate("forgot")}
                    className="block mx-auto text-[11px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif",
                      borderBottom:"1px solid rgba(107,99,85,0.35)", paddingBottom:"1px" }}>
                    Forgot password?
                  </button>
                  <button type="button"
                    onClick={() => onNavigate("signup")}
                    className="block mx-auto text-[11px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif",
                      borderBottom:"1px solid rgba(107,99,85,0.35)", paddingBottom:"1px" }}>
                    Don't have an account? Create one
                  </button>
                </div>

              </motion.form>
            )}

          </AnimatePresence>
        </div>

        <div className="text-center mt-5">
          <button type="button" onClick={() => onNavigate("admin-role-confirm")}
            className="flex items-center gap-1.5 mx-auto text-[10px] text-[#9C8E7E] hover:text-[#6B6355] transition-colors"
            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
            <ArrowLeft size={10} strokeWidth={1.75} />
            Change role
          </button>
        </div>

      </motion.div>
    </div>
  );
}

// ─── Role Confirmation ────────────────────────────────────────────────────────

type RoleOption = {
  role: "Admin" | "Organizer" | "Student";
  caption: string;
  available: boolean;
  destination: Screen;
};

const DEMO_ROLE_OPTIONS: RoleOption[] = [
  { role:"Admin",     caption:"Full platform access",   available:true,  destination:"admin-dashboard" },
  { role:"Organizer", caption:"Manage your events",     available:true,  destination:"org-dashboard"   },
  { role:"Student",   caption:"View and register",      available:true,  destination:"dashboard"        },
];

export function AdminRoleConfirmScreen({
  onNavigate,
  onRoleSelect,
  onGuestLogin,
  profile,
}: {
  onNavigate: (s: Screen) => void;
  onRoleSelect?: (role: "admin" | "org" | "student") => void;
  onGuestLogin?: () => void;
  profile?: AuthedProfile | null;
}) {
  const accountName = profile?.fullName ?? "Dr. Helena Marsh";
  const roles = DEMO_ROLE_OPTIONS;
  // Re-declared (previously dropped in a refactor, leaving `singleRole` an
  // undefined reference below — see the layout `style` on each role card).
  // roles.length is always 3 today so this evaluates to false and changes
  // no visible behavior; it just stops the component from throwing if
  // rendered at all, regardless of entry path.
  const availableRoles = roles.filter(r => r.available);
  const singleRole = availableRoles.length === 1;

  const [selected,  setSelected]  = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const [ruleKey, setRuleKey] = useState(0);

  function triggerConfirm(opt: RoleOption) {
    if (exiting) return;
    setSelected(opt.role);
    setRuleKey(k => k + 1);
    const roleKey = opt.role === "Admin" ? "admin" : opt.role === "Organizer" ? "org" : "student";
    onRoleSelect?.(roleKey);
    setTimeout(() => setExiting(true), 500);
    setTimeout(() => onNavigate(opt.destination), 760);
  }

  function handleSelect(opt: RoleOption) {
    if (!opt.available || exiting) return;
    triggerConfirm(opt);
  }

  return (
    <motion.div
      className="min-h-screen bg-[#F6F1E7] flex items-center justify-center px-6 py-12"
      style={dotGrid}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: exiting ? 0 : 1, y: exiting ? -8 : 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="w-full max-w-[580px]">

        <div className="flex items-center justify-center gap-2.5 mb-6">
          <BookMarked size={18} className="text-[#E2A23B]" strokeWidth={1.75} />
          <div className="text-center">
            <div className="text-[1.25rem] font-semibold text-[#1E1B16] tracking-tight leading-tight" style={F}>
              Fieldbook
            </div>
            <div className="text-[7px] tracking-[0.16em] uppercase leading-none mt-[2px]"
              style={{ ...M, color:"#9C8E7E" }}>Admin</div>
          </div>
        </div>

        <div className="text-center mb-5">
          <p className="text-[9px] tracking-widest uppercase mb-[6px]" style={{ ...M, color:"#9C8E7E" }}>
            Signing in as
          </p>
          <p className="text-[1.15rem] font-semibold text-[#1E1B16] leading-tight" style={F}>
            {accountName}
          </p>
        </div>

        <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden">
          <div className="px-6 pt-5 pb-6">

            <p className="text-[9px] tracking-widest uppercase mb-4" style={{ ...M, color:"#9C8E7E" }}>
              Select a role to continue
            </p>

            <div className={`flex gap-4 flex-col sm:flex-row`}>
              {roles.map((opt, cardIdx) => {
                const c           = ROLE_CONFIG[opt.role as UserRole];
                const isSelected  = selected === opt.role;
                const isOther     = selected !== null && !isSelected;
                const canInteract = opt.available && !exiting;

                return (
                  <motion.div
                    key={opt.role}
                    style={{ flex: singleRole ? "0 0 244px" : "1 1 0" }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: cardIdx * 0.1 }}
                  >
                    <motion.button
                      type="button"
                      disabled={!canInteract}
                      onClick={() => handleSelect(opt)}
                      className="relative flex flex-col items-start gap-3 px-5 pt-5 pb-7 rounded-[7px] border-[1.5px] text-left overflow-hidden w-full"
                      style={{
                        background: "#FCFAF3",
                        cursor: canInteract ? "pointer" : "default",
                      }}
                      animate={{
                        borderColor: isSelected
                          ? "#E2A23B"
                          : isOther
                            ? "rgba(220,212,194,0.5)"
                            : "#DCD4C2",
                        opacity: isOther ? 0.5 : !opt.available ? 0.4 : 1,
                        scale: isOther ? 0.97 : 1,
                        y: 0,
                        boxShadow: "0 2px 8px rgba(30,27,22,0.06)",
                      }}
                      whileHover={canInteract && !isSelected
                        ? {
                            borderColor: "#E2A23B",
                            y: -4,
                            boxShadow: "0 8px 24px rgba(30,27,22,0.14)",
                          }
                        : {}
                      }
                      transition={{ duration: 0.12, ease: "easeOut" }}
                    >
                      <span
                        className="inline-flex items-center gap-[5px] px-2.5 py-[4px] rounded-full text-[9px] font-semibold tracking-[0.07em] uppercase"
                        style={{
                          ...M,
                          background: isSelected ? `${c.dot}28` : c.bg,
                          border:     `1px solid ${isSelected ? c.dot : c.border}`,
                          color:      c.text,
                          transition: "background 120ms ease, border-color 120ms ease",
                        }}
                      >
                        <span
                          className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                          style={{
                            background: c.dot,
                            opacity: isSelected ? 1 : 0.65,
                            transition: "opacity 120ms ease",
                          }}
                        />
                        {opt.role}
                      </span>

                      <p className="text-[1.15rem] font-semibold text-[#1E1B16] leading-tight -mt-0.5" style={F}>
                        {opt.role}
                      </p>

                      <p
                        className="text-[11px] leading-snug -mt-1"
                        style={{ fontFamily: "'Public Sans', system-ui, sans-serif", color: opt.available ? "#6B6355" : "#9C8E7E" }}
                      >
                        {opt.caption}
                      </p>

                      {!opt.available && (
                        <span className="absolute top-3 right-3">
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
                            <rect x="1" y="5" width="8" height="7" rx="1.5"
                              stroke="#9C8E7E" strokeWidth="1" />
                            <path d="M3 5V3.5a2 2 0 0 1 4 0V5"
                              stroke="#9C8E7E" strokeWidth="1" strokeLinecap="round" />
                          </svg>
                        </span>
                      )}

                      {isSelected && (
                        <motion.div
                          key={ruleKey}
                          className="absolute bottom-0 left-0 h-[2px]"
                          style={{ background: "#E2A23B" }}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </div>

        {!exiting && (
          <motion.div
            className="text-center mt-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}>
            <button type="button" onClick={() => onNavigate("admin-login")}
              className="inline-flex items-center gap-1.5 text-[10px] text-[#9C8E7E] hover:text-[#6B6355] transition-colors"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              <ArrowLeft size={10} strokeWidth={1.75} />
              Back to sign-in
            </button>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}

// ─── Admin profile screen wrapper ─────────────────────────────────────────────
export function AdminProfileScreen({ onNavigate, isGuest, profile }: { onNavigate: (s: Screen) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  return (
    <AdminAppShell
      activeNav=""
      adminName={profile?.fullName ?? "Dr. Helena Marsh"}
      adminRole="Platform Administrator"
      pendingApprovals={0}
      notifCount={0}
      isGuest={isGuest}
      onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
      onNav={id => {
        if (id === "admin-dashboard")  { onNavigate("admin-dashboard");  return; }
        if (id === "admin-approvals")  { onNavigate("admin-approvals");  return; }
        if (id === "admin-users")      { onNavigate("admin-users");      return; }
        if (id === "admin-templates")  { onNavigate("admin-templates");  return; }
        if (id === "admin-analytics")  { onNavigate("admin-analytics");  return; }
        if (id === "admin-settings")   { onNavigate("admin-settings");   return; }
        if (id === "admin-notifs")     { onNavigate("admin-notifs");     return; }
      }}
    >
      <ProfileScreen
        role="Admin"
        userId={profile?.id}
        name={profile?.fullName ?? "Dr. Helena Marsh"}
        email={profile?.email ?? "h.marsh@fieldbook.edu"}
        phone=""
        bio=""
        avatarUrl={profile?.avatarUrl}
        accountId="ADM-0001"
        joinedDate="Aug 12, 2024"
        stats={[
          { label: "Approvals Reviewed", value: 31 },
          { label: "Sessions",           value: ENGAGEMENT_BY_ROLE.find(r => r.role === "Admin")!.sessions },
        ]}
        onBack={() => onNavigate("admin-dashboard")}
      />
    </AdminAppShell>
  );
}
