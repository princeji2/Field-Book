import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, ArrowRight, RefreshCw, XCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { AuthHeader, AuthCard, StrengthMeter, M, dotGrid, CertificateSeal } from "../shared";
import { hasActiveSession, updatePassword, signOutUser } from "../../lib/auth";

/**
 * "/auth/reset-callback" — where the password-recovery email link (see
 * requestPasswordReset in lib/auth.ts) lands. Same real full-page-load
 * mechanics as AuthCallbackRoute.tsx: this project's PKCE + detectSessionInUrl
 * config (supabaseClient.ts) exchanges the link's ?code=... for a temporary
 * "recovery" session automatically as the Supabase client initializes.
 * supabase.auth.getSession() internally awaits that same exchange promise
 * (see AuthCallbackRoute.tsx's comment on `initializePromise`), so calling
 * hasActiveSession() here reliably reflects whether the link actually
 * worked once it resolves — no manual exchangeCodeForSession() needed.
 *
 * Deliberately self-contained rather than routed through useAuth()/
 * AuthContext: the OAuth callback needs a resolved *role* to route by, this
 * page only needs to know "is there a session at all" before showing the
 * new-password form, and shouldn't perturb AuthContext's profile/guest
 * state for what is otherwise an unauthenticated-feeling flow.
 */
export function ResetCallbackRoute() {
  const [phase, setPhase] = useState<"checking" | "form" | "invalid" | "saving" | "success">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors, setErrors] = useState({ password: "", confirm: "" });
  const [submitErr, setSubmitErr] = useState("");
  const navigate = useNavigate();

  // Confirm the recovery link actually produced a session before showing
  // the form — an expired or already-used link produces none at all.
  useEffect(() => {
    (async () => {
      const active = await hasActiveSession();
      setPhase(active ? "form" : "invalid");
    })();
  }, []);

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => navigate("/login", { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [phase, navigate]);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const next = {
      password: password.length >= 8 ? "" : "Password must be at least 8 characters.",
      confirm: confirm === password ? "" : "Passwords do not match.",
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitErr("");
    setPhase("saving");

    const result = await updatePassword(password);
    if (result.status === "error") {
      setSubmitErr(result.message);
      setPhase("form");
      return;
    }

    // Force a fresh sign-in with the new password rather than leaving the
    // temporary recovery session active — matches the requested "redirect
    // to login" behavior.
    await signOutUser();
    toast.success("Password updated. Please sign in with your new password.");
    setPhase("success");
  }

  const wrapperClass = (err: string) =>
    `flex items-center bg-[#F6F1E7] border rounded-[7px] transition-colors ${
      err ? "border-[#B5432E]" : "border-[#DCD4C2] focus-within:border-[#1E1B16]/40"
    }`;

  return (
    <div className="bg-[#F6F1E7] min-h-screen flex flex-col" style={dotGrid}>
      <AuthHeader onBack={() => navigate("/")} />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <AuthCard
            eyebrow="Account Recovery"
            title={
              phase === "invalid" ? "Link expired." :
              phase === "success" ? "Password updated." :
              "Set a new password."
            }
            subtitle={
              phase === "form" || phase === "saving"
                ? "Choose a new password for your account."
                : undefined
            }
          >
            <AnimatePresence mode="wait">

              {/* ── Verifying the link ── */}
              {phase === "checking" && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-10 flex flex-col items-center text-center"
                >
                  <RefreshCw size={18} className="text-[#6B6355] animate-spin mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-[#6B6355]">Verifying your reset link…</p>
                </motion.div>
              )}

              {/* ── Expired / already-used link ── */}
              {phase === "invalid" && (
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-9 flex flex-col items-center text-center"
                >
                  <div className="w-10 h-10 rounded-[6px] border border-[#DCD4C2] flex items-center justify-center mb-4">
                    <XCircle size={18} strokeWidth={1.5} className="text-[#B5432E]" />
                  </div>
                  <p className="text-sm text-[#6B6355] mb-6 leading-relaxed">
                    This reset link has expired or was already used. Request a new one from the sign-in page.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot")}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors"
                  >
                    Request New Link <ArrowRight size={13} />
                  </button>
                </motion.div>
              )}

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
                  <CertificateSeal size={72} rotate={-8} delay={0.15} />
                  <p className="text-sm text-[#6B6355] mt-6">Redirecting you to sign in…</p>
                </motion.div>
              )}

              {/* ── New password form ── */}
              {(phase === "form" || phase === "saving") && (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  noValidate
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="px-8 py-7 space-y-5"
                >
                  {/* New password */}
                  <div>
                    <label
                      htmlFor="rp-password"
                      className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-1.5"
                      style={M}
                    >
                      New Password
                    </label>
                    <div className={wrapperClass(errors.password)}>
                      <input
                        id="rp-password"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: "" })); }}
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
                      htmlFor="rp-confirm"
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
                        id="rp-confirm"
                        type={showConf ? "text" : "password"}
                        value={confirm}
                        onChange={e => { setConfirm(e.target.value); setErrors(prev => ({ ...prev, confirm: "" })); }}
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

                  {submitErr && (
                    <p className="text-[9px] text-[#B5432E] -mt-1" style={M}>{submitErr}</p>
                  )}

                  <button
                    type="submit"
                    disabled={phase === "saving"}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {phase === "saving" ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <><span>Update Password</span><ArrowRight size={13} /></>
                    )}
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          </AuthCard>
        </div>
      </main>
    </div>
  );
}
