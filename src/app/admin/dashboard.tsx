import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, BarChart3, Check, ArrowRight, ChevronRight, CheckCircle2, AlertTriangle, Users, FileText, UserCheck, RefreshCw, XCircle, Calendar, Send } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen, CertificateSeal, parseMetricNum, StatMetricNumber } from "../shared";
import { AdminAppShell } from "./shell";
import { signOutUser, type AuthedProfile } from "../../lib/auth";
import { listApprovals, formatApprovalAge, type AdminApproval } from "../../lib/approvals";
import { listPlatformActivity, formatActivityAge, type PlatformActivityItem, type ActivityCategory } from "../../lib/activity";

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
//
// The "Needs Attention" panel's pending-approvals list is wired to real
// Supabase data via lib/approvals.ts's listApprovals() (same call
// ApprovalsScreen uses) — this screen fetches independently on mount
// rather than relying on AdminApprovalsRoute having mounted first, same
// "each admin screen owns its own real-data fetch" convention as
// RoleRequestsScreen. Platform-wide metrics/activity feed below (users
// registered, certs issued, etc.) have no backing tables yet
// (registrations/attendance aren't modeled) and remain mock placeholders.

const ADMIN_PLATFORM_METRICS = [
  { label:"Registered Users",   value:"4,218", sub:"+38 this week",    color:"#1E1B16" },
  { label:"Active Organizers",  value:"61",    sub:"across 14 depts",  color:"#1E1B16" },
  { label:"Events This Month",  value:"29",    sub:"12 live or upcoming", color:"#1E1B16" },
  { label:"Certs Issued (MTD)", value:"1,043", sub:"via 17 events",    color:"#2E6B4C" },
  { label:"Pending Approvals",  value:"4",     sub:"need your review",  color:"#8A5C00" },
];

// Icon per activity category — the Platform Activity panel below reads
// real rows from `platform_activity` (src/lib/activity.ts) now, but the
// icon choice is presentation-only, so it stays here in the UI layer
// rather than being stored per-row in the database (mirrors how
// TypeBadge/TYPE_COLORS in admin/approvals.tsx map approval `type`
// strings to a badge appearance).
const ACTIVITY_ICONS: Record<ActivityCategory, typeof Award> = {
  certificates_issued: Award,
  organizer_approved: UserCheck,
  new_registrations: Users,
  template_updated: FileText,
  event_submitted: Send,
  event_approved: CheckCircle2,
  event_rejected: XCircle,
  upcoming_reminder: Calendar,
  certificate_delivery_failed: AlertTriangle,
};

function activityIcon(category: string): typeof Award {
  return ACTIVITY_ICONS[category as ActivityCategory] ?? FileText;
}

// "Review Approvals" sub-label is filled in with the real pendingCount at
// render time below (ql1.sub is a placeholder, replaced per-render) — the
// rest have no backing table yet and stay static mock copy.
const ADMIN_QUICK_LINKS = [
  { id:"ql1", icon:CheckCircle2, label:"Review Approvals",       sub:"",                      accent:"#E2A23B", bg:"rgba(226,162,59,0.08)" },
  { id:"ql2", icon:Users,        label:"User Management",         sub:"4,218 accounts",       accent:"#1E1B16", bg:"rgba(30,27,22,0.05)"   },
  { id:"ql3", icon:FileText,     label:"Certificate Templates",   sub:"6 active templates",   accent:"#2E6B4C", bg:"rgba(46,107,76,0.07)"  },
  { id:"ql4", icon:BarChart3,    label:"Platform Analytics",      sub:"Usage this month",     accent:"#1E1B16", bg:"rgba(30,27,22,0.05)"   },
];


