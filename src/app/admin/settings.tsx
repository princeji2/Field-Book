import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Check, AlertTriangle, Settings, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen, InlineSeal } from "../shared";
import { AdminAppShell } from "./shell";

// ─── Admin Settings ──────────────────────────────────────────────────────────

type SettingsState = {
  platformName: string;
  supportEmail: string;
  allowedDomain: string;
  requireApproval: boolean;
  autoApproveVerified: boolean;
  defaultTemplate: string;
  eligibilityThreshold: number;
  notifyOrgOnApproval: boolean;
  notifyOrgOnRejection: boolean;
  notifyAdminNewOrg: boolean;
  notifyAdminNewEvent: boolean;
  weeklyDigest: boolean;
};

const SETTINGS_DEFAULTS: SettingsState = {
  platformName: "Fieldbook",
  supportEmail: "fieldbook@university.edu",
  allowedDomain: "university.edu",
  requireApproval: true,
  autoApproveVerified: false,
  defaultTemplate: "Classic Scroll",
  eligibilityThreshold: 80,
  notifyOrgOnApproval: true,
  notifyOrgOnRejection: true,
  notifyAdminNewOrg: true,
  notifyAdminNewEvent: false,
  weeklyDigest: true,
};

const CERT_TEMPLATES_LIST = ["Classic Scroll", "Clean Academic", "Bold Badge", "Minimal Line"];

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
        checked
          ? "bg-[#1E1B16] border-[#1E1B16]"
          : "bg-[#EDE7DA] border-[#DCD4C2]"
      }`}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full transition-all ${
          checked ? "left-[18px] bg-[#F6F1E7]" : "left-[3px] bg-[#9C8E7E]"
        }`}
      />
    </button>
  );
}

