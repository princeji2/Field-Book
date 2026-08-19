import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowLeft, X, ChevronRight, XCircle, Clock, Calendar, MapPin, Users, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen, CertificateSeal } from "../shared";
import { AdminAppShell } from "./shell";
import { signOutUser, type AuthedProfile } from "../../lib/auth";
import {
  listApprovals, approveEventApproval, rejectEventApproval, formatApprovalAge, formatApprovalDateTime,
  type AdminApproval, type ApprovalType, type ApprovalStatus,
} from "../../lib/approvals";
import { formatEventDate, formatEventTimeRange } from "../../lib/events";
import { dbRoleToUserRole } from "../../lib/users";

// ─── Admin Approvals ─────────────────────────────────────────────────────────
//
// Wired to real Supabase data via lib/approvals.ts's listApprovals() /
// approveEventApproval() / rejectEventApproval() — same "load/error/retry"
// shape as RoleRequestsScreen's real listRoleChangeRequests() call. There
// is no certificate-enabled column on `events` (unlike the old mock data's
// certEnabled field), so that row is dropped from the detail panel rather
// than shown with fabricated data.

type ApprovalTab = "Pending" | "Approved" | "Rejected";

const STATUS_TO_TAB: Record<ApprovalStatus, ApprovalTab> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const TYPE_LABELS: Record<ApprovalType, string> = {
  new_event: "New event",
  recurring: "Recurring",
  capacity_change: "Capacity change",
  edit: "Edit",
};

const TYPE_COLORS: Record<ApprovalType, { bg: string; border: string; text: string }> = {
  new_event:       { bg:"rgba(30,27,22,0.05)",   border:"rgba(30,27,22,0.15)",  text:"#1E1B16" },
  recurring:       { bg:"rgba(46,107,76,0.07)",  border:"rgba(46,107,76,0.2)",  text:"#2E6B4C" },
  capacity_change: { bg:"rgba(226,162,59,0.09)", border:"rgba(226,162,59,0.3)", text:"#8A5C00" },
  edit:            { bg:"rgba(107,99,85,0.08)",  border:"rgba(107,99,85,0.2)",  text:"#6B6355" },
};

function TypeBadge({ type }: { type: ApprovalType }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.edit;
  return (
    <span className="inline-flex items-center px-2 py-[3px] rounded-full text-[8px] font-medium tracking-[0.06em] uppercase flex-shrink-0"
      style={{ ...M, background:c.bg, border:`1px solid ${c.border}`, color:c.text }}>
      {TYPE_LABELS[type] ?? "Edit"}
    </span>
  );
}