// Seismograph trace — SVG polyline that draws in, with amber spikes timed to row reveals
function SeismographTrace({ width, height, rowCount, rowDelay }: {
  width: number; height: number; rowCount: number; rowDelay: number;
}) {
  const mid = height / 2;
  // Build a baseline with small jitter + spikes at each row position
  const pts: [number, number][] = [];
  const segW = width / (rowCount + 1);
  for (let i = 0; i <= width; i += 3) {
    const jitter = (Math.sin(i * 0.23) * 1.2 + Math.cos(i * 0.41) * 0.8);
    pts.push([i, mid + jitter]);
  }
  // Inject spike peaks at each row's x-position
  const spikePts: { x: number; delay: number }[] = [];
  for (let r = 0; r < rowCount; r++) {
    const x = segW * (r + 1);
    spikePts.push({ x, delay: rowDelay * r + 0.14 });
  }

  const polylinePoints = pts.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg
      width={width} height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.18 }}
      aria-hidden>
      {/* Baseline trace — draws in left-to-right */}
      <motion.polyline
        points={polylinePoints}
        fill="none"
        stroke="#9C8E7E"
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.12 }}
        style={{ pathLength: undefined }}
      />
      {/* Amber spike at each row — a short vertical flash */}
      {spikePts.map(({ x, delay: d }, i) => (
        <motion.line
          key={i}
          x1={x} y1={mid - 9} x2={x} y2={mid + 9}
          stroke="#E2A23B"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={[
            { scaleY: 1, opacity: 0.7, transition: { duration: 0.09, delay: d, ease: "easeOut" } },
            { scaleY: 0, opacity: 0,   transition: { duration: 0.28, delay: d + 0.09, ease: "easeIn" } },
          ]}
          style={{ transformOrigin: `${x}px ${mid}px` }}
        />
      ))}
    </svg>
  );
}

