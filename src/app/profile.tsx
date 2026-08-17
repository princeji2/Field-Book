import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { ArrowLeft, Check, Upload, Trash2, RefreshCw, Eye, EyeOff, LogOut, AlertTriangle, UserCog, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen } from "./shared";
import { updateAvatarUrl } from "../lib/auth";
import { uploadToBucket, buildObjectPath } from "../lib/storage";
import {
  getMyRoleChangeRequests, createRoleChangeRequest,
  type RoleChangeRequest,
} from "../lib/roleRequests";
import type { AppRole } from "../lib/auth";

type ProfileRole = "Admin" | "Organizer" | "Student";

// profile.tsx's own Title Case <-> lowercase-DB role mapping — mirrors
// dbRoleToUserRole/userRoleToDbRole in lib/users.ts, but that pair converts
// to admin/shell.tsx's UserRole type specifically; ProfileRole is a
// separate (if identically-valued) type local to this file, so it gets its
// own small mapper rather than importing users.ts's admin-UI-flavored one.
function profileRoleToAppRole(role: ProfileRole): AppRole {
  if (role === "Admin") return "admin";
  if (role === "Organizer") return "organizer";
  return "student";
}

function appRoleToProfileRole(role: AppRole): ProfileRole {
  if (role === "admin") return "Admin";
  if (role === "organizer") return "Organizer";
  return "Student";
}

const REQUESTABLE_ROLES: ProfileRole[] = ["Student", "Organizer", "Admin"];