function SettingsInput({
  value, onChange, placeholder, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-[9px] text-[12px] bg-[#F6F1E7] border border-[#DCD4C2] rounded-[6px] text-[#1E1B16] placeholder:text-[#9C8E7E] focus:outline-none focus:border-[#1E1B16] transition-colors"
      style={M}
    />
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#DCD4C2]">
        <div className="text-[13px] font-semibold text-[#1E1B16]" style={F}>{title}</div>
        {subtitle && <div className="text-[10px] mt-0.5" style={{ ...M, color:"#9C8E7E" }}>{subtitle}</div>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-[#1E1B16]"
          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{label}</div>
        {hint && <div className="text-[10px] mt-0.5" style={{ ...M, color:"#9C8E7E" }}>{hint}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export function AdminSettingsScreen({ onNavigate, isGuest }: { onNavigate: (s: Screen) => void; isGuest?: boolean }) {
  const [saved, setSaved] = useState<SettingsState>(() => {
    try {
      const raw = localStorage.getItem("fieldbook-admin-settings");
      if (raw) return JSON.parse(raw) as SettingsState;
    } catch {}
    return { ...SETTINGS_DEFAULTS };
  });
  const [draft, setDraft] = useState<SettingsState>(() => {
    try {
      const raw = localStorage.getItem("fieldbook-admin-settings");
      if (raw) return JSON.parse(raw) as SettingsState;
    } catch {}
    return { ...SETTINGS_DEFAULTS };
  });
  const [saving, setSaving] = useState(false);
  const [sealVisible, setSealVisible] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSealVisible(false);
    const committed = { ...draft };
    setTimeout(() => {
      setSaved(committed);
      try { localStorage.setItem("fieldbook-admin-settings", JSON.stringify(committed)); } catch {}
      setSaving(false);
      setSealVisible(true);
      toast.success("Settings saved");
      setTimeout(() => setSealVisible(false), 3000);
    }, 900);
  }

  function handleDiscard() {
    setDraft({ ...saved });
  }

  const settingsNavHandler = (id: string) => {
    if (id === "profile")          { onNavigate("profile");          return; }
    if (id === "admin-dashboard")  { onNavigate("admin-dashboard");  return; }
    if (id === "admin-approvals")  { onNavigate("admin-approvals");  return; }
    if (id === "admin-users")      { onNavigate("admin-users");      return; }
    if (id === "admin-templates")  { onNavigate("admin-templates");  return; }
    if (id === "admin-analytics")  { onNavigate("admin-analytics");  return; }
    if (id === "admin-notifs")     { onNavigate("admin-notifs");     return; }
    toast(`${id} — coming soon`);
  };

  return (
    <AdminAppShell
      activeNav="admin-settings"
      adminName="Dr. Helena Marsh"
      adminRole="Platform Administrator"
      pendingApprovals={0}
      notifCount={3}
      isGuest={isGuest}
      onLogOut={() => onNavigate("admin-login")}
      onNav={settingsNavHandler}
      topBarLeft={
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Settings</span>
          <span className="text-[#DCD4C2] text-sm">·</span>
          <span className="text-[10px]" style={{ ...M, color:"#9C8E7E" }}>Platform Configuration</span>
        </div>
      }
      topBarActions={
        <div className="flex items-center gap-2">
          {isDirty && (
            <motion.button
              type="button"
              onClick={handleDiscard}
              initial={{ opacity:0, x:6 }} animate={{ opacity:1, x:0 }}
              className="px-3 py-[6px] text-[11px] font-medium text-[#6B6355] hover:text-[#1E1B16] border border-[#DCD4C2] rounded-[6px] transition-colors"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              Discard
            </motion.button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving || isGuest}
            title={isGuest ? "Disabled in guest mode" : undefined}
            className={`flex items-center gap-2 px-4 py-[6px] rounded-[6px] text-[11px] font-semibold transition-all ${
              isDirty && !saving && !isGuest
                ? "bg-[#1E1B16] text-[#F6F1E7] hover:bg-[#2E2A24]"
                : "bg-[#EDE7DA] text-[#9C8E7E] cursor-not-allowed"
            }`}
            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
            {saving ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Saving…
              </>
            ) : sealVisible ? (
              <>
                <InlineSeal size={16} />
                Saved
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7">
          <div className="max-w-[680px] mx-auto space-y-5">

            <AnimatePresence>
              {isDirty && (
                <motion.div
                  initial={{ opacity:0, y:-6, height:0 }} animate={{ opacity:1, y:0, height:"auto" }}
                  exit={{ opacity:0, y:-6, height:0 }}
                  transition={{ duration:0.18 }}
                  className="flex items-center gap-3 px-4 py-3 bg-[#FFF6E0] border border-[#E2A23B] rounded-[7px]">
                  <AlertTriangle size={13} strokeWidth={1.5} className="text-[#E2A23B] flex-shrink-0" />
                  <span className="text-[11px] font-medium text-[#1E1B16]"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                    You have unsaved changes — click Save Changes to apply them.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial={{ opacity:0, y:7 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.22, ease:"easeOut" }}>
              <SectionCard title="General" subtitle="Platform name and contact information">
                <SettingsRow label="Platform Name" hint="Shown in all emails and certificates">
                  <div className="w-full sm:w-52">
                    <SettingsInput value={draft.platformName} onChange={v => set("platformName", v)} placeholder="Fieldbook" />
                  </div>
                </SettingsRow>
                <div className="border-t border-[#EDE7DA]" />
                <SettingsRow label="Support Email" hint="Where students send help requests">
                  <div className="w-full sm:w-52">
                    <SettingsInput value={draft.supportEmail} onChange={v => set("supportEmail", v)} placeholder="admin@university.edu" type="email" />
                  </div>
                </SettingsRow>
              </SectionCard>
            </motion.div>

            <motion.div initial={{ opacity:0, y:7 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.22, ease:"easeOut", delay:0.04 }}>
              <SectionCard title="Access Control" subtitle="Restrict who can register on the platform">
                <SettingsRow
                  label="Allowed Student Email Domain"
                  hint="Only addresses ending in this domain may create student accounts. Leave blank to allow all.">
                  <div className="w-full sm:w-52">
                    <div className="relative">
                      <span className="absolute left-3 top-[9px] text-[11px] pointer-events-none"
                        style={{ ...M, color:"#9C8E7E" }}>@</span>
                      <input
                        type="text"
                        value={draft.allowedDomain}
                        onChange={e => set("allowedDomain", e.target.value)}
                        placeholder="university.edu"
                        className="w-full pl-7 pr-3 py-[9px] text-[12px] bg-[#F6F1E7] border border-[#DCD4C2] rounded-[6px] text-[#1E1B16] placeholder:text-[#9C8E7E] focus:outline-none focus:border-[#1E1B16] transition-colors"
                        style={M}
                      />
                    </div>
                  </div>
                </SettingsRow>
              </SectionCard>
            </motion.div>

            <motion.div initial={{ opacity:0, y:7 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.22, ease:"easeOut", delay:0.08 }}>
              <SectionCard title="Approval Policy" subtitle="Control how organizer event submissions are reviewed">
                <SettingsRow
                  label="Require admin approval before events go live"
                  hint="All submitted events wait in the Approvals queue until reviewed.">
                  <SettingsToggle
                    id="require-approval"
                    label="Require admin approval before events go live"
                    checked={draft.requireApproval}
                    onChange={v => set("requireApproval", v)} />
                </SettingsRow>
                <div className="border-t border-[#EDE7DA]" />
                <SettingsRow
                  label="Auto-approve events from verified organizers"
                  hint="Organizers with Verified status bypass the queue. Only applies when approval is required.">
                  <SettingsToggle
                    id="auto-approve"
                    label="Auto-approve events from verified organizers"
                    checked={draft.autoApproveVerified && draft.requireApproval}
                    onChange={v => set("autoApproveVerified", v)} />
                </SettingsRow>
                {!draft.requireApproval && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1 h-1 rounded-full bg-[#9C8E7E] flex-shrink-0" />
                    <span className="text-[10px]" style={{ ...M, color:"#9C8E7E" }}>
                      Approval policy is off — all submitted events go live immediately.
                    </span>
                  </div>
                )}
              </SectionCard>
            </motion.div>

            <motion.div initial={{ opacity:0, y:7 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.22, ease:"easeOut", delay:0.12 }}>
              <SectionCard title="Certificate Defaults" subtitle="Defaults applied when organizers generate certificates">
                <SettingsRow
                  label="Default Certificate Template"
                  hint="Organizers may override per event.">
                  <div className="relative w-full sm:w-52">
                    <select
                      value={draft.defaultTemplate}
                      onChange={e => set("defaultTemplate", e.target.value)}
                      className="w-full appearance-none px-3 pr-8 py-[9px] text-[12px] bg-[#F6F1E7] border border-[#DCD4C2] rounded-[6px] text-[#1E1B16] focus:outline-none focus:border-[#1E1B16] transition-colors cursor-pointer"
                      style={M}>
                      {CERT_TEMPLATES_LIST.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} strokeWidth={1.5}
                      className="pointer-events-none absolute right-3 top-[10px] text-[#9C8E7E]" />
                  </div>
                </SettingsRow>
                <div className="border-t border-[#EDE7DA]" />
                <SettingsRow
                  label="Eligibility Threshold"
                  hint={`Attendees with check-in rate ≥ ${draft.eligibilityThreshold}% are eligible for a certificate.`}>
                  <div className="flex items-center gap-3 w-full sm:w-52">
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={draft.eligibilityThreshold}
                      onChange={e => set("eligibilityThreshold", Number(e.target.value))}
                      className="flex-1 accent-[#1E1B16] h-[3px] rounded-full cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold w-10 text-right"
                      style={{ ...M, color:"#1E1B16" }}>
                      {draft.eligibilityThreshold}%
                    </span>
                  </div>
                </SettingsRow>
              </SectionCard>
            </motion.div>

            <motion.div initial={{ opacity:0, y:7 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.22, ease:"easeOut", delay:0.16 }}>
              <SectionCard title="Notifications" subtitle="Email notifications sent by the platform">
                {[
                  {
                    key: "notifyOrgOnApproval" as const,
                    label: "Notify organizer when their event is approved",
                    hint: "Sends an approval confirmation email.",
                  },
                  {
                    key: "notifyOrgOnRejection" as const,
                    label: "Notify organizer when their event is rejected",
                    hint: "Includes the rejection reason in the email.",
                  },
                  {
                    key: "notifyAdminNewOrg" as const,
                    label: "Notify admins when a new organizer joins",
                    hint: "Sent when an organizer account is created.",
                  },
                  {
                    key: "notifyAdminNewEvent" as const,
                    label: "Notify admins when a new event is submitted",
                    hint: "Useful if approval queue volume is low.",
                  },
                  {
                    key: "weeklyDigest" as const,
                    label: "Send weekly platform digest to admins",
                    hint: "Signups, events, and certificate summary.",
                  },
                ].map((item, i) => (
                  <div key={item.key}>
                    {i > 0 && <div className="border-t border-[#EDE7DA] my-5" />}
                    <SettingsRow label={item.label} hint={item.hint}>
                      <SettingsToggle
                        id={item.key}
                        label={item.label}
                        checked={draft[item.key] as boolean}
                        onChange={v => set(item.key, v)} />
                    </SettingsRow>
                  </div>
                ))}
              </SectionCard>
            </motion.div>

            <motion.div
              className={`sticky bottom-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-[8px] border transition-all ${
                isDirty
                  ? "bg-[#FCFAF3] border-[#1E1B16] shadow-[0_4px_20px_rgba(30,27,22,0.12)]"
                  : "bg-[#FCFAF3] border-[#DCD4C2]"
              }`}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.25, ease:"easeOut", delay:0.2 }}>

              <div className="flex items-center gap-3">
                <AnimatePresence mode="wait">
                  {sealVisible ? (
                    <motion.div key="seal"
                      initial={{ scale:0.4, opacity:0 }} animate={{ scale:1, opacity:1 }}
                      exit={{ scale:0.4, opacity:0 }}
                      transition={{ type:"spring", stiffness:340, damping:22 }}>
                      <InlineSeal size={28} />
                    </motion.div>
                  ) : (
                    <motion.div key="icon"
                      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                      <Settings size={14} strokeWidth={1.5}
                        className={isDirty ? "text-[#E2A23B]" : "text-[#9C8E7E]"} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <div className="text-[11px] font-medium text-[#1E1B16]"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                    {sealVisible ? "All changes saved" : isDirty ? "You have unsaved changes" : "No pending changes"}
                  </div>
                  <div className="text-[9px]" style={{ ...M, color:"#9C8E7E" }}>
                    {sealVisible ? "Settings are live across the platform." : isDirty ? "Click Save Changes to apply." : "The platform is using the current settings."}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isDirty && (
                  <button type="button" onClick={handleDiscard}
                    className="px-3 py-[6px] text-[11px] font-medium text-[#6B6355] hover:text-[#1E1B16] border border-[#DCD4C2] rounded-[6px] transition-colors"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                    Discard
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty || saving || isGuest}
                  title={isGuest ? "Disabled in guest mode" : undefined}
                  className={`flex items-center gap-2 px-5 py-[7px] rounded-[6px] text-[12px] font-semibold transition-all ${
                    isDirty && !saving && !isGuest
                      ? "bg-[#1E1B16] text-[#F6F1E7] hover:bg-[#2E2A24]"
                      : "bg-[#EDE7DA] text-[#9C8E7E] cursor-not-allowed"
                  }`}
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  {saving ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Saving…
                    </>
                  ) : sealVisible ? (
                    <>
                      <Check size={12} strokeWidth={2.5} />
                      Saved
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </motion.div>

            <div className="h-4" />

          </div>
        </div>
      </main>
    </AdminAppShell>
  );
}
