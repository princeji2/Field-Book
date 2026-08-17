import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowLeft, X, ChevronRight, XCircle, Clock, Calendar, MapPin, Users, Award, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen, CertificateSeal } from "../shared";
import { AdminAppShell } from "./shell";
import { signOutUser, type AuthedProfile } from "../../lib/auth";

// ─── Admin Approvals ─────────────────────────────────────────────────────────

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type Approval = {
  id: string;
  eventTitle: string;
  organizer: string;
  orgRole: string;
  dept: string;
  submitted: string;
  submittedFull: string;
  type: "New event" | "Recurring" | "Capacity change" | "Edit";
  status: ApprovalStatus;
  // event detail fields
  date: string;
  time: string;
  venue: string;
  capacity: number;
  description: string;
  certEnabled: boolean;
  rejectionReason?: string;
  resolvedAt?: string;
};

const ALL_APPROVALS: Approval[] = [
  {
    id:"ap1", status:"Pending",
    eventTitle:"Indigenous Knowledge Forum",
    organizer:"Prof. Linda Okonkwo", orgRole:"Associate Professor", dept:"Anthropology",
    submitted:"2h ago", submittedFull:"Nov 13, 2024 · 10:22 AM", type:"New event",
    date:"Dec 4, 2024", time:"2:00 – 5:00 PM", venue:"Humanities Building, Rm 301", capacity:80,
    description:"A half-day interdisciplinary forum bringing together students and faculty to explore the preservation, ethics, and academic integration of indigenous knowledge systems. Three keynote speakers confirmed.",
    certEnabled:true,
  },
  {
    id:"ap2", status:"Pending",
    eventTitle:"Pre-Med Study Group — Week 8",
    organizer:"Dr. Yusuf Amara", orgRole:"Clinical Instructor", dept:"Medical School",
    submitted:"4h ago", submittedFull:"Nov 13, 2024 · 8:47 AM", type:"Recurring",
    date:"Nov 21, 2024", time:"6:00 – 8:00 PM", venue:"Medical Sciences Library, Room 4", capacity:25,
    description:"Weekly structured study session for pre-med students. This is the eighth installment of a semester-long series. Attendance tracking and participation certificates requested for academic credit.",
    certEnabled:true,
  },
  {
    id:"ap3", status:"Pending",
    eventTitle:"Winter Campus Market",
    organizer:"Student Union Board", orgRole:"Student Organization", dept:"Student Affairs",
    submitted:"Yesterday", submittedFull:"Nov 12, 2024 · 3:15 PM", type:"New event",
    date:"Dec 12–14, 2024", time:"10:00 AM – 6:00 PM", venue:"Campus Quad (Outdoor)", capacity:500,
    description:"Three-day outdoor market featuring student vendors, local artisans, food stalls, and live performances. Largest student-run event of the fall semester. Requires facilities coordination sign-off.",
    certEnabled:false,
  },
  {
    id:"ap4", status:"Pending",
    eventTitle:"Computational Biology Bootcamp",
    organizer:"Dr. Mei-Ling Zhao", orgRole:"Assistant Professor", dept:"Bioinformatics",
    submitted:"Yesterday", submittedFull:"Nov 12, 2024 · 11:05 AM", type:"Capacity change",
    date:"Nov 22, 2024", time:"9:00 AM – 4:00 PM", venue:"Computer Science Lab 2", capacity:40,
    description:"Request to increase capacity from 30 to 40 participants. Additional workstations have been confirmed available. Intensive one-day bootcamp covering sequence analysis, protein structure prediction, and data pipelines using Python.",
    certEnabled:true,
  },
  {
    id:"ap5", status:"Approved",
    eventTitle:"Environmental Policy Symposium",
    organizer:"Dr. Marcus Webb", orgRole:"Director", dept:"Student Affairs",
    submitted:"Nov 10, 2024", submittedFull:"Nov 10, 2024 · 9:00 AM", type:"New event",
    date:"Nov 14, 2024", time:"9:00 – 11:30 AM", venue:"Whitman Hall, Rm 204", capacity:100,
    description:"Annual symposium on environmental policy featuring guest speakers from government and NGOs. Open to all students. Certificates of participation issued to all attendees.",
    certEnabled:true, resolvedAt:"Nov 10, 2024 · 4:30 PM",
  },
  {
    id:"ap6", status:"Approved",
    eventTitle:"Leadership Summit 2024",
    organizer:"Dr. Helena Marsh", orgRole:"Platform Administrator", dept:"Dean's Office",
    submitted:"Oct 19, 2024", submittedFull:"Oct 19, 2024 · 2:00 PM", type:"New event",
    date:"Oct 22, 2024", time:"9:00 AM – 5:00 PM", venue:"Campus Center, Ballroom A", capacity:120,
    description:"Campus-wide leadership summit bringing together student leaders, faculty mentors, and external speakers. Full-day program with breakout sessions and networking dinner.",
    certEnabled:true, resolvedAt:"Oct 20, 2024 · 10:15 AM",
  },
  {
    id:"ap7", status:"Rejected",
    eventTitle:"Off-Campus Concert Series Night 3",
    organizer:"Music Society", orgRole:"Student Organization", dept:"Student Affairs",
    submitted:"Nov 8, 2024", submittedFull:"Nov 8, 2024 · 7:44 PM", type:"New event",
    date:"Nov 16, 2024", time:"9:00 PM – 1:00 AM", venue:"The Venue — 42 Market St", capacity:300,
    description:"Third night of an ongoing concert series at an off-campus venue. Student performers and two external headlining acts. Alcohol will be available at the venue.",
    certEnabled:false, rejectionReason:"Off-campus events involving alcohol at non-university venues fall outside the scope of Fieldbook's event management policy. Please coordinate directly with Student Life and resubmit if the event meets revised venue criteria.",
    resolvedAt:"Nov 9, 2024 · 11:00 AM",
  },
];