const ROLE_STYLES: Record<ProfileRole, {
  avatarBg: string; avatarBorder: string; avatarText: string;
  badgeBg: string; badgeBorder: string; badgeText: string; badgeDot: string;
}> = {
  Admin: {
    avatarBg: "rgba(181,67,46,0.12)", avatarBorder: "rgba(181,67,46,0.3)", avatarText: "#B5432E",
    badgeBg: "rgba(181,67,46,0.09)", badgeBorder: "rgba(181,67,46,0.25)", badgeText: "#B5432E", badgeDot: "#B5432E",
  },
  Organizer: {
    avatarBg: "rgba(226,162,59,0.18)", avatarBorder: "rgba(226,162,59,0.4)", avatarText: "#E2A23B",
    badgeBg: "rgba(226,162,59,0.10)", badgeBorder: "rgba(226,162,59,0.3)", badgeText: "#E2A23B", badgeDot: "#E2A23B",
  },
  Student: {
    avatarBg: "rgba(30,27,22,0.08)", avatarBorder: "rgba(30,27,22,0.15)", avatarText: "#6B6355",
    badgeBg: "rgba(30,27,22,0.06)", badgeBorder: "rgba(30,27,22,0.12)", badgeText: "#6B6355", badgeDot: "#6B6355",
  },
};

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#DCD4C2]">
        <div className="text-[13px] font-semibold text-[#1E1B16]" style={F}>{title}</div>
        {subtitle && <div className="text-[10px] mt-0.5" style={{ ...M, color: "#9C8E7E" }}>{subtitle}</div>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-[#1E1B16]"
          style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>{label}</div>
        {hint && <div className="text-[10px] mt-0.5" style={{ ...M, color: "#9C8E7E" }}>{hint}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SettingsToggle({
  checked, onChange, id, label,
}: { checked: boolean; onChange: (v: boolean) => void; id: string; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full border transition-colors flex-shrink-0 ${
        checked ? "bg-[#1E1B16] border-[#1E1B16]" : "bg-[#EDE7DA] border-[#DCD4C2]"
      }`}
    >
      <span className={`absolute top-[3px] w-4 h-4 rounded-full transition-all ${
        checked ? "left-[18px] bg-[#F6F1E7]" : "left-[3px] bg-[#9C8E7E]"
      }`} />
    </button>
  );
}

// ─── Role change request status pill ────────────────────────────────────────
function RequestStatusPill({ status }: { status: RoleChangeRequest["status"] }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
        style={{ ...M, background:"rgba(226,162,59,0.12)", border:"1px solid rgba(226,162,59,0.3)", color:"#8A5C00" }}>
        <Clock size={8} strokeWidth={2} /> Pending
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
        style={{ ...M, background:"rgba(46,107,76,0.10)", border:"1px solid rgba(46,107,76,0.3)", color:"#2E6B4C" }}>
        <Check size={8} strokeWidth={2.5} /> Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
      style={{ ...M, background:"rgba(181,67,46,0.10)", border:"1px solid rgba(181,67,46,0.28)", color:"#B5432E" }}>
      <XCircle size={8} strokeWidth={1.75} /> Rejected
    </span>
  );
}

function ProfileRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div>
        <div className="text-[12px] font-medium text-[#1E1B16]"
          style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>{label}</div>
        {hint && <div className="text-[10px] mt-0.5" style={{ ...M, color: "#9C8E7E" }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

type StatItem = { label: string; value: string | number };

export function ProfileScreen({
  role,
  userId,
  name: initialName,
  email: initialEmail,
  phone: initialPhone = "",
  bio: initialBio = "",
  avatarUrl: initialAvatarUrl = null,
  accountId,
  joinedDate,
  stats,
  onBack,
  isGuest,
}: {
  role: ProfileRole;
  /** Real profiles.id (UUID) for the signed-in user. Undefined for guest sessions — avatar upload is disabled via isGuest in that case anyway. */
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  /** Current avatar public URL from profiles.avatar_url, if any. */
  avatarUrl?: string | null;
  accountId: string;
  joinedDate: string;
  stats?: StatItem[];
  onBack: () => void;
  isGuest?: boolean;
}) {
  // Notification preferences and name/email/phone/bio edits are still
  // local-only (no notifications table / profile-fields update wired up
  // yet) — only the avatar is backed by real Supabase Storage + the
  // profiles.avatar_url column now, per the file-storage migration step.
  const [_p] = useState<{
    name?: string; email?: string; phone?: string; bio?: string;
    notifCerts?: boolean; notifEvents?: boolean; notifDigest?: boolean; notifPush?: boolean;
  }>(() => {
    try {
      const raw = localStorage.getItem(`fieldbook-profile-${role}`);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const [name, setName]     = useState(_p.name     ?? initialName);
  const [email, setEmail]   = useState(_p.email    ?? initialEmail);
  const [phone, setPhone]   = useState(_p.phone    ?? initialPhone);
  const [bio, setBio]       = useState(_p.bio      ?? initialBio);
  const [notifCerts,  setNotifCerts]  = useState(_p.notifCerts  ?? true);
  const [notifEvents, setNotifEvents] = useState(_p.notifEvents ?? true);
  const [notifDigest, setNotifDigest] = useState(_p.notifDigest ?? true);
  const [notifPush,   setNotifPush]   = useState(_p.notifPush   ?? true);

  const [currentPass,     setCurrentPass]     = useState("");
  const [newPass,         setNewPass]         = useState("");
  const [confirmPass,     setConfirmPass]     = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass,     setShowNewPass]     = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [currentPassErr,  setCurrentPassErr]  = useState("");
  const [newPassErr,      setNewPassErr]      = useState("");
  const [confirmPassErr,  setConfirmPassErr]  = useState("");
  const [pwSaving,        setPwSaving]        = useState(false);

  const [showDeactivate, setShowDeactivate] = useState(false);

  // ── Role change requests ──
  const [roleRequests, setRoleRequests] = useState<RoleChangeRequest[]>([]);
  const [roleRequestsLoading, setRoleRequestsLoading] = useState(!isGuest);
  const [roleRequestsError, setRoleRequestsError] = useState<string | null>(null);
  const [requestedRole, setRequestedRole] = useState<ProfileRole | null>(null);
  const [requestReason, setRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSubmitError, setRequestSubmitError] = useState<string | null>(null);

  const fetchRoleRequests = useCallback(async () => {
    setRoleRequestsLoading(true);
    setRoleRequestsError(null);
    const result = await getMyRoleChangeRequests();
    if (result.status === "error") {
      setRoleRequestsError(result.message);
      setRoleRequestsLoading(false);
      return;
    }
    setRoleRequests(result.requests);
    setRoleRequestsLoading(false);
  }, []);

  useEffect(() => {
    // Guest sessions have no real Supabase row to request a change against
    // — same isGuest short-circuit every other real-data fetch in this app
    // uses (see UsersScreen/RoleRequestsScreen).
    if (isGuest || !userId) { setRoleRequestsLoading(false); return; }
    void fetchRoleRequests();
  }, [isGuest, userId, fetchRoleRequests]);

  const pendingRoleRequest = roleRequests.find(r => r.status === "pending") ?? null;

  async function handleSubmitRoleRequest() {
    if (!userId || !requestedRole) return;
    setRequestSubmitError(null);
    setSubmittingRequest(true);

    const result = await createRoleChangeRequest({
      userId,
      currentRole: profileRoleToAppRole(role),
      requestedRole: profileRoleToAppRole(requestedRole),
      reason: requestReason,
    });

    setSubmittingRequest(false);

    if (result.status === "error") {
      setRequestSubmitError(result.message);
      return;
    }

    setRoleRequests(prev => [result.request, ...prev]);
    setRequestedRole(null);
    setRequestReason("");
    toast.success("Role change request submitted");
  }

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [isDirty, setIsDirty]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rs = ROLE_STYLES[role];
  const initials = name.split(" ").filter(Boolean).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  function markDirty() { setIsDirty(true); }

  function handleDiscard() {
    setName(initialName);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setBio(initialBio);
    setNotifCerts(true); setNotifEvents(true);
    setNotifDigest(true); setNotifPush(true);
    setIsDirty(false);
  }

  async function handleSave() {
    setSaving(true);
    // Name/email/phone/bio/notification prefs remain local-only for now.
    const snapshot = { name, email, phone, bio, notifCerts, notifEvents, notifDigest, notifPush };
    try { localStorage.setItem(`fieldbook-profile-${role}`, JSON.stringify(snapshot)); } catch {}

    // avatarUrl is the one real field here — persist it to profiles.avatar_url
    // so it survives a refresh/re-login instead of only living in this
    // session's state.
    if (userId) {
      const result = await updateAvatarUrl(userId, avatarUrl);
      if (result.status === "error") {
        setSaving(false);
        toast.error("Couldn't save profile photo", { description: result.message });
        return;
      }
    }

    setSaving(false);
    setIsDirty(false);
    toast.success("Profile updated");
  }

  function handleUpdatePassword() {
    const ce = currentPass.trim() ? "" : "Current password is required.";
    const ne = newPass.trim()
      ? newPass.length < 8 ? "Password must be at least 8 characters." : ""
      : "New password is required.";
    const fe = confirmPass.trim()
      ? confirmPass !== newPass ? "Passwords do not match." : ""
      : "Please confirm your new password.";
    setCurrentPassErr(ce); setNewPassErr(ne); setConfirmPassErr(fe);
    if (ce || ne || fe) return;
    setPwSaving(true);
    setTimeout(() => {
      setPwSaving(false);
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      toast.success("Password updated");
    }, 700);
  }

  function handleLogOutAll() {
    toast.success("Signed out of all other devices");
  }

  async function processAvatarFile(file: File) {
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image exceeds 5 MB."); return; }
    if (!file.type.startsWith("image/")) { setUploadError("Only image files are accepted."); return; }

    if (!userId) {
      // Guest session — isGuest already disables the upload zone via the
      // disabled state below, but guard here too in case this is ever
      // called without that check.
      setUploadError("Sign in to upload a profile photo.");
      return;
    }

    setIsUploadingAvatar(true);
    const path = buildObjectPath(userId, file);
    const result = await uploadToBucket("avatars", path, file);
    setIsUploadingAvatar(false);

    if (result.status === "error") {
      setUploadError(result.message);
      return;
    }

    setAvatarUrl(result.publicUrl);
    markDirty();
  }

  const inputCls = "w-full px-3 py-[9px] text-[12px] bg-[#F6F1E7] border border-[#DCD4C2] rounded-[6px] text-[#1E1B16] placeholder:text-[#9C8E7E] focus:outline-none focus:border-[#1E1B16] transition-colors";
  const PS = { fontFamily: "'Public Sans',system-ui,sans-serif" } as React.CSSProperties;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Top bar — breadcrumb + actions */}
      <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] h-14 flex items-center gap-3 px-4 sm:px-8">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
          style={PS}>
          <ArrowLeft size={13} strokeWidth={1.5} /> Back
        </button>
        <span className="text-[#DCD4C2] text-[11px]">/</span>
        <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>My Profile</span>
        <div className="ml-auto flex items-center gap-2">
          <AnimatePresence>
            {isDirty && (
              <motion.button type="button" onClick={handleDiscard}
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
                className="px-3.5 py-[7px] rounded-[6px] text-[12px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#1E1B16]/30 hover:text-[#1E1B16] transition-colors"
                style={PS}>
                Discard
              </motion.button>
            )}
          </AnimatePresence>
          <button type="button" onClick={handleSave} disabled={saving || isGuest}
            title={isGuest ? "Disabled in guest mode" : undefined}
            className="flex items-center gap-2 px-4 py-[7px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60"
            style={{ ...PS, background: "#E2A23B", color: "#1E1B16" }}>
            {saving
              ? <RefreshCw size={12} className="animate-spin" />
              : <Check size={12} strokeWidth={2.5} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-8 space-y-5">

          {/* ── Identity header ── */}
          <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden">
            <div className="px-6 py-6 flex items-center gap-5">
              <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: rs.avatarBg, border: `1.5px solid ${rs.avatarBorder}` }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  : <span className="text-[22px] font-semibold select-none" style={{ color: rs.avatarText }}>{initials}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] tracking-[0.12em] uppercase mb-1.5" style={{ ...M, color: "#9C8E7E" }}>
                  Member since {joinedDate}
                </div>
                <div className="text-[22px] font-semibold text-[#1E1B16] leading-tight truncate" style={F}>{name}</div>
                <span className="inline-flex items-center gap-[5px] px-2.5 py-[4px] mt-2 rounded-full text-[9px] font-semibold tracking-[0.07em] uppercase"
                  style={{ ...M, background: rs.badgeBg, border: `1px solid ${rs.badgeBorder}`, color: rs.badgeText }}>
                  <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: rs.badgeDot }} />
                  {role}
                </span>
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          {stats && stats.length > 0 && (
            <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden grid grid-cols-2 sm:flex sm:divide-x divide-[#DCD4C2]">
              {stats.map(s => (
                <div key={s.label} className="flex-1 min-w-0 px-4 py-4 flex flex-col items-center text-center gap-1 border-b border-[#DCD4C2] sm:border-b-0 [&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
                  <span className="text-[20px] leading-none text-[#1E1B16]" style={M}>
                    {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                  </span>
                  <span className="text-[9px] tracking-[0.09em] uppercase leading-snug"
                    style={{ fontFamily: "'Public Sans',system-ui,sans-serif", color: "#9C8E7E" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Profile photo ── */}
          <SectionCard title="Profile Photo" subtitle="PNG or JPG · max 5 MB">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); if (isUploadingAvatar) return; const f = e.dataTransfer.files[0]; if (f) processAvatarFile(f); }}
              onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
              className="flex items-center gap-4 p-4 rounded-[6px] cursor-pointer transition-colors"
              style={{
                border: `1px dashed ${isDragOver ? "#E2A23B" : "#DCD4C2"}`,
                background: isDragOver ? "rgba(226,162,59,0.04)" : "#F6F1E7",
              }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) processAvatarFile(f); e.target.value = ""; }} />
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: rs.avatarBg, border: `1px solid ${rs.avatarBorder}` }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[13px] font-semibold" style={{ color: rs.avatarText }}>{initials}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#1E1B16]" style={PS}>
                  {isUploadingAvatar ? "Uploading…" : avatarUrl ? "Replace photo" : "Upload a photo"}
                </p>
                <p className="text-[10px] mt-0.5" style={{ ...PS, color: "#9C8E7E" }}>
                  Drag here or click to browse
                </p>
              </div>
              {isUploadingAvatar
                ? <RefreshCw size={14} strokeWidth={1.5} style={{ color: "#DCD4C2" }} className="flex-shrink-0 animate-spin" />
                : <Upload size={14} strokeWidth={1.5} style={{ color: "#DCD4C2" }} className="flex-shrink-0" />}
            </div>
            {uploadError && (
              <p className="text-[11px] mt-1" style={{ ...PS, color: "#B5432E" }}>{uploadError}</p>
            )}
            {avatarUrl && (
              <button type="button"
                onClick={() => { setAvatarUrl(null); markDirty(); }}
                className="flex items-center gap-1.5 text-[11px] transition-opacity hover:opacity-70"
                style={{ ...PS, color: "#B5432E" }}>
                <Trash2 size={11} strokeWidth={1.75} /> Remove photo
              </button>
            )}
          </SectionCard>

          {/* ── Personal information ── */}
          <SectionCard title="Personal Information">
            <ProfileRow label="Full Name">
              <input value={name} onChange={e => { setName(e.target.value); markDirty(); }}
                className={inputCls} placeholder="Full name" style={PS} />
            </ProfileRow>
            <ProfileRow label="Email" hint="Used for notifications and account recovery">
              <input value={email} onChange={e => { setEmail(e.target.value); markDirty(); }}
                type="email" className={inputCls} placeholder="email@example.edu" style={PS} />
            </ProfileRow>
            <ProfileRow label="Phone" hint="Optional">
              <input value={phone} onChange={e => { setPhone(e.target.value); markDirty(); }}
                type="tel" className={inputCls} placeholder="+1 (555) 000-0000" style={PS} />
            </ProfileRow>
            <ProfileRow label="About" hint="A short bio visible to event organisers">
              <textarea value={bio} onChange={e => { setBio(e.target.value); markDirty(); }}
                rows={3} className={`${inputCls} resize-none`}
                placeholder="Tell us a bit about yourself…" style={PS} />
            </ProfileRow>
          </SectionCard>

          {/* ── Notifications ── */}
          <SectionCard title="Notifications" subtitle="Choose which emails and alerts you receive">
            {([
              { id: "notif-certs",   label: "Certificate emails",  hint: "Email when a certificate is issued to you",         checked: notifCerts,  set: setNotifCerts  },
              { id: "notif-events",  label: "Event emails",        hint: "Updates for events you have registered for",         checked: notifEvents, set: setNotifEvents },
              { id: "notif-digest",  label: "Weekly digest",       hint: "A summary of upcoming events every Monday morning",  checked: notifDigest, set: setNotifDigest },
              { id: "notif-push",    label: "Push notifications",  hint: "Browser push for time-sensitive event reminders",    checked: notifPush,   set: setNotifPush   },
            ] as { id: string; label: string; hint: string; checked: boolean; set: (v: boolean) => void }[]).map((row, i, arr) => (
              <React.Fragment key={row.id}>
                <SettingsRow label={row.label} hint={row.hint}>
                  <SettingsToggle
                    id={row.id}
                    label={row.label}
                    checked={row.checked}
                    onChange={v => { row.set(v); markDirty(); }}
                  />
                </SettingsRow>
                {i < arr.length - 1 && <div className="border-t border-[#EDE7DA]" />}
              </React.Fragment>
            ))}
          </SectionCard>

          {/* ── Security ── */}
          <SectionCard title="Security" subtitle="Change your password and manage active sessions">
            {/* Password fields */}
            {(
              [
                { id: "sec-current", label: "Current Password",  value: currentPass,  setValue: setCurrentPass,  err: currentPassErr,  setErr: setCurrentPassErr,  show: showCurrentPass, setShow: setShowCurrentPass  },
                { id: "sec-new",     label: "New Password",      value: newPass,      setValue: setNewPass,      err: newPassErr,      setErr: setNewPassErr,      show: showNewPass,     setShow: setShowNewPass      },
                { id: "sec-confirm", label: "Confirm Password",  value: confirmPass,  setValue: setConfirmPass,  err: confirmPassErr,  setErr: setConfirmPassErr,  show: showConfirmPass, setShow: setShowConfirmPass  },
              ] as {
                id: string; label: string;
                value: string; setValue: (v: string) => void;
                err: string;  setErr:  (v: string) => void;
                show: boolean; setShow: (v: boolean) => void;
              }[]
            ).map(f => (
              <ProfileRow key={f.id} label={f.label}>
                <div className="relative">
                  <input
                    id={f.id}
                    type={f.show ? "text" : "password"}
                    value={f.value}
                    onChange={e => { f.setValue(e.target.value); if (f.err) f.setErr(""); }}
                    placeholder="••••••••"
                    className={`w-full pl-3 pr-10 py-[9px] text-[12px] bg-[#F6F1E7] border rounded-[6px] text-[#1E1B16] placeholder:text-[#9C8E7E] focus:outline-none transition-colors ${
                      f.err ? "border-[#B5432E]" : "border-[#DCD4C2] focus:border-[#1E1B16]/40"
                    }`}
                    style={PS}
                  />
                  <button
                    type="button"
                    onClick={() => f.setShow(!f.show)}
                    aria-label={f.show ? `Hide ${f.label.toLowerCase()}` : `Show ${f.label.toLowerCase()}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8E7E] hover:text-[#6B6355] transition-colors"
                    tabIndex={-1}
                  >
                    {f.show
                      ? <EyeOff size={13} strokeWidth={1.5} />
                      : <Eye    size={13} strokeWidth={1.5} />}
                  </button>
                </div>
                {f.err && (
                  <p className="mt-1 text-[10px] text-[#B5432E]" style={PS}>{f.err}</p>
                )}
              </ProfileRow>
            ))}

            {/* Update Password button */}
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={pwSaving || isGuest}
              title={isGuest ? "Disabled in guest mode" : undefined}
              className="flex items-center gap-2 px-4 py-[8px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60"
              style={{ ...PS, background: "#E2A23B", color: "#1E1B16" }}
            >
              {pwSaving
                ? <RefreshCw size={12} className="animate-spin" />
                : <Check size={12} strokeWidth={2.5} />}
              Update Password
            </button>

            {/* Divider */}
            <div className="border-t border-[#EDE7DA]" />

            {/* Log out of all devices row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div>
                <div className="text-[12px] font-medium text-[#1E1B16]" style={PS}>Log out of all devices</div>
                <div className="text-[10px] mt-0.5" style={{ ...PS, color: "#9C8E7E" }}>
                  Ends all active sessions except this one
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogOutAll}
                disabled={isGuest}
                title={isGuest ? "Disabled in guest mode" : undefined}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-[7px] rounded-[6px] text-[11px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#B5432E]/40 hover:text-[#B5432E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={PS}
              >
                <LogOut size={11} strokeWidth={1.75} />
                Sign out everywhere
              </button>
            </div>
          </SectionCard>

          {/* ── Account identity (read-only) ── */}
          <SectionCard title="Account Identity" subtitle="Read-only · contact support to update these fields">
            <div className="divide-y divide-[#EDE7DA]">
              {[
                { label: "Role",       value: role },
                { label: "Account ID", value: accountId },
                { label: "Joined",     value: joinedDate },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-[11px] font-medium text-[#6B6355]" style={PS}>{label}</span>
                  <span className="text-[11px] text-[#1E1B16]" style={M}>{value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── Role Change Request ── */}
          <SectionCard title="Role Change Request" subtitle="Request a change to your account role — an admin must approve it before it takes effect">
            {roleRequestsLoading && (
              <div className="flex items-center gap-2 py-2">
                <RefreshCw size={13} strokeWidth={1.5} className="text-[#9C8E7E] animate-spin" />
                <span className="text-[11px] text-[#9C8E7E]" style={PS}>Loading your requests…</span>
              </div>
            )}

            {!roleRequestsLoading && roleRequestsError && (
              <div className="space-y-2">
                <p className="text-[11px] text-[#B5432E]" style={PS}>Couldn't load your requests: {roleRequestsError}</p>
                <button type="button" onClick={() => void fetchRoleRequests()}
                  className="flex items-center gap-1.5 px-3 py-[6px] rounded-[6px] text-[11px] font-semibold border border-[#DCD4C2] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors"
                  style={PS}>
                  <RefreshCw size={11} strokeWidth={1.75} /> Retry
                </button>
              </div>
            )}

            {!roleRequestsLoading && !roleRequestsError && (
              <>
                {pendingRoleRequest ? (
                  /* A pending request already exists — block new submissions until it's resolved. */
                  <div className="bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px] p-4 flex items-start gap-3">
                    <UserCog size={14} strokeWidth={1.5} className="text-[#6B6355] flex-shrink-0 mt-[1px]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-medium text-[#1E1B16]" style={PS}>
                          Request to become {pendingRoleRequest.requestedRole === "admin" ? "an" : "a"}{" "}
                          {appRoleToProfileRole(pendingRoleRequest.requestedRole)}
                        </span>
                        <RequestStatusPill status={pendingRoleRequest.status} />
                      </div>
                      <p className="text-[10px]" style={{ ...M, color: "#9C8E7E" }}>
                        Submitted {new Date(pendingRoleRequest.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}awaiting admin review
                      </p>
                    </div>
                  </div>
                ) : (
                  /* No pending request — offer the picker + optional reason. */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>
                        Request to become
                      </label>
                      <div className="flex gap-2">
                        {REQUESTABLE_ROLES.filter(r => r !== role).map(r => {
                          const active = requestedRole === r;
                          return (
                            <button key={r} type="button"
                              onClick={() => { setRequestedRole(r); setRequestSubmitError(null); }}
                              disabled={isGuest}
                              className="flex-1 px-3 py-2.5 text-[12px] font-medium rounded-[7px] border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{
                                ...PS,
                                background: active ? "#E2A23B" : "#F6F1E7",
                                color: active ? "#1E1B16" : "#1E1B16",
                                borderColor: active ? "rgba(30,27,22,0.15)" : "#DCD4C2",
                              }}>
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {requestedRole && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                        <ProfileRow label="Reason" hint="Optional — helps the reviewing admin decide">
                          <textarea
                            value={requestReason}
                            onChange={e => setRequestReason(e.target.value)}
                            rows={2}
                            placeholder="Why are you requesting this change?"
                            className={`${inputCls} resize-none`}
                            style={PS}
                          />
                        </ProfileRow>
                      </motion.div>
                    )}

                    {requestSubmitError && (
                      <p className="text-[10px] text-[#B5432E]" style={M}>{requestSubmitError}</p>
                    )}

                    <button type="button"
                      onClick={handleSubmitRoleRequest}
                      disabled={!requestedRole || submittingRequest || isGuest}
                      title={isGuest ? "Disabled in guest mode" : undefined}
                      className="flex items-center gap-2 px-4 py-[8px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ ...PS, background: "#E2A23B", color: "#1E1B16" }}>
                      {submittingRequest
                        ? <RefreshCw size={12} className="animate-spin" />
                        : <UserCog size={12} strokeWidth={2} />}
                      Submit Request
                    </button>
                  </div>
                )}

                {/* History of past (resolved) requests */}
                {roleRequests.filter(r => r.status !== "pending").length > 0 && (
                  <div className="pt-2 border-t border-[#EDE7DA] space-y-2.5">
                    <div className="text-[9px] tracking-widest uppercase text-[#6B6355] pt-3" style={M}>Request History</div>
                    {roleRequests.filter(r => r.status !== "pending").map(r => (
                      <div key={r.id} className="flex items-start justify-between gap-3 py-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] text-[#1E1B16]" style={PS}>
                              {appRoleToProfileRole(r.currentRole)} → {appRoleToProfileRole(r.requestedRole)}
                            </span>
                            <RequestStatusPill status={r.status} />
                          </div>
                          {r.adminNote && (
                            <p className="text-[10px] text-[#9C8E7E] leading-relaxed" style={PS}>{r.adminNote}</p>
                          )}
                        </div>
                        <span className="text-[9px] text-[#9C8E7E] flex-shrink-0" style={M}>
                          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </SectionCard>

          {/* ── Danger Zone ── */}
          <div className="rounded-[8px] overflow-hidden" style={{ border: "1px solid rgba(181,67,46,0.35)" }}>
            {/* Red header */}
            <div className="px-6 py-4 flex items-center gap-2.5" style={{ background: "rgba(181,67,46,0.06)", borderBottom: "1px solid rgba(181,67,46,0.2)" }}>
              <AlertTriangle size={12} strokeWidth={1.75} style={{ color: "#B5432E", flexShrink: 0 }} />
              <div>
                <div className="text-[13px] font-semibold" style={{ ...F, color: "#B5432E" }}>Danger Zone</div>
                <div className="text-[10px] mt-0.5" style={{ ...M, color: "rgba(181,67,46,0.65)" }}>Irreversible account actions</div>
              </div>
            </div>
            {/* Deactivate row */}
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-[12px] font-medium text-[#1E1B16]" style={PS}>Deactivate Account</div>
                <div className="text-[10px] mt-0.5" style={{ ...PS, color: "#9C8E7E" }}>
                  Permanently disables your account and signs you out everywhere.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivate(true)}
                disabled={isGuest}
                title={isGuest ? "Disabled in guest mode" : undefined}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-[7px] rounded-[6px] text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ ...PS, color: "#B5432E", border: "1px solid rgba(181,67,46,0.4)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(181,67,46,0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(181,67,46,0.65)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(181,67,46,0.4)"; }}
              >
                <AlertTriangle size={11} strokeWidth={1.75} />
                Deactivate
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ── Deactivate confirmation modal ── */}
      <AnimatePresence>
        {showDeactivate && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: "rgba(30,27,22,0.45)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={e => { if (e.target === e.currentTarget) setShowDeactivate(false); }}>
            <motion.div
              className="w-full max-w-[340px] bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}>
              <div className="px-7 pt-7 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(181,67,46,0.10)", border: "1px solid rgba(181,67,46,0.25)" }}>
                    <AlertTriangle size={13} strokeWidth={1.75} style={{ color: "#B5432E" }} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#1E1B16]" style={PS}>
                      Deactivate account?
                    </div>
                    <div className="text-[10px] mt-[2px]" style={{ ...M, color: "#9C8E7E" }}>
                      {initialName} · {accountId}
                    </div>
                  </div>
                </div>
                <p className="text-[12px] leading-[1.55] mb-6" style={{ ...PS, color: "#6B6355" }}>
                  This will immediately disable your account and sign you out of all devices. Your data will be retained for 30 days before permanent deletion. This action cannot be undone.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button type="button" onClick={() => setShowDeactivate(false)}
                    className="px-4 py-[7px] text-[12px] font-medium text-[#6B6355] border border-[#DCD4C2] rounded-[6px] hover:text-[#1E1B16] hover:border-[#9C8E7E] transition-colors"
                    style={PS}>
                    Cancel
                  </button>
                  <button type="button"
                    onClick={() => { setShowDeactivate(false); toast.error("Account deactivated"); }}
                    className="px-4 py-[7px] text-[12px] font-semibold text-[#F6F1E7] rounded-[6px] transition-colors"
                    style={{ ...PS, background: "#B5432E" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#9A3626"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#B5432E"; }}>
                    Deactivate Account
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