function venueLabel(a: AdminApproval): string {
  if (a.locationType === "online") return "Online";
  return a.venue ?? "Venue TBD";
}

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function ApprovalsScreen({ onNavigate, onPendingChange, isGuest, profile }: { onNavigate: (s: Screen) => void; onPendingChange?: (n: number) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  const [tab, setTab] = useState<ApprovalTab>("Pending");
  const [approvals, setApprovals] = useState<AdminApproval[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [wipingId, setWipingId] = useState<string | null>(null);
  const [wipingAction, setWipingAction] = useState<"approve" | "reject" | null>(null);
  const [collapsingIds, setCollapsingIds] = useState<Set<string>>(new Set());
  const [badgePopKey, setBadgePopKey] = useState(0);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await listApprovals();
    if (result.status === "error") {
      setLoadError(result.message);
      setLoading(false);
      return;
    }
    setApprovals(result.approvals);
    setLoading(false);
    onPendingChange?.(result.approvals.filter(a => a.status === "pending").length);
  }, [onPendingChange]);

  useEffect(() => {
    // Guest mode has no real Supabase session — approvals_select_admin's
    // RLS would just return zero rows anyway, so skip the fetch and show
    // an empty queue, matching RoleRequestsScreen/UsersScreen's isGuest
    // handling.
    if (isGuest) { setLoading(false); return; }
    void fetchApprovals();
  }, [isGuest, fetchApprovals]);

  const listed = approvals.filter(a => STATUS_TO_TAB[a.status] === tab);
  const pendingCount = approvals.filter(a => a.status === "pending").length;
  const panel = panelId ? approvals.find(a => a.id === panelId) ?? null : null;

  async function runApprove(a: AdminApproval) {
    if (isGuest || !profile?.id) return;
    setWipingId(a.id);
    setWipingAction("approve");

    const result = await approveEventApproval(a.id, a.eventId, profile.id, a.eventTitle);
    if (result.status === "error") {
      setWipingId(null);
      setWipingAction(null);
      toast.error(result.message);
      return;
    }

    setBadgePopKey(k => k + 1);
    onPendingChange?.(Math.max(0, pendingCount - 1));
    if (panelId === a.id) setPanelId(null);
    toast.success("Event approved and published to student portal");

    setTimeout(() => {
      setWipingId(null);
      setWipingAction(null);
      setCollapsingIds(prev => new Set(prev).add(a.id));
      setTimeout(() => {
        setCollapsingIds(prev => { const s = new Set(prev); s.delete(a.id); return s; });
        void fetchApprovals();
      }, 220);
    }, 180);
  }

  function openReject(id: string) {
    setRejectingId(id);
    setRejectReason("");
    setPanelId(id);
  }

  async function runReject(a: AdminApproval) {
    if (isGuest || !profile?.id) return;
    setWipingId(a.id);
    setWipingAction("reject");

    const result = await rejectEventApproval(a.id, profile.id, rejectReason, a.eventId, a.eventTitle);
    if (result.status === "error") {
      setWipingId(null);
      setWipingAction(null);
      toast.error(result.message);
      return;
    }

    setRejectingId(null);
    setRejectReason("");
    setBadgePopKey(k => k + 1);
    onPendingChange?.(Math.max(0, pendingCount - 1));
    if (panelId === a.id) setPanelId(null);
    toast("Submission rejected");

    setTimeout(() => {
      setWipingId(null);
      setWipingAction(null);
      setCollapsingIds(prev => new Set(prev).add(a.id));
      setTimeout(() => {
        setCollapsingIds(prev => { const s = new Set(prev); s.delete(a.id); return s; });
        void fetchApprovals();
      }, 220);
    }, 180);
  }

  const tabs: ApprovalTab[] = ["Pending","Approved","Rejected"];

  return (
    <AdminAppShell
      activeNav="admin-approvals"
      adminName={profile?.fullName ?? "Dr. Helena Marsh"}
      adminRole="Platform Administrator"
      pendingApprovals={pendingCount}
      pendingApprovalsKey={badgePopKey}
      notifCount={3}
      isGuest={isGuest}
      onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
      onNav={id => {
        if (id === "profile")         { onNavigate("profile");         return; }
        if (id === "admin-dashboard") { onNavigate("admin-dashboard"); return; }
        if (id === "admin-users")     { onNavigate("admin-users");     return; }
        if (id === "admin-role-requests") { onNavigate("admin-role-requests"); return; }
        if (id === "admin-templates") { onNavigate("admin-templates"); return; }
        if (id === "admin-analytics") { onNavigate("admin-analytics"); return; }
        if (id === "admin-settings")  { onNavigate("admin-settings");  return; }
        if (id === "admin-notifs")    { onNavigate("admin-notifs");    return; }
        toast(`${id} — coming soon`);
      }}
      topBarLeft={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" onClick={() => onNavigate("admin-dashboard")}
            className="flex items-center gap-1.5 text-[12px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
            <ArrowLeft size={13} strokeWidth={1.5} /> Dashboard
          </button>
          <span className="text-[#DCD4C2] text-xs hidden sm:inline">/</span>
          <span className="text-[13px] font-semibold text-[#1E1B16] basis-full sm:basis-auto" style={F}>Approvals</span>
          {pendingCount > 0 && (
            <motion.span
              key={`topbar-${badgePopKey}`}
              className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
              style={{ ...M, background:"#E2A23B", color:"#1E1B16" }}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={{ type:"spring", stiffness:500, damping:18 }}>
              {pendingCount} pending
            </motion.span>
          )}
        </div>
      }
    >
      {/* Outer layout: list + side panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Main list column ── */}
        <div className={`flex flex-col min-h-0 transition-all duration-200 ${panel ? "flex-1 sm:flex-none sm:w-[55%]" : "flex-1"}`}>
          {/* Tab bar */}
          <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] px-4 sm:px-8 flex items-end gap-0 pt-5">
            {tabs.map(t => {
              const count = approvals.filter(a => STATUS_TO_TAB[a.status] === t).length;
              const active = tab === t;
              return (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`flex items-center gap-2 px-4 pb-3 text-[12px] font-medium border-b-[2px] transition-colors ${
                    active
                      ? "border-[#1E1B16] text-[#1E1B16]"
                      : "border-transparent text-[#6B6355] hover:text-[#1E1B16]"
                  }`}
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  {t}
                  <motion.span
                    key={t === "Pending" ? `pending-${badgePopKey}` : `${t}-${count}`}
                    className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-semibold ${
                      active
                        ? t === "Pending" ? "bg-[#E2A23B] text-[#1E1B16]" : "bg-[#1E1B16] text-[#F6F1E7]"
                        : "bg-[#EDE7DA] text-[#6B6355]"
                    }`}
                    style={M}
                    initial={{ scale: 1.35 }}
                    animate={{ scale: 1 }}
                    transition={{ type:"spring", stiffness:500, damping:18 }}>
                    {count}
                  </motion.span>
                </button>
              );
            })}
          </div>

          {/* Column header + rows — horizontally scrollable on small screens */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">

          {/* Loading / error / empty states — outside min-width to stay viewport-responsive */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 px-4">
              <RefreshCw size={22} strokeWidth={1.5} className="text-[#9C8E7E] animate-spin" />
              <span className="text-[12px] text-[#9C8E7E]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                Loading approvals…
              </span>
            </div>
          )}
          {!loading && loadError && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 px-4">
              <span className="text-[12px] text-[#B5432E] text-center max-w-[380px]"
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                Couldn't load approvals: {loadError}
              </span>
              <button type="button" onClick={() => void fetchApprovals()}
                className="flex items-center gap-1.5 px-3 py-[6px] rounded-[6px] text-[11px] font-semibold border border-[#DCD4C2] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors"
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                <RefreshCw size={11} strokeWidth={1.75} /> Retry
              </button>
            </div>
          )}
          <AnimatePresence initial={false}>
            {!loading && !loadError && listed.length === 0 && (
              <motion.div key="empty"
                className="flex flex-col items-center justify-center h-48 gap-3 px-4 text-center"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <Check size={28} strokeWidth={1} className="text-[#DCD4C2]" />
                <span className="text-[12px] text-[#9C8E7E]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  {tab === "Pending" ? "Nothing pending — all caught up." : `No ${tab.toLowerCase()} submissions yet.`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable data table */}
          {!loading && !loadError && listed.length > 0 && (
          <div className="min-w-[700px]">
          <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] px-8 py-2.5 grid gap-4"
            style={{ gridTemplateColumns:"1fr 140px 110px 90px 156px" }}>
            {["Submission","Organizer","Department","Submitted","Actions"].map(h => (
              <span key={h} className="text-[8px] tracking-widest uppercase text-[#9C8E7E]" style={M}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="" style={dotGrid}>
            <AnimatePresence initial={false}>
              {listed.map((a, i) => {
                const isOpen = panelId === a.id;
                const isCollapsing = collapsingIds.has(a.id);
                const isWiping = wipingId === a.id;
                const wipeColor = wipingAction === "approve"
                  ? "rgba(46,107,76,0.14)"
                  : "rgba(181,67,46,0.12)";
                return (
                  <motion.div key={a.id}
                    animate={isCollapsing ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
                    transition={isCollapsing
                      ? { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
                      : { duration: 0 }}
                    style={{ overflow: "hidden" }}>
                  <motion.div
                    layout
                    initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                    transition={{ duration:0.18, delay:i * 0.04 }}
                    className={`relative grid gap-4 px-8 py-4 border-b border-[#DCD4C2] items-center transition-colors ${
                      isOpen ? "bg-[#FDFAF0]" : "bg-[#FCFAF3] hover:bg-[#F6F1E7]/80"
                    }`}
                    style={{ gridTemplateColumns:"1fr 140px 110px 90px 156px" }}>
                    {/* Wipe overlay */}
                    {isWiping && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{ background: wipeColor, transformOrigin: "left center" }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.18, ease: "linear" }}
                      />
                    )}

                    {/* Submission */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-medium text-[#1E1B16] truncate"
                          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{a.eventTitle}</span>
                        <TypeBadge type={a.type} />
                      </div>
                      <div className="text-[9px] text-[#9C8E7E]" style={M}>{formatApprovalDateTime(a.submittedAt)}</div>
                    </div>

                    {/* Organizer */}
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-[#1E1B16] truncate"
                        style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{a.organizerName}</div>
                      <div className="text-[9px] text-[#9C8E7E] truncate" style={M}>
                        {a.organizerRole ? dbRoleToUserRole(a.organizerRole) : "Organizer"}
                      </div>
                    </div>

                    {/* Dept */}
                    <div className="text-[10px] text-[#6B6355] truncate" style={M}>{a.department ?? "—"}</div>

                    {/* Age */}
                    <div className="text-[10px] text-[#9C8E7E]" style={M}>{formatApprovalAge(a.submittedAt)}</div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 xl:gap-1.5">
                      {a.status === "pending" ? (
                        <>
                          <button type="button"
                            onClick={() => void runApprove(a)}
                            disabled={isGuest || !!wipingId}
                            title={isGuest ? "Disabled in guest mode" : "Approve"}
                            className="flex items-center gap-1 px-1.5 py-[4px] xl:px-2.5 xl:py-[5px] rounded-[5px] text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background:"rgba(46,107,76,0.12)", border:"1px solid rgba(46,107,76,0.3)", color:"#2E6B4C", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                            <Check size={11} strokeWidth={2.2} /> Approve
                          </button>
                          <button type="button"
                            onClick={() => openReject(a.id)}
                            disabled={!!wipingId || isGuest}
                            title={isGuest ? "Disabled in guest mode" : "Reject"}
                            className="flex items-center gap-1 px-1.5 py-[4px] xl:px-2.5 xl:py-[5px] rounded-[5px] text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background:"rgba(181,67,46,0.10)", border:"1px solid rgba(181,67,46,0.28)", color:"#B5432E", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                            <X size={11} strokeWidth={2.2} /> Reject
                          </button>
                          <button type="button"
                            onClick={() => setPanelId(isOpen ? null : a.id)}
                            aria-label="Review details"
                            className="p-[5px] rounded-[5px] transition-colors hover:bg-[#EDE7DA]"
                            style={{ border:"1px solid #DCD4C2" }}>
                            <ChevronRight size={13} strokeWidth={1.75} className="text-[#6B6355]" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            {a.status === "approved"
                              ? <span className="flex items-center gap-1 text-[10px] font-medium" style={{ ...M, color:"#2E6B4C" }}><Check size={10} strokeWidth={2.5} /> Approved</span>
                              : <span className="flex items-center gap-1 text-[10px] font-medium" style={{ ...M, color:"#B5432E" }}><XCircle size={10} strokeWidth={1.75} /> Rejected</span>
                            }
                            {a.resolvedAt && <span className="text-[9px] text-[#9C8E7E]" style={M}>{formatApprovalDateTime(a.resolvedAt)}</span>}
                          </div>
                          <button type="button"
                            onClick={() => setPanelId(isOpen ? null : a.id)}
                            aria-label="Review details"
                            className="p-[5px] rounded-[5px] transition-colors hover:bg-[#EDE7DA]"
                            style={{ border:"1px solid #DCD4C2" }}>
                            <ChevronRight size={13} strokeWidth={1.75} className="text-[#6B6355]" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          </div>{/* min-w */}
          )}
          </div>{/* overflow-auto */}
        </div>

        {/* ── Side panel ── */}
        <AnimatePresence>
          {panel && (
            <motion.aside
              key={panel.id}
              className="hidden sm:flex flex-col min-h-0 overflow-hidden border-l border-[#DCD4C2] bg-[#FCFAF3]"
              style={{ width:"45%" }}
              initial={{ opacity:0, x:24 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:24 }}
              transition={{ duration:0.22, ease:"easeOut" }}>

              {/* Panel header */}
              <div className="flex-shrink-0 px-7 py-5 border-b border-[#DCD4C2] flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <TypeBadge type={panel.type} />
                    {panel.status === "pending"
                      ? <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
                          style={{ ...M, background:"rgba(226,162,59,0.12)", border:"1px solid rgba(226,162,59,0.3)", color:"#8A5C00" }}>
                          <Clock size={8} strokeWidth={2} /> Under review
                        </span>
                      : panel.status === "approved"
                        ? <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
                            style={{ ...M, background:"rgba(46,107,76,0.10)", border:"1px solid rgba(46,107,76,0.3)", color:"#2E6B4C" }}>
                            <Check size={8} strokeWidth={2.5} /> Approved
                          </span>
                        : <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
                            style={{ ...M, background:"rgba(181,67,46,0.10)", border:"1px solid rgba(181,67,46,0.28)", color:"#B5432E" }}>
                            <XCircle size={8} strokeWidth={1.75} /> Rejected
                          </span>
                    }
                  </div>
                  <h2 className="text-[1.25rem] font-semibold text-[#1E1B16] leading-snug" style={F}>{panel.eventTitle}</h2>
                  <p className="text-[10px] mt-1" style={{ ...M, color:"#9C8E7E" }}>{formatApprovalDateTime(panel.submittedAt)}</p>
                </div>
                <button type="button" onClick={() => setPanelId(null)}
                  className="flex-shrink-0 p-1.5 rounded-[5px] hover:bg-[#EDE7DA] transition-colors mt-0.5"
                  aria-label="Close panel">
                  <X size={14} strokeWidth={1.75} className="text-[#6B6355]" />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

                {/* Organizer info */}
                <div>
                  <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-3" style={M}>Submitted by</div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background:"rgba(226,162,59,0.15)", border:"1px solid rgba(226,162,59,0.3)" }}>
                      <span className="text-[11px] font-semibold" style={{ color:"#8A5C00" }}>
                        {initialsOf(panel.organizerName)}
                      </span>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#1E1B16]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{panel.organizerName}</div>
                      <div className="text-[10px]" style={{ ...M, color:"#9C8E7E" }}>
                        {panel.organizerRole ? dbRoleToUserRole(panel.organizerRole) : "Organizer"} · {panel.department ?? "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event logistics grid */}
                <div className="bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px] overflow-hidden">
                  {[
                    { label:"Date",     value:formatEventDate(panel.eventDate),                    icon:Calendar },
                    { label:"Time",     value:formatEventTimeRange(panel.startTime, panel.endTime), icon:Clock    },
                    { label:"Venue",    value:venueLabel(panel),                                    icon:MapPin   },
                    { label:"Capacity", value:`${panel.capacity} attendees`,                        icon:Users    },
                  ].map((row, i, arr) => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label}
                        className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? "border-b border-[#DCD4C2]" : ""}`}>
                        <Icon size={12} strokeWidth={1.5} className="flex-shrink-0 mt-[2px] text-[#6B6355]" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] tracking-widest uppercase text-[#9C8E7E] mb-0.5" style={M}>{row.label}</div>
                          <div className="text-[12px] text-[#1E1B16]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{row.value}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Description */}
                <div>
                  <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>Description</div>
                  <p className="text-[12px] text-[#1E1B16] leading-relaxed"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{panel.description ?? "No description provided."}</p>
                </div>

                {/* Rejection reason (if already rejected) */}
                {panel.status === "rejected" && panel.rejectionReason && (
                  <div className="bg-[rgba(181,67,46,0.06)] border border-[rgba(181,67,46,0.22)] rounded-[7px] p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageSquare size={11} strokeWidth={1.75} style={{ color:"#B5432E" }} />
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...M, color:"#B5432E" }}>Rejection reason</div>
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#1E1B16" }}>
                      {panel.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Approved stamp */}
                {panel.status === "approved" && (
                  <div className="flex items-center justify-center py-4">
                    <motion.div
                      initial={{ scale:0, rotate:-22, opacity:0 }}
                      animate={{ scale:1, rotate:-9, opacity:1 }}
                      transition={{ type:"spring", stiffness:320, damping:22, delay:0.1 }}>
                      <CertificateSeal size={80} rotate={-9} delay={0.1} />
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Panel actions — pending only */}
              {panel.status === "pending" && (
                <div className="flex-shrink-0 border-t border-[#DCD4C2] bg-[#F6F1E7] px-7 py-5 space-y-3">
                  {rejectingId === panel.id ? (
                    <motion.div
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                      transition={{ duration:0.18 }}
                      className="space-y-3">
                      <div>
                        <label className="block text-[8px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>
                          Rejection reason <span className="normal-case tracking-normal text-[#9C8E7E]">(optional)</span>
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          rows={3}
                          placeholder="Explain why this submission is being rejected…"
                          className="w-full bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] px-3 py-2.5 text-[12px] text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none resize-none focus:border-[#1E1B16]/35 transition-colors"
                          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => void runReject(panel)}
                          disabled={!!wipingId}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60"
                          style={{ background:"#B5432E", color:"#FCFAF3", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                          <XCircle size={13} strokeWidth={2} /> Confirm Rejection
                        </button>
                        <button type="button" onClick={() => setRejectingId(null)}
                          disabled={!!wipingId}
                          className="px-4 py-2.5 rounded-[6px] text-[12px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#1E1B16]/30 hover:text-[#1E1B16] transition-colors disabled:opacity-60"
                          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => void runApprove(panel)}
                        disabled={isGuest || !!wipingId}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[6px] text-[13px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background:"#2E6B4C", color:"#FCFAF3", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                        <Check size={14} strokeWidth={2.2} /> Approve
                      </button>
                      <button type="button" onClick={() => openReject(panel.id)}
                        disabled={isGuest || !!wipingId}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[6px] text-[13px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background:"rgba(181,67,46,0.10)", border:"1px solid rgba(181,67,46,0.3)", color:"#B5432E", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                        <XCircle size={14} strokeWidth={1.75} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

      </div>
    </AdminAppShell>
  );
}
