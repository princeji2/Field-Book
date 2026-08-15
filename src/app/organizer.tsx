import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  QrCode, Award, BarChart3, Compass,
  Check, ArrowRight, BookMarked,
  Calendar, MapPin, GraduationCap,
  ClipboardList, Scan, ChevronRight,
  ArrowLeft, Bell, Home, Search,
  Download, Share2, X, Users, Plus,
  Upload, Pencil, Copy, TrendingUp, ChevronDown,
  ImagePlus, Menu,
  FileText, CheckCircle2, AlertTriangle, Settings, RefreshCw, ExternalLink,
  XCircle, Clock, MoreHorizontal, Filter,
  LayoutTemplate, Star, Eye as EyeIcon, Trash2, GripVertical, Settings2,
  User, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import {
  F, M, dotGrid, type Screen,
  CertificateSeal, InlineSeal,
  CountUp, parseMetricNum, StatMetricNumber, HeroLedger,
  DemoCreate, DemoScan, DemoCert,
  useSidebarState, SidebarFrame,
} from "./shared";
import { SealBadge } from "./student";
import { ProfileScreen } from "./profile";

// ─── Organizer shell ──────────────────────────────────────────────────────────

const ORG_NAV_ITEMS = [
  { id: "org-dashboard",  label: "Dashboard",        icon: Home          },
  { id: "org-events",     label: "Events Workspace", icon: ClipboardList },
  { id: "org-qr",         label: "QR Display",       icon: QrCode        },
  { id: "org-attendees",  label: "Attendee Manager", icon: Users         },
  { id: "org-analytics",  label: "Analytics",        icon: BarChart3     },
  { id: "org-certs",      label: "Certificates",     icon: Award         },
] as const;

