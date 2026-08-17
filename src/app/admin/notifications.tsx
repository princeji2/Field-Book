import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, ArrowRight, FileText, AlertTriangle, UserPlus, CheckCircle2,
  XCircle, ShieldCheck, Ban, BarChart3, Settings,
} from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen, NOTIF_GROUPS, type NotifGroup } from "../shared";
import { AdminAppShell } from "./shell";
import { signOutUser, type AuthedProfile } from "../../lib/auth";

// ─── Admin Notifications ─────────────────────────────────────────────────────

type AdminNotifCategory = "submission" | "flag" | "system" | "user";

type AdminNotifItem = {
  id: string;
  category: AdminNotifCategory;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  body: string;
  meta: string;
  time: string;
  group: NotifGroup;
  unread: boolean;
  action?: { label: string; screen: Screen };
};

const ADMIN_NOTIFS: AdminNotifItem[] = [
  // ── Today ──
  {
    id: "an1",
    category: "submission",
    icon: FileText,
    title: "New event submitted for review",
    body: "\"Winter Symposium on AI Ethics\" was submitted by Dr. Priya Nair and is awaiting approval.",
    meta: "EVT-SUB-2024-0041",
    time: "1h ago",
    group: "today",
    unread: true,
    action: { label: "Review in Approvals", screen: "admin-approvals" },
  },
  {
    id: "an2",
    category: "submission",
    icon: FileText,
    title: "New event submitted for review",
    body: "\"Intro to Biomechanics Lab\" was submitted by Prof. Kevin Adeyemi — 2nd submission this week.",
    meta: "EVT-SUB-2024-0040",
    time: "3h ago",
    group: "today",
    unread: true,
    action: { label: "Review in Approvals", screen: "admin-approvals" },
  },
  {
    id: "an3",
    category: "flag",
    icon: AlertTriangle,
    title: "Event flagged by a student",
    body: "\"Entrepreneurship Sprint\" was flagged for a potential scheduling conflict with an existing certified event.",
    meta: "EVT-FLAG-2024-0018",
    time: "6h ago",
    group: "today",
    unread: true,
    action: { label: "Review in Approvals", screen: "admin-approvals" },
  },
  {
    id: "an4",
    category: "user",
    icon: UserPlus,
    title: "New organizer account created",
    body: "Dr. Fatima Al-Rashid (fatima@university.edu) registered as an organizer and is pending verification.",
    meta: "ORG-NEW-2024-0029",
    time: "9h ago",
    group: "today",
    unread: false,
    action: { label: "View in Users", screen: "admin-users" },
  },
  // ── Earlier this week ──
  {
    id: "an5",
    category: "submission",
    icon: CheckCircle2,
    title: "Event approval: action taken",
    body: "\"Leadership Summit 2024\" was approved by you. Organizer Dr. Helena Marsh has been notified.",
    meta: "EVT-APPR-2024-0039",
    time: "Yesterday",
    group: "week",
    unread: false,
  },
  {
    id: "an6",
    category: "flag",
    icon: XCircle,
    title: "Event rejected",
    body: "\"Unverified Guest Speaker Panel\" was rejected. Rejection reason was sent to the organizer.",
    meta: "EVT-REJ-2024-0038",
    time: "Yesterday",
    group: "week",
    unread: false,
  },
  {
    id: "an7",
    category: "system",
    icon: ShieldCheck,
    title: "Certificate template updated",
    body: "The \"Classic Scroll\" template was edited and is now the platform default.",
    meta: "TPL-UPD-2024-0007",
    time: "2 days ago",
    group: "week",
    unread: false,
    action: { label: "View Templates", screen: "admin-templates" },
  },
  {
    id: "an8",
    category: "user",
    icon: Ban,
    title: "User account suspended",
    body: "Student account s.miller@university.edu was suspended following a conduct report. Review in Users.",
    meta: "USR-SUSP-2024-0012",
    time: "3 days ago",
    group: "week",
    unread: false,
    action: { label: "View in Users", screen: "admin-users" },
  },
  // ── Older ──
  {
    id: "an9",
    category: "system",
    icon: BarChart3,
    title: "Weekly platform digest",
    body: "Week of Nov 4: 38 new signups, 4 events published, 1,043 certificates issued platform-wide.",
    meta: "DIGEST-2024-W45",
    time: "Nov 4",
    group: "older",
    unread: false,
    action: { label: "View Analytics", screen: "admin-analytics" },
  },
  {
    id: "an10",
    category: "system",
    icon: Settings,
    title: "Platform settings updated",
    body: "Approval policy was changed: auto-approve for verified organizers is now enabled.",
    meta: "CFG-AUDIT-2024-0003",
    time: "Nov 1",
    group: "older",
    unread: false,
    action: { label: "Review Settings", screen: "admin-settings" },
  },
  {
    id: "an11",
    category: "submission",
    icon: FileText,
    title: "Batch of 3 events submitted",
    body: "Career Services submitted 3 events in one session. All are in the Approvals queue.",
    meta: "EVT-BATCH-2024-0036",
    time: "Oct 29",
    group: "older",
    unread: false,
    action: { label: "Review in Approvals", screen: "admin-approvals" },
  },
];

