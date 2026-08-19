import React, { useState, useEffect, useRef, useId, useCallback } from "react";
import jsQR from "jsqr";
import { motion, AnimatePresence } from "motion/react";
import {
  QrCode, Award, BarChart3, Compass,
  Check, ArrowRight, BookMarked,
  Calendar, MapPin, GraduationCap,
  ClipboardList, ChevronRight,
  Scan, Shield, ArrowLeft, Eye, EyeOff, Bell, Home, Search,
  Download, Share2, X, Users, Plus,
  Upload, Pencil, Copy, ChevronDown,
  FileText, CheckCircle2, AlertTriangle, Settings, RefreshCw, ExternalLink,
  XCircle, Clock, ChevronLeft, MessageSquare,
  MoreHorizontal, UserPlus, Ban, ShieldCheck, Mail, Filter,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { toast } from "sonner";
import {
  F, M, dotGrid, type Screen,
  MockQR, CertificateSeal, AppShell, NOTIF_GROUPS, type NotifGroup,
} from "./shared";
import { ProfileScreen } from "./profile";
import { type AuthedProfile } from "../lib/auth";
import { generateCertificate, generateCertificateCode } from "../lib/certificates";
import { recordAttendance } from "../lib/attendance";
import {
  type StudentEventCard,
  type EventRow,
  listStudentExploreEvents,
  getStudentEventById,
  getEventByCode,
  formatEventDate,
} from "../lib/events";

// ─── Student Dashboard ────────────────────────────────────────────────────────
export function StudentDashboard({ onNavigate, isGuest, profile }: { onNavigate?: (s: Screen) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  const [activeNav, setActiveNav] = useState("dashboard");

  // Explore preview widget below is real data (events_select_public RLS).
  // "Next Up" and "Certificates" summary cards above/below it still render
  // fixed placeholder content — there is no registrations/attendees table
  // yet to know which events THIS student is registered for or has
  // checked into (see the note on MyEventsScreen), so "Next Up" can't be
  // computed from real data without inventing that table. Flagged rather
  // than wired to a fake per-student query.
  const [previewEvents, setPreviewEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await listStudentExploreEvents();
      if (!cancelled && result.status === "success") {
        setPreviewEvents(result.events.slice(0, 3));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function handleNav(id: string) {
    if (id === "profile")  { onNavigate?.("profile");  return; }
    if (id === "landing")  { onNavigate?.("landing");  return; }
    if (id === "explore")  { onNavigate?.("explore");  return; }
    if (id === "events")   { onNavigate?.("myevents"); return; }
    if (id === "scanner")  { onNavigate?.("scanner");  return; }
    if (id === "certs")    { onNavigate?.("certs");    return; }
    if (id === "notifs")   { onNavigate?.("notifs");   return; }
    setActiveNav(id);
  }

  return (
    <AppShell
      activeNav={activeNav}
      notifCount={3}
      studentName={profile?.fullName ?? "Sarah Chen"}
      studentId={profile?.id ?? "SCH-4421"}
      isGuest={isGuest}
      onNav={handleNav}
      onNavigate={onNavigate}
    >
      <main className="flex-1 overflow-auto" style={dotGrid}>
        <div className="px-4 sm:px-8 py-8 space-y-5">

          {/* ── Row 1: Next Up (2/3) + Summary cards (1/3) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Next Up — dominant card */}
            <motion.div
              className="col-span-1 lg:col-span-2 bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="h-[3px] bg-[#E2A23B]" />
              <div className="p-6">
                {/* Card header */}
                <div className="flex items-start justify-between mb-5">
                  <p className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Next Up</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#2E6B4C] rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C]" />
                    <span className="text-[9px] text-[#2E6B4C]" style={M}>Check-in Open</span>
                  </div>
                </div>

                {/* Content row */}
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[1.6rem] font-semibold text-[#1E1B16] mb-4 leading-[1.15]" style={F}>
                      Environmental Policy<br />Symposium
                    </h2>
                    <div className="space-y-2.5 mb-6">
                      <div className="flex items-center gap-2.5 text-sm text-[#6B6355]">
                        <Calendar size={13} strokeWidth={1.5} className="flex-shrink-0" />
                        November 14, 2024 · 9:00 – 11:30 AM
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-[#6B6355]">
                        <MapPin size={13} strokeWidth={1.5} className="flex-shrink-0" />
                        Whitman Hall, Room 204
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-[#6B6355]">
                        <GraduationCap size={13} strokeWidth={1.5} className="flex-shrink-0" />
                        Prof. Andrei Volkov · Environmental Science
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onNavigate?.("scanner", previewEvents[0]?.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors"
                      >
                        <QrCode size={13} strokeWidth={1.5} />
                        Check In via QR
                      </button>
                      <button
                        onClick={() => onNavigate?.("details", previewEvents[0]?.id)}
                        className="px-5 py-2.5 text-sm text-[#6B6355] border border-[#DCD4C2] rounded-[7px] hover:border-[#1E1B16]/30 transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>

                  {/* QR code preview */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className="p-3 border border-[#DCD4C2] rounded-[7px] bg-white">
                      <MockQR size={100} />
                    </div>
                    <span className="text-[8px] text-[#6B6355]" style={M}>ENV-POL-2024</span>
                  </div>
                </div>
              </div>

              {/* Footer strip */}
              <div className="border-t border-[#DCD4C2] bg-[#F6F1E7] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] text-[#6B6355]" style={M}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C]" />
                  47 registered · Certificate issued on verified attendance
                </div>
                <span className="text-[9px] text-[#6B6355]" style={M}>#FB-2024-0891</span>
              </div>
            </motion.div>

            {/* Summary column */}
            <div className="col-span-1 flex flex-col gap-5">

              {/* My Events summary */}
              <motion.div
                className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.07 }}
              >
                <div className="px-5 py-4 border-b border-[#DCD4C2]">
                  <p className="text-[9px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>My Events</p>
                  <div className="text-4xl font-light text-[#1E1B16] leading-none" style={F}>
                    4<span className="text-[#E2A23B] text-3xl">+</span>
                  </div>
                </div>
                <div className="px-5 py-3 space-y-2.5">
                  {[
                    { name: "Environmental Policy Symposium", date: "Nov 14" },
                    { name: "Design Thinking Workshop",       date: "Nov 8"  },
                    { name: "Leadership Primer Workshop",     date: "Nov 5"  },
                  ].map((ev) => (
                    <div key={ev.name} className="flex items-start gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C] flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-[#1E1B16] leading-snug truncate">{ev.name}</div>
                        <div className="text-[8px] text-[#6B6355]" style={M}>{ev.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#DCD4C2] px-5 py-2.5">
                  <button className="text-xs text-[#6B6355] hover:text-[#1E1B16] transition-colors">
                    View all events →
                  </button>
                </div>
              </motion.div>

              {/* Certificates summary */}
              <motion.div
                className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.14 }}
              >
                <div className="px-5 py-4 border-b border-[#DCD4C2] flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[9px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>Certificates</p>
                    <div className="text-4xl font-light text-[#1E1B16] leading-none" style={F}>3</div>
                  </div>
                  <CertificateSeal size={44} rotate={-8} delay={0.5} />
                </div>
                <div className="px-5 py-3">
                  <div className="text-[10px] font-semibold text-[#1E1B16] leading-snug mb-0.5" style={F}>
                    Environmental Policy Symposium
                  </div>
                  <div className="text-[9px] text-[#6B6355] mb-2" style={M}>
                    CERT-FB-2024-089142 · Nov 14
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#2E6B4C] rounded-full">
                    <span className="w-1 h-1 rounded-full bg-[#2E6B4C]" />
                    <span className="text-[7px] text-[#2E6B4C]" style={M}>Verified</span>
                  </div>
                </div>
                <div className="border-t border-[#DCD4C2] px-5 py-2.5">
                  <button className="text-xs text-[#6B6355] hover:text-[#1E1B16] transition-colors">
                    Download latest →
                  </button>
                </div>
              </motion.div>

            </div>
          </div>

          {/* ── Row 2: Explore (1/3) + Notifications (2/3) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Explore preview */}
            <motion.div
              className="col-span-1 bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.21 }}
            >
              <div className="px-5 py-4 border-b border-[#DCD4C2] flex items-center justify-between">
                <p className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Explore</p>
                <Compass size={13} className="text-[#6B6355]" strokeWidth={1.5} />
              </div>
              {previewEvents.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-[10px] text-[#9C8E7E]" style={M}>No published events yet.</p>
                </div>
              ) : previewEvents.map((ev, i, arr) => (
                <div key={ev.id} className={`px-5 py-3.5 ${i < arr.length - 1 ? "border-b border-[#DCD4C2]" : ""}`}>
                  <div className="text-xs font-medium text-[#1E1B16] leading-snug mb-1" style={F}>{ev.title}</div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-[#6B6355]" style={M}>{ev.dept}</span>
                    <span className="text-[9px] text-[#6B6355]" style={M}>{ev.date}</span>
                  </div>
                  <span className="text-[8px] text-[#2E6B4C]" style={M}>{ev.spots} spots left</span>
                </div>
              ))}
              <div className="border-t border-[#DCD4C2] px-5 py-2.5">
                <button className="text-xs text-[#6B6355] hover:text-[#1E1B16] transition-colors">
                  Browse all events →
                </button>
              </div>
            </motion.div>

            {/* Notifications strip */}
            <motion.div
              className="col-span-1 lg:col-span-2 bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.28 }}
            >
              <div className="px-5 py-4 border-b border-[#DCD4C2] flex items-center justify-between">
                <p className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Recent Activity</p>
                <span className="text-[9px] text-[#6B6355]" style={M}>3 unread</span>
              </div>
              {[
                {
                  icon: Award,
                  text: "Certificate issued for Design Thinking Workshop.",
                  meta: "CERT-FB-2024-089098",
                  time: "2h ago",
                  unread: true,
                },
                {
                  icon: Calendar,
                  text: "Reminder: Environmental Policy Symposium tomorrow at 9:00 AM.",
                  meta: "ENV-POL-2024",
                  time: "5h ago",
                  unread: true,
                },
                {
                  icon: Compass,
                  text: "Urban Ecology Workshop registration is now open — 12 spots remain.",
                  meta: "BIO-ECO-2024",
                  time: "Yesterday",
                  unread: true,
                },
                {
                  icon: Check,
                  text: "Attendance confirmed: Leadership Primer Workshop.",
                  meta: "LDR-PRM-2024",
                  time: "Nov 5",
                  unread: false,
                },
              ].map(({ icon: Icon, text, meta, time, unread }, i, arr) => (
                <div
                  key={i}
                  className={`px-5 py-4 flex items-start gap-3.5 ${i < arr.length - 1 ? "border-b border-[#DCD4C2]" : ""}`}
                >
                  <div className="w-7 h-7 rounded-[5px] border border-[#DCD4C2] bg-[#F6F1E7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon
                      size={13}
                      strokeWidth={1.5}
                      style={{ color: unread ? "#E2A23B" : "#6B6355" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed mb-0.5 ${unread ? "text-[#1E1B16]" : "text-[#6B6355]"}`}>
                      {text}
                    </p>
                    <span className="text-[8px] text-[#6B6355]" style={M}>{meta}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                    <span className="text-[9px] text-[#6B6355]" style={M}>{time}</span>
                    {unread && <span className="w-1.5 h-1.5 rounded-full bg-[#E2A23B] flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </main>
    </AppShell>
  );
}

// ─── Explore Events data ──────────────────────────────────────────────────────
// EventItem is now StudentEventCard (real events-table rows, resolved with
// the organizer's display name) — see src/lib/events.ts. The
// EXPLORE_EVENTS mock array that used to live here is gone; ExploreScreen
// and EventDetailScreen below fetch real data via listStudentExploreEvents()
// / getStudentEventById(), both scoped by the events_select_public RLS
// policy (status in published/live/completed).
type EventItem = StudentEventCard;

const CATEGORIES   = ["All", "Academic", "Workshop", "Leadership", "Career", "Research"] as const;
const DATE_OPTIONS = ["All Dates", "This Week", "This Month", "Next Month"] as const;

// ─── Event card ───────────────────────────────────────────────────────────────
export function EventCard({
  ev,
  registered,
  onRegister,
  onView,
  isGuest,
}: {
  ev: EventItem;
  registered: boolean;
  onRegister: () => void;
  onView?: () => void;
  isGuest?: boolean;
}) {
  const spotsLow = ev.spots <= 10;

  return (
    <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden flex flex-col h-full">

      {/* Card header strip */}
      <div className="px-4 py-2.5 bg-[#F6F1E7] border-b border-[#DCD4C2] flex items-center justify-between">
        <span
          className="text-[8px] tracking-widest uppercase text-[#6B6355] px-2 py-0.5 border border-[#DCD4C2] rounded-full"
          style={M}
        >
          {ev.category}
        </span>
        {ev.live ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C]" />
            <span className="text-[8px] text-[#2E6B4C]" style={M}>Live now</span>
          </div>
        ) : (
          <span className="text-[8px] text-[#DCD4C2]" style={M}>{ev.code}</span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pt-4 pb-3 flex flex-col gap-3">
        <h3
          className={`text-[0.95rem] font-semibold text-[#1E1B16] leading-snug ${onView ? "cursor-pointer hover:underline decoration-1 underline-offset-2" : ""}`}
          style={F}
          onClick={onView}
        >
          {ev.title}
        </h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#6B6355]">
            <Calendar size={11} strokeWidth={1.5} className="flex-shrink-0" />
            <span>{ev.date} · {ev.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B6355]">
            <MapPin size={11} strokeWidth={1.5} className="flex-shrink-0" />
            <span className="truncate">{ev.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B6355]">
            <GraduationCap size={11} strokeWidth={1.5} className="flex-shrink-0" />
            <span className="truncate">{ev.dept} · {ev.organizer}</span>
          </div>
        </div>

        {/* Spots bar */}
        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[9px] ${spotsLow ? "text-[#B5432E]" : "text-[#6B6355]"}`}
              style={M}
            >
              {spotsLow ? `Only ${ev.spots} spots left` : `${ev.spots} of ${ev.capacity} spots remaining`}
            </span>
          </div>
          <div className="h-[2px] bg-[#DCD4C2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E2A23B] rounded-full"
              style={{ width: `${Math.round((1 - ev.spots / ev.capacity) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action area */}
      {registered ? (
        <div
          className={`border-t border-[#DCD4C2] bg-[#F6F1E7] px-4 py-3 flex items-center justify-between ${onView ? "cursor-pointer hover:bg-[#F0EBE0] transition-colors" : ""}`}
          onClick={onView}
          title={onView ? "View details" : undefined}
        >
          <div>
            <div className="text-[9px] font-medium text-[#2E6B4C]" style={M}>Registered</div>
            <div className="text-[8px] text-[#6B6355]" style={M}>{ev.code}</div>
          </div>
          <CertificateSeal size={44} rotate={-9} delay={0.15} />
        </div>
      ) : (
        <div className="border-t border-[#DCD4C2] px-4 py-3 space-y-2">
          <button
            onClick={onRegister}
            disabled={isGuest}
            title={isGuest ? "Disabled in guest mode" : undefined}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Register <ArrowRight size={12} />
          </button>
          {onView && (
            <button
              onClick={onView}
              className="w-full text-center text-[9px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
              style={M}
            >
              View details →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Event detail supplementary data ─────────────────────────────────────────
const EVENT_DETAILS: Record<string, {
  description: string;
  agenda: { time: string; item: string }[];
}> = {
  "1": {
    description: "Join leading faculty, graduate researchers, and policy experts for a morning symposium on contemporary environmental policy. Sessions cover federal land-use reform, campus carbon-reduction pledges, and the role of university research in shaping state-level climate legislation.",
    agenda: [
      { time: "9:00 AM",  item: "Opening Remarks — Dean of Environmental Science" },
      { time: "9:20 AM",  item: "Keynote: Federal Land Use in the Next Decade" },
      { time: "10:00 AM", item: "Panel: Universities as Policy Labs" },
      { time: "10:45 AM", item: "Q&A and Open Discussion" },
      { time: "11:15 AM", item: "Networking & Coffee" },
    ],
  },
  "2": {
    description: "A hands-on field and lab workshop exploring urban ecosystem dynamics. Participants conduct transect surveys of campus green spaces, analyze biodiversity data, and present findings to a peer review panel led by Dr. Priya Mehta.",
    agenda: [
      { time: "2:00 PM",  item: "Orientation & Safety Briefing" },
      { time: "2:30 PM",  item: "Field Survey — Campus Green Spaces" },
      { time: "3:30 PM",  item: "Lab Analysis & Data Processing" },
      { time: "4:30 PM",  item: "Peer Presentations" },
      { time: "5:00 PM",  item: "Close" },
    ],
  },
  "3": {
    description: "The annual Leadership Summit brings together student organization leaders, faculty mentors, and guest executives for a full-day program of breakout workshops, keynote addresses, and structured networking designed to build lasting campus leadership capacity.",
    agenda: [
      { time: "10:00 AM", item: "Registration & Morning Coffee" },
      { time: "10:30 AM", item: "Opening Keynote: Leading with Intention" },
      { time: "12:00 PM", item: "Lunch Break" },
      { time: "1:00 PM",  item: "Breakout Workshops (4 tracks)" },
      { time: "2:30 PM",  item: "Guest Speaker: Alumni Executive Panel" },
      { time: "3:30 PM",  item: "Structured Networking" },
      { time: "4:00 PM",  item: "Close" },
    ],
  },
  "4": {
    description: "An interdisciplinary panel examining the ethical dimensions of artificial intelligence in academic settings — from plagiarism detection and admissions algorithms to faculty surveillance and research integrity. Co-hosted by Computer Science and Philosophy.",
    agenda: [
      { time: "4:00 PM",  item: "Introduction & Framing" },
      { time: "4:15 PM",  item: "Panel: AI and Academic Integrity" },
      { time: "5:00 PM",  item: "Panel: Algorithmic Admissions" },
      { time: "5:30 PM",  item: "Open Q&A" },
      { time: "6:00 PM",  item: "Close" },
    ],
  },
  "5": {
    description: "Learn and apply the five-stage Design Thinking methodology to a real campus challenge. Teams work through empathy mapping, ideation, prototyping, and user testing in a studio environment. Facilitated by the campus Design Lab.",
    agenda: [
      { time: "1:00 PM",  item: "Introduction to Design Thinking" },
      { time: "1:30 PM",  item: "Empathy Mapping" },
      { time: "2:15 PM",  item: "Ideation Session" },
      { time: "3:00 PM",  item: "Prototyping" },
      { time: "3:45 PM",  item: "User Testing & Feedback" },
      { time: "4:00 PM",  item: "Close" },
    ],
  },
  "6": {
    description: "An intensive, project-based bootcamp for aspiring founders. Teams form around shared problem statements, receive coaching from Startup Incubator mentors, and deliver five-minute pitches to a panel of investors and faculty judges.",
    agenda: [
      { time: "9:00 AM",  item: "Welcome & Team Formation" },
      { time: "10:00 AM", item: "Problem Statement Workshop" },
      { time: "11:30 AM", item: "Mentorship Roundtables" },
      { time: "12:30 PM", item: "Lunch Break" },
      { time: "1:30 PM",  item: "Build Session" },
      { time: "2:30 PM",  item: "Pitch Practice" },
      { time: "3:00 PM",  item: "Investor Pitches" },
      { time: "3:45 PM",  item: "Close" },
    ],
  },
  "7": {
    description: "A midday forum bringing together public health faculty, global NGO representatives, and student health advocates to examine pressing issues in global health equity — from pandemic preparedness to maternal care access in underserved regions.",
    agenda: [
      { time: "11:00 AM", item: "Welcome & Context-Setting" },
      { time: "11:15 AM", item: "Keynote: Pandemic Preparedness in 2030" },
      { time: "12:00 PM", item: "Panel: Maternal Health Access" },
      { time: "12:45 PM", item: "Lunch & Discussion" },
      { time: "1:15 PM",  item: "Student Research Spotlight" },
      { time: "2:00 PM",  item: "Close" },
    ],
  },
  "8": {
    description: "The Graduate School's annual winter showcase of doctoral and master's-level research. Poster sessions span all seven faculties; three oral presentations are selected by faculty committee for the keynote slot. Open to all students and faculty.",
    agenda: [
      { time: "9:00 AM",  item: "Registration & Morning Coffee" },
      { time: "9:30 AM",  item: "Selected Keynote Research Presentation" },
      { time: "10:30 AM", item: "Poster Sessions — Round 1" },
      { time: "12:00 PM", item: "Lunch Break" },
      { time: "1:00 PM",  item: "Poster Sessions — Round 2" },
      { time: "3:00 PM",  item: "Oral Presentations" },
      { time: "4:30 PM",  item: "Awards & Close" },
    ],
  },
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; color?: string }>> = {
  Academic:   GraduationCap,
  Workshop:   Settings,
  Leadership: Shield,
  Career:     BarChart3,
  Research:   BookMarked,
};

const CATEGORY_HERO: Record<string, string> = {
  Academic:   "linear-gradient(135deg, #1E1B16 0%, #1F3329 55%, #1E1B16 100%)",
  Workshop:   "linear-gradient(135deg, #1E1B16 0%, #2D1E0E 55%, #1A1510 100%)",
  Leadership: "linear-gradient(135deg, #1A2820 0%, #2E6B4C 55%, #1A2820 100%)",
  Career:     "linear-gradient(135deg, #1E1B16 0%, #2B1A0E 55%, #1E1B16 100%)",
  Research:   "linear-gradient(135deg, #1E1B16 0%, #141E2B 55%, #1E1B16 100%)",
};

// ─── Detail sub-components ────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={13} strokeWidth={1.5} className="text-[#6B6355] mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-[8px] uppercase tracking-widest text-[#6B6355] mb-0.5" style={M}>{label}</div>
        <div className="text-sm text-[#1E1B16]">{value}</div>
      </div>
    </div>
  );
}

function RelatedEventMini({
  ev,
  onView,
}: {
  ev: EventItem;
  onView: () => void;
}) {
  return (
    <button
      onClick={onView}
      className="w-full text-left bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] p-4 hover:border-[#1E1B16]/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <h4 className="text-sm font-semibold text-[#1E1B16] leading-snug" style={F}>{ev.title}</h4>
        <ChevronRight size={13} className="text-[#DCD4C2] flex-shrink-0 mt-0.5" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-[#6B6355]">
          <Calendar size={10} strokeWidth={1.5} className="flex-shrink-0" />
          <span>{ev.date}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B6355]">
          <MapPin size={10} strokeWidth={1.5} className="flex-shrink-0" />
          <span className="truncate">{ev.venue}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Event detail screen ──────────────────────────────────────────────────────
export function EventDetailScreen({
  eventId,
  onNavigate,
  isGuest,
  profile,
}: {
  eventId: string;
  onNavigate: (s: Screen, payload?: string) => void;
  isGuest?: boolean;
  profile?: AuthedProfile | null;
}) {
  const [ev, setEv] = useState<EventItem | null>(null);
  const [related, setRelated] = useState<EventItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [detailResult, listResult] = await Promise.all([
        getStudentEventById(eventId),
        listStudentExploreEvents(),
      ]);
      if (cancelled) return;
      if (detailResult.status === "error") {
        setLoadError(detailResult.message);
        return;
      }
      setEv(detailResult.event);
      if (listResult.status === "success") {
        setRelated(
          listResult.events
            .filter(e => e.category === detailResult.event.category && e.id !== detailResult.event.id)
            .slice(0, 3)
        );
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  const details = ev ? EVENT_DETAILS[ev.id] : undefined;
  const spotsLow = ev ? ev.spots <= 10 : false;

  const CategoryIcon = ev ? (CATEGORY_ICONS[ev.category] ?? Compass) : Compass;
  const heroGradient = ev ? (CATEGORY_HERO[ev.category] ?? CATEGORY_HERO["Academic"]) : CATEGORY_HERO["Academic"];

  const backButton = (
    <button
      onClick={() => onNavigate("explore")}
      className="flex items-center gap-1.5 text-sm text-[#6B6355] hover:text-[#1E1B16] transition-colors"
    >
      <ArrowLeft size={14} strokeWidth={1.5} />
      <span>Explore Events</span>
    </button>
  );

  const shellNav = (id: string) => {
    if (id === "profile")   { onNavigate("profile");   return; }
    if (id === "landing")   { onNavigate("landing");   return; }
    if (id === "dashboard") { onNavigate("dashboard"); return; }
    if (id === "explore")   { onNavigate("explore");   return; }
    if (id === "events")    { onNavigate("myevents");  return; }
    if (id === "certs")     { onNavigate("certs");     return; }
    if (id === "notifs")    { onNavigate("notifs");    return; }
  };

  if (loadError || !ev) {
    return (
      <AppShell
        activeNav="explore"
        notifCount={3}
        studentName={profile?.fullName ?? "Sarah Chen"}
        studentId={profile?.id ?? "SCH-4421"}
        isGuest={isGuest}
        topBarLeft={backButton}
        onNav={shellNav}
        onNavigate={onNavigate}
      >
        <main className="flex-1 overflow-auto bg-[#F6F1E7] flex items-center justify-center">
          <p className="text-sm text-[#6B6355]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
            {loadError ? `Couldn't load this event: ${loadError}` : "Loading event…"}
          </p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeNav="explore"
      notifCount={3}
      studentName={profile?.fullName ?? "Sarah Chen"}
      studentId={profile?.id ?? "SCH-4421"}
      isGuest={isGuest}
      topBarLeft={backButton}
      onNav={shellNav}
      onNavigate={onNavigate}
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]">

        {/* ── Hero banner ── */}
        <div
          className="relative h-[260px] overflow-hidden flex-shrink-0"
          style={{ background: heroGradient }}
        >
          {/* Dot texture overlay */}
          <div className="absolute inset-0 opacity-25" style={dotGrid} />

          {/* Decorative category icon */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
            <CategoryIcon size={200} strokeWidth={0.5} color="#F6F1E7" style={{ opacity: 0.06 }} />
          </div>

          {/* Horizontal rule accent */}
          <div
            className="absolute left-0 right-0 bottom-0 h-px opacity-20"
            style={{ background: "linear-gradient(90deg, transparent, #E2A23B 40%, #E2A23B 60%, transparent)" }}
          />

          {/* Bottom scrim */}
          <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(30,27,22,0.75) 0%, transparent 100%)" }}
          />

          {/* Overlaid content */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-7 space-y-2.5">
            <div className="flex items-center gap-2.5">
              {ev.live && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2E6B4C]/60 bg-[#2E6B4C]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F6F1E7]" />
                  <span className="text-[8px] text-[#F6F1E7]" style={M}>Live now</span>
                </div>
              )}
              <span
                className="text-[8px] tracking-widest uppercase text-[#F6F1E7]/60 px-2.5 py-1 border border-[#F6F1E7]/15 rounded-full"
                style={M}
              >
                {ev.category}
              </span>
              <span className="text-[8px] text-[#F6F1E7]/40" style={M}>{ev.code}</span>
            </div>
            <h1 className="text-[1.6rem] font-semibold text-[#F6F1E7] leading-snug max-w-2xl" style={F}>
              {ev.title}
            </h1>
            <p className="text-sm text-[#F6F1E7]/55">{ev.dept} · {ev.organizer}</p>
          </div>
        </div>

        {/* ── Body: two-column ── */}
        <div style={dotGrid} className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row gap-8 items-start">

            {/* Left: info + description + agenda */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Info card */}
              <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] p-5 space-y-4">
                <h2 className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>Event Information</h2>
                <div className="space-y-3.5">
                  <InfoRow icon={Calendar}      label="Date & Time" value={`${ev.date} · ${ev.time}`} />
                  <InfoRow icon={MapPin}         label="Venue"       value={ev.venue} />
                  <InfoRow icon={GraduationCap}  label="Department"  value={ev.dept} />
                  <InfoRow icon={Shield}         label="Organizer"   value={ev.organizer} />
                </div>
                {/* Seats */}
                <div className="pt-1 border-t border-[#DCD4C2]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] ${spotsLow ? "text-[#B5432E] font-medium" : "text-[#6B6355]"}`}
                      style={M}
                    >
                      {spotsLow
                        ? `Only ${ev.spots} spots remaining — register soon`
                        : `${ev.spots} of ${ev.capacity} spots available`}
                    </span>
                    <span className="text-[9px] text-[#DCD4C2]" style={M}>
                      {Math.round((1 - ev.spots / ev.capacity) * 100)}% full
                    </span>
                  </div>
                  <div className="h-[2px] bg-[#DCD4C2] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${spotsLow ? "bg-[#B5432E]" : "bg-[#E2A23B]"}`}
                      style={{ width: `${Math.round((1 - ev.spots / ev.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Description card */}
              {details && (
                <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] p-5 space-y-3">
                  <h2 className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>About this Event</h2>
                  <p className="text-sm text-[#1E1B16] leading-relaxed">{details.description}</p>
                </div>
              )}

              {/* Agenda card */}
              {details && details.agenda.length > 0 && (
                <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={12} strokeWidth={1.5} className="text-[#6B6355]" />
                    <h2 className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>Schedule</h2>
                  </div>
                  <div className="space-y-0">
                    {details.agenda.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 py-3 border-b border-[#DCD4C2] last:border-b-0"
                      >
                        <span
                          className="w-[72px] flex-shrink-0 text-[9px] text-[#6B6355] pt-0.5"
                          style={M}
                        >
                          {a.time}
                        </span>
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span className="w-1 h-1 rounded-full bg-[#E2A23B] flex-shrink-0 mt-1.5" />
                          <span className="text-sm text-[#1E1B16]">{a.item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate note */}
              <div className="flex items-start gap-3 px-4 py-3.5 border border-[#DCD4C2] rounded-[8px] bg-[#FCFAF3]">
                <Award size={14} strokeWidth={1.5} className="text-[#E2A23B] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#6B6355] leading-relaxed">
                  Attendance at this event earns a <span className="text-[#1E1B16] font-medium">Fieldbook certificate of participation</span>, recorded to your ledger and available for download after check-in is confirmed.
                </p>
              </div>

            </div>

            {/* Right: sticky action card */}
            <div className="w-full md:w-72 md:flex-shrink-0">
              <div className="sticky top-6 bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden">
                <AnimatePresence mode="wait">
                  {registered ? (
                    <motion.div
                      key="qr-pass"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      {/* Registered header */}
                      <div className="px-5 pt-5 pb-4 border-b border-[#DCD4C2] flex items-center justify-between">
                        <div>
                          <div className="text-[8px] font-medium text-[#2E6B4C] mb-0.5" style={M}>Registered</div>
                          <div className="text-base font-semibold text-[#1E1B16]" style={F}>Your QR Pass</div>
                        </div>
                        <CertificateSeal size={52} rotate={-10} delay={0.2} />
                      </div>
                      {/* QR code */}
                      <div className="px-5 py-5 flex flex-col items-center gap-4">
                        <div className="p-4 bg-[#F6F1E7] border border-[#DCD4C2] rounded-[8px]">
                          <MockQR size={120} />
                        </div>
                        <div className="text-center space-y-0.5">
                          <div className="text-[8px] text-[#6B6355]" style={M}>Access Code</div>
                          <div className="text-sm font-semibold text-[#1E1B16] tracking-wider" style={M}>{ev.code}</div>
                        </div>
                        <p className="text-[8px] text-[#6B6355] text-center leading-relaxed">
                          Show this QR code at the venue entrance. Check-in logs your attendance automatically.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      {/* Register header */}
                      <div className="px-5 pt-5 pb-4 border-b border-[#DCD4C2]">
                        <div className="text-base font-semibold text-[#1E1B16] mb-1" style={F}>Secure your spot</div>
                        <div className={`text-[9px] ${spotsLow ? "text-[#B5432E] font-medium" : "text-[#6B6355]"}`} style={M}>
                          {spotsLow
                            ? `Only ${ev.spots} spots left — act fast`
                            : `${ev.spots} of ${ev.capacity} spots available`}
                        </div>
                      </div>
                      <div className="px-5 py-5 space-y-4">
                        {/* Spots bar */}
                        <div>
                          <div className="h-[2px] bg-[#DCD4C2] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${spotsLow ? "bg-[#B5432E]" : "bg-[#E2A23B]"}`}
                              style={{ width: `${Math.round((1 - ev.spots / ev.capacity) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-[8px] text-[#DCD4C2]" style={M}>0</span>
                            <span className="text-[8px] text-[#DCD4C2]" style={M}>{ev.capacity}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setRegistered(true)}
                          disabled={isGuest}
                          title={isGuest ? "Disabled in guest mode" : undefined}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#E2A23B] text-[#1E1B16] font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Register now <ArrowRight size={13} />
                        </button>
                        <p className="text-[8px] text-[#6B6355] text-center leading-relaxed">
                          A QR pass is issued instantly. Your attendance is recorded in your Fieldbook ledger.
                        </p>
                        <div className="flex items-center gap-2 pt-1 border-t border-[#DCD4C2]">
                          <Check size={11} strokeWidth={2} className="text-[#2E6B4C] flex-shrink-0" />
                          <span className="text-[8px] text-[#6B6355]" style={M}>Earns a certificate of participation</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        {/* ── Related events strip ── */}
        {related.length > 0 && (
          <div className="border-t border-[#DCD4C2] bg-[#F6F1E7]">
            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-5">
              <div className="flex items-center gap-2.5">
                <Compass size={13} strokeWidth={1.5} className="text-[#6B6355]" />
                <h3 className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>
                  More {ev.category} Events
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.07, ease: "easeOut" }}
                  >
                    <RelatedEventMini
                      ev={r}
                      onView={() => onNavigate("details", r.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </AppShell>
  );
}

// ─── Explore Events screen ────────────────────────────────────────────────────
export function ExploreScreen({
  onNavigate,
  onViewDetail,
  isGuest,
  profile,
}: {
  onNavigate: (s: Screen) => void;
  onViewDetail?: (id: string) => void;
  isGuest?: boolean;
  profile?: AuthedProfile | null;
}) {
  const [query,       setQuery]       = useState("");
  const [category,   setCategory]    = useState("All");
  const [dateFilter, setDateFilter]   = useState("All Dates");
  const [liveOnly,   setLiveOnly]     = useState(false);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount]   = useState(6);
  const [activeNav, setActiveNav]     = useState("explore");

  // Real events (events_select_public RLS — published/live/completed),
  // replacing the EXPLORE_EVENTS mock array.
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEventsLoading(true);
      const result = await listStudentExploreEvents();
      if (cancelled) return;
      setEventsLoading(false);
      if (result.status === "error") { setEventsError(result.message); return; }
      setEventsError(null);
      setEvents(result.events);
    })();
    return () => { cancelled = true; };
  }, []);

  function handleNav(id: string) {
    if (id === "profile")   { onNavigate("profile");   return; }
    if (id === "landing")   { onNavigate("landing");   return; }
    if (id === "dashboard") { onNavigate("dashboard");  return; }
    if (id === "events")    { onNavigate("myevents");   return; }
    if (id === "scanner")   { onNavigate("scanner");    return; }
    if (id === "certs")     { onNavigate("certs");      return; }
    if (id === "notifs")    { onNavigate("notifs");     return; }
    setActiveNav(id);
  }

  function matchesDate(date: string) {
    if (dateFilter === "All Dates") return true;
    const thisWeekPrefixes = ["Nov 14", "Nov 15", "Nov 16", "Nov 17", "Nov 18", "Nov 19", "Nov 20"];
    if (dateFilter === "This Week")   return thisWeekPrefixes.some(d => date.startsWith(d));
    if (dateFilter === "This Month")  return date.includes("Nov");
    if (dateFilter === "Next Month")  return date.includes("Dec");
    return true;
  }

  const filtered = events.filter(ev => {
    if (liveOnly && !ev.live) return false;
    if (category !== "All" && ev.category !== category) return false;
    if (!matchesDate(ev.date)) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q)     ||
        ev.dept.toLowerCase().includes(q)       ||
        ev.organizer.toLowerCase().includes(q)  ||
        ev.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const hasActiveFilters = query.trim() !== "" || category !== "All" || dateFilter !== "All Dates" || liveOnly;

  function clearFilters() {
    setQuery(""); setCategory("All"); setDateFilter("All Dates"); setLiveOnly(false); setVisibleCount(6);
  }

  const topSearch = (
    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] w-72">
      <Search size={13} strokeWidth={1.5} className="text-[#6B6355] flex-shrink-0" />
      <input
        type="search"
        value={query}
        onChange={e => { setQuery(e.target.value); setVisibleCount(6); }}
        placeholder="Search events, departments…"
        className="flex-1 min-w-0 bg-transparent text-sm text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none"
      />
    </div>
  );

  return (
    <AppShell
      activeNav={activeNav}
      notifCount={3}
      studentName={profile?.fullName ?? "Sarah Chen"}
      studentId={profile?.id ?? "SCH-4421"}
      isGuest={isGuest}
      onNav={handleNav}
      onNavigate={onNavigate}
      topBarLeft={topSearch}
    >
      <main className="flex-1 overflow-auto" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7 space-y-5">

          {/* ── Filter bar ── */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category pills */}
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setVisibleCount(6); }}
                className={`px-3 py-1 text-[9px] tracking-widest uppercase rounded-full border transition-colors ${
                  category === cat
                    ? "bg-[#1E1B16] text-[#F6F1E7] border-[#1E1B16]"
                    : "bg-[#FCFAF3] text-[#6B6355] border-[#DCD4C2] hover:border-[#1E1B16]/30 hover:text-[#1E1B16]"
                }`}
                style={M}
              >
                {cat}
              </button>
            ))}

            <div className="h-4 w-px bg-[#DCD4C2] mx-0.5" />

            {/* Date pills */}
            {DATE_OPTIONS.map(df => (
              <button
                key={df}
                onClick={() => { setDateFilter(df); setVisibleCount(6); }}
                className={`px-3 py-1 text-[9px] rounded-full border transition-colors ${
                  dateFilter === df
                    ? "bg-[#1E1B16] text-[#F6F1E7] border-[#1E1B16]"
                    : "bg-[#FCFAF3] text-[#6B6355] border-[#DCD4C2] hover:border-[#1E1B16]/30 hover:text-[#1E1B16]"
                }`}
                style={M}
              >
                {df}
              </button>
            ))}

            <div className="h-4 w-px bg-[#DCD4C2] mx-0.5" />

            {/* Live now toggle */}
            <button
              onClick={() => { setLiveOnly(v => !v); setVisibleCount(6); }}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] transition-colors ${
                liveOnly
                  ? "border-[#2E6B4C] text-[#2E6B4C] bg-[#FCFAF3]"
                  : "border-[#DCD4C2] text-[#6B6355] bg-[#FCFAF3] hover:border-[#1E1B16]/30 hover:text-[#1E1B16]"
              }`}
              style={M}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${liveOnly ? "bg-[#2E6B4C]" : "bg-[#DCD4C2]"}`} />
              Live now
            </button>
          </div>

          {/* ── Results meta ── */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#6B6355]" style={M}>
              {filtered.length} {filtered.length === 1 ? "event" : "events"} found
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[9px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                style={M}
              >
                Clear all filters ×
              </button>
            )}
          </div>

          {/* ── Loading state ── */}
          {eventsLoading && (
            <div className="py-20 flex items-center justify-center">
              <RefreshCw size={18} strokeWidth={1.5} className="text-[#9C8E7E] animate-spin" />
            </div>
          )}

          {/* ── Error state ── */}
          {!eventsLoading && eventsError && (
            <div className="py-20 flex flex-col items-center text-center">
              <p className="text-sm text-[#B5432E]">Couldn't load events: {eventsError}</p>
            </div>
          )}

          {/* ── Empty state ── */}
          {!eventsLoading && !eventsError && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="py-20 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 border border-[#DCD4C2] rounded-[8px] flex items-center justify-center mb-5">
                <Compass size={20} strokeWidth={1.5} className="text-[#DCD4C2]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1E1B16] mb-2 leading-snug" style={F}>
                No events found.
              </h3>
              <p className="text-sm text-[#6B6355] mb-7 max-w-xs leading-relaxed">
                {events.length === 0
                  ? "No published events yet. Check back soon."
                  : "No events match your current search or filters. Try adjusting them or clearing everything."}
              </p>
              {events.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-5 py-2 border border-[#1E1B16]/25 rounded-[7px] text-sm text-[#1E1B16] hover:border-[#1E1B16]/50 transition-colors"
                >
                  Clear all filters <ArrowRight size={12} />
                </button>
              )}
            </motion.div>
          )}

          {/* ── Event card grid ── */}
          {!eventsLoading && visible.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {visible.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05, ease: "easeOut" }}
                  className="flex"
                >
                  <div className="flex-1">
                    <EventCard
                      ev={ev}
                      registered={registeredIds.includes(ev.id)}
                      onRegister={() =>
                        setRegisteredIds(prev =>
                          prev.includes(ev.id) ? prev : [...prev, ev.id]
                        )
                      }
                      onView={onViewDetail ? () => onViewDetail(ev.id) : undefined}
                      isGuest={isGuest}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Load more ── */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                onClick={() => setVisibleCount(v => v + 6)}
                className="flex items-center gap-3 px-7 py-2.5 border border-[#DCD4C2] rounded-[7px] text-sm text-[#1E1B16] hover:border-[#1E1B16]/40 transition-colors"
              >
                Load more events
                <span className="text-[9px] text-[#6B6355]" style={M}>
                  {filtered.length - visibleCount} remaining
                </span>
              </button>
              <p className="text-[9px] text-[#DCD4C2]" style={M}>
                Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}
              </p>
            </div>
          )}

          {/* All loaded */}
          {!hasMore && filtered.length > 0 && (
            <p className="text-center text-[9px] text-[#DCD4C2]" style={M}>
              All {filtered.length} events shown
            </p>
          )}

        </div>
      </main>
    </AppShell>
  );
}

// ─── My Events screen ─────────────────────────────────────────────────────────
type MyRegisteredEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  code: string;
  checkInOpen?: boolean;
  checkInOpensAt?: string;
  attended?: boolean;
  certIssued?: boolean;
  // Id of the certificate_templates row to render this event's certificate
  // onto. The real `events` table has no template linkage yet (organizer
  // event-creation doesn't assign one) — this is a placeholder until that
  // exists. TEST_CERT_TEMPLATE_ID below is a one-off row seeded directly in
  // Supabase for local testing; do not treat this as how template
  // selection will work once events are wired to real data.
  certTemplateId?: string;
};

// One-off test fixture: a `certificate_templates` row named
// "TEST TEMPLATE - DELETE ME" inserted directly via the service-role key so
// the real /api/certificates/generate success path could be exercised
// end-to-end before events carry their own template id. Delete this
// constant (and the Supabase row it points to) once events have real
// template linkage.
const TEST_CERT_TEMPLATE_ID = "b7f12cf1-23fd-4161-8fd4-f186f79edef4";

const MY_UPCOMING: MyRegisteredEvent[] = [
  { id: "mu1", title: "Environmental Policy Symposium",      category: "Academic",   date: "Nov 14, 2024", time: "9:00 – 11:30 AM",    venue: "Whitman Hall, Rm 204",         code: "ENV-POL-2024",  checkInOpen: true  },
  { id: "mu2", title: "Leadership Summit 2024",              category: "Leadership", date: "Nov 22, 2024", time: "10:00 AM – 4:00 PM",  venue: "Student Union, Main Hall",     code: "LDR-SUM-2024",  checkInOpen: false, checkInOpensAt: "Nov 22, 10:00 AM" },
  { id: "mu3", title: "Tech Ethics Panel: AI in Academia",   category: "Academic",   date: "Nov 29, 2024", time: "4:00 – 6:00 PM",      venue: "Engineering Hall, Rm 101",     code: "TECH-ETH-2024", checkInOpen: false, checkInOpensAt: "Nov 29, 4:00 PM"  },
  { id: "mu4", title: "Entrepreneurship Bootcamp",           category: "Career",     date: "Dec 10, 2024", time: "9:00 AM – 3:00 PM",   venue: "Business Hall, Conf. Center",  code: "ENT-BTC-2024",  checkInOpen: false, checkInOpensAt: "Dec 10, 9:00 AM"  },
  { id: "mu5", title: "Winter Research Symposium",           category: "Research",   date: "Dec 18, 2024", time: "9:00 AM – 5:00 PM",   venue: "Library, Research Commons",    code: "WRS-2024",      checkInOpen: false, checkInOpensAt: "Dec 18, 9:00 AM"  },
];

const MY_PAST: MyRegisteredEvent[] = [
  { id: "mp1", title: "Campus Sustainability Forum",         category: "Academic",   date: "Oct 8, 2024",  time: "10:00 AM – 1:00 PM", venue: "Whitman Hall, Rm 101",          code: "SUS-FOR-2024",  attended: true,  certIssued: true  },
  { id: "mp2", title: "Research Methodology Bootcamp",       category: "Research",   date: "Oct 15, 2024", time: "9:00 AM – 3:00 PM",  venue: "Library, Study Room A",         code: "RES-MTH-2024",  attended: true,  certIssued: true  },
  { id: "mp3", title: "Foundations of Data Science",         category: "Workshop",   date: "Oct 24, 2024", time: "2:00 – 5:00 PM",     venue: "Engineering Hall, Lab 3",       code: "DATA-SCI-2024", attended: true,  certIssued: false, certTemplateId: TEST_CERT_TEMPLATE_ID },
  { id: "mp4", title: "Public Speaking Intensive",           category: "Workshop",   date: "Nov 1, 2024",  time: "1:00 – 4:00 PM",     venue: "Arts Building, Studio 1",       code: "SPK-INT-2024",  attended: true,  certIssued: false, certTemplateId: TEST_CERT_TEMPLATE_ID },
  { id: "mp5", title: "Social Impact Hackathon",             category: "Leadership", date: "Nov 7, 2024",  time: "9:00 AM – 6:00 PM",  venue: "Student Union, Ground Floor",   code: "SOC-HACK-2024", attended: false, certIssued: false },
];

function EventInfoMeta({ ev }: { ev: MyRegisteredEvent }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B6355]">
      <div className="flex items-center gap-1.5">
        <Calendar size={10} strokeWidth={1.5} className="flex-shrink-0" />
        <span>{ev.date} · {ev.time}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin size={10} strokeWidth={1.5} className="flex-shrink-0" />
        <span className="truncate max-w-[180px]">{ev.venue}</span>
      </div>
    </div>
  );
}

function UpcomingRow({
  ev,
  checkedIn,
  onCheckIn,
  isGuest,
}: {
  ev: MyRegisteredEvent;
  checkedIn: boolean;
  onCheckIn: () => void;
  isGuest?: boolean;
}) {
  return (
    <div className={`bg-[#FCFAF3] border rounded-[8px] px-5 py-4 flex items-center gap-5 transition-colors ${ev.checkInOpen && !checkedIn ? "border-[#2E6B4C]/40" : "border-[#1E1B16]/20"}`}>
      {/* Live pulse */}
      {ev.checkInOpen && !checkedIn && (
        <span className="w-2 h-2 rounded-full bg-[#2E6B4C] flex-shrink-0 ring-4 ring-[#2E6B4C]/15" />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[8px] tracking-widest uppercase text-[#6B6355] px-2 py-0.5 border border-[#DCD4C2] rounded-full" style={M}>
            {ev.category}
          </span>
          {ev.checkInOpen && (
            <span className="text-[8px] font-medium text-[#2E6B4C]" style={M}>Check-in open now</span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-[#1E1B16] leading-snug" style={F}>{ev.title}</h3>
        <EventInfoMeta ev={ev} />
      </div>

      {/* Code (hidden on small) */}
      <div className="hidden xl:block w-28 flex-shrink-0 space-y-0.5">
        <div className="text-[8px] text-[#DCD4C2]" style={M}>Event code</div>
        <div className="text-[9px] text-[#6B6355]" style={M}>{ev.code}</div>
      </div>

      {/* Action */}
      <div className="flex-shrink-0 min-w-[120px] flex justify-end">
        <AnimatePresence mode="wait">
          {checkedIn ? (
            <motion.div
              key="checked"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex items-center gap-1.5"
            >
              <Check size={13} strokeWidth={2.5} className="text-[#2E6B4C]" />
              <span className="text-xs font-medium text-[#2E6B4C]">Checked in</span>
            </motion.div>
          ) : ev.checkInOpen ? (
            <motion.button
              key="check-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCheckIn}
              disabled={isGuest}
              title={isGuest ? "Disabled in guest mode" : undefined}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E2A23B] text-[#1E1B16] text-xs font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <QrCode size={12} strokeWidth={1.5} />
              Check In
            </motion.button>
          ) : (
            <motion.div
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-right space-y-1"
            >
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px] cursor-not-allowed">
                <QrCode size={11} strokeWidth={1.5} className="text-[#DCD4C2]" />
                <span className="text-xs text-[#DCD4C2]">Check In</span>
              </div>
              <div className="text-[8px] text-[#DCD4C2] text-right" style={M}>Opens {ev.checkInOpensAt}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PastRow({
  ev,
  certGotten,
  certUrl,
  onGetCert,
  isGuest,
}: {
  ev: MyRegisteredEvent;
  certGotten: boolean;
  certUrl?: string;
  onGetCert: () => Promise<void>;
  isGuest?: boolean;
}) {
  const attended = ev.attended !== false;
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setErrorMessage(null);
    try {
      await onGetCert();
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Certificate generation failed.");
    }
  }

  return (
    <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] px-5 py-4 flex items-center gap-5">
      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[8px] tracking-widest uppercase text-[#6B6355] px-2 py-0.5 border border-[#DCD4C2] rounded-full" style={M}>
            {ev.category}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-[#1E1B16] leading-snug" style={F}>{ev.title}</h3>
        <EventInfoMeta ev={ev} />
      </div>

      {/* Status badge */}
      <div className="w-24 flex-shrink-0 flex justify-center">
        {attended ? (
          <span className="px-2.5 py-1 bg-[#2E6B4C] text-[#F6F1E7] text-[8px] tracking-wide rounded-full" style={M}>
            Attended
          </span>
        ) : (
          <span className="px-2.5 py-1 border border-[#B5432E] text-[#B5432E] text-[8px] tracking-wide rounded-full" style={M}>
            Missed
          </span>
        )}
      </div>

      {/* Certificate action */}
      <div className="w-48 flex-shrink-0 flex flex-col items-end gap-1">
        {!attended ? (
          <span className="text-base text-[#DCD4C2]">—</span>
        ) : (
          <AnimatePresence mode="wait">
            {certGotten ? (
              <motion.a
                key="cert-done"
                href={certUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                title={certUrl ? "View / download certificate" : undefined}
              >
                <CertificateSeal size={44} rotate={-9} delay={0.1} />
                <div className="space-y-0.5">
                  <div className="text-[8px] font-medium text-[#2E6B4C]" style={M}>Certificate Issued</div>
                  <div className="text-[8px] text-[#6B6355]" style={M}>{ev.code}</div>
                </div>
              </motion.a>
            ) : status === "loading" ? (
              <motion.div
                key="cert-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#1E1B16]/25 text-xs text-[#6B6355] rounded-[7px]"
              >
                <RefreshCw size={12} className="animate-spin" />
                Generating…
              </motion.div>
            ) : (
              <motion.button
                key="cert-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClick}
                disabled={isGuest}
                title={isGuest ? "Disabled in guest mode" : undefined}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#1E1B16]/25 text-xs text-[#1E1B16] rounded-[7px] hover:bg-[#F6F1E7] hover:border-[#1E1B16]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Award size={12} strokeWidth={1.5} className="text-[#E2A23B]" />
                Get Certificate
              </motion.button>
            )}
          </AnimatePresence>
        )}
        {status === "error" && errorMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] text-[#B5432E] text-right leading-snug max-w-[190px]"
            style={M}
          >
            {errorMessage}
          </motion.p>
        )}
      </div>
    </div>
  );
}

export function MyEventsScreen({
  onNavigate,
  onScanEvent,
  isGuest,
  profile,
}: {
  onNavigate: (s: Screen) => void;
  onScanEvent?: (eventId: string) => void;
  isGuest?: boolean;
  profile?: AuthedProfile | null;
}) {
  const [tab,          setTab]          = useState<"upcoming" | "past">("upcoming");
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);
  const [certGottenIds, setCertGottenIds] = useState<string[]>([]);
  // Maps event id -> the Storage URL certificate-service returned for it,
  // so PastRow can link straight to the generated PDF once issued.
  const [certUrls, setCertUrls] = useState<Record<string, string>>({});

  async function handleGetCertificate(ev: MyRegisteredEvent) {
    if (!ev.certTemplateId) {
      throw new Error("This event has no certificate template configured yet.");
    }

    const result = await generateCertificate({
      studentName: profile?.fullName ?? "Sarah Chen",
      eventTitle: ev.title,
      templateId: ev.certTemplateId,
      certificateCode: generateCertificateCode(),
      studentId: profile?.id,
    });

    if (result.status === "error") {
      throw new Error(result.message);
    }

    setCertUrls(prev => ({ ...prev, [ev.id]: result.certificateUrl }));
    setCertGottenIds(prev => [...prev, ev.id]);
    toast.success("Certificate issued", { description: "Your certificate is ready to view." });
  }

  function handleNav(id: string) {
    if (id === "profile")   { onNavigate("profile");   return; }
    if (id === "landing")   { onNavigate("landing");   return; }
    if (id === "dashboard") { onNavigate("dashboard"); return; }
    if (id === "explore")   { onNavigate("explore");   return; }
    if (id === "scanner")   { onNavigate("scanner");   return; }
    if (id === "certs")     { onNavigate("certs");     return; }
    if (id === "notifs")    { onNavigate("notifs");    return; }
  }

  const pageTitle = (
    <span className="text-sm font-semibold text-[#1E1B16]" style={F}>My Events</span>
  );

  return (
    <AppShell
      activeNav="events"
      notifCount={3}
      studentName={profile?.fullName ?? "Sarah Chen"}
      studentId={profile?.id ?? "SCH-4421"}
      isGuest={isGuest}
      onNav={handleNav}
      onNavigate={onNavigate}
      topBarLeft={pageTitle}
    >
      <main className="flex-1 overflow-auto" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7 space-y-6">

          {/* ── Page header ── */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-1" style={M}>Student Record</p>
              <h1 className="text-[1.4rem] font-semibold text-[#1E1B16] leading-tight" style={F}>My Events</h1>
            </div>

            {/* Tab switcher */}
            <div className="flex border border-[#DCD4C2] rounded-[7px] overflow-hidden flex-shrink-0">
              {(["upcoming", "past"] as const).map((t, i) => (
                <div key={t} className="flex">
                  {i > 0 && <div className="w-px bg-[#DCD4C2]" />}
                  <button
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-2 px-5 py-2 text-xs font-medium transition-colors ${
                      tab === t
                        ? "bg-[#1E1B16] text-[#F6F1E7]"
                        : "text-[#6B6355] hover:bg-[#F6F1E7] hover:text-[#1E1B16]"
                    }`}
                  >
                    {t === "upcoming" ? "Upcoming" : "Past"}
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                        tab === t ? "bg-[#F6F1E7]/15 text-[#F6F1E7]/70" : "bg-[#DCD4C2]/50 text-[#6B6355]"
                      }`}
                      style={M}
                    >
                      {t === "upcoming" ? MY_UPCOMING.length : MY_PAST.length}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Column labels ── */}
          <div className="flex items-center gap-5 px-5">
            <div className="flex-1 text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>Event</div>
            <div className="hidden xl:block w-28 text-[8px] tracking-widest uppercase text-[#6B6355] flex-shrink-0" style={M}>Code</div>
            {tab === "past" && <div className="w-24 text-[8px] tracking-widest uppercase text-[#6B6355] text-center flex-shrink-0" style={M}>Status</div>}
            <div className="w-48 text-[8px] tracking-widest uppercase text-[#6B6355] text-right flex-shrink-0" style={M}>
              {tab === "upcoming" ? "Check-in" : "Certificate"}
            </div>
          </div>

          {/* ── Tab content ── */}
          <AnimatePresence mode="wait">
            {tab === "upcoming" ? (
              <motion.div
                key="upcoming-tab"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {MY_UPCOMING.length === 0 ? (
                  <div className="py-20 flex flex-col items-center text-center">
                    <div className="w-12 h-12 border border-[#DCD4C2] rounded-[8px] flex items-center justify-center mb-5">
                      <Calendar size={20} strokeWidth={1.5} className="text-[#DCD4C2]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1E1B16] mb-2" style={F}>No upcoming events.</h3>
                    <p className="text-sm text-[#6B6355] mb-7 max-w-xs leading-relaxed">
                      {"You haven't registered for any upcoming events yet. Head to Explore to find something."}
                    </p>
                    <button
                      onClick={() => onNavigate("explore")}
                      className="flex items-center gap-2 px-5 py-2 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors"
                    >
                      Explore Events <ArrowRight size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {MY_UPCOMING.map((ev, i) => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.06, ease: "easeOut" }}
                      >
                        <UpcomingRow
                          ev={ev}
                          checkedIn={checkedInIds.includes(ev.id)}
                          onCheckIn={() => {
                            if (ev.checkInOpen && onScanEvent) {
                              onScanEvent(ev.id);
                            } else {
                              setCheckedInIds(p => [...p, ev.id]);
                            }
                          }}
                          isGuest={isGuest}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="past-tab"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {MY_PAST.length === 0 ? (
                  <div className="py-20 flex flex-col items-center text-center">
                    <div className="w-12 h-12 border border-[#DCD4C2] rounded-[8px] flex items-center justify-center mb-5">
                      <Award size={20} strokeWidth={1.5} className="text-[#DCD4C2]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1E1B16] mb-2" style={F}>No past events yet.</h3>
                    <p className="text-sm text-[#6B6355] max-w-xs leading-relaxed">
                      Attend an event to earn your first Fieldbook certificate of participation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {MY_PAST.map((ev, i) => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.06, ease: "easeOut" }}
                      >
                        <PastRow
                          ev={ev}
                          certGotten={certGottenIds.includes(ev.id) || !!ev.certIssued}
                          certUrl={certUrls[ev.id]}
                          onGetCert={() => handleGetCertificate(ev)}
                          isGuest={isGuest}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Footer tally ── */}
          <div className="flex items-center justify-between pt-2 border-t border-[#DCD4C2]">
            <span className="text-[8px] text-[#DCD4C2]" style={M}>
              {tab === "upcoming"
                ? `${MY_UPCOMING.length} upcoming registration${MY_UPCOMING.length !== 1 ? "s" : ""}`
                : `${MY_PAST.filter(e => e.attended !== false).length} attended · ${MY_PAST.filter(e => e.attended === false).length} missed`}
            </span>
            {tab === "past" && (
              <span className="text-[8px] text-[#DCD4C2]" style={M}>
                {MY_PAST.filter(e => e.attended !== false && (e.certIssued || certGottenIds.includes(e.id))).length} certificates issued
              </span>
            )}
          </div>

        </div>
      </main>
    </AppShell>
  );
}

// ─── QR Scanner / Attendance screen ──────────────────────────────────────────

/** Extracts the event code from a scanned QR value.
 *  Organizer QRs encode: "fieldbook:attendance:{EVENT_CODE}"
 *  Also accepts raw event codes directly (manual entry compatibility). */
function parseQrValue(raw: string): string | null {
  const trimmed = raw.trim();
  const prefix = "fieldbook:attendance:";
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length).toUpperCase() || null;
  }
  // Treat the raw value itself as a potential code if it looks like one
  if (/^[A-Z0-9-]{4,}$/i.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

type ScanPhase = "permission" | "scanning" | "detected" | "recording" | "success" | "error";

export function ScannerScreen({
  eventId,
  onNavigate,
  isGuest,
  profile,
}: {
  eventId?: string;
  onNavigate: (s: Screen) => void;
  isGuest?: boolean;
  profile?: AuthedProfile | null;
}) {
  const [phase, setPhase] = useState<ScanPhase>("permission");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [confirmedEv, setConfirmedEv] = useState<EventRow | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  const [timestamp, setTimestamp] = useState(() => {
    const now = new Date();
    const h = now.getHours();
    const mm = String(now.getMinutes()).padStart(2, "0");
    const h12 = h % 12 || 12;
    return `${h12}:${mm} ${h >= 12 ? "PM" : "AM"}`;
  });

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const scanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Camera lifecycle ──
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 720 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("scanning");
      scanningRef.current = true;
      requestScanFrame();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setCameraError("Camera permission denied. Please allow camera access to scan QR codes.");
      } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError(msg);
      }
      setPhase("permission");
    }
  }, []);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera on mount
  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ── Frame-by-frame QR scanning ──
  function requestScanFrame() {
    rafRef.current = requestAnimationFrame(scanFrame);
  }

  function scanFrame() {
    if (!scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      requestScanFrame();
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) { requestScanFrame(); return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

    if (qr && qr.data) {
      const code = parseQrValue(qr.data);
      if (code) {
        scanningRef.current = false;
        setDetectedCode(code);
        setPhase("detected");
        void processScannedCode(code);
        return;
      }
    }

    requestScanFrame();
  }

  // ── Process a decoded QR code ──
  async function processScannedCode(code: string) {
    const result = await getEventByCode(code);
    if (result.status === "error") {
      setAttendanceError("Invalid QR code. This doesn't match any active event.");
      setPhase("error");
      return;
    }
    await doRecordAttendance(result.event);
  }

  // ── Core attendance recording ──
  async function doRecordAttendance(event: EventRow) {
    if (!profile?.id) {
      setAttendanceError("You must be signed in to record attendance.");
      setConfirmedEv(event);
      setPhase("error");
      return;
    }

    if (event.status !== "published" && event.status !== "live") {
      setAttendanceError(
        event.status === "completed"
          ? "This event has ended. Attendance can no longer be recorded."
          : "This event is not yet available for attendance."
      );
      setConfirmedEv(event);
      setPhase("error");
      return;
    }

    setPhase("recording");
    setConfirmedEv(event);

    const result = await recordAttendance(profile.id, event.id);

    if (result.status === "success") {
      const now = new Date();
      const h = now.getHours();
      const mm = String(now.getMinutes()).padStart(2, "0");
      const h12 = h % 12 || 12;
      setTimestamp(`${h12}:${mm} ${h >= 12 ? "PM" : "AM"}`);
      setPhase("success");
    } else if (result.status === "duplicate") {
      setAttendanceError(result.message);
      setPhase("error");
    } else {
      setAttendanceError(result.message);
      setPhase("error");
    }
  }

  // ── Manual code submission ──
  async function handleManualSubmit() {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    setManualLoading(true);
    setManualError(null);
    stopCamera();

    const result = await getEventByCode(code);
    setManualLoading(false);

    if (result.status === "error") {
      setManualError(result.message);
      return;
    }
    await doRecordAttendance(result.event);
  }

  // ── Image upload QR decode ──
  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) return;
    stopCamera();
    setPhase("detected");
    setDetectedCode(null);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setAttendanceError("Could not process image. Try a different photo.");
      setPhase("error");
      URL.revokeObjectURL(img.src);
      return;
    }
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(img.src);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

    if (!qr || !qr.data) {
      setAttendanceError("No QR code found in this image. Please try another photo.");
      setPhase("error");
      return;
    }

    const code = parseQrValue(qr.data);
    if (!code) {
      setAttendanceError("QR code detected but it's not a valid Fieldbook attendance code.");
      setPhase("error");
      return;
    }

    setDetectedCode(code);
    await processScannedCode(code);
  }

  // ── Try again / reset ──
  function handleReset() {
    setPhase("permission");
    setAttendanceError(null);
    setManualError(null);
    setConfirmedEv(null);
    setDetectedCode(null);
    void startCamera();
  }

  // Display helpers
  const confirmedTitle = confirmedEv?.title ?? "";
  const confirmedVenue = confirmedEv?.venue ?? "Venue TBD";
  const confirmedDate = confirmedEv ? formatEventDate(confirmedEv.event_date) : "";
  const confirmedCode = confirmedEv?.code ?? "";

  return (
    <div className="min-h-screen bg-[#F6F1E7] flex flex-col" style={dotGrid}>

      {/* ── Top bar ── */}
      <header className="h-14 flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <BookMarked size={15} className="text-[#E2A23B]" strokeWidth={1.75} />
          <span className="text-base font-semibold text-[#1E1B16] tracking-tight" style={F}>Fieldbook</span>
        </div>
        <button
          onClick={() => { stopCamera(); onNavigate("myevents"); }}
          className="flex items-center gap-1.5 text-sm text-[#6B6355] hover:text-[#1E1B16] transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          <span className="hidden sm:inline">Back to Events</span>
        </button>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 py-5 sm:py-8 overflow-auto">
        <div className="w-full max-w-[400px] flex flex-col items-center gap-5">

          <AnimatePresence mode="wait">

            {/* ════ SCANNING / PERMISSION PHASE ════ */}
            {(phase === "scanning" || phase === "permission") && (
              <motion.div
                key="scanner-view"
                className="w-full flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {/* Title */}
                <div className="text-center">
                  <p className="text-[9px] tracking-widest uppercase text-[#6B6355] mb-1" style={M}>Attendance Scanner</p>
                  <h1 className="text-xl font-semibold text-[#1E1B16] leading-snug" style={F}>Scan Event QR</h1>
                </div>

                {/* Camera viewport */}
                <div
                  className="relative w-full aspect-square rounded-[12px] overflow-hidden"
                  style={{ background: "#0D0B09", maxWidth: 360 }}
                >
                  {/* Live video feed */}
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  {/* Hidden canvas for frame capture */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Vignette overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(8,7,5,0.7) 100%)" }}
                  />

                  {/* QR scanning frame (inner square) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative" style={{ width: "68%", height: "68%" }}>
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#E2A23B] rounded-tl-[3px]" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#E2A23B] rounded-tr-[3px]" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#E2A23B] rounded-bl-[3px]" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#E2A23B] rounded-br-[3px]" />

                      {/* Animated scan line */}
                      {phase === "scanning" && (
                        <motion.div
                          className="absolute left-2 right-2 pointer-events-none"
                          style={{
                            height: "2px",
                            background: "linear-gradient(90deg, transparent 0%, #E2A23B 20%, #E2A23B 80%, transparent 100%)",
                            boxShadow: "0 0 12px 4px rgba(226,162,59,0.3)",
                          }}
                          initial={{ top: "5%" }}
                          animate={{ top: ["5%", "92%"] }}
                          transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Camera permission / error overlay */}
                  {phase === "permission" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0D0B09]/90 z-10 px-6">
                      {cameraError ? (
                        <>
                          <div className="w-12 h-12 rounded-full border border-[#DCD4C2]/30 flex items-center justify-center">
                            <XCircle size={22} strokeWidth={1.5} className="text-[#DCD4C2]" />
                          </div>
                          <p className="text-sm text-[#DCD4C2] text-center leading-relaxed">{cameraError}</p>
                          <button
                            onClick={() => void startCamera()}
                            className="px-4 py-2 text-[11px] font-medium text-[#F6F1E7] border border-[#DCD4C2]/40 rounded-[6px] hover:border-[#F6F1E7]/60 transition-colors"
                          >
                            Try Again
                          </button>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={20} strokeWidth={1.5} className="animate-spin text-[#E2A23B]" />
                          <p className="text-sm text-[#DCD4C2] text-center">Requesting camera access…</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Bottom status bar */}
                  {phase === "scanning" && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 pb-4 pointer-events-none">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-[#E2A23B]"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <span className="text-[8px] text-[#E2A23B]/70 tracking-widest uppercase" style={M}>Scanning</span>
                    </div>
                  )}
                </div>

                {/* Secondary actions below camera */}
                <div className="w-full flex flex-col items-center gap-3">

                  {/* Upload QR Image button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) void handleImageUpload(f); e.target.value = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#1E1B16] border border-[#1E1B16]/20 rounded-[7px] bg-[#FCFAF3] hover:border-[#1E1B16]/40 transition-colors"
                  >
                    <Upload size={13} strokeWidth={1.5} />
                    Upload QR Image
                  </button>

                  {/* Manual code entry toggle */}
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 h-px bg-[#DCD4C2]" />
                    <button
                      onClick={() => { setShowManual(v => !v); setManualError(null); setManualCode(""); }}
                      className="text-[9px] text-[#6B6355] hover:text-[#1E1B16] transition-colors flex-shrink-0"
                      style={M}
                    >
                      {showManual ? "Hide code entry" : "Enter code manually"}
                    </button>
                    <div className="flex-1 h-px bg-[#DCD4C2]" />
                  </div>

                  {/* Manual entry field */}
                  <AnimatePresence>
                    {showManual && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden w-full"
                      >
                        <div className="space-y-2.5 pt-1">
                          <div className="flex gap-2.5">
                            <input
                              type="text"
                              value={manualCode}
                              onChange={e => { setManualCode(e.target.value.toUpperCase()); setManualError(null); }}
                              onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
                              placeholder="e.g. ENV-POL-2026-A1B2"
                              className="flex-1 min-w-0 px-3.5 py-2.5 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] text-sm text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none focus:border-[#1E1B16]/40 transition-colors"
                              style={M}
                            />
                            <button
                              onClick={handleManualSubmit}
                              disabled={isGuest || manualLoading}
                              aria-label="Submit event code"
                              className="w-10 flex items-center justify-center bg-[#1E1B16] text-[#F6F1E7] rounded-[7px] border border-[#1E1B16] hover:bg-[#2E2A22] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {manualLoading
                                ? <RefreshCw size={12} strokeWidth={2} className="animate-spin" />
                                : <ArrowRight size={14} />}
                            </button>
                          </div>
                          {manualError && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#B5432E]">
                              {manualError}
                            </motion.p>
                          )}
                          <p className="text-[8px] text-[#DCD4C2] text-center" style={M}>
                            Enter the event code shown on the attendance QR
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ════ DETECTED / RECORDING PHASE ════ */}
            {(phase === "detected" || phase === "recording") && (
              <motion.div
                key="processing"
                className="flex flex-col items-center gap-5 py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-full border-2 border-[#E2A23B] flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                >
                  <Scan size={22} strokeWidth={1.5} className="text-[#E2A23B]" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1E1B16]" style={F}>
                    {phase === "detected" ? "QR Detected" : "Recording Attendance"}
                  </p>
                  <p className="text-xs text-[#6B6355] mt-1">
                    {phase === "detected" ? "Validating event…" : "Saving your attendance…"}
                  </p>
                  {detectedCode && (
                    <p className="text-[9px] text-[#6B6355] mt-2" style={M}>{detectedCode}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ════ SUCCESS PHASE ════ */}
            {phase === "success" && confirmedEv && (
              <motion.div
                key="success"
                className="w-full"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden">
                  <div className="px-5 py-3 bg-[#F6F1E7] border-b border-[#DCD4C2] flex items-center justify-between">
                    <span className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>Attendance Recorded</span>
                    <span className="text-[8px] text-[#DCD4C2]" style={M}>{confirmedCode}</span>
                  </div>
                  <div className="px-5 py-7 flex flex-col items-center gap-5">
                    <CertificateSeal size={88} rotate={-8} delay={0.2} />
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold text-[#1E1B16] leading-tight" style={F}>
                        Attendance Recorded
                      </h2>
                      <p className="text-sm text-[#6B6355] mt-1">Your attendance has been saved.</p>
                    </div>
                    <div className="w-full h-px bg-[#DCD4C2]" />
                    <div className="w-full space-y-2.5">
                      {[
                        { label: "Event", value: confirmedTitle, serif: true },
                        { label: "Venue", value: confirmedVenue, serif: false },
                        { label: "Time", value: `${timestamp} · ${confirmedDate}`, serif: false, mono: true },
                      ].map(({ label, value, serif, mono }) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                          <span className="text-[8px] tracking-widest uppercase text-[#6B6355] flex-shrink-0 mt-0.5" style={M}>{label}</span>
                          <span className="text-sm text-[#1E1B16] text-right leading-snug" style={serif ? F : (mono ? M : undefined)}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full h-px bg-[#DCD4C2]" />
                    <button
                      onClick={() => onNavigate("myevents")}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#1E1B16]/25 rounded-[7px] text-sm font-medium text-[#1E1B16] hover:bg-[#F6F1E7] hover:border-[#1E1B16]/40 transition-colors"
                    >
                      Done
                      <Check size={13} strokeWidth={2.5} className="text-[#2E6B4C]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ ERROR PHASE ════ */}
            {phase === "error" && (
              <motion.div
                key="error"
                className="w-full"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden">
                  <div className="px-5 py-3 bg-[#F6F1E7] border-b border-[#DCD4C2] flex items-center justify-between">
                    <span className="text-[8px] tracking-widest uppercase text-[#B5432E]" style={M}>Attendance Not Recorded</span>
                    {confirmedCode && <span className="text-[8px] text-[#DCD4C2]" style={M}>{confirmedCode}</span>}
                  </div>
                  <div className="px-5 py-7 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-[#B5432E]/30 flex items-center justify-center">
                      <AlertTriangle size={20} strokeWidth={1.5} className="text-[#B5432E]" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-lg font-semibold text-[#1E1B16] leading-snug" style={F}>
                        Could not record attendance
                      </h2>
                      <p className="text-sm text-[#6B6355] mt-2">{attendanceError}</p>
                    </div>
                    {confirmedEv && (
                      <>
                        <div className="w-full h-px bg-[#DCD4C2]" />
                        <div className="w-full">
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>Event</span>
                            <span className="text-sm text-[#1E1B16] text-right" style={F}>{confirmedTitle}</span>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="w-full h-px bg-[#DCD4C2]" />
                    <div className="flex items-center gap-3 w-full">
                      <button
                        onClick={handleReset}
                        className="flex-1 py-2.5 border border-[#1E1B16]/25 rounded-[7px] text-sm font-medium text-[#1E1B16] hover:bg-[#F6F1E7] hover:border-[#1E1B16]/40 transition-colors text-center"
                      >
                        Scan Again
                      </button>
                      <button
                        onClick={() => onNavigate("myevents")}
                        className="flex-1 py-2.5 border border-[#DCD4C2] rounded-[7px] text-sm text-[#6B6355] hover:border-[#1E1B16]/30 transition-colors text-center"
                      >
                        Back to Events
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Certificates screen ─────────────────────────────────────────────────────

// Static seal SVG (no spring animation) for card thumbnails
export function SealBadge({ size = 52, rotate = -9 }: { size?: number; rotate?: number }) {
  const rawId = useId();
  const uid = "sb" + rawId.replace(/[^a-z0-9]/gi, "");
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
    <div style={{ width: size, height: size, flexShrink: 0, transform: `rotate(${rotate}deg)` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs><path id={uid} d={topArc} /></defs>
        <polygon points={pts} fill="#E2A23B" />
        <circle cx={r} cy={r} r={r - 8}    fill="#E2A23B" />
        <circle cx={r} cy={r} r={r - 10.5} fill="none" stroke="#1E1B16" strokeWidth="0.75" />
        <circle cx={r} cy={r} r={r - 17.5} fill="none" stroke="#1E1B16" strokeWidth="0.75" strokeDasharray="2 1.5" />
        <text fill="#1E1B16" fontSize={fs} fontFamily="'IBM Plex Mono',monospace" fontWeight="500" letterSpacing="1.1">
          <textPath href={`#${uid}`} startOffset="50%" textAnchor="middle">· FIELDBOOK · VERIFIED ·</textPath>
        </text>
        <path
          d={`M${(r-r*.22).toFixed(2)},${(r+r*.04).toFixed(2)} L${(r-r*.03).toFixed(2)},${(r+r*.22).toFixed(2)} L${(r+r*.26).toFixed(2)},${(r-r*.18).toFixed(2)}`}
          stroke="#1E1B16" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
      </svg>
    </div>
  );
}

type CertRecord = {
  id: string;
  eventTitle: string;
  eventId: string;
  category: string;
  issuedDate: string;
  certCode: string;
  dept: string;
  organizer: string;
};

const CERT_RECORDS: CertRecord[] = [
  { id: "cert-001", eventTitle: "Campus Sustainability Forum",     eventId: "",  category: "Academic",   issuedDate: "Oct 9, 2024",  certCode: "CERT-FB-2024-088021", dept: "Environmental Science",  organizer: "Prof. Andrei Volkov"       },
  { id: "cert-002", eventTitle: "Research Methodology Bootcamp",   eventId: "",  category: "Research",   issuedDate: "Oct 16, 2024", certCode: "CERT-FB-2024-088476", dept: "Graduate School",         organizer: "Graduate Research Office"  },
  { id: "cert-003", eventTitle: "Design Thinking Workshop",        eventId: "5", category: "Workshop",   issuedDate: "Nov 13, 2024", certCode: "CERT-FB-2024-089098", dept: "Arts & Design",           organizer: "Design Lab"                },
  { id: "cert-004", eventTitle: "Leadership Primer Workshop",      eventId: "",  category: "Leadership", issuedDate: "Nov 6, 2024",  certCode: "CERT-FB-2024-088912", dept: "Student Life",            organizer: "Office of Student Affairs" },
  { id: "cert-005", eventTitle: "Science Communication Seminar",   eventId: "",  category: "Academic",   issuedDate: "Sep 27, 2024", certCode: "CERT-FB-2024-087344", dept: "Graduate School",         organizer: "Dr. Maria Santos"          },
];

const CERT_ACCENT: Record<string, string> = {
  Academic:   "#2E6B4C",
  Workshop:   "#E2A23B",
  Leadership: "#2E6B4C",
  Research:   "#6B6355",
  Career:     "#E2A23B",
};

// ─── Canvas-based certificate export ─────────────────────────────────────────
async function downloadCertificate(cert: CertRecord) {
  await document.fonts.ready;

  const W = 1400;
  const H = 990;
  const PAD = 88;
  const accent = CERT_ACCENT[cert.category] ?? "#6B6355";
  const PS = "'Public Sans', system-ui, sans-serif";

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#FCFAF3";
  ctx.fillRect(0, 0, W, H);

  // Dot-grid texture
  ctx.fillStyle = "rgba(30,27,22,0.04)";
  for (let x = 18; x < W; x += 18)
    for (let y = 18; y < H; y += 18) {
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
    }

  // Category accent bar (left)
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 8, H);

  // Marigold top stripe
  ctx.fillStyle = "#E2A23B";
  ctx.fillRect(8, 0, W - 8, 14);

  let y = PAD + 12;

  // Header: Fieldbook (left) + label (right)
  ctx.font = `600 26px ${PS}`;
  ctx.fillStyle = "#1E1B16";
  ctx.textAlign = "left";
  ctx.fillText("Fieldbook", PAD, y);

  ctx.font = `400 13px ${PS}`;
  ctx.fillStyle = "#6B6355";
  ctx.textAlign = "right";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", W - PAD, y);

  y += 28;
  // Divider
  ctx.strokeStyle = "#DCD4C2";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();

  y += 72;

  // Seal (decorative circles)
  const cx = W / 2;
  ctx.strokeStyle = "#E2A23B"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, y, 54, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(226,162,59,0.35)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, y, 46, 0, Math.PI * 2); ctx.stroke();
  ctx.font = `600 20px ${PS}`; ctx.fillStyle = "#E2A23B"; ctx.textAlign = "center";
  ctx.fillText("FB", cx, y + 7);

  y += 54 + 46;

  // "This certifies that"
  ctx.font = `400 16px ${PS}`; ctx.fillStyle = "#6B6355"; ctx.textAlign = "center";
  ctx.fillText("This certifies that", cx, y);
  y += 56;

  // Student name
  ctx.font = `600 58px ${PS}`; ctx.fillStyle = "#1E1B16";
  ctx.fillText("Sarah Chen", cx, y);
  y += 36;

  // "has attended and completed"
  ctx.font = `400 16px ${PS}`; ctx.fillStyle = "#6B6355";
  ctx.fillText("has attended and completed", cx, y);
  y += 54;

  // Event title (wrap if long)
  ctx.font = `600 30px ${PS}`; ctx.fillStyle = "#1E1B16";
  const titleMaxW = W - PAD * 2.5;
  if (ctx.measureText(cert.eventTitle).width > titleMaxW) {
    // Naive two-line split at midpoint word
    const words = cert.eventTitle.split(" ");
    const mid   = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");
    ctx.fillText(line1, cx, y);        y += 40;
    ctx.fillText(line2, cx, y);        y += 8;
  } else {
    ctx.fillText(cert.eventTitle, cx, y);
  }
  y += 32;

  // Dept · Organizer
  ctx.font = `400 15px ${PS}`; ctx.fillStyle = "#9C8E7E";
  ctx.fillText(`${cert.dept} · ${cert.organizer}`, cx, y);
  y += 64;

  // Divider
  ctx.strokeStyle = "#DCD4C2"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD * 2, y); ctx.lineTo(W - PAD * 2, y); ctx.stroke();
  y += 44;

  // Bottom row — three columns
  const c1 = PAD + 80, c2 = cx, c3 = W - PAD - 80;
  const labelFont = `400 11px ${PS}`, valueFont = `400 15px ${PS}`;

  ctx.font = labelFont; ctx.fillStyle = "#DCD4C2";
  ctx.textAlign = "left";  ctx.fillText("DATE ISSUED",    c1, y);
  ctx.textAlign = "center"; ctx.fillText("CERTIFICATE ID", c2, y);
  ctx.textAlign = "right";  ctx.fillText("STATUS",         c3, y);

  y += 24;

  ctx.font = valueFont;
  ctx.fillStyle = "#1E1B16"; ctx.textAlign = "left";  ctx.fillText(cert.issuedDate, c1, y);
  ctx.fillStyle = "#6B6355"; ctx.textAlign = "center"; ctx.fillText(cert.certCode,   c2, y);
  ctx.fillStyle = "#2E6B4C"; ctx.textAlign = "right";  ctx.fillText("✓ Verified",    c3, y);

  // Trigger PNG download
  const a  = document.createElement("a");
  a.download = `${cert.certCode}.png`;
  a.href     = canvas.toDataURL("image/png");
  a.click();
}

// ─── Certificate detail overlay ───────────────────────────────────────────────
function CertDetailOverlay({
  cert,
  onClose,
  onViewEvent,
}: {
  cert: CertRecord;
  onClose: () => void;
  onViewEvent?: () => void;
}) {
  const accent = CERT_ACCENT[cert.category] ?? "#6B6355";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(30,27,22,0.55)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-[#FCFAF3] border border-[#1E1B16]/25 rounded-[8px] overflow-hidden w-full max-w-[480px]"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Marigold top stripe */}
        <div className="h-1.5 bg-[#E2A23B]" />

        {/* Certificate body */}
        <div className="px-9 py-8 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F6F1E7] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
            aria-label="Close"
          >
            <X size={14} strokeWidth={1.75} />
          </button>

          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookMarked size={14} className="text-[#E2A23B]" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-[#1E1B16] tracking-tight" style={F}>Fieldbook</span>
            </div>
            <span className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>
              Certificate of Participation
            </span>
          </div>

          <div className="h-px bg-[#DCD4C2] mb-8" />

          {/* Certificate center */}
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <CertificateSeal size={92} rotate={-8} delay={0.18} />

            <div className="space-y-1.5">
              <p className="text-xs text-[#6B6355]">This certifies that</p>
              <h2 className="text-[2rem] font-semibold text-[#1E1B16] leading-tight" style={F}>Sarah Chen</h2>
              <p className="text-xs text-[#6B6355]">has attended and completed</p>
              <h3 className="text-[1.1rem] font-semibold text-[#1E1B16] leading-snug" style={F}>
                {cert.eventTitle}
              </h3>
              <p className="text-[9px] text-[#6B6355]" style={M}>
                {cert.dept} · {cert.organizer}
              </p>
            </div>
          </div>

          <div className="h-px bg-[#DCD4C2] mb-5" />

          {/* Detail rows */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-[7px] tracking-widest uppercase text-[#DCD4C2]" style={M}>Date Issued</div>
              <div className="text-xs text-[#1E1B16]" style={M}>{cert.issuedDate}</div>
            </div>
            <div className="space-y-0.5 text-center">
              <div className="text-[7px] tracking-widest uppercase text-[#DCD4C2]" style={M}>Certificate ID</div>
              <div className="text-[9px] text-[#6B6355]" style={M}>{cert.certCode}</div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-[7px] tracking-widest uppercase text-[#DCD4C2]" style={M}>Status</div>
              <div className="flex items-center gap-1 px-2 py-0.5 border border-[#2E6B4C] rounded-full">
                <span className="w-1 h-1 rounded-full" style={{ background: accent }} />
                <span className="text-[7px] text-[#2E6B4C]" style={M}>Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action footer */}
        <div className="border-t border-[#DCD4C2] px-6 py-4 flex items-center justify-between bg-[#F6F1E7]">
          {onViewEvent ? (
            <button
              onClick={onViewEvent}
              className="flex items-center gap-1.5 text-xs text-[#6B6355] hover:text-[#1E1B16] transition-colors"
            >
              View event <ArrowRight size={11} strokeWidth={1.5} />
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCertificate(cert)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#DCD4C2] rounded-[6px] text-xs text-[#6B6355] hover:bg-[#FCFAF3] hover:border-[#1E1B16]/25 hover:text-[#1E1B16] transition-colors"
            >
              <Download size={11} strokeWidth={1.5} />
              Download PNG
            </button>
            <button
              onClick={() => {
                toast("Link copied", { description: "Share link copied to clipboard." });
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#DCD4C2] rounded-[6px] text-xs text-[#6B6355] hover:bg-[#FCFAF3] hover:border-[#1E1B16]/25 hover:text-[#1E1B16] transition-colors"
            >
              <Share2 size={11} strokeWidth={1.5} />
              Share
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Certificate card (grid item) ─────────────────────────────────────────────
function CertCard({
  cert,
  index,
  onOpen,
}: {
  cert: CertRecord;
  index: number;
  onOpen: () => void;
}) {
  const accent = CERT_ACCENT[cert.category] ?? "#6B6355";

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.07, ease: "easeOut" }}
      onClick={onOpen}
      className="w-full text-left bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden hover:border-[#1E1B16]/40 transition-colors group"
    >
      {/* Thumbnail — certificate document preview */}
      <div className="relative h-44 overflow-hidden" style={{ background: "#F8F4EC" }}>
        {/* Dot-grid texture (light) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(30,27,22,0.05) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* Category accent left bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: accent }} />

        {/* Document interior */}
        <div className="absolute inset-0 pl-7 pr-5 pt-5 pb-4 flex flex-col">
          {/* Letterhead */}
          <div className="flex items-center gap-1.5 mb-4">
            <BookMarked size={9} strokeWidth={1.75} style={{ color: "#DCD4C2" }} />
            <span className="text-[7px] tracking-[0.12em] uppercase" style={{ ...M, color: "#DCD4C2" }}>Fieldbook</span>
            <span className="text-[7px]" style={{ color: "#DCD4C2" }}>·</span>
            <span className="text-[7px] tracking-[0.1em] uppercase" style={{ ...M, color: "#DCD4C2" }}>Certificate</span>
          </div>

          {/* Faux text lines: student name (wider, marigold tint) */}
          <div className="space-y-2 flex-1">
            <div className="text-[7px] uppercase tracking-widest" style={{ ...M, color: "#DCD4C2" }}>This certifies that</div>
            <div className="h-[3px] w-4/5 rounded-full" style={{ background: "rgba(226,162,59,0.35)" }} />
            <div className="h-[1.5px] w-3/5 bg-[#DCD4C2] rounded-full mt-3" />
            <div className="h-[1.5px] w-5/6 bg-[#DCD4C2] rounded-full" />
            <div className="h-[1.5px] w-2/5 bg-[#DCD4C2] rounded-full" />
          </div>

          {/* Bottom: date + seal */}
          <div className="flex items-end justify-between mt-2">
            <div className="space-y-1">
              <div className="h-[1px] w-16 bg-[#DCD4C2]" />
              <div className="text-[6px]" style={{ ...M, color: "#DCD4C2" }}>{cert.issuedDate}</div>
            </div>
            <SealBadge size={54} rotate={-9} />
          </div>
        </div>

        {/* Hover scrim */}
        <div className="absolute inset-0 bg-[#1E1B16]/0 group-hover:bg-[#1E1B16]/[0.03] transition-colors pointer-events-none" />
      </div>

      {/* Card footer */}
      <div className="px-4 py-3.5 border-t border-[#DCD4C2]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="text-[7px] tracking-widest uppercase px-1.5 py-0.5 border border-[#DCD4C2] rounded-full flex-shrink-0"
                style={{ ...M, color: "#6B6355" }}
              >
                {cert.category}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#1E1B16] leading-snug line-clamp-2" style={F}>
              {cert.eventTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#6B6355]" style={M}>{cert.issuedDate}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); downloadCertificate(cert); }}
              className="w-7 h-7 flex items-center justify-center rounded-[5px] border border-[#DCD4C2] text-[#6B6355] hover:bg-[#F6F1E7] hover:text-[#1E1B16] hover:border-[#1E1B16]/30 transition-colors"
              aria-label="Download certificate as PNG"
            >
              <Download size={11} strokeWidth={1.5} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                toast("Link copied", { description: "Share link copied to clipboard." });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-[5px] border border-[#DCD4C2] text-[#6B6355] hover:bg-[#F6F1E7] hover:text-[#1E1B16] hover:border-[#1E1B16]/30 transition-colors"
              aria-label="Share"
            >
              <Share2 size={11} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Certificates main screen ─────────────────────────────────────────────────
export function CertificatesScreen({
  onNavigate,
  onViewEventDetail,
  isGuest,
  profile,
}: {
  onNavigate: (s: Screen) => void;
  onViewEventDetail?: (eventId: string) => void;
  isGuest?: boolean;
  profile?: AuthedProfile | null;
}) {
  const [query,        setQuery]        = useState("");
  const [selectedCert, setSelectedCert] = useState<CertRecord | null>(null);

  function handleNav(id: string) {
    if (id === "profile")   { onNavigate("profile");   return; }
    if (id === "landing")   { onNavigate("landing");   return; }
    if (id === "dashboard") { onNavigate("dashboard"); return; }
    if (id === "explore")   { onNavigate("explore");   return; }
    if (id === "events")    { onNavigate("myevents");  return; }
    if (id === "scanner")   { onNavigate("scanner");   return; }
    if (id === "notifs")    { onNavigate("notifs");    return; }
  }

  const filtered = CERT_RECORDS.filter(c => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.eventTitle.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)   ||
      c.dept.toLowerCase().includes(q)
    );
  });

  const pageTitle = (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-semibold text-[#1E1B16]" style={F}>Certificates</span>
      <span
        className="text-[8px] px-1.5 py-0.5 border border-[#DCD4C2] rounded-full text-[#6B6355]"
        style={M}
      >
        {CERT_RECORDS.length}
      </span>
    </div>
  );

  return (
    <>
      <AppShell
        activeNav="certs"
        notifCount={3}
        studentName={profile?.fullName ?? "Sarah Chen"}
        studentId={profile?.id ?? "SCH-4421"}
        isGuest={isGuest}
        onNav={handleNav}
        onNavigate={onNavigate}
        topBarLeft={pageTitle}
      >
        <main className="flex-1 overflow-auto" style={dotGrid}>
          <div className="px-4 sm:px-8 py-7 space-y-6">

            {/* ── Page header + search ── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-1" style={M}>Student Record</p>
                <h1 className="text-[1.4rem] font-semibold text-[#1E1B16] leading-tight" style={F}>My Certificates</h1>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] focus-within:border-[#1E1B16]/40 transition-colors w-64 flex-shrink-0">
                <Search size={12} strokeWidth={1.5} className="text-[#6B6355] flex-shrink-0" />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search certificates…"
                  className="flex-1 min-w-0 bg-transparent text-sm text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none"
                />
              </div>
            </div>

            {/* ── Results meta ── */}
            {query.trim() && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#6B6355]" style={M}>
                  {filtered.length} {filtered.length === 1 ? "certificate" : "certificates"} found
                </span>
                <button
                  onClick={() => setQuery("")}
                  className="text-[9px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                  style={M}
                >
                  Clear ×
                </button>
              </div>
            )}

            {/* ── Empty state ── */}
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="py-20 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 border border-[#DCD4C2] rounded-[8px] flex items-center justify-center mb-5">
                  <Award size={20} strokeWidth={1.5} className="text-[#DCD4C2]" />
                </div>
                {query.trim() ? (
                  <>
                    <h3 className="text-lg font-semibold text-[#1E1B16] mb-2" style={F}>No results.</h3>
                    <p className="text-sm text-[#6B6355] mb-7 max-w-xs leading-relaxed">
                      No certificates match your search. Try a different keyword.
                    </p>
                    <button
                      onClick={() => setQuery("")}
                      className="flex items-center gap-2 px-5 py-2 border border-[#1E1B16]/25 rounded-[7px] text-sm text-[#1E1B16] hover:border-[#1E1B16]/45 transition-colors"
                    >
                      Clear search <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-[#1E1B16] mb-2" style={F}>No certificates yet.</h3>
                    <p className="text-sm text-[#6B6355] mb-7 max-w-xs leading-relaxed">
                      Attend and check in to events to earn a certificate of participation. Each one is recorded permanently to your ledger.
                    </p>
                    <button
                      onClick={() => onNavigate("explore")}
                      className="flex items-center gap-2 px-5 py-2 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors"
                    >
                      Explore Events <ArrowRight size={12} />
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Certificate grid ── */}
            {filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((cert, i) => (
                  <CertCard
                    key={cert.id}
                    cert={cert}
                    index={i}
                    onOpen={() => setSelectedCert(cert)}
                  />
                ))}
              </div>
            )}

            {/* ── Total tally ── */}
            {filtered.length > 0 && !query.trim() && (
              <p className="text-center text-[8px] text-[#DCD4C2]" style={M}>
                {CERT_RECORDS.length} certificates · Sarah Chen · SCH-4421
              </p>
            )}

          </div>
        </main>
      </AppShell>

      {/* ── Detail overlay (rendered outside AppShell, fixed z-50) ── */}
      <AnimatePresence>
        {selectedCert && (
          <CertDetailOverlay
            cert={selectedCert}
            onClose={() => setSelectedCert(null)}
            onViewEvent={
              selectedCert.eventId && onViewEventDetail
                ? () => {
                    setSelectedCert(null);
                    onViewEventDetail(selectedCert.eventId);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────


type NotifItem = {
  id: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  text: string;
  meta: string;
  group: NotifGroup;
  time: string;
  unread: boolean;
};

const NOTIFS: NotifItem[] = [
  // Today — 2 unread, 1 read (matches dashboard notifCount=3 across app)
  { id: "n1",  icon: Award,    text: "Certificate issued for Design Thinking Workshop.",                   meta: "CERT-FB-2024-089098", group: "today",  time: "2h ago",     unread: true  },
  { id: "n2",  icon: Calendar, text: "Reminder: Environmental Policy Symposium tomorrow at 9:00 AM.",      meta: "ENV-POL-2024",        group: "today",  time: "5h ago",     unread: true  },
  { id: "n3",  icon: Check,    text: "Registration confirmed: Biotechnology & Society Conference.",         meta: "ENT-BTC-2024",        group: "today",  time: "8h ago",     unread: false },
  // Earlier this week — 1 unread, 2 read
  { id: "n4",  icon: Compass,  text: "Urban Ecology Workshop registration is now open — 12 spots remain.", meta: "BIO-ECO-2024",        group: "week",   time: "Yesterday",  unread: true  },
  { id: "n5",  icon: QrCode,   text: "Your QR check-in pass for Urban Ecology Workshop is ready.",         meta: "BIO-ECO-2024",        group: "week",   time: "2 days ago", unread: false },
  { id: "n6",  icon: Calendar, text: "Reminder: Leadership Summit registration closes in 24 hours.",        meta: "LDR-SUM-2024",        group: "week",   time: "3 days ago", unread: false },
  // Older — all read
  { id: "n7",  icon: Check,    text: "Attendance confirmed: Leadership Primer Workshop.",                   meta: "LDR-PRM-2024",        group: "older",  time: "Nov 5",      unread: false },
  { id: "n8",  icon: Award,    text: "New certificate issued: Research Methodology Bootcamp.",              meta: "CERT-FB-2024-088476", group: "older",  time: "Oct 16",     unread: false },
  { id: "n9",  icon: Award,    text: "New certificate issued: Public Speaking Intensive.",                  meta: "CERT-FB-2024-088021", group: "older",  time: "Oct 9",      unread: false },
  { id: "n10", icon: Shield,   text: "Your Fieldbook participation ledger record has been updated.",        meta: "LEDGER-SCH-4421",     group: "older",  time: "Oct 1",      unread: false },
];


function NotifRow({
  notif, isRead, onRead, delay,
}: { notif: NotifItem; isRead: boolean; onRead: () => void; delay: number }) {
  const Icon = notif.icon;
  const active = notif.unread && !isRead;
  return (
    <motion.button
      type="button"
      className="w-full text-left relative flex items-start gap-4 px-4 sm:px-8 py-[15px] border-b border-[#DCD4C2] last:border-b-0 cursor-pointer"
      style={{ background: active ? "rgba(226,162,59,0.06)" : "transparent" }}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut", delay }}
      onClick={onRead}
    >
      {/* Unread left accent bar */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-[2px] transition-opacity duration-300"
        style={{ background: "#E2A23B", opacity: active ? 1 : 0 }}
      />
      {/* Icon box */}
      <span
        className="mt-[1px] w-8 h-8 flex-shrink-0 rounded-[5px] border flex items-center justify-center transition-colors duration-300"
        style={{
          background: active ? "rgba(226,162,59,0.10)" : "rgba(30,27,22,0.05)",
          borderColor: active ? "rgba(226,162,59,0.35)" : "rgba(30,27,22,0.15)",
        }}
      >
        <Icon size={13} strokeWidth={1.8} color={active ? "#C88A1C" : "#6B6355"} />
      </span>
      {/* Body text */}
      <span className="flex-1 min-w-0">
        <span
          className="block text-[13px] leading-[1.52] mb-[3px] transition-colors duration-300"
          style={{
            fontFamily: "'Public Sans', system-ui, sans-serif",
            color: active ? "#1E1B16" : "#4A4437",
            fontWeight: active ? 500 : 400,
          }}
        >
          {notif.text}
        </span>
        <span className="text-[9px] tracking-widest uppercase" style={{ ...M, color: "#9C8E7E" }}>
          {notif.meta}
        </span>
      </span>
      {/* Time + unread dot */}
      <span className="flex items-center gap-[7px] flex-shrink-0 ml-2 mt-[2px]">
        <span className="text-[9px] tracking-wide whitespace-nowrap" style={{ ...M, color: "#9C8E7E" }}>
          {notif.time}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity duration-300"
          style={{ background: "#E2A23B", opacity: active ? 1 : 0 }}
        />
      </span>
    </motion.button>
  );
}

export function NotificationsScreen({ onNavigate, isGuest, profile }: { onNavigate: (s: Screen) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  const [activeNav, setActiveNav] = useState("notifs");
  const [readIds,   setReadIds]   = useState<string[]>([]);

  function handleNav(id: string) {
    if (id === "profile")   { onNavigate("profile");   return; }
    if (id === "landing")   { onNavigate("landing");   return; }
    if (id === "dashboard") { onNavigate("dashboard"); return; }
    if (id === "explore")   { onNavigate("explore");   return; }
    if (id === "events")    { onNavigate("myevents");  return; }
    if (id === "scanner")   { onNavigate("scanner");   return; }
    if (id === "certs")     { onNavigate("certs");     return; }
    setActiveNav(id);
  }

  const unreadCount = NOTIFS.filter(n => n.unread && !readIds.includes(n.id)).length;
  const indexed = NOTIFS.map((n, i) => ({ notif: n, delay: 0.06 + i * 0.045 }));

  return (
    <AppShell
      activeNav={activeNav}
      notifCount={unreadCount}
      studentName={profile?.fullName ?? "Sarah Chen"}
      studentId={profile?.id ?? "SCH-4421"}
      isGuest={isGuest}
      onNav={handleNav}
      onNavigate={onNavigate}
    >
      {/* Page header */}
      <motion.div
        className="flex items-start justify-between mb-8"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div>
          <p className="text-[9px] tracking-widest uppercase mb-1" style={{ ...M, color: "#9C8E7E" }}>
            Student Portal
          </p>
          <h1 className="text-[28px] leading-[1.1] text-[#1E1B16]" style={F}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="mt-[5px] text-[12px]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif", color: "#9C8E7E" }}>
              {unreadCount} unread
            </p>
          )}
          {unreadCount === 0 && NOTIFS.some(n => n.unread) && (
            <p className="mt-[5px] text-[12px]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif", color: "#9C8E7E" }}>
              All caught up
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <motion.button
            type="button"
            className="mt-1 text-[12px] text-[#6B6355] hover:text-[#1E1B16] transition-colors pb-px disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Public Sans', system-ui, sans-serif", borderBottom: "1px solid rgba(107,99,85,0.4)" }}
            onClick={() => setReadIds(NOTIFS.map(n => n.id))}
            disabled={isGuest}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            Mark all as read
          </motion.button>
        )}
      </motion.div>

      {/* Notification list / empty state */}
      {NOTIFS.length === 0 ? (
        <motion.div
          className="flex flex-col items-center py-24 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <span className="w-14 h-14 rounded-full border border-[#DCD4C2] bg-[#FCFAF3] flex items-center justify-center mb-5">
            <Bell size={22} strokeWidth={1.3} color="#9C8E7E" />
          </span>
          <p className="text-[18px] text-[#1E1B16] mb-2" style={F}>
            {"You're all caught up"}
          </p>
          <p className="text-[13px] max-w-[240px] leading-[1.55]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif", color: "#9C8E7E" }}>
            Notifications about your events, certificates, and check-ins will appear here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="border border-[#1E1B16]/[0.18] rounded-[8px] overflow-hidden bg-[#FCFAF3]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut", delay: 0.05 }}
        >
          {NOTIF_GROUPS.map(({ label, key }) => {
            const items = indexed.filter(({ notif }) => notif.group === key);
            if (!items.length) return null;
            return (
              <div key={key}>
                {/* Group header */}
                <div
                  className="px-4 sm:px-8 py-[9px] border-b border-[#DCD4C2]"
                  style={{ background: "#EDE7D9" }}
                >
                  <span
                    className="text-[7px] tracking-[0.15em] uppercase font-semibold"
                    style={{ ...M, color: "#9C8E7E" }}
                  >
                    {label}
                  </span>
                </div>
                {/* Rows */}
                {items.map(({ notif, delay }) => (
                  <NotifRow
                    key={notif.id}
                    notif={notif}
                    isRead={readIds.includes(notif.id)}
                    onRead={() => setReadIds(prev => prev.includes(notif.id) ? prev : [...prev, notif.id])}
                    delay={delay}
                  />
                ))}
              </div>
            );
          })}
        </motion.div>
      )}
    </AppShell>
  );
}

// ─── Student profile screen wrapper ───────────────────────────────────────────
export function StudentProfileScreen({ onNavigate, isGuest, profile }: { onNavigate?: (s: Screen) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  return (
    <AppShell
      activeNav=""
      notifCount={0}
      studentName={profile?.fullName ?? "Sarah Chen"}
      studentId={profile?.id ?? "SCH-4421"}
      isGuest={isGuest}
      onNav={id => {
        if (id === "landing")   { onNavigate?.("landing");   return; }
        if (id === "dashboard") { onNavigate?.("dashboard"); return; }
        if (id === "explore")   { onNavigate?.("explore");   return; }
        if (id === "events")    { onNavigate?.("myevents");  return; }
        if (id === "certs")     { onNavigate?.("certs");     return; }
        if (id === "notifs")    { onNavigate?.("notifs");    return; }
      }}
      onNavigate={onNavigate}
    >
      <ProfileScreen
        role="Student"
        userId={profile?.id}
        name={profile?.fullName ?? "Sarah Chen"}
        email={profile?.email ?? "s.chen@fieldbook.edu"}
        phone=""
        bio=""
        avatarUrl={profile?.avatarUrl}
        accountId="SCH-4421"
        joinedDate="Sep 1, 2024"
        stats={[
          { label: "Certificates Earned", value: 1043 },
          { label: "Events Attended",     value: 2190 },
          { label: "Sessions",            value: 3841 },
        ]}
        onBack={() => onNavigate?.("dashboard")}
        isGuest={isGuest}
      />
    </AppShell>
  );
}