function OrgAppShell({
  activeNav,
  orgName,
  orgRole,
  notifCount,
  onNav,
  onCreateEvent,
  topBarLeft,
  topBarActions,
  isGuest,
  children,
}: {
  activeNav: string;
  orgName: string;
  orgRole: string;
  notifCount: number;
  onNav?: (id: string) => void;
  onCreateEvent?: () => void;
  topBarLeft?: React.ReactNode;
  topBarActions?: React.ReactNode;
  isGuest?: boolean;
  children: React.ReactNode;
}) {
  const initials = orgName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const { isMobile, mobileOpen, setMobileOpen, sidebarCollapsed, handleMenuToggle } = useSidebarState();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  return (
    <SidebarFrame isMobile={isMobile} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} sidebarCollapsed={sidebarCollapsed}
      sidebar={<>
        {/* Logo + toggle */}
        <div className={`h-14 border-b border-[#DCD4C2] flex-shrink-0 flex items-center ${sidebarCollapsed ? "justify-center px-3" : "px-3 gap-2"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookMarked size={15} className="text-[#E2A23B] flex-shrink-0" strokeWidth={1.75} />
              <div className="min-w-0">
                <div className="text-base font-semibold text-[#1E1B16] tracking-tight leading-tight whitespace-nowrap" style={F}>Fieldbook</div>
                <div className="text-[7px] tracking-[0.14em] uppercase leading-none mt-[2px] whitespace-nowrap" style={{ ...M, color: "#9C8E7E" }}>Organizer</div>
              </div>
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

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {ORG_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id;
            return (
              <div key={id} className="relative group">
                <button
                  type="button"
                  onClick={() => { onNav?.(id); if (isMobile) setMobileOpen(false); }}
                  aria-label={sidebarCollapsed ? label : undefined}
                  className={`w-full flex items-center rounded-[6px] text-sm transition-colors ${
                    sidebarCollapsed ? "justify-center py-2" : "gap-3 px-3 py-2 text-left"
                  } ${active ? "bg-[#1E1B16] text-[#F6F1E7]" : "text-[#6B6355] hover:bg-[#F6F1E7] hover:text-[#1E1B16]"}`}
                >
                  <Icon size={14} strokeWidth={1.5} className="flex-shrink-0"
                    style={{ color: active ? "#E2A23B" : undefined }} />
                  {!sidebarCollapsed && <span className="flex-1 truncate">{label}</span>}
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

        {/* Create Event CTA */}
        <div className="px-2 pb-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => { onCreateEvent?.(); if (isMobile) setMobileOpen(false); }}
            aria-label={sidebarCollapsed ? "Create Event" : undefined}
            className={`w-full flex items-center justify-center py-[9px] rounded-[6px] font-semibold transition-opacity hover:opacity-85 active:opacity-70 ${!sidebarCollapsed ? "gap-[7px] text-[13px]" : ""}`}
            style={{ background: "#E2A23B", color: "#1E1B16", fontFamily: "'Public Sans', system-ui, sans-serif" }}
          >
            <Plus size={13} strokeWidth={2.2} />
            {!sidebarCollapsed && "Create Event"}
          </button>
        </div>

        {/* Organizer profile */}
        <div className={`border-t border-[#DCD4C2] p-4 flex items-center flex-shrink-0 ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(226,162,59,0.18)", border: "1px solid rgba(226,162,59,0.4)" }}
          >
            <span className="text-[10px] font-semibold" style={{ color: "#8A5C00" }}>{initials}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#1E1B16] truncate">{orgName}</div>
              <div className="text-[9px] truncate" style={{ ...M, color: "#6B6355" }}>{orgRole}</div>
            </div>
          )}
        </div>
      </>}>
      {/* ── Top bar ── */}
      <header className="h-14 flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] flex items-center gap-4 px-4 sm:px-8">
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Open navigation menu"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-[6px] text-[#1E1B16] hover:bg-[#EDE7DA] transition-colors">
              <Menu size={14} strokeWidth={1.75} />
            </button>
          )}
          <div className="flex-1 min-w-0">{topBarLeft}</div>
          {topBarActions && <div className="flex items-center gap-2 flex-shrink-0">{topBarActions}</div>}
          {isGuest && (
            <div className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full border border-[#DCD4C2] flex-shrink-0"
              style={{ background:"rgba(107,99,85,0.08)" }}>
              <EyeIcon size={10} strokeWidth={1.75} style={{ color:"#6B6355" }} />
              <span className="text-[9px] font-medium tracking-wide" style={{ ...M, color:"#6B6355" }}>Viewing as Guest</span>
            </div>
          )}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button type="button" className="relative p-1" aria-label="Notifications">
              <Bell size={15} strokeWidth={1.5} color="#6B6355" />
              {notifCount > 0 && (
                <span
                  className="absolute top-0 right-0 w-[7px] h-[7px] rounded-full border border-[#F6F1E7]"
                  style={{ background: "#E2A23B" }}
                />
              )}
            </button>
              <div className="relative flex-shrink-0">
                <button type="button" aria-label="Profile menu"
                  onClick={() => setAvatarMenuOpen(v => !v)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: "rgba(226,162,59,0.18)", border: "1px solid rgba(226,162,59,0.4)" }}>
                  <span className="text-[10px] font-semibold" style={{ color: "#E2A23B" }}>{initials}</span>
                </button>
                <AnimatePresence>
                  {avatarMenuOpen && (
                    <motion.div key="bd-org" className="fixed inset-0 z-40"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }} onClick={() => setAvatarMenuOpen(false)} />
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {avatarMenuOpen && (
                    <motion.div key="org-menu"
                      className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
                      style={{ boxShadow: "0 4px 20px rgba(30,27,22,0.10)" }}
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}>
                      <div className="px-4 py-3 border-b border-[#DCD4C2]">
                        <div className="text-[12px] font-semibold text-[#1E1B16] truncate"
                          style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>{orgName}</div>
                        <div className="text-[9px] mt-[1px] truncate" style={{ ...M, color: "#6B6355" }}>{orgRole}</div>
                      </div>
                      <div className="py-1">
                        {[
                          { label: "My Profile", icon: User,   action: () => { setAvatarMenuOpen(false); onNav?.("profile"); }, danger: false },
                          { label: "Log Out",    icon: LogOut, action: () => { setAvatarMenuOpen(false); onNav?.("landing"); }, danger: true  },
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

// ─── Organizer Dashboard data & screen ────────────────────────────────────────

type OrgEventStatus = "Draft" | "Published" | "Live" | "Completed";

type OrgEvent = {
  id: string;
  title: string;
  date: string;
  venue: string;
  status: OrgEventStatus;
  attendees: number;
  capacity: number;
  startTime?: string;
};

const ORG_EVENTS: OrgEvent[] = [
  { id: "oe1", title: "Biotechnology & Society Conference", date: "Nov 12, 2024", venue: "Auditorium A",       status: "Live",      attendees: 89,  capacity: 120, startTime: "9:00 AM" },
  { id: "oe2", title: "Environmental Policy Symposium",     date: "Nov 13, 2024", venue: "Whitman Hall 204",   status: "Published", attendees: 67,  capacity: 100 },
  { id: "oe3", title: "Urban Ecology Workshop",             date: "Nov 20, 2024", venue: "Science Building 3", status: "Draft",     attendees: 0,   capacity: 40  },
  { id: "oe4", title: "Design Thinking Workshop",           date: "Nov 8, 2024",  venue: "Innovation Lab",     status: "Completed", attendees: 38,  capacity: 40  },
  { id: "oe5", title: "Leadership Summit 2024",             date: "Oct 22, 2024", venue: "Campus Center",      status: "Completed", attendees: 112, capacity: 120 },
];

type OrgActivityItem = {
  id: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  text: string;
  time: string;
};

const ORG_ACTIVITY: OrgActivityItem[] = [
  { id: "oa1", icon: Check,    text: "Jordan Rivera checked in to Biotechnology & Society Conference",  time: "2 min ago"  },
  { id: "oa2", icon: Users,    text: "12 new registrations for Environmental Policy Symposium",          time: "18 min ago" },
  { id: "oa3", icon: Award,    text: "Certificate issued to Sarah Chen — Design Thinking Workshop",      time: "1h ago"     },
  { id: "oa4", icon: Compass,  text: "Urban Ecology Workshop published to student portal",               time: "3h ago"     },
  { id: "oa5", icon: Calendar, text: "Environmental Policy Symposium registration opened",               time: "Yesterday"  },
];

// ─── Attendee data ────────────────────────────────────────────────────────────

type AttendeeStatus     = "Checked In" | "No-show" | "Pending";
type AttendeeCertStatus = "Issued" | "Pending" | "Not eligible";
type Attendee = {
  id: string; name: string; studentId: string; dept: string;
  checkinTime: string | null; status: AttendeeStatus; certStatus: AttendeeCertStatus;
};

const ATTENDEES_BY_EVENT: Record<string, Attendee[]> = {
  oe1: [
    { id:"a01", name:"Jordan Rivera",    studentId:"JRI-8821", dept:"Biology",           checkinTime:"9:04 AM",  status:"Checked In", certStatus:"Pending"       },
    { id:"a02", name:"Priya Mehta",      studentId:"PME-3340", dept:"Biochemistry",      checkinTime:"9:07 AM",  status:"Checked In", certStatus:"Pending"       },
    { id:"a03", name:"Omar Farouq",      studentId:"OFA-7712", dept:"Environmental Sci", checkinTime:"9:11 AM",  status:"Checked In", certStatus:"Pending"       },
    { id:"a04", name:"Elena Vasquez",    studentId:"EVA-2298", dept:"Public Health",     checkinTime:"9:15 AM",  status:"Checked In", certStatus:"Pending"       },
    { id:"a05", name:"Daniel Park",      studentId:"DPA-5503", dept:"Chemistry",         checkinTime:null,       status:"Pending",    certStatus:"Pending"       },
    { id:"a06", name:"Fatima Al-Rashid", studentId:"FAL-9901", dept:"Biomedical Eng",    checkinTime:"9:22 AM",  status:"Checked In", certStatus:"Pending"       },
    { id:"a07", name:"Lucas Moretti",    studentId:"LMO-6614", dept:"Biology",           checkinTime:null,       status:"No-show",    certStatus:"Not eligible"  },
    { id:"a08", name:"Ananya Krishnan",  studentId:"AKR-1107", dept:"Neuroscience",      checkinTime:"9:31 AM",  status:"Checked In", certStatus:"Pending"       },
    { id:"a09", name:"Marcus Webb Jr.",  studentId:"MWE-4422", dept:"Biochemistry",      checkinTime:"9:38 AM",  status:"Checked In", certStatus:"Pending"       },
    { id:"a10", name:"Sofia Reyes",      studentId:"SRE-8830", dept:"Public Health",     checkinTime:null,       status:"Pending",    certStatus:"Pending"       },
  ],
  oe2: [
    { id:"b01", name:"Theodora Okafor",  studentId:"TOK-2211", dept:"Political Science", checkinTime:"2:03 PM",  status:"Checked In", certStatus:"Pending"       },
    { id:"b02", name:"Rashid Abubakar",  studentId:"RAB-5567", dept:"Environmental Sci", checkinTime:"2:07 PM",  status:"Checked In", certStatus:"Pending"       },
    { id:"b03", name:"Claire Fontaine",  studentId:"CFO-8813", dept:"Urban Planning",    checkinTime:"2:12 PM",  status:"Checked In", certStatus:"Pending"       },
    { id:"b04", name:"Kevin Tran",       studentId:"KTR-3394", dept:"Economics",         checkinTime:null,       status:"No-show",    certStatus:"Not eligible"  },
    { id:"b05", name:"Amara Diallo",     studentId:"ADI-7729", dept:"Sociology",         checkinTime:"2:19 PM",  status:"Checked In", certStatus:"Pending"       },
    { id:"b06", name:"Nadia Kozlov",     studentId:"NKO-1145", dept:"Public Policy",     checkinTime:"2:25 PM",  status:"Checked In", certStatus:"Pending"       },
    { id:"b07", name:"William Zhang",    studentId:"WZH-6603", dept:"Environmental Sci", checkinTime:"2:28 PM",  status:"Checked In", certStatus:"Pending"       },
    { id:"b08", name:"Isabel Montero",   studentId:"IMO-9918", dept:"Political Science", checkinTime:null,       status:"Pending",    certStatus:"Pending"       },
  ],
  oe4: [
    { id:"c01", name:"Sarah Chen",       studentId:"SCH-4421", dept:"Design",            checkinTime:"10:02 AM", status:"Checked In", certStatus:"Issued"        },
    { id:"c02", name:"Marcus Lee",       studentId:"MLE-7745", dept:"Engineering",       checkinTime:"10:05 AM", status:"Checked In", certStatus:"Issued"        },
    { id:"c03", name:"Yuki Tanaka",      studentId:"YTA-3312", dept:"Computer Science",  checkinTime:"10:08 AM", status:"Checked In", certStatus:"Issued"        },
    { id:"c04", name:"Aisha Nwosu",      studentId:"ANW-5589", dept:"Business",          checkinTime:null,       status:"No-show",    certStatus:"Not eligible"  },
    { id:"c05", name:"Ryan O'Brien",     studentId:"ROB-2230", dept:"Design",            checkinTime:"10:14 AM", status:"Checked In", certStatus:"Issued"        },
    { id:"c06", name:"Zara Hussain",     studentId:"ZHU-8867", dept:"Product Mgmt",      checkinTime:"10:17 AM", status:"Checked In", certStatus:"Issued"        },
    { id:"c07", name:"Ethan Brooks",     studentId:"EBR-1123", dept:"Engineering",       checkinTime:"10:21 AM", status:"Checked In", certStatus:"Issued"        },
    { id:"c08", name:"Mei-Ling Wu",      studentId:"MWU-6678", dept:"UX Research",       checkinTime:null,       status:"No-show",    certStatus:"Not eligible"  },
    { id:"c09", name:"David Okonkwo",    studentId:"DOK-4456", dept:"Business",          checkinTime:"10:29 AM", status:"Checked In", certStatus:"Issued"        },
    { id:"c10", name:"Isabela Costa",    studentId:"ICO-9934", dept:"Design",            checkinTime:"10:33 AM", status:"Checked In", certStatus:"Issued"        },
  ],
  oe5: [
    { id:"d01", name:"James Rodriguez",  studentId:"JRO-9915", dept:"Business Admin",    checkinTime:"9:02 AM",  status:"Checked In", certStatus:"Issued"        },
    { id:"d02", name:"Lena Hoffman",     studentId:"LHO-3378", dept:"MBA",               checkinTime:"9:06 AM",  status:"Checked In", certStatus:"Issued"        },
    { id:"d03", name:"Kwame Asante",     studentId:"KAS-7741", dept:"Public Admin",      checkinTime:"9:09 AM",  status:"Checked In", certStatus:"Issued"        },
    { id:"d04", name:"Valentina Cruz",   studentId:"VCR-2256", dept:"Org. Leadership",   checkinTime:null,       status:"No-show",    certStatus:"Not eligible"  },
    { id:"d05", name:"Hiroshi Yamamoto", studentId:"HYA-5512", dept:"MBA",               checkinTime:"9:18 AM",  status:"Checked In", certStatus:"Issued"        },
    { id:"d06", name:"Chloe Andersen",   studentId:"CAN-8890", dept:"Communication",     checkinTime:"9:21 AM",  status:"Checked In", certStatus:"Issued"        },
    { id:"d07", name:"Malik Johnson",    studentId:"MJO-1167", dept:"Business Admin",    checkinTime:"9:24 AM",  status:"Checked In", certStatus:"Issued"        },
    { id:"d08", name:"Seun Adeleke",     studentId:"SAD-6623", dept:"Org. Leadership",   checkinTime:"9:28 AM",  status:"Checked In", certStatus:"Issued"        },
    { id:"d09", name:"Grace Nzinga",     studentId:"GNZ-4489", dept:"Public Admin",      checkinTime:null,       status:"No-show",    certStatus:"Not eligible"  },
    { id:"d10", name:"Tommy Nguyen",     studentId:"TNG-9946", dept:"MBA",               checkinTime:"9:35 AM",  status:"Checked In", certStatus:"Issued"        },
  ],
};

function AttendeePill({ value }: { value: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    "Checked In":   { bg: "rgba(46,107,76,0.12)",  fg: "#2E6B4C" },
    "No-show":      { bg: "rgba(181,67,46,0.12)",  fg: "#B5432E" },
    "Pending":      { bg: "rgba(226,162,59,0.15)", fg: "#8A5C00" },
    "Issued":       { bg: "rgba(46,107,76,0.12)",  fg: "#2E6B4C" },
    "Not eligible": { bg: "rgba(107,99,85,0.12)",  fg: "#6B6355" },
  };
  const c = map[value] ?? { bg: "rgba(30,27,22,0.09)", fg: "#6B6355" };
  return (
    <span
      className="inline-flex items-center px-2 py-[3px] rounded-[4px] text-[9px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap"
      style={{ ...M, background: c.bg, color: c.fg }}
    >
      {value}
    </span>
  );
}

function OrgStatusBadge({ status }: { status: OrgEventStatus }) {
  const cfg: Record<OrgEventStatus, { bg: string; fg: string; dot?: string }> = {
    Live:      { bg: "#2D6A4F",               fg: "#FCFAF3", dot: "#7ECB9A" },
    Published: { bg: "rgba(226,162,59,0.15)", fg: "#8A5C00"                 },
    Draft:     { bg: "rgba(30,27,22,0.09)",   fg: "#6B6355"                 },
    Completed: { bg: "rgba(30,27,22,0.12)",   fg: "#4A4437"                 },
  };
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center gap-[5px] px-2 py-[3px] rounded-[4px] text-[8px] font-semibold tracking-[0.1em] uppercase whitespace-nowrap"
      style={{ ...M, background: c.bg, color: c.fg }}
    >
      {c.dot && <span className="w-[5px] h-[5px] rounded-full animate-pulse flex-shrink-0" style={{ background: c.dot }} />}
      {status}
    </span>
  );
}

export function OrganizerDashboard({ onNavigate, isGuest }: { onNavigate: (s: Screen) => void; isGuest?: boolean }) {
  const [activeNav, setActiveNav] = useState("org-dashboard");

  function handleNav(id: string) {
    if (id === "profile")       { onNavigate("profile");       return; }
    if (id === "landing")       { onNavigate("landing");       return; }
    if (id === "org-events")    { onNavigate("org-events");    return; }
    if (id === "org-qr")        { onNavigate("org-qr");        return; }
    if (id === "org-attendees") { onNavigate("org-attendees"); return; }
    if (id === "org-analytics") { onNavigate("org-analytics"); return; }
    if (id === "org-certs")     { onNavigate("org-certs");     return; }
    setActiveNav(id);
  }

  const liveEvent = ORG_EVENTS.find(e => e.status === "Live");
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <OrgAppShell
      activeNav={activeNav}
      orgName="Dr. Marcus Webb"
      orgRole="Student Affairs Office"
      notifCount={2}
      onNav={handleNav}
      onCreateEvent={() => onNavigate("org-events-create")}
      isGuest={isGuest}
      topBarLeft={
        <div>
          <p className="text-[13px] font-semibold text-[#1E1B16] leading-tight" style={F}>
            {greeting}, Dr. Webb.
          </p>
          <p className="text-[9px] mt-[2px]" style={{ ...M, color: "#9C8E7E" }}>
            Wednesday, Nov 13 · Student Affairs Office
          </p>
        </div>
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-8 space-y-5">

          {/* ── Live Now ── */}
          <motion.div
            className="relative rounded-[8px] overflow-hidden bg-[#FCFAF3]"
            style={{ border: "1px solid rgba(45,106,79,0.35)" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="h-[3px]" style={{ background: "#2D6A4F" }} />
            <div className="absolute left-0 top-[3px] bottom-0 w-[4px]" style={{ background: "#2D6A4F" }} />
            <div className="pl-10 pr-8 py-6 flex items-start justify-between gap-8">
              <div className="flex-1 min-w-0">
                {/* Live badge + start time */}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center gap-[6px] px-3 py-[5px] rounded-full text-[8px] font-semibold tracking-[0.14em] uppercase"
                    style={{ ...M, background: "#2D6A4F", color: "#FCFAF3" }}
                  >
                    <span className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: "#7ECB9A" }} />
                    Live Now
                  </span>
                  {liveEvent?.startTime && (
                    <span className="text-[9px]" style={{ ...M, color: "#9C8E7E" }}>
                      Started {liveEvent.startTime}
                    </span>
                  )}
                </div>

                {liveEvent ? (
                  <>
                    <h2 className="text-[1.5rem] font-semibold text-[#1E1B16] leading-[1.2] mb-3" style={F}>
                      {liveEvent.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-5">
                      <span className="flex items-center gap-1.5 text-[13px] text-[#6B6355]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                        <MapPin size={12} strokeWidth={1.5} className="flex-shrink-0" />
                        {liveEvent.venue}
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] text-[#6B6355]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                        <Users size={12} strokeWidth={1.5} className="flex-shrink-0" />
                        {liveEvent.attendees} checked in · {liveEvent.capacity} registered
                      </span>
                    </div>
                    {/* Attendance bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] tracking-widest uppercase" style={{ ...M, color: "#9C8E7E" }}>Attendance progress</span>
                        <span className="text-[9px]" style={{ ...M, color: "#2D6A4F" }}>
                          {Math.round((liveEvent.attendees / liveEvent.capacity) * 100)}% capacity
                        </span>
                      </div>
                      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "#DCD4C2" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "#2D6A4F" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(liveEvent.attendees / liveEvent.capacity) * 100}%` }}
                          transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[#6B6355]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                    No events currently in progress.
                  </p>
                )}
              </div>

              {/* Seal — shown only when live */}
              {liveEvent && (
                <div className="flex-shrink-0 mt-1" style={{ opacity: 0.7 }}>
                  <SealBadge size={62} rotate={-8} />
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Metric cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Events Run",         value: "18",    Icon: ClipboardList, accent: "#E2A23B" },
              { label: "Total Attendees",    value: "1,247", Icon: Users,         accent: "#2D6A4F" },
              { label: "Certificates Issued", value: "892",  Icon: Award,         accent: "#E2A23B" },
            ].map(({ label, value, Icon, accent }, i) => (
              <motion.div
                key={label}
                className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] p-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.08 + i * 0.06 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-[9px] tracking-widest uppercase" style={{ ...M, color: "#9C8E7E" }}>{label}</p>
                  <Icon size={13} strokeWidth={1.5} className="flex-shrink-0" style={{ color: accent }} />
                </div>
                <p className="text-[2.4rem] font-semibold text-[#1E1B16] leading-none" style={F}>
                  <StatMetricNumber target={parseMetricNum(value)} formatted={value} color="#1E1B16" duration={550} delay={i * 70} />
                </p>
              </motion.div>
            ))}
          </div>

          {/* ── My Events + Recent Activity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_308px] gap-5">

            {/* My Events list */}
            <motion.div
              className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.2 }}
            >
              <div className="flex items-center justify-between px-6 py-[15px] border-b border-[#DCD4C2]">
                <p className="text-[9px] tracking-widest uppercase font-semibold" style={{ ...M, color: "#6B6355" }}>My Events</p>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[11px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                  style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}
                >
                  View all <ChevronRight size={11} strokeWidth={1.5} />
                </button>
              </div>
              {ORG_EVENTS.map((ev, i) => (
                <div
                  key={ev.id}
                  className={`flex items-center gap-4 px-6 py-[13px] transition-colors cursor-pointer hover:bg-[#F6F1E7] ${
                    i < ORG_EVENTS.length - 1 ? "border-b border-[#DCD4C2]" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] text-[#1E1B16] truncate mb-[3px]"
                      style={{ fontFamily: "'Public Sans', system-ui, sans-serif", fontWeight: ev.status === "Live" ? 600 : 400 }}
                    >
                      {ev.title}
                    </p>
                    <p className="text-[9px] truncate" style={{ ...M, color: "#9C8E7E" }}>
                      {ev.date} · {ev.venue}
                    </p>
                  </div>
                  <OrgStatusBadge status={ev.status} />
                  <span
                    className="text-[11px] tabular-nums flex-shrink-0 w-12 text-right"
                    style={{ ...M, color: "#9C8E7E" }}
                  >
                    {ev.status === "Draft" ? "—" : `${ev.attendees}/${ev.capacity}`}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.26 }}
            >
              <div className="px-6 py-[15px] border-b border-[#DCD4C2]">
                <p className="text-[9px] tracking-widest uppercase font-semibold" style={{ ...M, color: "#6B6355" }}>Recent Activity</p>
              </div>
              {ORG_ACTIVITY.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-6 py-3.5 ${i < ORG_ACTIVITY.length - 1 ? "border-b border-[#DCD4C2]" : ""}`}
                  >
                    <span
                      className="mt-[1px] w-6 h-6 rounded-[4px] flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(30,27,22,0.06)", border: "1px solid rgba(30,27,22,0.1)" }}
                    >
                      <Icon size={11} strokeWidth={1.8} color="#6B6355" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[11px] leading-[1.5] text-[#4A4437] mb-[2px]"
                        style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}
                      >
                        {item.text}
                      </p>
                      <p className="text-[9px]" style={{ ...M, color: "#9C8E7E" }}>{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

          </div>
        </div>
      </main>
    </OrgAppShell>
  );
}

// ─── Events Workspace / Create-Edit Event screen ──────────────────────────────

type EventFormData = {
  title: string;
  category: string;
  department: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  locationType: "in-person" | "online" | "hybrid";
  venue: string;
  capacity: string;
  requireRegistration: boolean;
  enableWaitlist: boolean;
  requireCheckIn: boolean;
};

const DEFAULT_FORM: EventFormData = {
  title: "",
  category: "Academic",
  department: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  locationType: "in-person",
  venue: "",
  capacity: "50",
  requireRegistration: true,
  enableWaitlist: false,
  requireCheckIn: true,
};

const CATEGORY_BANNER: Record<string, string> = {
  Academic:   "#2E6B4C",
  Workshop:   "#C88A1C",
  Leadership: "#3D3228",
  Career:     "#6B6355",
  Research:   "#3A4C5E",
  Conference: "#4A4437",
  Seminar:    "#5C3A3A",
};

const WORKSPACE_TABS: { id: "all" | OrgEventStatus; label: string }[] = [
  { id: "all",       label: "All"       },
  { id: "Draft",     label: "Draft"     },
  { id: "Published", label: "Published" },
  { id: "Live",      label: "Live"      },
  { id: "Completed", label: "Completed" },
];

function OrgToggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[13px] text-[#1E1B16]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200"
        style={{ background: on ? "#E2A23B" : "rgba(30,27,22,0.18)" }}
      >
        <span
          className="absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white transition-transform duration-200"
          style={{
            transform: on ? "translateX(18px)" : "translateX(3px)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.14)",
            border: "1px solid rgba(30,27,22,0.1)",
          }}
        />
      </button>
    </div>
  );
}

function EventPreviewCard({ form }: { form: EventFormData }) {
  const bannerColor = CATEGORY_BANNER[form.category] ?? "#4A4437";
  const isEmpty = !form.title && !form.date && !form.venue;
  return (
    <div className="rounded-[8px] border border-[#1E1B16]/20 overflow-hidden bg-[#FCFAF3]">
      {/* Banner */}
      <div
        className="h-[100px] relative flex items-end p-3"
        style={{ background: bannerColor, ...dotGrid }}
      >
        <span
          className="inline-block px-2 py-[3px] rounded-[4px] text-[8px] font-semibold tracking-widest uppercase"
          style={{ ...M, background: "rgba(252,250,243,0.2)", color: "#FCFAF3" }}
        >
          {form.category}
        </span>
      </div>
      {/* Body */}
      <div className="p-4">
        {isEmpty ? (
          <div>
            <div className="h-4 rounded bg-[#DCD4C2] mb-2 w-3/4" />
            <div className="h-3 rounded bg-[#DCD4C2] mb-1 w-1/2" />
            <div className="h-3 rounded bg-[#DCD4C2] w-2/3" />
          </div>
        ) : (
          <>
            <p className="text-[15px] font-semibold text-[#1E1B16] leading-tight mb-2" style={F}>
              {form.title || "Event Title"}
            </p>
            {(form.date || form.startTime) && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B6355] mb-1" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                <Calendar size={10} strokeWidth={1.5} className="flex-shrink-0" />
                <span>{form.date || "Date TBD"}{form.startTime ? ` · ${form.startTime}` : ""}{form.endTime ? `–${form.endTime}` : ""}</span>
              </div>
            )}
            {form.locationType !== "online" && form.venue && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B6355] mb-1" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                <MapPin size={10} strokeWidth={1.5} className="flex-shrink-0" />
                {form.venue}
              </div>
            )}
            {form.locationType === "online" && (
              <div className="text-[11px] text-[#6B6355] mb-1" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>Online</div>
            )}
          </>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#DCD4C2]">
          <span className="text-[9px]" style={{ ...M, color: "#9C8E7E" }}>
            {form.capacity || "—"} seats{form.department ? ` · ${form.department}` : ""}
          </span>
          <span
            className="text-[8px] px-2 py-[3px] rounded-[4px] font-semibold tracking-widest uppercase"
            style={{ ...M, background: "rgba(30,27,22,0.09)", color: "#6B6355" }}
          >
            Draft
          </span>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-[13px] text-[#1E1B16] placeholder:text-[#9C8E7E] bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[6px] focus:border-[#E2A23B] focus:outline-none transition-colors";

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden">
      <div className="px-6 py-[13px] border-b border-[#DCD4C2]">
        <p className="text-[9px] tracking-widest uppercase font-semibold" style={{ ...M, color: "#6B6355" }}>{title}</p>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[9px] tracking-widest uppercase font-semibold mb-1.5" style={{ ...M, color: "#9C8E7E" }}>
      {children}
    </label>
  );
}

function OrgMediaDropzone() {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); }}
      className="rounded-[6px] border-2 border-dashed flex flex-col items-center justify-center py-10 transition-colors cursor-pointer"
      style={{
        borderColor: dragging ? "#E2A23B" : "rgba(30,27,22,0.2)",
        background: dragging ? "rgba(226,162,59,0.05)" : "rgba(30,27,22,0.02)",
      }}
    >
      <Upload size={20} strokeWidth={1.4} color="#9C8E7E" />
      <p className="mt-2.5 text-[13px] text-[#6B6355]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
        Drag an image here or <span className="underline underline-offset-2">browse</span>
      </p>
      <p className="text-[9px] mt-1" style={{ ...M, color: "#9C8E7E" }}>JPG, PNG or WebP · Max 4 MB</p>
    </div>
  );
}