type ApprovalTab = "Pending" | "Approved" | "Rejected";

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "New event":       { bg:"rgba(30,27,22,0.05)",   border:"rgba(30,27,22,0.15)",  text:"#1E1B16" },
  "Recurring":       { bg:"rgba(46,107,76,0.07)",  border:"rgba(46,107,76,0.2)",  text:"#2E6B4C" },
  "Capacity change": { bg:"rgba(226,162,59,0.09)", border:"rgba(226,162,59,0.3)", text:"#8A5C00" },
  "Edit":            { bg:"rgba(107,99,85,0.08)",  border:"rgba(107,99,85,0.2)",  text:"#6B6355" },
};

function TypeBadge({ type }: { type: Approval["type"] }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS["Edit"];
  return (
    <span className="inline-flex items-center px-2 py-[3px] rounded-full text-[8px] font-medium tracking-[0.06em] uppercase flex-shrink-0"
      style={{ ...M, background:c.bg, border:`1px solid ${c.border}`, color:c.text }}>
      {type}
    </span>
  );
}

export function ApprovalsScreen({ onNavigate, onPendingChange, isGuest, profile }: { onNavigate: (s: Screen) => void; onPendingChange?: (n: number) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  const [tab, setTab] = useState<ApprovalTab>("Pending");
  const [approvals, setApprovals] = useState<Approval[]>(ALL_APPROVALS);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [wipingId, setWipingId] = useState<string | null>(null);
  const [wipingAction, setWipingAction] = useState<"approve" | "reject" | null>(null);
  const [collapsingIds, setCollapsingIds] = useState<Set<string>>(new Set());
  const [pendingDelta, setPendingDelta] = useState(0);
  const [badgePopKey, setBadgePopKey] = useState(0);

  const listed = approvals.filter(a => a.status === tab);
  const pendingCount = approvals.filter(a => a.status === "Pending").length + pendingDelta;
  const panel = panelId ? approvals.find(a => a.id === panelId) ?? null : null;

  function doApprove(id: string) {
    setApprovals(prev => prev.map(a => a.id === id
      ? { ...a, status:"Approved", resolvedAt:`Now` }
      : a
    ));
    if (panelId === id) setPanelId(null);
    toast.success("Event approved and published to student portal");
  }

  function doReject(id: string) {
    setApprovals(prev => prev.map(a => a.id === id
      ? { ...a, status:"Rejected", rejectionReason:rejectReason || undefined, resolvedAt:"Now" }
      : a
    ));
    setRejectingId(null);
    setRejectReason("");
    if (panelId === id) setPanelId(null);
    toast("Submission rejected");
  }

  function animateApprove(id: string) {
    const newPending = Math.max(0, pendingCount - 1);
    setPendingDelta(d => d - 1);
    setBadgePopKey(k => k + 1);
    onPendingChange?.(newPending);
    setWipingId(id);
    setWipingAction("approve");
    setTimeout(() => {
      setWipingId(null);
      setWipingAction(null);
      setCollapsingIds(prev => new Set(prev).add(id));
      setTimeout(() => {
        doApprove(id);
        setCollapsingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        setPendingDelta(0);
      }, 220);
    }, 180);
  }

  function openReject(id: string) {
    setRejectingId(id);
    setRejectReason("");
    setPanelId(id);
  }

  function animateReject(id: string) {
    const newPending = Math.max(0, pendingCount - 1);
    setPendingDelta(d => d - 1);
    setBadgePopKey(k => k + 1);
    onPendingChange?.(newPending);
    setWipingId(id);
    setWipingAction("reject");
    setTimeout(() => {
      setWipingId(null);
      setWipingAction(null);
      setCollapsingIds(prev => new Set(prev).add(id));
      setTimeout(() => {
        doReject(id);
        setCollapsingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        setPendingDelta(0);
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
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onNavigate("admin-dashboard")}
            className="flex items-center gap-1.5 text-[12px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
            <ArrowLeft size={13} strokeWidth={1.5} /> Dashboard
          </button>
          <span className="text-[#DCD4C2] text-xs">/</span>
          <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Approvals</span>
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
              const count = approvals.filter(a => a.status === t).length;
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
              {listed.length === 0 && (
                <motion.div key="empty"
                  className="flex flex-col items-center justify-center h-48 gap-3"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <Check size={28} strokeWidth={1} className="text-[#DCD4C2]" />
                  <span className="text-[12px] text-[#9C8E7E]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                    {tab === "Pending" ? "Nothing pending — all caught up." : `No ${tab.toLowerCase()} submissions yet.`}
                  </span>
                </motion.div>
              )}
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
                      <div className="text-[9px] text-[#9C8E7E]" style={M}>{a.submittedFull}</div>
                    </div>

                    {/* Organizer */}
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-[#1E1B16] truncate"
                        style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{a.organizer}</div>
                      <div className="text-[9px] text-[#9C8E7E] truncate" style={M}>{a.orgRole}</div>
                    </div>

                    {/* Dept */}
                    <div className="text-[10px] text-[#6B6355] truncate" style={M}>{a.dept}</div>

                    {/* Age */}
                    <div className="text-[10px] text-[#9C8E7E]" style={M}>{a.submitted}</div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 xl:gap-1.5">
                      {a.status === "Pending" ? (
                        <>
                          <button type="button"
                            onClick={() => animateApprove(a.id)}
                            disabled={isGuest}
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
                            {a.status === "Approved"
                              ? <span className="flex items-center gap-1 text-[10px] font-medium" style={{ ...M, color:"#2E6B4C" }}><Check size={10} strokeWidth={2.5} /> Approved</span>
                              : <span className="flex items-center gap-1 text-[10px] font-medium" style={{ ...M, color:"#B5432E" }}><XCircle size={10} strokeWidth={1.75} /> Rejected</span>
                            }
                            {a.resolvedAt && <span className="text-[9px] text-[#9C8E7E]" style={M}>{a.resolvedAt}</span>}
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
                    {panel.status === "Pending"
                      ? <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
                          style={{ ...M, background:"rgba(226,162,59,0.12)", border:"1px solid rgba(226,162,59,0.3)", color:"#8A5C00" }}>
                          <Clock size={8} strokeWidth={2} /> Under review
                        </span>
                      : panel.status === "Approved"
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
                  <p className="text-[10px] mt-1" style={{ ...M, color:"#9C8E7E" }}>{panel.submittedFull}</p>
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
                        {panel.organizer.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0,2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#1E1B16]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{panel.organizer}</div>
                      <div className="text-[10px]" style={{ ...M, color:"#9C8E7E" }}>{panel.orgRole} · {panel.dept}</div>
                    </div>
                  </div>
                </div>

                {/* Event logistics grid */}
                <div className="bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px] overflow-hidden">
                  {[
                    { label:"Date",     value:panel.date,           icon:Calendar  },
                    { label:"Time",     value:panel.time,           icon:Clock     },
                    { label:"Venue",    value:panel.venue,          icon:MapPin    },
                    { label:"Capacity", value:`${panel.capacity} attendees`, icon:Users },
                    { label:"Certs",    value:panel.certEnabled ? "Enabled — issued on check-in" : "Not requested", icon:Award },
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
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{panel.description}</p>
                </div>

                {/* Rejection reason (if already rejected) */}
                {panel.status === "Rejected" && panel.rejectionReason && (
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
                {panel.status === "Approved" && (
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
              {panel.status === "Pending" && (
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
                        <button type="button" onClick={() => animateReject(panel.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85"
                          style={{ background:"#B5432E", color:"#FCFAF3", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                          <XCircle size={13} strokeWidth={2} /> Confirm Rejection
                        </button>
                        <button type="button" onClick={() => setRejectingId(null)}
                          className="px-4 py-2.5 rounded-[6px] text-[12px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#1E1B16]/30 hover:text-[#1E1B16] transition-colors"
                          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => doApprove(panel.id)}
                        disabled={isGuest}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[6px] text-[13px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background:"#2E6B4C", color:"#FCFAF3", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                        <Check size={14} strokeWidth={2.2} /> Approve
                      </button>
                      <button type="button" onClick={() => openReject(panel.id)}
                        disabled={isGuest}
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