const ADMIN_NOTIF_CATEGORY_COLORS: Record<AdminNotifCategory, { bg: string; border: string; icon: string }> = {
  submission: { bg: "rgba(30,27,22,0.05)",   border: "rgba(30,27,22,0.15)",  icon: "#6B6355"  },
  flag:       { bg: "rgba(181,67,46,0.07)",  border: "rgba(181,67,46,0.25)", icon: "#B5432E"  },
  system:     { bg: "rgba(30,27,22,0.05)",   border: "rgba(30,27,22,0.15)",  icon: "#6B6355"  },
  user:       { bg: "rgba(46,107,76,0.07)",  border: "rgba(46,107,76,0.25)", icon: "#2E6B4C"  },
};

const ADMIN_NOTIF_CATEGORY_LABELS: Record<AdminNotifCategory, string> = {
  submission: "Submission",
  flag:       "Flagged",
  system:     "System",
  user:       "User",
};

function AdminNotifRow({
  notif, isRead, onRead, onAction, delay, staggerDelay = 0,
}: {
  notif: AdminNotifItem;
  isRead: boolean;
  onRead: () => void;
  onAction: (s: Screen) => void;
  delay: number;
  staggerDelay?: number;
}) {
  const Icon   = notif.icon;
  const active = notif.unread && !isRead;
  const cols   = ADMIN_NOTIF_CATEGORY_COLORS[notif.category];
  const isFlag = notif.category === "flag";

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${notif.title}${active ? " — unread" : ""}`}
      className="relative flex items-start gap-4 px-6 py-4 border-b border-[#DCD4C2] last:border-b-0 cursor-pointer"
      style={{ background: active ? (isFlag ? "rgba(181,67,46,0.04)" : "rgba(226,162,59,0.05)") : "transparent" }}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut", delay }}
      onClick={onRead}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRead(); } }}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-[2px]"
        style={{
          background: active ? (isFlag ? "#B5432E" : "#E2A23B") : "#DCD4C2",
          transition: `background-color 300ms ease ${staggerDelay}ms`,
        }}
      />

      <span
        className="mt-[2px] w-8 h-8 flex-shrink-0 rounded-[5px] border flex items-center justify-center transition-colors duration-300"
        style={{
          background: active ? cols.bg : "rgba(30,27,22,0.04)",
          borderColor: active ? cols.border : "rgba(30,27,22,0.12)",
        }}
      >
        <Icon size={13} strokeWidth={1.8} color={active ? cols.icon : "#9C8E7E"} />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-[3px]">
          <span
            className="text-[12px] leading-[1.45] transition-colors duration-300"
            style={{
              fontFamily: "'Public Sans', system-ui, sans-serif",
              color: active ? "#1E1B16" : "#4A4437",
              fontWeight: active ? 600 : 500,
            }}
          >
            {notif.title}
          </span>
          <span className="flex items-center gap-[6px] flex-shrink-0 mt-[1px]">
            <span className="text-[9px] whitespace-nowrap" style={{ ...M, color: "#9C8E7E" }}>{notif.time}</span>
            <motion.span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0 origin-center"
              style={{ background: isFlag ? "#B5432E" : "#E2A23B" }}
              animate={{ scale: active ? 1 : 0 }}
              transition={{ duration: 0.15, delay: active ? 0 : staggerDelay / 1000, ease: "easeIn" }}
            />
          </span>
        </div>

        <p className="text-[11px] leading-[1.52] mb-[6px]"
          style={{ fontFamily: "'Public Sans', system-ui, sans-serif", color: "#6B6355" }}>
          {notif.body}
        </p>

        <div className="flex items-center gap-3">
          <span className="text-[8px] tracking-widest uppercase" style={{ ...M, color: "#9C8E7E" }}>{notif.meta}</span>
          <span
            className="text-[8px] tracking-widest uppercase px-[6px] py-[2px] rounded-[3px] border"
            style={{
              ...M,
              color: active ? cols.icon : "#9C8E7E",
              background: active ? cols.bg : "transparent",
              borderColor: active ? cols.border : "rgba(30,27,22,0.1)",
            }}>
            {ADMIN_NOTIF_CATEGORY_LABELS[notif.category]}
          </span>
          {notif.action && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRead(); onAction(notif.action!.screen); }}
              className="flex items-center gap-1 text-[10px] font-medium transition-colors"
              style={{ fontFamily: "'Public Sans', system-ui, sans-serif", color: "#1E1B16",
                borderBottom: "1px solid rgba(30,27,22,0.3)" }}>
              {notif.action.label}
              <ArrowRight size={9} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AdminNotifsScreen({ onNavigate, isGuest, profile }: { onNavigate: (s: Screen) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  const [filter, setFilter]         = useState<"all" | AdminNotifCategory>("all");
  const [readIds, setReadIds]       = useState<string[]>([]);
  const [staggerDelays, setStaggerDelays] = useState<Record<string, number>>({});

  const notifsNavHandler = (id: string) => {
    if (id === "profile")          { onNavigate("profile");          return; }
    if (id === "admin-dashboard")  { onNavigate("admin-dashboard");  return; }
    if (id === "admin-approvals")  { onNavigate("admin-approvals");  return; }
    if (id === "admin-users")      { onNavigate("admin-users");      return; }
    if (id === "admin-role-requests") { onNavigate("admin-role-requests"); return; }
    if (id === "admin-templates")  { onNavigate("admin-templates");  return; }
    if (id === "admin-analytics")  { onNavigate("admin-analytics");  return; }
    if (id === "admin-settings")   { onNavigate("admin-settings");   return; }
    toast(`${id} — coming soon`);
  };

  const filtered = ADMIN_NOTIFS.filter(n => filter === "all" || n.category === filter);
  const unreadCount = ADMIN_NOTIFS.filter(n => n.unread && !readIds.includes(n.id)).length;

  function markRead(id: string) {
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }
  function markAllRead() {
    const unreadInOrder = ADMIN_NOTIFS.filter(n => n.unread && !readIds.includes(n.id));
    const delays: Record<string, number> = {};
    unreadInOrder.forEach((n, i) => { delays[n.id] = i * 40; });
    setStaggerDelays(delays);
    setReadIds(ADMIN_NOTIFS.map(n => n.id));
  }

  const FILTER_PILLS: { id: "all" | AdminNotifCategory; label: string }[] = [
    { id: "all",        label: "All" },
    { id: "submission", label: "Submissions" },
    { id: "flag",       label: "Flagged" },
    { id: "user",       label: "Users" },
    { id: "system",     label: "System" },
  ];

  return (
    <AdminAppShell
      activeNav="admin-notifs"
      adminName={profile?.fullName ?? "Dr. Helena Marsh"}
      adminRole="Platform Administrator"
      pendingApprovals={0}
      notifCount={unreadCount}
      isGuest={isGuest}
      notifCountKey={unreadCount}
      onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
      onNav={notifsNavHandler}
      topBarLeft={
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Notifications</span>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              className="px-[7px] py-[2px] rounded-full text-[9px] font-semibold bg-[#E2A23B] text-[#1E1B16]"
              style={M}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={{ type:"spring", stiffness:500, damping:18 }}>
              {unreadCount}
            </motion.span>
          )}
        </div>
      }
      topBarActions={
        unreadCount > 0 ? (
          <button type="button" onClick={markAllRead}
            className="text-[11px] font-medium text-[#6B6355] hover:text-[#1E1B16] transition-colors"
            style={{ fontFamily: "'Public Sans', system-ui, sans-serif",
              borderBottom: "1px solid rgba(107,99,85,0.35)", paddingBottom: "1px" }}>
            Mark all as read
          </button>
        ) : null
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7">

          <motion.div className="mb-6" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.22, ease:"easeOut" }}>
            <p className="text-[9px] tracking-widest uppercase mb-1" style={{ ...M, color:"#9C8E7E" }}>
              Admin Portal
            </p>
            <h1 className="text-[28px] leading-[1.1] text-[#1E1B16] mb-[5px]" style={F}>
              Notifications
            </h1>
            <p className="text-[12px]"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#9C8E7E" }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              {" · "}{ADMIN_NOTIFS.length} total
            </p>
          </motion.div>

          <motion.div className="flex flex-wrap items-center gap-2 mb-5"
            initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.2, ease:"easeOut", delay:0.05 }}>
            {FILTER_PILLS.map(pill => {
              const count = pill.id === "all"
                ? ADMIN_NOTIFS.filter(n => n.unread && !readIds.includes(n.id)).length
                : ADMIN_NOTIFS.filter(n => n.category === pill.id && n.unread && !readIds.includes(n.id)).length;
              const active = filter === pill.id;
              return (
                <button key={pill.id} type="button"
                  onClick={() => setFilter(pill.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[10px] font-medium border transition-all ${
                    active
                      ? pill.id === "flag"
                        ? "bg-[#B5432E] border-[#B5432E] text-[#F6F1E7]"
                        : "bg-[#1E1B16] border-[#1E1B16] text-[#F6F1E7]"
                      : "bg-[#FCFAF3] border-[#DCD4C2] text-[#6B6355] hover:text-[#1E1B16] hover:border-[#1E1B16]"
                  }`}
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  {pill.label}
                  {count > 0 && (
                    <span className={`text-[8px] font-bold px-1 py-[1px] rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-[#E2A23B] text-[#1E1B16]"
                    }`} style={M}>{count}</span>
                  )}
                </button>
              );
            })}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={filter}
              initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.18 }}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-24 text-center">
                  <span className="w-14 h-14 rounded-full border border-[#DCD4C2] bg-[#FCFAF3] flex items-center justify-center mb-5">
                    <Bell size={22} strokeWidth={1.3} color="#9C8E7E" />
                  </span>
                  <p className="text-[18px] text-[#1E1B16] mb-2" style={F}>No notifications here</p>
                  <p className="text-[13px] max-w-[220px] leading-[1.55]"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#9C8E7E" }}>
                    Nothing in this category right now.
                  </p>
                </div>
              ) : (
                <div className="bg-[#FCFAF3] border border-[#1E1B16]/[0.18] rounded-[8px] overflow-hidden">
                  {NOTIF_GROUPS.map(({ label, key }) => {
                    const items = filtered
                      .map((n, i) => ({ notif: n, delay: 0.06 + i * 0.04 }))
                      .filter(({ notif }) => notif.group === key);
                    if (!items.length) return null;
                    return (
                      <div key={key}>
                        <div className="px-6 py-[9px] border-b border-[#DCD4C2]"
                          style={{ background: "#EDE7D9" }}>
                          <span className="text-[7px] tracking-[0.15em] uppercase font-semibold"
                            style={{ ...M, color:"#9C8E7E" }}>
                            {label}
                          </span>
                        </div>
                        {items.map(({ notif, delay }) => (
                          <AdminNotifRow
                            key={notif.id}
                            notif={notif}
                            isRead={readIds.includes(notif.id)}
                            onRead={() => markRead(notif.id)}
                            onAction={onNavigate}
                            delay={delay}
                            staggerDelay={staggerDelays[notif.id] ?? 0}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </main>
    </AdminAppShell>
  );
}