export function EventsWorkspaceScreen({ onNavigate, initialView = "list", isGuest }: { onNavigate: (s: Screen, id?: string) => void; initialView?: "list" | "create"; isGuest?: boolean }) {
  const [view, setView]           = useState<"list" | "create" | "edit">(initialView);
  const [editEvent, setEditEvent] = useState<OrgEvent | null>(null);
  const [statusTab, setStatusTab] = useState<"all" | OrgEventStatus>("all");
  const [form, setForm]           = useState<EventFormData>(DEFAULT_FORM);

  function upd<K extends keyof EventFormData>(k: K, v: EventFormData[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function startCreate() {
    setForm(DEFAULT_FORM);
    setEditEvent(null);
    setView("create");
  }

  function startEdit(ev: OrgEvent) {
    setForm({ ...DEFAULT_FORM, title: ev.title, venue: ev.venue, capacity: String(ev.capacity) });
    setEditEvent(ev);
    setView("edit");
  }

  function goBack() {
    setView("list");
    setEditEvent(null);
  }

  const filteredEvents = statusTab === "all" ? ORG_EVENTS : ORG_EVENTS.filter(e => e.status === statusTab);

  const counts: Record<"all" | OrgEventStatus, number> = {
    all:       ORG_EVENTS.length,
    Draft:     ORG_EVENTS.filter(e => e.status === "Draft").length,
    Published: ORG_EVENTS.filter(e => e.status === "Published").length,
    Live:      ORG_EVENTS.filter(e => e.status === "Live").length,
    Completed: ORG_EVENTS.filter(e => e.status === "Completed").length,
  };

  // ── Top bar slots ──────────────────────────────────────────────────────────
  const listTopBarLeft = (
    <span className="text-[15px] font-semibold text-[#1E1B16]" style={F}>Events Workspace</span>
  );
  const listTopBarActions = (
    <button
      type="button"
      onClick={startCreate}
      disabled={isGuest}
      title={isGuest ? "Disabled in guest mode" : undefined}
      className="flex items-center gap-1.5 px-4 py-[7px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "#E2A23B", color: "#1E1B16", fontFamily: "'Public Sans', system-ui, sans-serif" }}
    >
      <Plus size={12} strokeWidth={2.2} />
      Create Event
    </button>
  );

  const formTopBarLeft = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={goBack} aria-label="Back" className="p-1 text-[#6B6355] hover:text-[#1E1B16] transition-colors">
        <ArrowLeft size={15} strokeWidth={1.5} />
      </button>
      <div className="w-px h-4 bg-[#DCD4C2]" />
      <span className="text-[15px] font-semibold text-[#1E1B16]" style={F}>
        {view === "create" ? "Create Event" : "Edit Event"}
      </span>
      {editEvent && (
        <span className="text-[9px] px-2 py-[3px] rounded-[4px]" style={{ ...M, background: "rgba(30,27,22,0.09)", color: "#6B6355" }}>
          {editEvent.title}
        </span>
      )}
    </div>
  );
  const formTopBarActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => toast("Saved as draft")}
        disabled={isGuest}
        title={isGuest ? "Disabled in guest mode" : undefined}
        className="px-3.5 py-[7px] rounded-[6px] text-[12px] font-semibold border transition-colors hover:bg-[#FCFAF3] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ fontFamily: "'Public Sans', system-ui, sans-serif", borderColor: "rgba(30,27,22,0.25)", color: "#1E1B16" }}
      >
        Save as Draft
      </button>
      <button
        type="button"
        onClick={() => { toast.success("Event published successfully"); goBack(); }}
        disabled={isGuest}
        title={isGuest ? "Disabled in guest mode" : undefined}
        className="px-3.5 py-[7px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "#E2A23B", color: "#1E1B16", fontFamily: "'Public Sans', system-ui, sans-serif" }}
      >
        Publish
      </button>
    </div>
  );

  return (
    <OrgAppShell
      activeNav="org-events"
      orgName="Dr. Marcus Webb"
      orgRole="Student Affairs Office"
      notifCount={2}
      onNav={id => {
        if (id === "profile")        { onNavigate("profile");        return; }
        if (id === "landing")        { onNavigate("landing");        return; }
        if (id === "org-dashboard")  { onNavigate("org-dashboard");  return; }
        if (id === "org-qr")         { onNavigate("org-qr");         return; }
        if (id === "org-attendees")  { onNavigate("org-attendees");  return; }
        if (id === "org-analytics")  { onNavigate("org-analytics");  return; }
        if (id === "org-certs")      { onNavigate("org-certs");      return; }
      }}
      onCreateEvent={startCreate}
      isGuest={isGuest}
      topBarLeft={view === "list" ? listTopBarLeft : formTopBarLeft}
      topBarActions={view === "list" ? listTopBarActions : formTopBarActions}
    >
      <AnimatePresence mode="wait">

        {/* ── List view ─────────────────────────────────────────────────────── */}
        {view === "list" && (
          <motion.main
            key="workspace-list"
            className="flex-1 overflow-auto bg-[#F6F1E7]"
            style={dotGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 sm:px-8 pt-6 pb-10">

              {/* Status tabs */}
              <div className="flex items-center gap-0 mb-6" style={{ borderBottom: "1px solid #DCD4C2" }}>
                {WORKSPACE_TABS.map(({ id, label }) => {
                  const active = statusTab === id;
                  const count = counts[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStatusTab(id)}
                      className="flex items-center gap-[6px] px-4 py-3 text-[13px] transition-colors"
                      style={{
                        fontFamily: "'Public Sans', system-ui, sans-serif",
                        fontWeight: active ? 600 : 400,
                        color: active ? "#1E1B16" : "#6B6355",
                        borderBottom: active ? "2px solid #1E1B16" : "2px solid transparent",
                        marginBottom: "-1px",
                      }}
                    >
                      {label}
                      {count > 0 && (
                        <span
                          className="text-[8px] px-1.5 py-[1px] rounded-full font-semibold"
                          style={{
                            ...M,
                            background: active ? "#1E1B16" : "rgba(30,27,22,0.1)",
                            color: active ? "#F6F1E7" : "#6B6355",
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredEvents.length === 0 ? (
                /* ── Empty state ── */
                <motion.div
                  className="flex flex-col items-center py-24 text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="w-14 h-14 rounded-full border border-[#DCD4C2] bg-[#FCFAF3] flex items-center justify-center mb-5">
                    <ClipboardList size={22} strokeWidth={1.3} color="#9C8E7E" />
                  </div>
                  <p className="text-[20px] text-[#1E1B16] mb-2" style={F}>
                    {statusTab === "all" ? "Create your first event" : `No ${statusTab} events`}
                  </p>
                  <p className="text-[13px] max-w-[290px] text-[#6B6355] leading-[1.65] mb-6" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                    {statusTab === "all"
                      ? "Build and publish your first campus event to start collecting attendance and issuing certificates."
                      : `Events with "${statusTab}" status will appear here.`}
                  </p>
                  {statusTab === "all" && (
                    <button
                      type="button"
                      onClick={startCreate}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] text-[13px] font-semibold transition-opacity hover:opacity-85"
                      style={{ background: "#E2A23B", color: "#1E1B16", fontFamily: "'Public Sans', system-ui, sans-serif" }}
                    >
                      <Plus size={13} strokeWidth={2} />
                      Create Event
                    </button>
                  )}
                </motion.div>
              ) : (
                /* ── Events table ── */
                <motion.div
                  className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {/* Column header */}
                  <div
                    className="grid items-center px-6 py-3 border-b border-[#DCD4C2]"
                    style={{ gridTemplateColumns: "1fr 130px 80px 104px" }}
                  >
                    {["Event", "Status", "Reg.", "Actions"].map(h => (
                      <span key={h} className="text-[8px] tracking-widest uppercase font-semibold" style={{ ...M, color: "#9C8E7E" }}>{h}</span>
                    ))}
                  </div>

                  {filteredEvents.map((ev, i) => (
                    <motion.div
                      key={ev.id}
                      className={`grid items-center px-6 py-[14px] transition-colors hover:bg-[#F6F1E7] ${i < filteredEvents.length - 1 ? "border-b border-[#DCD4C2]" : ""}`}
                      style={{ gridTemplateColumns: "1fr 130px 80px 104px" }}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut", delay: i * 0.045 }}
                    >
                      {/* Event info */}
                      <div className="min-w-0 pr-4">
                        <p
                          className="text-[13px] text-[#1E1B16] truncate mb-[3px]"
                          style={{ fontFamily: "'Public Sans', system-ui, sans-serif", fontWeight: ev.status === "Live" ? 600 : 400 }}
                        >
                          {ev.title}
                        </p>
                        <p className="text-[9px] truncate" style={{ ...M, color: "#9C8E7E" }}>
                          {ev.date} · {ev.venue}
                        </p>
                      </div>
                      {/* Status badge */}
                      <div><OrgStatusBadge status={ev.status} /></div>
                      {/* Registration count */}
                      <span className="text-[11px] tabular-nums" style={{ ...M, color: "#9C8E7E" }}>
                        {ev.status === "Draft" ? "—" : `${ev.attendees}/${ev.capacity}`}
                      </span>
                      {/* Quick actions */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => startEdit(ev)}
                          className="p-2 rounded-[5px] text-[#6B6355] hover:bg-[#EDE7D9] hover:text-[#1E1B16] transition-colors"
                        >
                          <Pencil size={12} strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          aria-label="View Attendees"
                          onClick={() => onNavigate("org-attendees", ev.id)}
                          className="p-2 rounded-[5px] text-[#6B6355] hover:bg-[#EDE7D9] hover:text-[#1E1B16] transition-colors"
                        >
                          <Users size={12} strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          aria-label="Duplicate"
                          onClick={() => toast("Event duplicated as Draft")}
                          disabled={isGuest}
                          className="p-2 rounded-[5px] text-[#6B6355] hover:bg-[#EDE7D9] hover:text-[#1E1B16] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Copy size={12} strokeWidth={1.8} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.main>
        )}

        {/* ── Create / Edit form view ───────────────────────────────────────── */}
        {(view === "create" || view === "edit") && (
          <motion.main
            key="workspace-form"
            className="flex-1 overflow-auto bg-[#F6F1E7]"
            style={dotGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 sm:px-8 py-8">
              <div className="grid gap-7 grid-cols-1 lg:grid-cols-[1fr_296px]" style={{ alignItems: "start" }}>

                {/* ── Form cards ── */}
                <div className="space-y-4">

                  {/* Basic Info */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                    <FormCard title="Basic Info">
                      <div>
                        <FieldLabel>Event Title</FieldLabel>
                        <input
                          className={inputCls}
                          placeholder="e.g. Annual Research Symposium 2025"
                          value={form.title}
                          onChange={e => upd("title", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Category</FieldLabel>
                          <select
                            className={inputCls + " appearance-none cursor-pointer"}
                            value={form.category}
                            onChange={e => upd("category", e.target.value)}
                          >
                            {["Academic", "Workshop", "Leadership", "Career", "Research", "Conference", "Seminar"].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Department</FieldLabel>
                          <input
                            className={inputCls}
                            placeholder="e.g. Graduate School"
                            value={form.department}
                            onChange={e => upd("department", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                          className={inputCls + " resize-none"}
                          rows={4}
                          placeholder="Describe the event, its purpose, and what attendees can expect..."
                          value={form.description}
                          onChange={e => upd("description", e.target.value)}
                        />
                      </div>
                    </FormCard>
                  </motion.div>

                  {/* Schedule */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut", delay: 0.07 }}>
                    <FormCard title="Schedule">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <FieldLabel>Date</FieldLabel>
                          <input type="date" className={inputCls} value={form.date} onChange={e => upd("date", e.target.value)} />
                        </div>
                        <div>
                          <FieldLabel>Start Time</FieldLabel>
                          <input type="time" className={inputCls} value={form.startTime} onChange={e => upd("startTime", e.target.value)} />
                        </div>
                        <div>
                          <FieldLabel>End Time</FieldLabel>
                          <input type="time" className={inputCls} value={form.endTime} onChange={e => upd("endTime", e.target.value)} />
                        </div>
                      </div>
                      {/* Format segmented control */}
                      <div>
                        <FieldLabel>Format</FieldLabel>
                        <div className="flex rounded-[6px] border border-[#1E1B16]/20 overflow-hidden">
                          {(["in-person", "online", "hybrid"] as const).map((type, ti) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => upd("locationType", type)}
                              className="flex-1 py-2 text-[12px] transition-colors"
                              style={{
                                fontFamily: "'Public Sans', system-ui, sans-serif",
                                background: form.locationType === type ? "#1E1B16" : "#FCFAF3",
                                color: form.locationType === type ? "#F6F1E7" : "#6B6355",
                                borderRight: ti < 2 ? "1px solid rgba(30,27,22,0.15)" : "none",
                              }}
                            >
                              {type === "in-person" ? "In-person" : type === "online" ? "Online" : "Hybrid"}
                            </button>
                          ))}
                        </div>
                      </div>
                      {form.locationType !== "online" && (
                        <div>
                          <FieldLabel>Venue</FieldLabel>
                          <input
                            className={inputCls}
                            placeholder="e.g. Auditorium A, Building Name"
                            value={form.venue}
                            onChange={e => upd("venue", e.target.value)}
                          />
                        </div>
                      )}
                      {form.locationType === "online" && (
                        <div>
                          <FieldLabel>Meeting Link (optional)</FieldLabel>
                          <input className={inputCls} placeholder="https://..." />
                        </div>
                      )}
                    </FormCard>
                  </motion.div>

                  {/* Capacity & Registration */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut", delay: 0.14 }}>
                    <FormCard title="Capacity & Registration">
                      <div>
                        <FieldLabel>Maximum Attendees</FieldLabel>
                        <input
                          type="number"
                          min="1"
                          className={inputCls}
                          value={form.capacity}
                          onChange={e => upd("capacity", e.target.value)}
                        />
                      </div>
                      <div className="divide-y divide-[#DCD4C2]">
                        <OrgToggle on={form.requireRegistration} onChange={v => upd("requireRegistration", v)} label="Require registration" />
                        {form.requireRegistration && (
                          <OrgToggle on={form.enableWaitlist} onChange={v => upd("enableWaitlist", v)} label="Enable waitlist when full" />
                        )}
                        <OrgToggle on={form.requireCheckIn} onChange={v => upd("requireCheckIn", v)} label="Require QR check-in for attendance" />
                      </div>
                    </FormCard>
                  </motion.div>

                  {/* Media */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut", delay: 0.21 }}>
                    <FormCard title="Media">
                      <p className="text-[12px] text-[#6B6355] -mt-1" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                        Recommended banner size: 1200 × 400 px.
                      </p>
                      <OrgMediaDropzone />
                    </FormCard>
                  </motion.div>
                </div>

                {/* ── Live Preview panel ── */}
                <div className="sticky top-6">
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut", delay: 0.1 }}
                  >
                    <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-[13px] border-b border-[#DCD4C2]">
                        <p className="text-[9px] tracking-widest uppercase font-semibold" style={{ ...M, color: "#6B6355" }}>Event Preview</p>
                        <p className="text-[9px]" style={{ ...M, color: "#9C8E7E" }}>Updates live</p>
                      </div>
                      <div className="p-4">
                        <EventPreviewCard form={form} />
                      </div>
                      <div className="px-5 pb-5">
                        <p className="text-[10px] leading-[1.6] text-[#9C8E7E]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                          How this event appears to students in the Explore Events screen.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </OrgAppShell>
  );
}

// ─── Landing page (all existing content, unchanged) ──────────────────────────
export function LandingPage({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [demoStep, setDemoStep] = useState(0);

  const steps = [
    { num: "01", label: "Create Event",       icon: ClipboardList },
    { num: "02", label: "Students Scan",       icon: Scan          },
    { num: "03", label: "Certificate Issued",  icon: Award         },
  ];

  return (
    <div className="bg-[#F6F1E7] text-[#1E1B16] min-h-screen" style={dotGrid}>

      {/* ══ Nav ══════════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-[#F6F1E7] border-b border-[#1E1B16]/12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <BookMarked size={16} className="text-[#E2A23B]" strokeWidth={1.75} />
            <span className="text-[#1E1B16] text-base font-semibold tracking-tight" style={F}>Fieldbook</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {["Features", "For Campuses", "Pricing"].map((l) => (
              <a key={l} href="#" className="text-sm text-[#6B6355] hover:text-[#1E1B16] transition-colors duration-150">{l}</a>
            ))}
            <button
              onClick={() => onNavigate("admin-role-confirm")}
              className="text-sm text-[#6B6355] hover:text-[#1E1B16] transition-colors duration-150"
            >
              Sign in
            </button>
          </div>
          <button
            onClick={() => onNavigate("admin-role-confirm")}
            className="px-4 py-1.5 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main>

        {/* ══ Hero ══════════════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-28 grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-16 items-center">
          <div className="max-w-[500px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FCFAF3] border border-[#DCD4C2] rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C]" />
              <span className="text-[10px] text-[#6B6355] tracking-widest uppercase" style={M}>Campus Ledger System</span>
            </div>

            <h1 className="text-5xl lg:text-[3.6rem] font-semibold leading-[1.06] tracking-tight text-[#1E1B16] mb-6" style={F}>
              The Official Record<br />of Campus<br /><em className="text-[#6B6355]">Participation.</em>
            </h1>

            <p className="text-[#6B6355] text-lg leading-relaxed mb-10">
              Track events, verify attendance, and issue certificates that students carry forward. Built for institutions that take campus life seriously.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-12">
              <button
                onClick={() => onNavigate("admin-role-confirm")}
                className="flex items-center gap-2 px-6 py-3 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors"
              >
                Get Started <ArrowRight size={14} />
              </button>
              <button className="flex items-center gap-2 px-6 py-3 text-[#1E1B16] text-sm font-medium border border-[#1E1B16]/25 rounded-[7px] hover:border-[#1E1B16]/50 transition-colors">
                See how it works <ChevronRight size={14} />
              </button>
            </div>

            <div className="border-t border-[#DCD4C2] pt-10 flex items-center gap-8">
              {[["127+","Campuses"],["2.4M","Certificates"],["98.7%","Accuracy"]].map(([v,l]) => (
                <div key={l}>
                  <div className="text-xl font-semibold text-[#1E1B16] leading-none mb-1" style={F}>{v}</div>
                  <div className="text-xs text-[#6B6355]">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroLedger />
          </div>
        </section>

        {/* ══ Interactive Demo ══════════════════════════════════════════════ */}
        <section className="border-t border-[#DCD4C2] bg-[#FCFAF3]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>The Process</p>
                <h2 className="text-3xl font-semibold text-[#1E1B16] leading-snug" style={F}>
                  QR scan to certificate<br />in under a minute.
                </h2>
              </div>
              <p className="text-sm text-[#6B6355] max-w-xs">
                Select any step to see the live interface. Each transition is automatic — no manual steps for students.
              </p>
            </div>

            {/* Step selector tabs */}
            <div className="flex items-stretch border border-[#DCD4C2] rounded-[8px] overflow-hidden mb-6">
              {steps.map(({ num, label, icon: Icon }, i) => (
                <button
                  key={num}
                  onClick={() => setDemoStep(i)}
                  className={`flex-1 flex items-center gap-3 px-5 py-4 text-left transition-colors duration-200 ${
                    i < steps.length - 1 ? "border-r border-[#DCD4C2]" : ""
                  } ${demoStep === i ? "bg-[#1E1B16] text-[#F6F1E7]" : "bg-[#FCFAF3] text-[#6B6355] hover:bg-[#F6F1E7]"}`}
                >
                  <span
                    className="text-[10px] font-medium flex-shrink-0"
                    style={{ ...M, color: demoStep === i ? "#E2A23B" : undefined }}
                  >
                    {num}
                  </span>
                  <Icon size={14} strokeWidth={1.5} className="flex-shrink-0" />
                  <span className="text-xs font-medium hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Demo panel */}
            <div className="bg-[#F6F1E7] border border-[#DCD4C2] rounded-[8px] p-6 min-h-[280px]">
              <AnimatePresence mode="wait">
                {demoStep === 0 && <DemoCreate key="create" />}
                {demoStep === 1 && <DemoScan key="scan" />}
                {demoStep === 2 && <DemoCert key="cert" />}
              </AnimatePresence>
            </div>

            {/* Step description */}
            <p className="mt-5 text-xs text-[#6B6355] leading-relaxed max-w-xl">
              {[
                "Organizers register an event and receive a time-locked QR code bound to the venue and session window.",
                "Students point their camera at the QR on arrival. Each scan is timestamped and anti-spoofing checks run automatically.",
                "Verified attendance generates a cryptographically signed certificate, permanently registered to the student record.",
              ][demoStep]}
            </p>
          </div>
        </section>

        {/* ══ Roles ════════════════════════════════════════════════════════ */}
        <section className="border-t border-[#DCD4C2]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>Who It's For</p>
                <h2 className="text-3xl font-semibold text-[#1E1B16]" style={F}>Three roles, one system.</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  role: "STUDENT",
                  icon: GraduationCap,
                  title: "Build your campus record.",
                  desc: "Track every event you attend. Access your full participation history and download certificates whenever you need them.",
                  features: ["Personal participation ledger","Certificate portfolio","Event discovery feed","QR scan history"],
                  dark: false,
                },
                {
                  role: "ORGANIZER",
                  icon: ClipboardList,
                  title: "Run events with authority.",
                  desc: "Create events, generate QR codes, and monitor attendance in real time. Every scan recorded with a timestamp.",
                  features: ["Event creation & QR generation","Real-time attendance board","Certificate batch issuance","Exportable records"],
                  dark: true,
                },
                {
                  role: "ADMIN",
                  icon: Settings2,
                  title: "Govern participation.",
                  desc: "Oversight across all events and organizers. Set policies, review certificates, and generate institutional reports.",
                  features: ["Institution-wide dashboard","Organizer management","Policy configuration","Audit logs & compliance"],
                  dark: false,
                },
              ].map(({ role, icon: Icon, title, desc, features, dark }) => (
                <div
                  key={role}
                  className={`rounded-[8px] border p-6 ${dark ? "bg-[#1E1B16] border-[#1E1B16]" : "bg-[#FCFAF3] border-[#DCD4C2]"}`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[9px] tracking-widest font-medium" style={{ ...M, color: dark ? "#E2A23B" : "#6B6355" }}>{role}</span>
                    <Icon size={15} strokeWidth={1.5} style={{ color: dark ? "#E2A23B" : "#6B6355" }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2.5 leading-snug" style={{ ...F, color: dark ? "#F6F1E7" : "#1E1B16" }}>{title}</h3>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: dark ? "#9A9080" : "#6B6355" }}>{desc}</p>
                  <ul className="space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: dark ? "#DCD4C2" : "#1E1B16" }}>
                        <Check size={11} style={{ color: dark ? "#E2A23B" : "#2E6B4C", flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Features Grid ════════════════════════════════════════════════ */}
        <section className="border-t border-[#DCD4C2] bg-[#FCFAF3]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>Platform</p>
                <h2 className="text-3xl font-semibold text-[#1E1B16] leading-snug" style={F}>Everything the<br />ledger needs.</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#DCD4C2] border border-[#DCD4C2] rounded-[8px] overflow-hidden">
              {[
                { icon: QrCode,    title: "QR Attendance",      tag: "CORE",       desc: "Unique per-event QR codes. Scans timestamped and logged instantly. Anti-spoofing and time-window enforcement built in to every session." },
                { icon: Award,     title: "Digital Certificates", tag: "CORE",     desc: "Verifiable credentials generated at event close. Carry your institution's seal, cryptographic signature, and a permanent public verification link." },
                { icon: BarChart3, title: "Analytics",           tag: "INSIGHT",   desc: "Engagement reports, participation trends, and cohort analysis. Identify your most active departments and the events that drive engagement." },
                { icon: Compass,   title: "Discovery",           tag: "ENGAGEMENT", desc: "Students browse a curated feed of upcoming events. Follow departments, receive invitations, and plan the semester ahead." },
              ].map(({ icon: Icon, title, tag, desc }) => (
                <div key={title} className="bg-[#FCFAF3] p-8 group hover:bg-[#F6F1E7] transition-colors duration-200">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-10 h-10 border border-[#DCD4C2] rounded-[6px] flex items-center justify-center group-hover:border-[#1E1B16]/30 transition-colors">
                      <Icon size={17} strokeWidth={1.5} className="text-[#6B6355] group-hover:text-[#1E1B16] transition-colors" />
                    </div>
                    <span className="text-[9px] tracking-widest text-[#6B6355]" style={M}>{tag}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1E1B16] mb-2" style={F}>{title}</h3>
                  <p className="text-sm text-[#6B6355] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Stats ════════════════════════════════════════════════════════ */}
        <section className="border-t border-[#DCD4C2]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {[
                { v: "127",  u: "+",  l: "Partner Campuses" },
                { v: "2.4",  u: "M",  l: "Certificates Issued" },
                { v: "98.7", u: "%",  l: "Verification Accuracy" },
                { v: "48",   u: "",   l: "Countries" },
              ].map(({ v, u, l }) => (
                <div key={l} className="border-l-2 border-[#E2A23B] pl-5">
                  <div className="text-4xl font-light text-[#1E1B16] leading-none mb-2" style={F}>
                    {v}<span className="text-[#E2A23B]">{u}</span>
                  </div>
                  <div className="text-xs text-[#6B6355]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ══════════════════════════════════════════════════════════ */}
        <section className="border-t border-[#DCD4C2] bg-[#FCFAF3]">
          <div className="max-w-xl mx-auto px-6 py-28 text-center">
            <div className="flex justify-center mb-8">
              <CertificateSeal size={80} rotate={-7} delay={0} />
            </div>
            <h2 className="text-4xl font-semibold text-[#1E1B16] mb-5 leading-[1.1]" style={F}>
              Ready to formalize<br /><em className="text-[#6B6355]">campus participation?</em>
            </h2>
            <p className="text-[#6B6355] mb-10 leading-relaxed">
              Join 127 institutions building a verifiable record of student engagement. Setup takes under a day.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => onNavigate("admin-role-confirm")}
                className="flex items-center gap-2 px-7 py-3 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors"
              >
                {"Get Started — it's free"} <ArrowRight size={14} />
              </button>
              <button className="px-7 py-3 text-sm font-medium text-[#1E1B16] border border-[#1E1B16]/25 rounded-[7px] hover:border-[#1E1B16]/50 transition-colors">
                Request a Demo
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ══ Footer ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#DCD4C2]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <BookMarked size={14} className="text-[#E2A23B]" strokeWidth={1.75} />
                <span className="font-semibold text-[#1E1B16]" style={F}>Fieldbook</span>
              </div>
              <p className="text-xs text-[#6B6355] leading-relaxed max-w-[180px]">
                The official campus participation ledger for institutions that take student engagement seriously.
              </p>
            </div>
            {[
              { h: "Product",      ls: ["Features","Certificates","Analytics","Discovery"] },
              { h: "Institutions", ls: ["Student Portal","Organizer Tools","Admin Dashboard","Integrations"] },
              { h: "Company",      ls: ["About","Blog","Careers","Contact"] },
            ].map(({ h, ls }) => (
              <div key={h}>
                <h4 className="text-[9px] font-semibold text-[#1E1B16] mb-3 tracking-widest uppercase" style={M}>{h}</h4>
                <ul className="space-y-2">
                  {ls.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-xs text-[#6B6355] hover:text-[#1E1B16] transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#DCD4C2] pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <p className="text-[9px] text-[#6B6355]" style={M}>© 2024 Fieldbook Systems, Inc. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {["Privacy","Terms","Security"].map((l) => (
                <a key={l} href="#" className="text-[9px] text-[#6B6355] hover:text-[#1E1B16] transition-colors" style={M}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Organizer Analytics ─────────────────────────────────────────────────────

const ANALYTICS_EVENTS = [
  { id: "all",  label: "All Events" },
  { id: "ev1",  label: "Environmental Policy Symposium" },
  { id: "ev2",  label: "Robotics Club Showcase" },
  { id: "ev3",  label: "Career Fair 2024" },
  { id: "ev4",  label: "Research Poster Session" },
];

type DateRange = "7d" | "30d" | "all";

const REGISTRATIONS_ALL: Record<DateRange, { date: string; count: number }[]> = {
  "7d": [
    { date: "Nov 7",  count: 14 },
    { date: "Nov 8",  count: 22 },
    { date: "Nov 9",  count: 18 },
    { date: "Nov 10", count: 31 },
    { date: "Nov 11", count: 27 },
    { date: "Nov 12", count: 45 },
    { date: "Nov 13", count: 38 },
  ],
  "30d": [
    { date: "Oct 14", count: 6  },
    { date: "Oct 17", count: 11 },
    { date: "Oct 21", count: 9  },
    { date: "Oct 24", count: 17 },
    { date: "Oct 28", count: 14 },
    { date: "Oct 31", count: 23 },
    { date: "Nov 4",  count: 19 },
    { date: "Nov 7",  count: 14 },
    { date: "Nov 8",  count: 22 },
    { date: "Nov 9",  count: 18 },
    { date: "Nov 10", count: 31 },
    { date: "Nov 11", count: 27 },
    { date: "Nov 12", count: 45 },
    { date: "Nov 13", count: 38 },
  ],
  "all": [
    { date: "Sep",    count: 32 },
    { date: "Oct",    count: 74 },
    { date: "Nov 1",  count: 28 },
    { date: "Nov 4",  count: 19 },
    { date: "Nov 7",  count: 14 },
    { date: "Nov 8",  count: 22 },
    { date: "Nov 9",  count: 18 },
    { date: "Nov 10", count: 31 },
    { date: "Nov 11", count: 27 },
    { date: "Nov 12", count: 45 },
    { date: "Nov 13", count: 38 },
  ],
};

const ATTENDANCE_DATA = [
  { event: "Env. Policy Symp.", checked: 87, noshow: 13 },
  { event: "Robotics Showcase", checked: 62, noshow: 28 },
  { event: "Career Fair 2024",  checked: 145, noshow: 41 },
  { event: "Research Posters",  checked: 54, noshow: 19 },
];

const TOP_EVENTS_DATA = [
  { rank: 1, title: "Career Fair 2024",               date: "Nov 5, 2024",  regs: 186, checkin: 145, rate: 78 },
  { rank: 2, title: "Environmental Policy Symposium", date: "Nov 14, 2024", regs: 100, checkin: 87,  rate: 87 },
  { rank: 3, title: "Robotics Club Showcase",         date: "Oct 30, 2024", regs: 90,  checkin: 62,  rate: 69 },
  { rank: 4, title: "Research Poster Session",        date: "Oct 22, 2024", regs: 73,  checkin: 54,  rate: 74 },
];

function AnalyticsDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.id === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-[7px] bg-[#FCFAF3] border border-[#DCD4C2] rounded-[6px] text-[12px] text-[#1E1B16] hover:border-[#1E1B16]/35 transition-colors"
        style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}
      >
        <span className="max-w-[180px] truncate">{current?.label}</span>
        <ChevronDown size={11} strokeWidth={1.75} className="text-[#6B6355] flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] overflow-hidden shadow-none min-w-[220px]">
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[12px] transition-colors ${
                opt.id === value
                  ? "bg-[#F6F1E7] text-[#1E1B16] font-medium"
                  : "text-[#6B6355] hover:bg-[#F6F1E7] hover:text-[#1E1B16]"
              }`}
              style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const DATE_RANGE_OPTIONS: { id: DateRange; label: string }[] = [
  { id: "7d",  label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "all", label: "All time" },
];

export function OrgAnalyticsScreen({ onNavigate, isGuest }: { onNavigate: (s: Screen) => void; isGuest?: boolean }) {
  const [eventScope, setEventScope] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [hoveredRegIdx, setHoveredRegIdx] = useState<number | null>(null);
  const [hoveredBarRow, setHoveredBarRow] = useState<number | null>(null);

  function handleNav(id: string) {
    if (id === "profile")       { onNavigate("profile");       return; }
    if (id === "landing")       { onNavigate("landing");       return; }
    if (id === "org-dashboard") { onNavigate("org-dashboard"); return; }
    if (id === "org-events")    { onNavigate("org-events");    return; }
    if (id === "org-qr")        { onNavigate("org-qr");        return; }
    if (id === "org-attendees") { onNavigate("org-attendees"); return; }
    if (id === "org-certs")     { onNavigate("org-certs");     return; }
  }

  const regData = REGISTRATIONS_ALL[dateRange];
  const peakCount = Math.max(...regData.map(d => d.count));
  const totalRegs = regData.reduce((s, d) => s + d.count, 0);
  const totalCheckedIn = ATTENDANCE_DATA.reduce((s, d) => s + d.checked, 0);
  const totalNoShow = ATTENDANCE_DATA.reduce((s, d) => s + d.noshow, 0);
  const avgCheckinRate = Math.round((totalCheckedIn / (totalCheckedIn + totalNoShow)) * 100);

  const metricStrip = [
    { label: "Total Registrations", value: totalRegs.toString(), sub: `in range` },
    { label: "Checked In",          value: totalCheckedIn.toString(), sub: `across all events`, color: "#2E6B4C" },
    { label: "No-shows",            value: totalNoShow.toString(), sub: "did not attend" },
    { label: "Avg. Check-in Rate",  value: `${avgCheckinRate}%`, sub: "attendance efficiency", color: avgCheckinRate >= 75 ? "#2E6B4C" : "#6B6355" },
    { label: "Active Events",       value: "4", sub: "this period" },
  ];

  return (
    <OrgAppShell
      activeNav="org-analytics"
      orgName="Dr. Marcus Webb"
      orgRole="Student Affairs Office"
      notifCount={2}
      onNav={handleNav}
      onCreateEvent={() => onNavigate("org-events")}
      isGuest={isGuest}
      topBarLeft={
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Analytics</span>
          <span className="text-[#DCD4C2] text-sm">·</span>
          <AnalyticsDropdown
            value={eventScope}
            options={ANALYTICS_EVENTS}
            onChange={setEventScope}
          />
        </div>
      }
      topBarActions={
        <div className="flex items-center gap-1.5 p-[3px] bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px]">
          {DATE_RANGE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDateRange(opt.id)}
              className={`px-3 py-[5px] rounded-[5px] text-[11px] font-medium transition-colors ${
                dateRange === opt.id
                  ? "bg-[#1E1B16] text-[#F6F1E7]"
                  : "text-[#6B6355] hover:text-[#1E1B16]"
              }`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7 space-y-5">

          {/* ── Metric strip ── */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {metricStrip.map((m, i) => {
              const suffix = m.value.endsWith("%") ? "%" : "";
              return (
                <div
                  key={m.label}
                  className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] px-4 py-4"
                >
                  <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>{m.label}</div>
                  <div className="text-[1.65rem] font-semibold leading-none mb-1.5" style={F}>
                    <StatMetricNumber
                      target={parseMetricNum(m.value)}
                      formatted={m.value.replace("%", "")}
                      color={m.color ?? "#1E1B16"}
                      duration={550}
                      delay={i * 70}
                      suffix={suffix}
                    />
                  </div>
                  <div className="text-[9px] text-[#9C8E7E]" style={M}>{m.sub}</div>
                </div>
              );
            })}
          </motion.div>

          {/* ── Row 2: Line chart (2/3) + Attendance bar (1/3) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Registrations over time — pure SVG */}
            <motion.div
              className="col-span-1 lg:col-span-2 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
            >
              <div className="px-6 pt-5 pb-4 border-b border-[#DCD4C2] flex items-center justify-between">
                <div>
                  <div className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Registrations Over Time</div>
                  <div className="text-[11px] text-[#9C8E7E] mt-0.5" style={M}>
                    {totalRegs} total · peak {peakCount}/day
                  </div>
                </div>
                <TrendingUp size={14} strokeWidth={1.5} className="text-[#E2A23B]" />
              </div>
              <div className="px-4 pt-5 pb-4 relative">
                {/* SVG line chart */}
                {(() => {
                  const VW = 600, VH = 200;
                  const ml = 32, mr = 8, mt = 6, mb = 26;
                  const pw = VW - ml - mr, ph = VH - mt - mb;
                  const n = regData.length;
                  const maxV = Math.ceil(peakCount * 1.15 / 10) * 10 || 10;
                  const yTicks = [0, Math.round(maxV * 0.5), maxV];
                  const px = (i: number) => ml + (n < 2 ? pw / 2 : (i / (n - 1)) * pw);
                  const py = (v: number) => mt + (1 - v / maxV) * ph;
                  const linePath = regData.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d.count).toFixed(1)}`).join(" ");
                  const hovered = hoveredRegIdx !== null ? regData[hoveredRegIdx] : null;
                  return (
                    <svg
                      viewBox={`0 0 ${VW} ${VH}`}
                      className="w-full"
                      style={{ height: VH, display: "block" }}
                      onMouseLeave={() => setHoveredRegIdx(null)}
                    >
                      {/* Gridlines */}
                      {yTicks.map(v => (
                        <g key={v}>
                          <line x1={ml} y1={py(v)} x2={ml + pw} y2={py(v)} stroke="rgba(220,212,194,0.6)" strokeWidth={1} />
                          <text x={ml - 4} y={py(v) + 3} textAnchor="end" fontSize={9} fill="#9C8E7E" fontFamily="'IBM Plex Mono',monospace">{v}</text>
                        </g>
                      ))}
                      {/* X axis baseline */}
                      <line x1={ml} y1={mt + ph} x2={ml + pw} y2={mt + ph} stroke="#DCD4C2" strokeWidth={1} />
                      {/* X labels: first, ~middle, last */}
                      {regData.map((d, i) => {
                        const show = i === 0 || i === Math.round((n - 1) / 2) || i === n - 1;
                        return show ? (
                          <text key={i} x={px(i)} y={VH - 4} textAnchor="middle" fontSize={9} fill="#9C8E7E" fontFamily="'IBM Plex Mono',monospace">{d.date}</text>
                        ) : null;
                      })}
                      {/* Cursor line on hover */}
                      {hoveredRegIdx !== null && (
                        <line x1={px(hoveredRegIdx)} y1={mt} x2={px(hoveredRegIdx)} y2={mt + ph} stroke="rgba(30,27,22,0.07)" strokeWidth={1} />
                      )}
                      {/* Line */}
                      <path d={linePath} fill="none" stroke="#1E1B16" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
                      {/* Dots */}
                      {regData.map((d, i) => {
                        const isPeak = d.count === peakCount;
                        const isHov = hoveredRegIdx === i;
                        return isPeak ? (
                          <circle key={i} cx={px(i)} cy={py(d.count)} r={isHov ? 6 : 5} fill="#E2A23B" stroke="#1E1B16" strokeWidth={1.5} />
                        ) : (
                          <circle key={i} cx={px(i)} cy={py(d.count)} r={isHov ? 4 : 2.5} fill={isHov ? "#E2A23B" : "#1E1B16"} stroke={isHov ? "#1E1B16" : "none"} strokeWidth={isHov ? 1.5 : 0} />
                        );
                      })}
                      {/* Invisible hover zones */}
                      {regData.map((d, i) => (
                        <rect
                          key={i}
                          x={px(i) - (pw / Math.max(n - 1, 1)) / 2}
                          y={mt}
                          width={pw / Math.max(n - 1, 1)}
                          height={ph}
                          fill="transparent"
                          onMouseEnter={() => setHoveredRegIdx(i)}
                        />
                      ))}
                    </svg>
                  );
                })()}
                {/* Hover tooltip */}
                {hoveredRegIdx !== null && (() => {
                  const d = regData[hoveredRegIdx];
                  const n = regData.length;
                  const VW = 600;
                  const ml = 32, mr = 8;
                  const pw = VW - ml - mr;
                  const rawX = ml + (n < 2 ? pw / 2 : (hoveredRegIdx / (n - 1)) * pw);
                  const pct = rawX / VW;
                  return (
                    <div
                      className="absolute pointer-events-none bg-[#FCFAF3] border border-[#DCD4C2] rounded-[6px] px-3 py-2 text-left"
                      style={{ ...M, bottom: "calc(100% - 180px)", left: `clamp(8px, calc(${(pct * 100).toFixed(1)}% - 48px), calc(100% - 100px))` }}
                    >
                      <div className="text-[9px] text-[#6B6355] mb-0.5">{d.date}</div>
                      <div className="text-[12px] font-semibold text-[#1E1B16]">{d.count} reg.</div>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-3 mt-3 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-[1.5px] bg-[#1E1B16] inline-block" />
                    <span className="text-[9px] text-[#6B6355]" style={M}>Registrations</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2A23B] border border-[#1E1B16] inline-block" />
                    <span className="text-[9px] text-[#6B6355]" style={M}>Peak / current</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Check-in vs No-show — pure SVG */}
            <motion.div
              className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
            >
              <div className="px-5 pt-5 pb-4 border-b border-[#DCD4C2]">
                <div className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Checked In vs No-show</div>
                <div className="text-[11px] text-[#9C8E7E] mt-0.5" style={M}>by event</div>
              </div>
              <div className="px-3 pt-4 pb-4 relative">
                {(() => {
                  const VW = 300, VH = 200;
                  const labelW = 82, mr = 12, mt = 8;
                  const pw = VW - labelW - mr;
                  const rows = ATTENDANCE_DATA.length;
                  const rowH = (VH - mt) / rows;
                  const maxVal = Math.max(...ATTENDANCE_DATA.map(d => d.checked + d.noshow));
                  const barH = 7, gap = 4;
                  return (
                    <svg
                      viewBox={`0 0 ${VW} ${VH}`}
                      className="w-full"
                      style={{ height: VH, display: "block" }}
                      onMouseLeave={() => setHoveredBarRow(null)}
                    >
                      {ATTENDANCE_DATA.map((d, i) => {
                        const cy = mt + i * rowH + rowH / 2;
                        const checkedW = (d.checked / maxVal) * pw;
                        const noshowW = (d.noshow / maxVal) * pw;
                        const isHov = hoveredBarRow === i;
                        return (
                          <g key={i} onMouseEnter={() => setHoveredBarRow(i)}>
                            {isHov && <rect x={0} y={mt + i * rowH} width={VW} height={rowH} fill="rgba(30,27,22,0.03)" />}
                            <text x={labelW - 4} y={cy - gap / 2} textAnchor="end" fontSize={9} fill="#6B6355" fontFamily="'IBM Plex Mono',monospace" dominantBaseline="middle">{d.event}</text>
                            <rect x={labelW} y={cy - barH - gap / 2} width={Math.max(checkedW, 2)} height={barH} fill="#2E6B4C" rx={2} ry={2} />
                            <rect x={labelW} y={cy + gap / 2} width={Math.max(noshowW, 2)} height={barH} fill="#DCD4C2" rx={2} ry={2} />
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
                {/* Bar hover tooltip */}
                {hoveredBarRow !== null && (() => {
                  const d = ATTENDANCE_DATA[hoveredBarRow];
                  const rows = ATTENDANCE_DATA.length;
                  const VH = 200;
                  const mt = 8;
                  const rowH = (VH - mt) / rows;
                  const topPct = ((mt + hoveredBarRow * rowH + rowH / 2) / VH * 100).toFixed(1);
                  return (
                    <div
                      className="absolute pointer-events-none right-4 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[6px] px-3 py-2 space-y-1"
                      style={{ ...M, top: `calc(${topPct}% - 28px)` }}
                    >
                      <div className="text-[9px] text-[#6B6355] truncate max-w-[140px]">{d.event}</div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#2E6B4C" }} />
                        <span className="text-[#6B6355]">In: </span>
                        <span className="font-semibold text-[#1E1B16]">{d.checked}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#DCD4C2" }} />
                        <span className="text-[#6B6355]">No-show: </span>
                        <span className="font-semibold text-[#1E1B16]">{d.noshow}</span>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-4 mt-2 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2E6B4C] inline-block flex-shrink-0" />
                    <span className="text-[9px] text-[#6B6355]" style={M}>Checked in</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DCD4C2] inline-block flex-shrink-0" />
                    <span className="text-[9px] text-[#6B6355]" style={M}>No-show</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Top Events Ranked ── */}
          <motion.div
            className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.14 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#DCD4C2] flex items-center justify-between">
              <div className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Top Events — Ranked by Attendance</div>
              <span className="text-[9px] text-[#9C8E7E]" style={M}>Check-in rate</span>
            </div>

            {/* Column headers */}
            <div className="px-6 py-2.5 border-b border-[#DCD4C2] grid grid-cols-[28px,1fr,120px,80px,80px,100px] gap-4 items-center">
              {["#", "Event", "Date", "Reg.", "Checked In", "Rate"].map(h => (
                <span key={h} className="text-[8px] tracking-widest uppercase text-[#9C8E7E]" style={M}>{h}</span>
              ))}
            </div>

            {TOP_EVENTS_DATA.map((ev, i) => {
              const isTop = i === 0;
              return (
                <div
                  key={ev.rank}
                  className={`px-6 py-4 grid grid-cols-[28px,1fr,120px,80px,80px,100px] gap-4 items-center ${
                    i < TOP_EVENTS_DATA.length - 1 ? "border-b border-[#DCD4C2]" : ""
                  } ${isTop ? "bg-[#F6F1E7]" : ""}`}
                >
                  {/* Rank */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 ${
                      isTop ? "bg-[#E2A23B] text-[#1E1B16]" : "bg-[#EDE7DA] text-[#6B6355]"
                    }`}
                    style={M}
                  >
                    {ev.rank}
                  </div>

                  {/* Title */}
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#1E1B16] truncate" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
                      {ev.title}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-[10px] text-[#6B6355]" style={M}>{ev.date}</div>

                  {/* Registrations */}
                  <div className="text-[12px] font-medium text-[#1E1B16]" style={M}>{ev.regs}</div>

                  {/* Checked in */}
                  <div className="text-[12px] font-medium" style={{ ...M, color: "#2E6B4C" }}>{ev.checkin}</div>

                  {/* Rate bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[5px] bg-[#EDE7DA] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${ev.rate}%`,
                          background: ev.rate >= 80 ? "#2E6B4C" : ev.rate >= 65 ? "#6B6355" : "#DCD4C2",
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium flex-shrink-0 w-9 text-right"
                      style={{ ...M, color: ev.rate >= 80 ? "#2E6B4C" : "#6B6355" }}
                    >
                      {ev.rate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>

        </div>
      </main>
    </OrgAppShell>
  );
}

// ─── Organizer Certificates ──────────────────────────────────────────────────

type CertRecipient = {
  id: string; name: string; studentId: string; email: string;
  checkedIn: string; status: "Pending" | "Sent" | "Failed";
};

const CERT_EVENT_DATA = {
  title: "Design Thinking Workshop",
  date: "November 8, 2024",
  venue: "Innovation Lab",
  eligible: 38, total: 40,
};

const INITIAL_RECIPIENTS: CertRecipient[] = [
  { id:"r1",  name:"Aaliyah Johnson",  studentId:"AJO-8812", email:"a.johnson@university.edu",  checkedIn:"09:03 AM", status:"Sent"    },
  { id:"r2",  name:"Ben Torres",       studentId:"BTO-4427", email:"b.torres@university.edu",   checkedIn:"09:07 AM", status:"Sent"    },
  { id:"r3",  name:"Clara Huang",      studentId:"CHU-2209", email:"c.huang@university.edu",    checkedIn:"09:11 AM", status:"Sent"    },
  { id:"r4",  name:"David Eze",        studentId:"DEZ-5503", email:"d.eze@university.edu",      checkedIn:"09:14 AM", status:"Failed"  },
  { id:"r5",  name:"Emeka Osei",       studentId:"EOS-7741", email:"e.osei@university.edu",     checkedIn:"09:18 AM", status:"Sent"    },
  { id:"r6",  name:"Fatima Al-Rashid", studentId:"FAL-3398", email:"f.alrashid@university.edu", checkedIn:"09:22 AM", status:"Pending" },
  { id:"r7",  name:"George Nakamura",  studentId:"GNA-9915", email:"g.nakamura@university.edu", checkedIn:"09:25 AM", status:"Pending" },
  { id:"r8",  name:"Hannah Park",      studentId:"HPA-1134", email:"h.park@university.edu",     checkedIn:"09:31 AM", status:"Pending" },
  { id:"r9",  name:"Ivan Petrov",      studentId:"IPE-6622", email:"i.petrov@university.edu",   checkedIn:"09:35 AM", status:"Pending" },
  { id:"r10", name:"Jasmine Wright",   studentId:"JWR-0081", email:"j.wright@university.edu",   checkedIn:"09:40 AM", status:"Failed"  },
];

// ─── Certificate Issuance Modal ───────────────────────────────────────────────

function CertIssuanceModal({
  recipientName, eventTitle, eventDate, organizer, onClose,
}: {
  recipientName: string; eventTitle: string; eventDate: string; organizer: string; onClose: () => void;
}) {
  const DURATION = 2700;
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const [sealPopped, setSealPopped] = useState(false);

  useEffect(() => {
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const e = Math.min(ts - startRef.current, DURATION);
      setElapsed(e);
      if (e < DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Trigger seal pop once when done
  useEffect(() => {
    if (elapsed >= DURATION && !sealPopped) setSealPopped(true);
  }, [elapsed >= DURATION]);

  // Stroke segments [x1,y1,x2,y2] in 540×354 viewBox — plotter order
  const segs: [number,number,number,number][] = [
    [12,12,528,12],     // border top
    [528,12,528,342],   // border right
    [528,342,12,342],   // border bottom
    [12,342,12,12],     // border left
    [12,54,528,54],     // header rule
    [24,106,310,106],   // recipient name baseline
    [24,154,420,154],   // event title baseline
    [24,174,195,174],   // date baseline
    [12,296,528,296],   // footer rule
    [28,288,118,288],   // signature stub (last)
  ];

  const lengths = segs.map(([x1,y1,x2,y2]) => Math.hypot(x2-x1, y2-y1));
  const total = lengths.reduce((a,b) => a+b, 0);
  const vel = total / DURATION;

  // Cumulative start/end time for each segment
  const segT: { start:number; end:number }[] = [];
  let cum = 0;
  for (const l of lengths) {
    segT.push({ start: cum, end: cum + l/vel });
    cum += l/vel;
  }

  function offset(i: number): number {
    const { start, end } = segT[i];
    if (elapsed <= start) return lengths[i];
    if (elapsed >= end) return 0;
    return lengths[i] * (1 - (elapsed - start) / (end - start));
  }

  function dotPos(): { x:number; y:number } {
    for (let i = 0; i < segs.length; i++) {
      if (elapsed <= segT[i].end) {
        const [x1,y1,x2,y2] = segs[i];
        const t = elapsed <= segT[i].start ? 0 : (elapsed - segT[i].start) / (segT[i].end - segT[i].start);
        return { x: x1+(x2-x1)*t, y: y1+(y2-y1)*t };
      }
    }
    const last = segs[segs.length-1];
    return { x: last[2], y: last[3] };
  }

  // Opacity helpers — text fades in at stroke-start, reaches 1 by stroke-end
  function fade(segIdx: number, extra = 0): number {
    const { start, end } = segT[segIdx];
    const dur = end - start + extra;
    if (elapsed <= start) return 0;
    return Math.min(1, (elapsed - start) / dur);
  }

  const dot = dotPos();
  const done = elapsed >= DURATION;

  // Text opacities keyed to their corresponding stroke
  const opHeader  = fade(4);       // header rule → header text
  const opName    = fade(5);       // name baseline → recipient name
  const opTitle   = fade(6);       // title baseline → event title + has attended label
  const opDate    = fade(7);       // date baseline → date text
  const opSig     = fade(9, 200);  // signature → organizer name

  return (
    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.18 }}>
      <div className="absolute inset-0 bg-[#1E1B16]/40" onClick={done ? onClose : undefined} />
      <motion.div
        initial={{ scale:0.93, y:14 }} animate={{ scale:1, y:0 }}
        transition={{ duration:0.22, ease:"easeOut" }}
        className="relative z-10 rounded-[10px] overflow-hidden w-full max-w-[596px] mx-4"
        style={{ background:"#FCFAF3", border:"1px solid #DCD4C2", boxShadow:"0 20px 60px rgba(30,27,22,0.14)" }}>

        {/* Modal header bar */}
        <div className="px-6 pt-5 pb-4 border-b border-[#DCD4C2] flex items-center justify-between">
          <div>
            <div className="text-[9px] tracking-widest uppercase mb-1" style={{ ...M, color:"#6B6355" }}>
              {done ? "Certificate Issued" : "Issuing Certificate"}
            </div>
            <div className="text-[14px] font-semibold text-[#1E1B16]" style={F}>{recipientName}</div>
          </div>
          {done && (
            <button type="button" onClick={onClose} aria-label="Close"
              className="p-1.5 rounded-[5px] hover:bg-[#EDE7DA] transition-colors">
              <X size={14} strokeWidth={1.75} className="text-[#6B6355]" />
            </button>
          )}
        </div>

        {/* Certificate canvas */}
        <div className="p-5" style={{ perspective: "900px" }}>
          <motion.div
            initial={{ rotateX: 6, rotateY: -4, scale: 0.96 }}
            animate={done ? { rotateX: 0, rotateY: 0, scale: 1 } : { rotateX: 6, rotateY: -4, scale: 0.96 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ transformOrigin: "center 55%" }}
          >
          <div style={{
            background:"#FFFFFF", border:"1px solid rgba(30,27,22,0.12)",
            borderRadius:6, overflow:"hidden", position:"relative",
            boxShadow: done ? "0 4px 18px rgba(30,27,22,0.10)" : "0 18px 54px rgba(30,27,22,0.26)",
            transition: "box-shadow 400ms ease-out",
          }}>
            {/* Accent top bar */}
            <div style={{ height:3, background:"#E2A23B", position:"absolute", top:0, left:0, right:0 }} />
            {/* Dot-grid watermark */}
            <div style={{
              position:"absolute", inset:0, pointerEvents:"none",
              backgroundImage:"radial-gradient(circle, rgba(30,27,22,0.04) 1px, transparent 1px)",
              backgroundSize:"18px 18px",
            }} />

            <svg viewBox="0 0 540 354" style={{ width:"100%", display:"block" }}>

              {/* ── Plotter strokes ── */}
              {segs.map(([x1,y1,x2,y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#1E1B16" strokeWidth={0.8} strokeLinecap="round"
                  strokeDasharray={lengths[i]} strokeDashoffset={offset(i)} />
              ))}

              {/* ── Amber dot (pen head) ── */}
              {!done && (
                <circle cx={dot.x} cy={dot.y} r={3.5} fill="#E2A23B" />
              )}

              {/* ── Text layers (fade in with corresponding stroke) ── */}

              {/* Header content */}
              <g opacity={opHeader}>
                <text x={24} y={34} fontSize={7.5} fontWeight={600} letterSpacing="0.13em"
                  fontFamily="'IBM Plex Mono',monospace" fill="#1E1B16">FIELDBOOK</text>
                <text x={516} y={34} fontSize={6} letterSpacing="0.08em" textAnchor="end"
                  fontFamily="'IBM Plex Mono',monospace" fill="#9C8E7E">CERTIFICATE OF PARTICIPATION</text>
                <text x={24} y={72} fontSize={6} letterSpacing="0.13em"
                  fontFamily="'IBM Plex Mono',monospace" fill="#9C8E7E">THIS CERTIFIES THAT</text>
              </g>

              {/* Recipient name */}
              <g opacity={opName}>
                <text x={24} y={99} fontSize={26} fontWeight={600} fontFamily="'Fraunces',Georgia,serif" fill="#1E1B16">{recipientName}</text>
                <text x={24} y={116} fontSize={7} fontFamily="'IBM Plex Mono',monospace" fill="#9C8E7E">Student ID: XXX-0000</text>
              </g>

              {/* Event title */}
              <g opacity={opTitle}>
                <text x={24} y={136} fontSize={6} letterSpacing="0.13em"
                  fontFamily="'IBM Plex Mono',monospace" fill="#9C8E7E">HAS ATTENDED</text>
                <text x={24} y={151} fontSize={15} fontWeight={600} fontFamily="'Fraunces',Georgia,serif" fill="#1E1B16">{eventTitle}</text>
              </g>

              {/* Date */}
              <g opacity={opDate}>
                <text x={24} y={170} fontSize={7} fontFamily="'IBM Plex Mono',monospace" fill="#9C8E7E">{eventDate} · {CERT_EVENT_DATA.venue}</text>
              </g>

              {/* Organizer name */}
              <g opacity={opSig}>
                <text x={28} y={310} fontSize={6.5} fontFamily="'IBM Plex Mono',monospace" fill="#9C8E7E">{organizer}</text>
              </g>

              {/* ── Seal badge (scale-pop on completion) ── */}
              <g transform="translate(498, 315)">
                <motion.g
                  style={{ originX:"10px", originY:"10px" }}
                  initial={{ scale:0 }}
                  animate={{ scale: sealPopped ? 1 : Math.min(opSig, 0.5) }}
                  transition={sealPopped
                    ? { type:"spring", stiffness:500, damping:22, duration:0.3 }
                    : { duration:0.05 }}>
                  <circle cx={10} cy={10} r={9} fill="#E2A23B" />
                  <circle cx={10} cy={10} r={7} fill="none" stroke="rgba(30,27,22,0.2)" strokeWidth={0.5} />
                  <path d="M6.5,10.5 L9,13 L13.5,7.5" stroke="#1E1B16" strokeWidth={1.2}
                    strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </motion.g>
              </g>

            </svg>
          </div>
          </motion.div>
        </div>

        {/* Footer actions (shown on completion) */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              transition={{ duration:0.2, ease:"easeOut" }}
              className="px-6 pb-5 flex items-center justify-between overflow-hidden">
              <span style={{ ...M, color:"#9C8E7E" }} className="text-[9px]">Issued · {eventDate}</span>
              <button type="button" onClick={onClose}
                className="flex items-center gap-2 px-4 py-[7px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85"
                style={{ background:"#E2A23B", color:"#1E1B16", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                <Check size={12} strokeWidth={2.5} /> Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
}

function CertStatusPill({ status }: { status: CertRecipient["status"] }) {
  const cfg = {
    Sent:    { bg:"rgba(46,107,76,0.10)",  border:"rgba(46,107,76,0.3)",   text:"#2E6B4C", dot:"#2E6B4C" },
    Pending: { bg:"rgba(226,162,59,0.10)", border:"rgba(226,162,59,0.35)", text:"#8A5C00", dot:"#E2A23B" },
    Failed:  { bg:"rgba(181,67,46,0.10)",  border:"rgba(181,67,46,0.3)",   text:"#B5432E", dot:"#B5432E" },
  }[status];
  return (
    <span className="inline-flex items-center gap-[5px] px-2.5 py-[4px] rounded-full text-[9px] font-semibold tracking-[0.08em] uppercase flex-shrink-0"
      style={{ ...M, background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.text }}>
      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background:cfg.dot }} />
      {status}
    </span>
  );
}


export function OrgCertificatesScreen({ onNavigate, isGuest }: { onNavigate: (s: Screen) => void; isGuest?: boolean }) {
  const [recipients, setRecipients] = useState<CertRecipient[]>(INITIAL_RECIPIENTS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [sealsVisible, setSealsVisible] = useState<Set<string>>(
    new Set(INITIAL_RECIPIENTS.filter(r => r.status === "Sent").map(r => r.id))
  );
  const [issuanceRecipient, setIssuanceRecipient] = useState<CertRecipient | null>(null);

  const sentCount    = recipients.filter(r => r.status === "Sent").length;
  const pendingCount = recipients.filter(r => r.status === "Pending").length;
  const failedCount  = recipients.filter(r => r.status === "Failed").length;
  const allPending   = recipients.filter(r => r.status === "Pending");

  const allSelected  = selected.size === recipients.length && recipients.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() { setSelected(allSelected ? new Set() : new Set(recipients.map(r => r.id))); }
  function toggleOne(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function handleGenerate() {
    if (pendingCount === 0) return;
    // Show issuance modal for the first pending recipient, send all in parallel
    setIssuanceRecipient(allPending[0]);
    setGenerating(true);
    allPending.forEach((r, i) => {
      setTimeout(() => {
        setRecipients(prev => prev.map(x => x.id === r.id ? { ...x, status: "Sent" } : x));
        setSealsVisible(prev => new Set([...prev, r.id]));
        if (i === allPending.length - 1) { setGenerating(false); toast.success(`${allPending.length} certificates sent`); }
      }, 450 * (i + 1));
    });
  }

  function handleResendFailed() {
    const targets = recipients.filter(r => r.status === "Failed");
    targets.forEach((r, i) => {
      setTimeout(() => {
        setRecipients(prev => prev.map(x => x.id === r.id ? { ...x, status: "Sent" } : x));
        setSealsVisible(prev => new Set([...prev, r.id]));
        if (i === targets.length - 1) { toast.success(`${targets.length} re-sent`); setSelected(new Set()); }
      }, 380 * (i + 1));
    });
  }

  function handleNav(id: string) {
    if (id === "profile")       { onNavigate("profile");       return; }
    if (id === "landing")       { onNavigate("landing");       return; }
    if (id === "org-dashboard") { onNavigate("org-dashboard"); return; }
    if (id === "org-events")    { onNavigate("org-events");    return; }
    if (id === "org-qr")        { onNavigate("org-qr");        return; }
    if (id === "org-attendees") { onNavigate("org-attendees"); return; }
    if (id === "org-analytics") { onNavigate("org-analytics"); return; }
  }

  return (
    <OrgAppShell
      activeNav="org-certs"
      orgName="Dr. Marcus Webb" orgRole="Student Affairs Office" notifCount={2}
      onNav={handleNav}
      onCreateEvent={() => onNavigate("org-events")}
      isGuest={isGuest}
      topBarLeft={
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => onNavigate("org-events")}
            className="flex items-center gap-1.5 text-[12px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
            style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
            <ArrowLeft size={13} strokeWidth={1.5} /> Events
          </button>
          <span className="text-[#DCD4C2] text-xs">/</span>
          <span className="text-[12px] text-[#6B6355]" style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>Certificates</span>
          <span className="text-[#DCD4C2] text-xs">/</span>
          <span className="text-[13px] font-semibold text-[#1E1B16] truncate max-w-[220px]" style={F}>{CERT_EVENT_DATA.title}</span>
        </div>
      }
      topBarActions={
        <button type="button" onClick={() => toast("Certificate Templates library — coming soon")}
          className="flex items-center gap-2 px-3.5 py-[7px] bg-[#FCFAF3] border border-[#DCD4C2] rounded-[6px] text-[12px] text-[#1E1B16] hover:border-[#1E1B16]/35 transition-colors"
          style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
          <Award size={12} strokeWidth={1.5} className="text-[#E2A23B]" />
          Design template
        </button>
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7">
          <div className="grid grid-cols-[310px,1fr] gap-5">

            {/* ── Left: preview + eligibility + action ── */}
            <div className="space-y-4">
              {/* Certificate preview */}
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>
                <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-2.5" style={M}>Certificate Preview</div>
                <div className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden">
                  <div className="h-[3px] bg-[#E2A23B]" />
                  <div className="px-6 py-4 border-b border-[#DCD4C2] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookMarked size={11} className="text-[#E2A23B]" strokeWidth={1.75} />
                      <span className="text-[9px] font-semibold tracking-widest uppercase" style={M}>Fieldbook</span>
                    </div>
                    <span className="text-[8px] text-[#9C8E7E]" style={M}>Certificate of Participation</span>
                  </div>
                  <div className="px-6 py-5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[8px] text-[#6B6355] tracking-widest uppercase mb-1.5" style={M}>This Certifies That</p>
                      <h3 className="text-[1.3rem] font-semibold text-[#1E1B16] leading-tight mb-0.5" style={F}>Recipient Name</h3>
                      <p className="text-[9px] text-[#6B6355] mb-4" style={M}>Student ID: XXX-0000</p>
                      <p className="text-[8px] text-[#6B6355] tracking-widest uppercase mb-1" style={M}>Has Attended</p>
                      <p className="text-sm font-semibold text-[#1E1B16]" style={F}>{CERT_EVENT_DATA.title}</p>
                      <p className="text-[10px] text-[#6B6355] mt-0.5">{CERT_EVENT_DATA.date} · {CERT_EVENT_DATA.venue}</p>
                    </div>
                    <CertificateSeal size={70} rotate={-9} delay={0.2} />
                  </div>
                  <div className="px-6 py-3 border-t border-[#DCD4C2] flex items-end justify-between">
                    <div>
                      <div className="w-20 border-b border-[#1E1B16]/25 mb-1" />
                      <p className="text-[8px] text-[#6B6355] tracking-wide" style={M}>DR. MARCUS WEBB</p>
                      <p className="text-[7px] text-[#9C8E7E]" style={M}>STUDENT AFFAIRS OFFICE</p>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#DCD4C2] rounded-full">
                      <span className="w-1 h-1 rounded-full bg-[#DCD4C2]" />
                      <span className="text-[7px] text-[#9C8E7E]" style={M}>Preview only</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Eligibility summary */}
              <motion.div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22, delay:0.06 }}>
                <div className="px-5 py-3.5 border-b border-[#DCD4C2]">
                  <div className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>Eligibility Summary</div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {[
                    { label:"Checked-in attendees", value:CERT_EVENT_DATA.eligible, color:"#2E6B4C" },
                    { label:"Total registered",      value:CERT_EVENT_DATA.total,    color:"#6B6355" },
                    { label:"Certificates pending",  value:pendingCount,             color:"#8A5C00" },
                    { label:"Certificates sent",     value:sentCount,                color:"#2E6B4C" },
                    { label:"Failed deliveries",     value:failedCount,              color:failedCount > 0 ? "#B5432E" : "#6B6355" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-[#6B6355]" style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>{row.label}</span>
                      <span className="text-[13px] font-semibold" style={{ ...M, color:row.color }}>{row.value}</span>
                    </div>
                  ))}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8px] text-[#9C8E7E]" style={M}>Issuance progress</span>
                      <span className="text-[9px] font-medium" style={{ ...M, color:"#2E6B4C" }}>
                        {Math.round((sentCount / CERT_EVENT_DATA.eligible) * 100)}%
                      </span>
                    </div>
                    <div className="h-[5px] bg-[#EDE7DA] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full bg-[#2E6B4C]"
                        initial={{ width:0 }}
                        animate={{ width:`${(sentCount / CERT_EVENT_DATA.eligible) * 100}%` }}
                        transition={{ duration:0.6, ease:"easeOut" }} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Generate & Send */}
              <motion.div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] p-5 space-y-3"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22, delay:0.1 }}>
                <div>
                  <div className="text-[11px] font-medium text-[#1E1B16] mb-0.5" style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                    Generate &amp; Send Pending
                  </div>
                  <p className="text-[10px] text-[#6B6355] leading-relaxed">
                    Issue certificates to all {pendingCount} eligible attendees who {"haven't"} received one yet.
                  </p>
                </div>
                <button type="button" onClick={handleGenerate}
                  disabled={generating || pendingCount === 0 || isGuest}
                  title={isGuest ? "Disabled in guest mode" : undefined}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[6px] text-[13px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background:"#E2A23B", color:"#1E1B16", fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                  {generating ? (
                    <>
                      <motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}
                        className="inline-block w-3.5 h-3.5 border-2 border-[#1E1B16]/30 border-t-[#1E1B16] rounded-full" />
                      Sending…
                    </>
                  ) : (
                    <><Award size={14} strokeWidth={2} />{pendingCount === 0 ? "All sent" : `Send ${pendingCount} Certificate${pendingCount > 1 ? "s" : ""}`}</>
                  )}
                </button>
                {failedCount > 0 && (
                  <button type="button" onClick={handleResendFailed}
                    disabled={isGuest}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-[6px] text-[12px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#1E1B16]/30 hover:text-[#1E1B16] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                    Resend {failedCount} Failed
                  </button>
                )}
              </motion.div>
            </div>

            {/* ── Right: issuance table ── */}
            <motion.div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden flex flex-col"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25, delay:0.04 }}>
              {/* Table header */}
              <div className="px-6 py-4 border-b border-[#DCD4C2] flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Issuance Status</div>
                  <div className="text-[10px] text-[#9C8E7E] mt-0.5" style={M}>{CERT_EVENT_DATA.eligible} eligible · {CERT_EVENT_DATA.title}</div>
                </div>
                {selected.size > 0 && (
                  <motion.button type="button" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                    onClick={handleResendFailed}
                    disabled={isGuest}
                    className="flex items-center gap-1.5 px-3 py-[6px] rounded-[6px] text-[11px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#1E1B16]/30 hover:text-[#1E1B16] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>
                    Resend selected ({selected.size})
                  </motion.button>
                )}
              </div>
              {/* Column headers */}
              <div className="px-6 py-2.5 border-b border-[#DCD4C2] grid grid-cols-[20px,1fr,120px,86px,106px,56px] gap-4 items-center flex-shrink-0 bg-[#F6F1E7]">
                <button type="button" onClick={toggleAll}
                  aria-label={allSelected ? "Deselect all" : "Select all"}
                  className={`w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors ${allSelected ? "bg-[#E2A23B] border-[#E2A23B]" : someSelected ? "bg-[#EDE7DA] border-[#DCD4C2]" : "border-[#DCD4C2] hover:border-[#6B6355]"}`}>
                  {(allSelected || someSelected) && <Check size={9} className="text-[#1E1B16]" strokeWidth={2.5} />}
                </button>
                {["Attendee","Student ID","Check-in","Status","Seal"].map(h => (
                  <span key={h} className="text-[8px] tracking-widest uppercase text-[#9C8E7E]" style={M}>{h}</span>
                ))}
              </div>
              {/* Rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#DCD4C2]">
                {recipients.map((r, i) => {
                  const isChecked = selected.has(r.id);
                  const hasSeal   = sealsVisible.has(r.id);
                  return (
                    <motion.div key={r.id}
                      className={`px-6 py-3 grid grid-cols-[20px,1fr,120px,86px,106px,56px] gap-4 items-center transition-colors ${isChecked ? "bg-[#FDFAF0]" : "hover:bg-[#F6F1E7]/60"}`}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.14, delay:i * 0.022 }}>
                      <button type="button" onClick={() => toggleOne(r.id)}
                        aria-label={`Select ${r.name}`}
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? "bg-[#E2A23B] border-[#E2A23B]" : "border-[#DCD4C2] hover:border-[#6B6355]"}`}>
                        {isChecked && <Check size={9} className="text-[#1E1B16]" strokeWidth={2.5} />}
                      </button>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[#1E1B16] truncate" style={{ fontFamily:"'Public Sans', system-ui, sans-serif" }}>{r.name}</div>
                        <div className="text-[9px] text-[#9C8E7E] truncate" style={M}>{r.email}</div>
                      </div>
                      <div className="text-[10px] text-[#6B6355]" style={M}>{r.studentId}</div>
                      <div className="text-[10px] text-[#6B6355]" style={M}>{r.checkedIn}</div>
                      <div><CertStatusPill status={r.status} /></div>
                      <div className="flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          {hasSeal ? (
                            <motion.div key="seal"
                              initial={{ scale:0, rotate:-25, opacity:0 }}
                              animate={{ scale:1, rotate:-10, opacity:1 }}
                              exit={{ scale:0, opacity:0 }}
                              transition={{ type:"spring", stiffness:360, damping:22 }}>
                              <InlineSeal />
                            </motion.div>
                          ) : (
                            <motion.div key="empty" className="w-[34px] h-[34px] rounded-full border border-dashed border-[#DCD4C2] flex items-center justify-center">
                              <span className="text-[8px] text-[#DCD4C2]" style={M}>—</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {/* Footer */}
              <div className="px-6 py-3 border-t border-[#DCD4C2] flex items-center justify-between flex-shrink-0 bg-[#F6F1E7]">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-[#9C8E7E]" style={M}>{recipients.length} total recipients</span>
                  {selected.size > 0 && <span className="text-[9px] text-[#6B6355]" style={M}>{selected.size} selected</span>}
                </div>
                <div className="flex items-center gap-4">
                  {[
                    { count:sentCount,    color:"#2E6B4C", label:"sent"    },
                    { count:pendingCount, color:"#E2A23B", label:"pending" },
                    ...(failedCount > 0 ? [{ count:failedCount, color:"#B5432E", label:"failed" }] : []),
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className="w-[5px] h-[5px] rounded-full" style={{ background:s.color }} />
                      <span className="text-[9px] text-[#6B6355]" style={M}>{s.count} {s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* ── Certificate Issuance Modal ── */}
      <AnimatePresence>
        {issuanceRecipient && (
          <CertIssuanceModal
            key={issuanceRecipient.id}
            recipientName={issuanceRecipient.name}
            eventTitle={CERT_EVENT_DATA.title}
            eventDate={CERT_EVENT_DATA.date}
            organizer="Dr. Marcus Webb"
            onClose={() => setIssuanceRecipient(null)}
          />
        )}
      </AnimatePresence>

    </OrgAppShell>
  );
}

// ─── QR Display Screen ────────────────────────────────────────────────────────

function genQRPattern(seed: number): number[][] {
  const N = 17;
  const g: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  function marker(r0: number, c0: number) {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      const edge  = r === 0 || r === 6 || c === 0 || c === 6;
      const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      g[r0 + r][c0 + c] = (edge || inner) ? 1 : 0;
    }
  }
  marker(0, 0); marker(0, 10); marker(10, 0);
  for (let i = 8; i < 12; i++) { g[6][i] = i % 2; g[i][6] = i % 2; }
  let h = (Math.imul(seed + 1, 0x9e3779b9) >>> 0);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const inTL = r < 8 && c < 8;
    const inTR = r < 8 && c >= 9;
    const inBL = r >= 9 && c < 8;
    const isTiming = r === 6 || c === 6;
    if (!inTL && !inTR && !inBL && !isTiming) {
      h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
      g[r][c] = (h >>> 16) & 1;
    }
  }
  return g;
}

function OrgQRSvg({ seed, size }: { seed: number; size: number }) {
  const pattern = React.useMemo(() => genQRPattern(seed), [seed]);
  const cell = size / 17;
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", background: "#FCFAF3" }}>
      {pattern.flatMap((row, ri) =>
        row.map((v, ci) => v
          ? <rect key={`${ri}-${ci}`} x={ci * cell} y={ri * cell}
              width={cell - 0.5} height={cell - 0.5} fill="#1E1B16" />
          : null
        )
      )}
    </svg>
  );
}

export function OrgQRScreen({ onNavigate, isGuest }: { onNavigate: (s: Screen) => void; isGuest?: boolean }) {
  const sessions = ORG_EVENTS.filter(e => e.status === "Live" || e.status === "Published");
  const defaultId = (sessions.find(e => e.status === "Live") ?? sessions[0])?.id ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(defaultId);
  const [qrSeed, setQrSeed]         = useState(1);
  const [regenFading, setRegenFading] = useState(false);
  const [closedIds, setClosedIds]   = useState<Set<string>>(new Set());
  const [qrSource, setQrSource]     = useState<"generated" | "upload">("generated");
  const [uploadedQrByEvent, setUploadedQrByEvent] = useState<Record<string, string | null>>(() => {
    try {
      const raw = localStorage.getItem("fieldbook-qr-uploads");
      return raw ? (JSON.parse(raw) as Record<string, string | null>) : {};
    } catch { return {}; }
  });
  const [qrUploadError, setQrUploadError] = useState<string | null>(null);
  const [qrDragOver, setQrDragOver] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem("fieldbook-qr-uploads", JSON.stringify(uploadedQrByEvent)); } catch {}
  }, [uploadedQrByEvent]);

  const event  = selectedId ? ORG_EVENTS.find(e => e.id === selectedId) ?? null : null;
  const isLive = !!event && event.status === "Live" && !closedIds.has(event.id);
  const isClosed = !!event && (event.status === "Completed" || closedIds.has(event.id));
  const QR_SIZE = 300;

  const uploadedQr = selectedId ? (uploadedQrByEvent[selectedId] ?? null) : null;

  function handleRegen() {
    if (regenFading) return;
    setRegenFading(true);
    setTimeout(() => {
      setQrSeed(s => s + 1);
      setRegenFading(false);
    }, 155);
  }

  function handleQrFileSelect(file: File) {
    setQrUploadError(null);
    if (!file.type.startsWith("image/")) {
      setQrUploadError("Only PNG and JPG files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setQrUploadError("File must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (selectedId) {
        setUploadedQrByEvent(prev => ({ ...prev, [selectedId]: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  }

  function handleQrDrop(e: React.DragEvent) {
    e.preventDefault();
    setQrDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleQrFileSelect(file);
  }

  function handleQrRemove() {
    if (selectedId) {
      setUploadedQrByEvent(prev => ({ ...prev, [selectedId]: null }));
    }
    setQrUploadError(null);
  }

  function handleNav(id: string) {
    if (id === "profile")       { onNavigate("profile");       return; }
    if (id === "landing")       { onNavigate("landing");       return; }
    if (id === "org-dashboard") { onNavigate("org-dashboard"); return; }
    if (id === "org-events")    { onNavigate("org-events");    return; }
    if (id === "org-attendees") { onNavigate("org-attendees"); return; }
    if (id === "org-analytics") { onNavigate("org-analytics"); return; }
    if (id === "org-certs")     { onNavigate("org-certs");     return; }
  }

  return (
    <OrgAppShell
      activeNav="org-qr"
      orgName="Dr. Marcus Webb"
      orgRole="Student Affairs Office"
      notifCount={2}
      onNav={handleNav}
      onCreateEvent={() => onNavigate("org-events")}
      isGuest={isGuest}
      topBarLeft={
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>QR Display</span>
          {isLive && (
            <span className="inline-flex items-center gap-[5px] px-2 py-[3px] rounded-[4px] text-[8px] font-semibold tracking-[0.1em] uppercase"
              style={{ ...M, background: "#2D6A4F", color: "#FCFAF3" }}>
              <span className="w-[5px] h-[5px] rounded-full animate-pulse flex-shrink-0" style={{ background: "#7ECB9A" }} />
              Live
            </span>
          )}
        </div>
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7">

          {/* ── Page header ── */}
          <motion.div className="mb-6"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}>
            <p className="text-[9px] tracking-widest uppercase mb-1" style={{ ...M, color: "#9C8E7E" }}>
              Organizer Portal
            </p>
            <h1 className="text-[28px] leading-[1.1] text-[#1E1B16] mb-[5px]" style={F}>
              QR Attendance
            </h1>
            <p className="text-[12px]" style={{ fontFamily: "'Public Sans',system-ui,sans-serif", color: "#9C8E7E" }}>
              Select a session to display its check-in code.
            </p>
          </motion.div>

          {/* ── Session selector pills ── */}
          <motion.div className="flex items-center gap-2 mb-8 flex-wrap"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}>
            {sessions.map(ev => {
              const active    = selectedId === ev.id;
              const evIsLive  = ev.status === "Live" && !closedIds.has(ev.id);
              return (
                <button key={ev.id} type="button" onClick={() => setSelectedId(ev.id)}
                  className={`flex items-center gap-2 px-3 py-[5px] rounded-full text-[11px] font-medium border transition-all ${
                    active
                      ? "bg-[#1E1B16] border-[#1E1B16] text-[#F6F1E7]"
                      : "bg-[#FCFAF3] border-[#DCD4C2] text-[#6B6355] hover:text-[#1E1B16] hover:border-[#1E1B16]/50"
                  }`}
                  style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                  {evIsLive && (
                    <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 animate-pulse ${active ? "bg-[#7ECB9A]" : "bg-[#2D6A4F]"}`} />
                  )}
                  <span className="truncate max-w-[180px]">{ev.title}</span>
                  <span className="text-[8px] shrink-0" style={{ ...M, opacity: 0.6 }}>{ev.date}</span>
                </button>
              );
            })}
          </motion.div>

          {/* ── Source toggle ── */}
          <motion.div className="flex items-center mb-6"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: 0.08 }}>
            <div className="flex items-center rounded-full border border-[#DCD4C2] bg-[#FCFAF3] p-[3px] gap-[2px]">
              {(["generated", "upload"] as const).map(src => (
                <button key={src} type="button"
                  onClick={() => { setQrSource(src); setQrUploadError(null); }}
                  className={`px-4 py-[5px] rounded-full text-[11px] font-medium transition-all ${
                    qrSource === src
                      ? "bg-[#1E1B16] text-[#F6F1E7]"
                      : "text-[#6B6355] hover:text-[#1E1B16]"
                  }`}
                  style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                  {src === "generated" ? "Generated" : "Upload Photo"}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── QR card ── */}
          <AnimatePresence mode="wait">
            {!event ? (
              <motion.div key="empty"
                className="flex flex-col items-center justify-center py-32 gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}>
                <div className="w-16 h-16 rounded-full border border-[#DCD4C2] bg-[#FCFAF3] flex items-center justify-center">
                  <QrCode size={24} strokeWidth={1.3} color="#9C8E7E" />
                </div>
                <p className="text-[13px]" style={{ fontFamily: "'Public Sans',system-ui,sans-serif", color: "#9C8E7E" }}>
                  Select a session above to generate its QR code.
                </p>
              </motion.div>
            ) : (
              <motion.div key={selectedId}
                className="flex justify-center"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}>

                <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[12px] overflow-hidden w-full max-w-[420px]">

                  {/* Card header */}
                  <div className="px-4 sm:px-8 pt-7 pb-5 border-b border-[#DCD4C2]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold leading-snug text-[#1E1B16] mb-1" style={F}>
                          {event.title}
                        </h2>
                        <p className="text-[12px] leading-[1.5]"
                          style={{ fontFamily: "'Public Sans',system-ui,sans-serif", color: "#6B6355" }}>
                          {event.date}
                          {event.startTime && ` · ${event.startTime}${event.endTime ? `–${event.endTime}` : ""}`}
                        </p>
                        <p className="text-[12px]"
                          style={{ fontFamily: "'Public Sans',system-ui,sans-serif", color: "#6B6355" }}>
                          {event.venue}
                        </p>
                      </div>
                      <OrgStatusBadge status={closedIds.has(event.id) ? "Completed" : event.status} />
                    </div>
                  </div>

                  {/* QR area */}
                  <div className="flex flex-col items-center px-4 sm:px-8 py-7 gap-5">

                    {/* QR display: generated or uploaded */}
                    <AnimatePresence mode="wait">
                      {qrSource === "generated" ? (
                        <motion.div key="gen"
                          className="relative w-full max-w-[300px] aspect-square"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}>
                          {isLive && (
                            <motion.div
                              className="absolute pointer-events-none rounded-[4px]"
                              style={{ inset: -4, border: "2px solid #E2A23B" }}
                              animate={{ opacity: [0, 0.65, 0], scale: [0.97, 1.03, 1.03] }}
                              transition={{
                                duration: 1.1, ease: "easeOut",
                                repeat: Infinity, repeatDelay: 1.9,
                              }}
                            />
                          )}
                          <motion.div
                            className="w-full h-full"
                            animate={{ opacity: regenFading ? 0 : 1 }}
                            transition={{ duration: 0.14 }}>
                            <AnimatePresence mode="wait">
                              <motion.div key={qrSeed} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                                <motion.div
                                  className="overflow-hidden w-full h-full"
                                  initial={{ clipPath: "inset(100% 0 0 0)" }}
                                  animate={{ clipPath: "inset(0% 0 0 0)" }}
                                  transition={{ duration: 0.72, ease: [0.33, 1, 0.68, 1] }}>
                                  <OrgQRSvg seed={qrSeed} size={QR_SIZE} />
                                </motion.div>
                              </motion.div>
                            </AnimatePresence>
                          </motion.div>
                        </motion.div>
                      ) : uploadedQr ? (
                        /* Uploaded QR preview */
                        <motion.div key="uploaded-preview"
                          className="relative rounded-[4px] overflow-hidden border border-[#DCD4C2] w-full max-w-[300px] aspect-square mx-auto"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}>
                          <img src={uploadedQr} alt="Uploaded QR code"
                            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", background: "#FCFAF3" }} />
                        </motion.div>
                      ) : (
                        /* Upload zone */
                        <motion.div key="upload-zone"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}>
                          <input
                            ref={qrFileInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleQrFileSelect(f); e.target.value = ""; }}
                          />
                          <div
                            onClick={() => qrFileInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setQrDragOver(true); }}
                            onDragLeave={() => setQrDragOver(false)}
                            onDrop={handleQrDrop}
                            className="flex flex-col items-center justify-center gap-3 rounded-[4px] cursor-pointer transition-colors w-full max-w-[300px] aspect-square mx-auto"
                            style={{
                              border: `1.5px dashed ${qrDragOver ? "#6B6355" : "#DCD4C2"}`,
                              background: qrDragOver ? "rgba(107,99,85,0.05)" : "transparent",
                            }}>
                            <div className="w-10 h-10 rounded-full border border-[#DCD4C2] bg-[#F6F1E7] flex items-center justify-center">
                              <ImagePlus size={18} strokeWidth={1.3} color="#9C8E7E" />
                            </div>
                            <div className="text-center">
                              <p className="text-[12px] text-[#1E1B16]"
                                style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                                Drop your QR image here
                              </p>
                              <p className="text-[11px] mt-0.5"
                                style={{ fontFamily: "'Public Sans',system-ui,sans-serif", color: "#9C8E7E" }}>
                                or{" "}
                                <span className="underline cursor-pointer text-[#6B6355]">browse files</span>
                              </p>
                              <p className="text-[9px] mt-2 tracking-wide" style={{ ...M, color: "#9C8E7E" }}>
                                PNG or JPG · max 5 MB
                              </p>
                            </div>
                          </div>
                          {qrUploadError && (
                            <p className="text-[10px] mt-2 text-center" style={{ ...M, color: "#B5432E" }}>
                              {qrUploadError}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Eyebrow label */}
                    <AnimatePresence mode="wait">
                      {isClosed ? (
                        <motion.p key="closed"
                          className="text-[10px] tracking-widest uppercase text-center"
                          style={{ ...M, color: "#2E6B4C" }}
                          initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}>
                          Session Closed — {Math.round((event.attendees / event.capacity) * 100)}% attendance verified
                        </motion.p>
                      ) : isLive ? (
                        <motion.p key="live"
                          className="text-[10px] tracking-widest uppercase text-center"
                          style={{ ...M, color: "#E2A23B" }}
                          initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}>
                          Valid {event.startTime ?? ""}
                          {event.endTime ? ` – ${event.endTime}` : ""}
                        </motion.p>
                      ) : (
                        <motion.p key="upcoming"
                          className="text-[10px] tracking-widest uppercase text-center"
                          style={{ ...M, color: "#9C8E7E" }}
                          initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}>
                          Scan opens {event.date}{event.startTime ? ` at ${event.startTime}` : ""}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Check-in count */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[1.65rem] font-semibold leading-none" style={F}>
                        <CountUp
                          key={selectedId}
                          target={event.attendees}
                          formatted={String(event.attendees)}
                          color="#1E1B16"
                          duration={600}
                          delay={200}
                        />
                      </span>
                      <span className="text-[10px] tracking-widest uppercase" style={{ ...M, color: "#9C8E7E" }}>
                        checked in
                      </span>
                      <span className="text-[9px]" style={{ ...M, color: "#DCD4C2" }}>
                        / {event.capacity}
                      </span>
                    </div>

                    <div className="w-full h-px bg-[#DCD4C2]" />

                    {/* Footer actions */}
                    <div className="flex items-center gap-3 w-full justify-between">
                      {qrSource === "generated" ? (
                        <button type="button" onClick={handleRegen} disabled={regenFading || isGuest}
                          title={isGuest ? "Disabled in guest mode" : undefined}
                          className="flex items-center gap-2 px-4 py-[7px] rounded-[6px] text-[12px] font-medium border border-[#1E1B16]/25 text-[#1E1B16] bg-[#FCFAF3] hover:bg-[#F6F1E7] hover:border-[#1E1B16]/50 transition-colors disabled:opacity-40"
                          style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                          <RefreshCw size={12} strokeWidth={2} />
                          Regenerate Code
                        </button>
                      ) : uploadedQr ? (
                        <div className="flex items-center gap-2">
                          <button type="button"
                            onClick={() => qrFileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-[7px] rounded-[6px] text-[12px] font-medium border border-[#1E1B16]/25 text-[#1E1B16] bg-[#FCFAF3] hover:bg-[#F6F1E7] hover:border-[#1E1B16]/50 transition-colors"
                            style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                            <Upload size={12} strokeWidth={2} />
                            Replace Photo
                          </button>
                          <button type="button"
                            onClick={handleQrRemove}
                            className="flex items-center gap-1.5 px-3 py-[7px] rounded-[6px] text-[11px] font-medium border border-[#DCD4C2] text-[#6B6355] bg-[#FCFAF3] hover:bg-[#F6F1E7] hover:text-[#1E1B16] transition-colors"
                            style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                            <X size={11} strokeWidth={2} />
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div />
                      )}
                      {isLive && (
                        <button type="button"
                          onClick={() => setClosedIds(prev => new Set(prev).add(event.id))}
                          disabled={isGuest}
                          className="flex items-center gap-1.5 px-3 py-[7px] rounded-[6px] text-[11px] font-medium border border-[#DCD4C2] text-[#6B6355] bg-[#FCFAF3] hover:bg-[#F6F1E7] hover:text-[#1E1B16] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
                          <CheckCircle2 size={11} strokeWidth={1.75} />
                          Close session
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </OrgAppShell>
  );
}

// ─── Attendee Manager screen ──────────────────────────────────────────────────

export function OrgAttendeesScreen({
  onNavigate,
  eventId = "oe4",
  isGuest,
}: {
  onNavigate: (s: Screen, id?: string) => void;
  eventId?: string;
  isGuest?: boolean;
}) {
  const event     = ORG_EVENTS.find(e => e.id === eventId) ?? ORG_EVENTS[3];
  const attendees = ATTENDEES_BY_EVENT[eventId] ?? ATTENDEES_BY_EVENT["oe4"];

  const totalReg    = attendees.length;
  const checkedIn   = attendees.filter(a => a.status === "Checked In").length;
  const rate        = totalReg > 0 ? Math.round((checkedIn / totalReg) * 100) : 0;
  const certsIssued = attendees.filter(a => a.certStatus === "Issued").length;

  function handleNav(id: string) {
    if (id === "profile")       { onNavigate("profile");       return; }
    if (id === "landing")       { onNavigate("landing");       return; }
    if (id === "org-dashboard") { onNavigate("org-dashboard"); return; }
    if (id === "org-events")    { onNavigate("org-events");    return; }
    if (id === "org-qr")        { onNavigate("org-qr");        return; }
    if (id === "org-analytics") { onNavigate("org-analytics"); return; }
    if (id === "org-certs")     { onNavigate("org-certs");     return; }
  }

  const GRID     = "36px 1fr 158px 116px 110px 112px";
  const COL_HEAD = ["", "Name", "Department", "Check-in", "Status", "Certificate"];

  return (
    <OrgAppShell
      activeNav="org-attendees"
      orgName="Dr. Marcus Webb"
      orgRole="Student Affairs Office"
      notifCount={2}
      onNav={handleNav}
      onCreateEvent={() => onNavigate("org-events")}
      isGuest={isGuest}
      topBarLeft={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("org-events")}
            aria-label="Back"
            className="p-1 text-[#6B6355] hover:text-[#1E1B16] transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
          </button>
          <div className="w-px h-4 bg-[#DCD4C2]" />
          <span className="text-[15px] font-semibold text-[#1E1B16]" style={F}>
            Attendee Manager
          </span>
          <span
            className="text-[9px] px-2 py-[3px] rounded-[4px] max-w-[220px] truncate"
            style={{ ...M, background: "rgba(30,27,22,0.09)", color: "#6B6355" }}
          >
            {event.title}
          </span>
        </div>
      }
      topBarActions={
        <button
          type="button"
          onClick={() => toast("Export CSV — coming soon")}
          disabled={isGuest}
          title={isGuest ? "Disabled in guest mode" : undefined}
          className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[6px] text-[12px] font-semibold border transition-colors hover:bg-[#FCFAF3] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "'Public Sans', system-ui, sans-serif", borderColor: "rgba(30,27,22,0.25)", color: "#1E1B16" }}
        >
          <Download size={12} strokeWidth={1.8} />
          Export CSV
        </button>
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-8 space-y-6">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { label: "Total Registered", value: totalReg,    fmt: String(totalReg),    suffix: "",  accent: "#E2A23B" },
              { label: "Checked In",        value: checkedIn,   fmt: String(checkedIn),   suffix: "",  accent: "#2E6B4C" },
              { label: "Check-in Rate",     value: rate,        fmt: String(rate),        suffix: "%", accent: "#E2A23B" },
              { label: "Certs Issued",      value: certsIssued, fmt: String(certsIssued), suffix: "",  accent: "#2E6B4C" },
            ] as const).map(({ label, value, fmt, suffix, accent }, i) => (
              <motion.div
                key={label}
                className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] p-5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: i * 0.07 }}
              >
                <p className="text-[8px] tracking-widest uppercase mb-3" style={{ ...M, color: "#9C8E7E" }}>
                  {label}
                </p>
                <p className="text-[2.2rem] font-semibold leading-none" style={M}>
                  <CountUp
                    target={value}
                    formatted={fmt}
                    suffix={suffix}
                    color={accent}
                    duration={550}
                    delay={i * 70}
                  />
                </p>
              </motion.div>
            ))}
          </div>

          {/* ── Table ── */}
          <motion.div
            className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.3 }}
          >
            {/* Column headers */}
            <div
              className="grid items-center px-6 py-3 border-b border-[#DCD4C2]"
              style={{ gridTemplateColumns: GRID }}
            >
              {COL_HEAD.map((h, i) => (
                <span key={i} className="text-[8px] tracking-widest uppercase font-semibold" style={{ ...M, color: "#9C8E7E" }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {attendees.map((att, i) => {
              const initials = att.name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <motion.div
                  key={att.id}
                  className={`grid items-center px-6 py-[13px] transition-colors hover:bg-[#F6F1E7] ${i < attendees.length - 1 ? "border-b border-[#DCD4C2]" : ""}`}
                  style={{ gridTemplateColumns: GRID }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut", delay: 0.35 + i * 0.025 }}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(30,27,22,0.07)", border: "1px solid rgba(30,27,22,0.12)" }}
                  >
                    <span className="text-[10px] font-semibold" style={{ color: "#4A4437" }}>{initials}</span>
                  </div>

                  {/* Name + ID */}
                  <div className="min-w-0 pr-4">
                    <p
                      className="text-[13px] text-[#1E1B16] truncate mb-[2px]"
                      style={{ fontFamily: "'Public Sans', system-ui, sans-serif", fontWeight: 500 }}
                    >
                      {att.name}
                    </p>
                    <p className="text-[9px] tabular-nums truncate" style={{ ...M, color: "#9C8E7E" }}>
                      {att.studentId}
                    </p>
                  </div>

                  {/* Department */}
                  <p
                    className="text-[12px] truncate pr-3"
                    style={{ fontFamily: "'Public Sans', system-ui, sans-serif", color: "#6B6355" }}
                  >
                    {att.dept}
                  </p>

                  {/* Check-in time */}
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ ...M, color: att.checkinTime ? "#4A4437" : "#9C8E7E" }}
                  >
                    {att.checkinTime ?? "—"}
                  </span>

                  {/* Status pill */}
                  <div><AttendeePill value={att.status} /></div>

                  {/* Cert pill */}
                  <div><AttendeePill value={att.certStatus} /></div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Footer */}
          <p className="text-[10px]" style={{ ...M, color: "#9C8E7E" }}>
            Showing {attendees.length} of {event.attendees} registered · {event.title}
          </p>

        </div>
      </main>
    </OrgAppShell>
  );
}

// ─── Organizer profile screen wrapper ─────────────────────────────────────────
export function OrgProfileScreen({ onNavigate, isGuest }: { onNavigate: (s: Screen) => void; isGuest?: boolean }) {
  return (
    <OrgAppShell
      activeNav=""
      orgName="Dr. Marcus Webb"
      orgRole="Student Affairs Office"
      notifCount={0}
      onNav={id => {
        if (id === "landing")        { onNavigate("landing");        return; }
        if (id === "org-dashboard")  { onNavigate("org-dashboard");  return; }
        if (id === "org-events")     { onNavigate("org-events");     return; }
        if (id === "org-qr")         { onNavigate("org-qr");         return; }
        if (id === "org-attendees")  { onNavigate("org-attendees");  return; }
        if (id === "org-analytics")  { onNavigate("org-analytics");  return; }
        if (id === "org-certs")      { onNavigate("org-certs");      return; }
      }}
      isGuest={isGuest}
    >
      <ProfileScreen
        role="Organizer"
        name="Dr. Marcus Webb"
        email="m.webb@fieldbook.edu"
        phone=""
        bio=""
        accountId="ORG-0042"
        joinedDate="Sep 4, 2024"
        stats={[
          { label: "Events Hosted",      value: 5   },
          { label: "Attendees Managed",  value: 348 },
          { label: "Sessions",           value: 312 },
        ]}
        onBack={() => onNavigate("org-dashboard")}
        isGuest={isGuest}
      />
    </OrgAppShell>
  );
}