export function AdminDashboard({
  onNavigate,
  onPendingApprovalsChange,
  livePendingRoleRequests,
  isGuest,
  profile,
}: {
  onNavigate: (s: Screen) => void;
  onPendingApprovalsChange?: (n: number) => void;
  livePendingRoleRequests?: number;
  isGuest?: boolean;
  profile?: AuthedProfile | null;
}) {
  const [pendingApprovals, setPendingApprovals] = useState<AdminApproval[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(!isGuest);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const pendingCount = pendingApprovals.length;
  const activityRef  = useRef<HTMLDivElement>(null);
  const [activityWidth, setActivityWidth] = useState(0);
  const [reviewHover, setReviewHover] = useState(false);
  const [activity, setActivity] = useState<PlatformActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(!isGuest);
  const [activityError, setActivityError] = useState<string | null>(null);

  const fetchPendingApprovals = useCallback(async () => {
    setLoadingApprovals(true);
    setApprovalsError(null);
    const result = await listApprovals();
    if (result.status === "error") {
      setApprovalsError(result.message);
      setLoadingApprovals(false);
      return;
    }
    const pending = result.approvals.filter(a => a.status === "pending");
    setPendingApprovals(pending);
    setLoadingApprovals(false);
    onPendingApprovalsChange?.(pending.length);
  }, [onPendingApprovalsChange]);

  useEffect(() => {
    // Guest mode has no real Supabase session — approvals_select_admin's
    // RLS would just return zero rows anyway, so skip the fetch and show
    // an empty/"all caught up" panel, matching the isGuest handling
    // elsewhere in the admin screens (UsersScreen, RoleRequestsScreen).
    if (isGuest) { setLoadingApprovals(false); return; }
    void fetchPendingApprovals();
  }, [isGuest, fetchPendingApprovals]);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    setActivityError(null);
    const result = await listPlatformActivity(6);
    if (result.status === "error") {
      setActivityError(result.message);
      setLoadingActivity(false);
      return;
    }
    setActivity(result.items);
    setLoadingActivity(false);
  }, []);

  useEffect(() => {
    // Same platform_activity_select_admin RLS shape as approvals — guest
    // mode would just get zero rows, so skip the fetch entirely.
    if (isGuest) { setLoadingActivity(false); return; }
    void fetchActivity();
  }, [isGuest, fetchActivity]);

  useEffect(() => {
    if (!activityRef.current) return;
    const ro = new ResizeObserver(entries => {
      setActivityWidth(entries[0].contentRect.width);
    });
    ro.observe(activityRef.current);
    setActivityWidth(activityRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <AdminAppShell
      activeNav="admin-dashboard"
      adminName={profile?.fullName ?? "Dr. Helena Marsh"}
      adminRole="Platform Administrator"
      pendingApprovals={pendingCount}
      pendingRoleRequests={livePendingRoleRequests ?? 0}
      notifCount={3}
      isGuest={isGuest}
      onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
      onNav={id => {
        if (id === "profile")         { onNavigate("profile");         return; }
        if (id === "admin-approvals") { onNavigate("admin-approvals"); return; }
        if (id === "admin-users")     { onNavigate("admin-users");     return; }
        if (id === "admin-role-requests") { onNavigate("admin-role-requests"); return; }
        if (id === "admin-templates") { onNavigate("admin-templates"); return; }
        if (id === "admin-analytics") { onNavigate("admin-analytics"); return; }
        if (id === "admin-settings")  { onNavigate("admin-settings");  return; }
        if (id === "admin-notifs")    { onNavigate("admin-notifs");    return; }
        toast(`${id} — coming soon`);
      }}
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7 space-y-5">

          {/* ── Needs Attention ── */}
          <motion.div
            className="bg-[#FCFAF3] rounded-[8px] overflow-hidden relative"
            style={{ border: `1px solid ${pendingCount > 0 ? "rgba(226,162,59,0.5)" : "#DCD4C2"}` }}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.26, ease:"easeOut" }}
          >
            {/* Amber top border — draws in left-to-right over 400ms */}
            {pendingCount > 0 && (
              <div className="relative h-[3px] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-[#E2A23B]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                />
              </div>
            )}
            <div className="px-6 py-5 flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-3 mb-3">
                  {loadingApprovals ? (
                    <span className="inline-flex items-center gap-[6px] px-2.5 py-[5px] rounded-full text-[8px] font-semibold tracking-[0.12em] uppercase"
                      style={{ ...M, background:"rgba(30,27,22,0.05)", border:"1px solid rgba(30,27,22,0.12)", color:"#6B6355" }}>
                      <RefreshCw size={9} strokeWidth={2} className="animate-spin" /> Loading
                    </span>
                  ) : pendingCount > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-[6px] px-2.5 py-[5px] rounded-full text-[8px] font-semibold tracking-[0.12em] uppercase"
                        style={{ ...M, background:"#E2A23B", color:"#1E1B16" }}>
                        <span className="w-[5px] h-[5px] rounded-full animate-pulse bg-[#1E1B16]/40" />
                        {pendingCount} Pending
                      </span>
                      <span className="text-[9px]" style={{ ...M, color:"#9C8E7E" }}>Organizer approvals awaiting review</span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-[6px] px-2.5 py-[5px] rounded-full text-[8px] font-semibold tracking-[0.12em] uppercase"
                      style={{ ...M, background:"rgba(46,107,76,0.10)", border:"1px solid rgba(46,107,76,0.25)", color:"#2E6B4C" }}>
                      <Check size={9} strokeWidth={2.5} /> All caught up
                    </span>
                  )}
                </div>
                {loadingApprovals ? (
                  <h2 className="text-[1.45rem] font-semibold text-[#1E1B16] leading-[1.2] mb-2" style={F}>
                    Checking for pending approvals…
                  </h2>
                ) : approvalsError ? (
                  <>
                    <h2 className="text-[1.45rem] font-semibold text-[#1E1B16] leading-[1.2] mb-2" style={F}>
                      Couldn't load approvals.
                    </h2>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-[#B5432E]" style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>{approvalsError}</span>
                      <button type="button" onClick={() => void fetchPendingApprovals()}
                        className="flex items-center gap-1 px-2 py-[3px] rounded-[5px] text-[10px] font-semibold border border-[#DCD4C2] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors"
                        style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                        <RefreshCw size={10} strokeWidth={1.75} /> Retry
                      </button>
                    </div>
                  </>
                ) : pendingCount > 0 ? (
                  <h2 className="text-[1.45rem] font-semibold text-[#1E1B16] leading-[1.2] mb-3" style={F}>
                    Needs Attention
                  </h2>
                ) : (
                  <h2 className="text-[1.45rem] font-semibold text-[#1E1B16] leading-[1.2] mb-2" style={F}>
                    Platform running smoothly.
                  </h2>
                )}
                {!loadingApprovals && !approvalsError && pendingCount > 0 && (
                  <div className="space-y-2">
                    {pendingApprovals.slice(0,3).map((ap, i) => (
                      <motion.div key={ap.id}
                        className="flex items-start gap-3 py-2.5 border-b border-[#DCD4C2] last:border-none"
                        initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }}
                        transition={{ duration:0.2, delay:0.08 + i*0.05 }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E2A23B] mt-[5px] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[#1E1B16] leading-snug truncate"
                            style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                            {ap.eventTitle}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-[#6B6355]" style={M}>{ap.organizerName}</span>
                            <span className="text-[#DCD4C2] text-xs">·</span>
                            <span className="text-[9px] text-[#9C8E7E]" style={M}>{ap.department ?? "—"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[8px]" style={{ ...M, color:"#9C8E7E" }}>{formatApprovalAge(ap.submittedAt)}</span>
                          <span className="text-[8px] px-2 py-0.5 rounded-full border"
                            style={{ ...M, borderColor:"rgba(226,162,59,0.35)", color:"#8A5C00", background:"rgba(226,162,59,0.08)" }}>
                            {ap.type === "new_event" ? "New event" : ap.type === "recurring" ? "Recurring" : ap.type === "capacity_change" ? "Capacity change" : "Edit"}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    {pendingApprovals.length > 3 && (
                      <div className="pt-1">
                        <span className="text-[10px] text-[#6B6355]" style={M}>+{pendingApprovals.length - 3} more pending</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {pendingCount === 0 && (
                <CertificateSeal size={80} rotate={-10} delay={0.2} />
              )}
              {pendingCount > 0 && (
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <button type="button"
                    onClick={() => onNavigate("admin-approvals")}
                    onMouseEnter={() => setReviewHover(true)}
                    onMouseLeave={() => setReviewHover(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] text-[12px] font-semibold"
                    style={{
                      background: reviewHover ? "#C8891A" : "#E2A23B",
                      color: "#1E1B16",
                      fontFamily: "'Public Sans', system-ui, sans-serif",
                      transition: "background 150ms ease",
                    }}>
                    <CheckCircle2 size={13} strokeWidth={2} />
                    Review All
                  </button>
                  <button type="button" onClick={() => toast("Dismissed")}
                    className="text-[10px] text-center text-[#9C8E7E] hover:text-[#6B6355] transition-colors"
                    style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Platform metrics strip — count-up on load ── */}
          <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.22, ease:"easeOut", delay:0.06 }}>
            {ADMIN_PLATFORM_METRICS.map((m, i) => {
              const isPending = m.label === "Pending Approvals";
              const target = isPending ? pendingCount : parseMetricNum(m.value);
              return (
                <div key={m.label} className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] px-4 py-4">
                  <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>{m.label}</div>
                  <div className="text-[1.65rem] font-semibold leading-none mb-1.5" style={F}>
                    <StatMetricNumber
                      target={target}
                      formatted={isPending ? String(target) : m.value}
                      color={m.color}
                      duration={550}
                      delay={i * 70}
                    />
                  </div>
                  <div className="text-[9px] text-[#9C8E7E]" style={M}>{m.sub}</div>
                </div>
              );
            })}
          </motion.div>

          {/* ── Row: Activity feed (3/5) + Quick links (2/5) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Recent activity — seismograph trace behind rows */}
            <motion.div
              ref={activityRef}
              className="col-span-1 lg:col-span-3 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.25, ease:"easeOut", delay:0.1 }}>
              <div className="px-6 py-4 border-b border-[#DCD4C2] flex items-center justify-between">
                <div className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Platform Activity</div>
                <button type="button"
                  onClick={() => onNavigate("admin-notifs")}
                  className="text-[9px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                  style={M}>View all →</button>
              </div>
              {/* List with seismograph trace */}
              <div className="relative">
                {loadingActivity && (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw size={16} strokeWidth={1.5} className="text-[#9C8E7E] animate-spin" />
                  </div>
                )}
                {!loadingActivity && activityError && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <span className="text-[11px] text-[#B5432E]" style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                      Couldn't load activity: {activityError}
                    </span>
                    <button type="button" onClick={() => void fetchActivity()}
                      className="flex items-center gap-1 px-2 py-[3px] rounded-[5px] text-[10px] font-semibold border border-[#DCD4C2] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors"
                      style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                      <RefreshCw size={10} strokeWidth={1.75} /> Retry
                    </button>
                  </div>
                )}
                {!loadingActivity && !activityError && activity.length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <span className="text-[11px] text-[#9C8E7E]" style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                      No activity yet.
                    </span>
                  </div>
                )}
                {!loadingActivity && !activityError && activity.length > 0 && (
                  <>
                    {activityWidth > 0 && (
                      <SeismographTrace
                        width={activityWidth}
                        height={activity.length * 56}
                        rowCount={activity.length}
                        rowDelay={0.14}
                      />
                    )}
                    <div className="divide-y divide-[#DCD4C2] relative">
                      {activity.map((item, i) => {
                        const Icon = activityIcon(item.category);
                        return (
                          <motion.div key={item.id}
                            className="px-6 py-3.5 flex items-start gap-4"
                            initial={{ opacity:0 }} animate={{ opacity:1 }}
                            transition={{ duration:0.15, delay:0.14 + i*0.04 }}>
                            <div className="w-7 h-7 rounded-[6px] flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background:`${item.accentColor}14`, border:`1px solid ${item.accentColor}28` }}>
                              <Icon size={12} strokeWidth={1.75} style={{ color:item.accentColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-[#1E1B16] leading-snug"
                                style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>{item.message}</div>
                            </div>
                            <span className="text-[9px] text-[#9C8E7E] flex-shrink-0 mt-0.5" style={M}>{formatActivityAge(item.createdAt)}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Quick links */}
            <motion.div className="col-span-1 lg:col-span-2 flex flex-col gap-3"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.25, ease:"easeOut", delay:0.13 }}>
              <div className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>Quick Actions</div>
              {ADMIN_QUICK_LINKS.map((ql, i) => {
                const Icon = ql.icon;
                return (
                  <motion.button key={ql.id} type="button"
                    onClick={() => toast(`${ql.label} — coming soon`)}
                    className="w-full flex items-center gap-4 px-5 py-4 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] text-left hover:border-[#1E1B16]/30 transition-colors group"
                    initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                    transition={{ duration:0.2, delay:0.16 + i*0.05 }}>
                    <div className="w-9 h-9 rounded-[7px] flex items-center justify-center flex-shrink-0"
                      style={{ background:ql.bg, border:`1px solid ${ql.accent}22` }}>
                      <Icon size={15} strokeWidth={1.5} style={{ color:ql.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#1E1B16]"
                        style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>{ql.label}</div>
                      <div className="text-[9px] text-[#9C8E7E]" style={M}>
                        {ql.id === "ql1"
                          ? (loadingApprovals ? "Loading…" : pendingCount === 0 ? "All caught up" : `${pendingCount} pending`)
                          : ql.sub}
                      </div>
                    </div>
                    <ChevronRight size={13} strokeWidth={1.5} className="text-[#DCD4C2] group-hover:text-[#6B6355] transition-colors flex-shrink-0" />
                  </motion.button>
                );
              })}
            </motion.div>

          </div>

        </div>
      </main>
    </AdminAppShell>
  );
}
