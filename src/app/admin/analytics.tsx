import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, BarChart3, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen, parseMetricNum, StatMetricNumber } from "../shared";
import { AdminAppShell } from "./shell";
import { signOutUser, type AuthedProfile } from "../../lib/auth";

// ─── Admin Analytics ─────────────────────────────────────────────────────────

type AdminDateRange = "7d" | "30d" | "all";

const ADMIN_DATE_RANGE_OPTIONS: { id: AdminDateRange; label: string }[] = [
  { id:"7d",  label:"Last 7 days"  },
  { id:"30d", label:"Last 30 days" },
  { id:"all", label:"All time"     },
];

// Two-series growth data — signups (solid) + events published (dashed)
const GROWTH_DATA: Record<AdminDateRange, { date: string; signups: number; events: number }[]> = {
  "7d": [
    { date:"Nov 7",  signups:18, events:2 },
    { date:"Nov 8",  signups:27, events:3 },
    { date:"Nov 9",  signups:22, events:1 },
    { date:"Nov 10", signups:38, events:4 },
    { date:"Nov 11", signups:31, events:3 },
    { date:"Nov 12", signups:45, events:5 },
    { date:"Nov 13", signups:40, events:4 },
  ],
  "30d": [
    { date:"Oct 14", signups:9,  events:1 },
    { date:"Oct 17", signups:14, events:2 },
    { date:"Oct 21", signups:11, events:2 },
    { date:"Oct 24", signups:20, events:3 },
    { date:"Oct 28", signups:17, events:2 },
    { date:"Oct 31", signups:26, events:4 },
    { date:"Nov 4",  signups:22, events:3 },
    { date:"Nov 7",  signups:18, events:2 },
    { date:"Nov 8",  signups:27, events:3 },
    { date:"Nov 9",  signups:22, events:1 },
    { date:"Nov 10", signups:38, events:4 },
    { date:"Nov 11", signups:31, events:3 },
    { date:"Nov 12", signups:45, events:5 },
    { date:"Nov 13", signups:40, events:4 },
  ],
  "all": [
    { date:"Aug",    signups:112, events:8  },
    { date:"Sep",    signups:284, events:17 },
    { date:"Oct",    signups:198, events:21 },
    { date:"Nov 1",  signups:38,  events:4  },
    { date:"Nov 4",  signups:22,  events:3  },
    { date:"Nov 7",  signups:18,  events:2  },
    { date:"Nov 8",  signups:27,  events:3  },
    { date:"Nov 9",  signups:22,  events:1  },
    { date:"Nov 10", signups:38,  events:4  },
    { date:"Nov 11", signups:31,  events:3  },
    { date:"Nov 12", signups:45,  events:5  },
    { date:"Nov 13", signups:40,  events:4  },
  ],
};

// Engagement by role — horizontal bars, single ink color, value labels
export const ENGAGEMENT_BY_ROLE = [
  { role:"Student",   sessions:3841, certsClaimed:1043, eventsAttended:2190 },
  { role:"Organizer", sessions:312,  certsClaimed:0,    eventsAttended:0    },
  { role:"Admin",     sessions:48,   certsClaimed:0,    eventsAttended:0    },
];

// Top organizers ranked by events published
const TOP_ORGANIZERS = [
  { rank:1, name:"Dr. Marcus Webb",     dept:"Student Affairs",  events:5, checkins:348, certs:302, rate:87 },
  { rank:2, name:"Dr. Mei-Ling Zhao",   dept:"Bioinformatics",   events:4, checkins:187, certs:158, rate:84 },
  { rank:3, name:"Prof. Linda Okonkwo", dept:"Anthropology",     events:3, checkins:140, certs:122, rate:87 },
  { rank:4, name:"Dr. Yusuf Amara",     dept:"Medical School",   events:3, checkins:98,  certs:89,  rate:91 },
  { rank:5, name:"Student Union Board", dept:"Student Affairs",  events:2, checkins:231, certs:0,   rate:0  },
];

// Top events ranked by total registrations
const TOP_EVENTS_PLATFORM = [
  { rank:1, title:"Career Fair 2024",               organizer:"Career Services",    regs:412, checkins:338, rate:82 },
  { rank:2, title:"Leadership Summit 2024",          organizer:"Dr. Helena Marsh",   regs:120, checkins:112, rate:93 },
  { rank:3, title:"Environmental Policy Symposium",  organizer:"Dr. Marcus Webb",    regs:100, checkins:87,  rate:87 },
  { rank:4, title:"Robotics Club Showcase",          organizer:"Engineering Dept",   regs:90,  checkins:62,  rate:69 },
  { rank:5, title:"Computational Biology Bootcamp",  organizer:"Dr. Mei-Ling Zhao",  regs:40,  checkins:38,  rate:95 },
];

export function AdminAnalyticsScreen({ onNavigate, isGuest, profile }: { onNavigate: (s: Screen) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  const [dateRange, setDateRange] = useState<AdminDateRange>("30d");
  const [topTab, setTopTab] = useState<"organizers" | "events">("organizers");
  const [hoveredGrowthIdx, setHoveredGrowthIdx] = useState<number | null>(null);
  const [hoveredRoleRow, setHoveredRoleRow] = useState<number | null>(null);

  const growthData = GROWTH_DATA[dateRange];
  const peakSignups = Math.max(...growthData.map(d => d.signups));
  const totalSignups = growthData.reduce((s, d) => s + d.signups, 0);
  const totalEvents  = growthData.reduce((s, d) => s + d.events, 0);

  const adminNavHandler = (id: string) => {
    if (id === "profile")          { onNavigate("profile");          return; }
    if (id === "admin-dashboard")  { onNavigate("admin-dashboard");  return; }
    if (id === "admin-approvals")  { onNavigate("admin-approvals");  return; }
    if (id === "admin-users")      { onNavigate("admin-users");      return; }
    if (id === "admin-role-requests") { onNavigate("admin-role-requests"); return; }
    if (id === "admin-templates")  { onNavigate("admin-templates");  return; }
    if (id === "admin-settings")   { onNavigate("admin-settings");   return; }
    if (id === "admin-notifs")     { onNavigate("admin-notifs");     return; }
    toast(`${id} — coming soon`);
  };

  // Metric strip values derived from range
  const metrics = [
    { label:"New Signups",        value:totalSignups.toString(), sub:"in selected range",     color:"#1E1B16" },
    { label:"Events Published",   value:totalEvents.toString(),  sub:"across all organizers", color:"#1E1B16" },
    { label:"Total Certificates", value:"1,043",                 sub:"issued platform-wide",  color:"#2E6B4C" },
    { label:"Active Organizers",  value:"61",                    sub:"submitted ≥1 event",    color:"#1E1B16" },
    { label:"Check-in Rate",      value:"84%",                   sub:"platform average",      color:"#2E6B4C" },
  ];



  return (
    <AdminAppShell
      activeNav="admin-analytics"
      adminName={profile?.fullName ?? "Dr. Helena Marsh"}
      adminRole="Platform Administrator"
      pendingApprovals={0}
      notifCount={3}
      isGuest={isGuest}
      onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
      onNav={adminNavHandler}
      topBarLeft={
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[13px] font-semibold text-[#1E1B16] flex-shrink-0" style={F}>Analytics</span>
          <span className="text-[#DCD4C2] text-sm flex-shrink-0">·</span>
          <span className="text-[10px] truncate" style={{ ...M, color:"#9C8E7E" }}>Platform-wide</span>
        </div>
      }
      topBarActions={
        <div className="flex items-center gap-1.5 p-[3px] bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px] overflow-x-auto max-w-full">
          {ADMIN_DATE_RANGE_OPTIONS.map(opt => (
            <button key={opt.id} type="button"
              onClick={() => setDateRange(opt.id)}
              aria-pressed={dateRange === opt.id}
              className={`px-3 py-[5px] rounded-[5px] text-[11px] font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                dateRange === opt.id
                  ? "bg-[#1E1B16] text-[#F6F1E7]"
                  : "text-[#6B6355] hover:text-[#1E1B16]"
              }`}
              style={M}>
              {opt.label}
            </button>
          ))}
        </div>
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-7 space-y-5">

          {/* ── Metric strip ── */}
          <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.22, ease:"easeOut" }}>
            {metrics.map((m, i) => {
              const suffix = m.value.endsWith("%") ? "%" : "";
              const numVal = parseMetricNum(m.value);
              return (
                <div key={m.label} className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] px-4 py-4">
                  <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>{m.label}</div>
                  <div className="text-[1.65rem] font-semibold leading-none mb-1.5" style={F}>
                    <StatMetricNumber
                      target={numVal}
                      formatted={m.value.replace("%","")}
                      color={m.color}
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

          {/* ── Growth chart (full width) ── */}
          <motion.div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.25, ease:"easeOut", delay:0.06 }}>
            <div className="px-6 pt-5 pb-4 border-b border-[#DCD4C2] flex items-center justify-between">
              <div>
                <div className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Platform Growth</div>
                <div className="text-[11px] mt-0.5" style={{ ...M, color:"#9C8E7E" }}>
                  {totalSignups} new signups · {totalEvents} events published
                </div>
              </div>
              <TrendingUp size={14} strokeWidth={1.5} className="text-[#E2A23B]" />
            </div>
            <div className="px-5 pt-5 pb-4 relative">
              {/* Pure SVG dual-line growth chart */}
              {(() => {
                const VW = 800, VH = 210;
                const ml = 34, mr = 10, mt = 8, mb = 26;
                const pw = VW - ml - mr, ph = VH - mt - mb;
                const n = growthData.length;
                const maxSignups = Math.ceil(peakSignups * 1.15 / 10) * 10 || 10;
                const maxEvents  = Math.max(...growthData.map(d => d.events));
                const maxV = Math.max(maxSignups, Math.ceil(maxEvents * 1.3 / 10) * 10, 10);
                const yTicks = [0, Math.round(maxV * 0.5), maxV];
                const px = (i: number) => ml + (n < 2 ? pw / 2 : (i / (n - 1)) * pw);
                const py = (v: number) => mt + (1 - v / maxV) * ph;
                const signupPath = growthData.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d.signups).toFixed(1)}`).join(" ");
                const eventPath  = growthData.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d.events).toFixed(1)}`).join(" ");
                const hov = hoveredGrowthIdx;
                // Peak dot timing: delay = fraction of 900ms when line reaches peak x
                const peakIdx = growthData.findIndex(d => d.signups === peakSignups);
                const peakFrac = n < 2 ? 0 : peakIdx / (n - 1);
                const peakDelaySec = peakFrac * 0.9;
                const clipId = `gc-${dateRange}`;
                return (
                  <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: VH, display:"block" }}
                    aria-hidden="true"
                    onMouseLeave={() => setHoveredGrowthIdx(null)}>
                    <defs>
                      <clipPath id={clipId}>
                        <motion.rect
                          key={dateRange}
                          x={ml} y={0} height={VH}
                          initial={{ width: 0 }}
                          animate={{ width: pw }}
                          transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
                        />
                      </clipPath>
                    </defs>
                    {/* Gridlines — static, not clipped */}
                    {yTicks.map(v => (
                      <g key={v}>
                        <line x1={ml} y1={py(v)} x2={ml+pw} y2={py(v)} stroke="rgba(220,212,194,0.6)" strokeWidth={1} />
                        <text x={ml-4} y={py(v)+3} textAnchor="end" fontSize={9} fill="#9C8E7E" fontFamily="'IBM Plex Mono',monospace">{v}</text>
                      </g>
                    ))}
                    <line x1={ml} y1={mt+ph} x2={ml+pw} y2={mt+ph} stroke="#DCD4C2" strokeWidth={1} />
                    {/* X labels — static */}
                    {growthData.map((d, i) => {
                      const show = i === 0 || i === Math.round((n-1)/2) || i === n-1;
                      return show ? <text key={i} x={px(i)} y={VH-4} textAnchor="middle" fontSize={9} fill="#9C8E7E" fontFamily="'IBM Plex Mono',monospace">{d.date}</text> : null;
                    })}
                    {/* Cursor */}
                    {hov !== null && <line x1={px(hov)} y1={mt} x2={px(hov)} y2={mt+ph} stroke="rgba(30,27,22,0.07)" strokeWidth={1} />}
                    {/* Clipped group: both lines + all dots except peak */}
                    <g clipPath={`url(#${clipId})`}>
                      {/* Events line (dashed, behind) */}
                      <path d={eventPath} fill="none" stroke="#1E1B16" strokeWidth={1.5} strokeDasharray="5 3" strokeLinejoin="round" strokeLinecap="round" />
                      {/* Signups line (solid, on top) */}
                      <path d={signupPath} fill="none" stroke="#1E1B16" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
                      {/* Event dots */}
                      {growthData.map((d, i) => (
                        <circle key={i} cx={px(i)} cy={py(d.events)} r={hov === i ? 4 : 2.5} fill="#FCFAF3" stroke="#1E1B16" strokeWidth={1.25} />
                      ))}
                      {/* Non-peak signup dots */}
                      {growthData.map((d, i) => {
                        if (d.signups === peakSignups) return null;
                        const isHov = hov === i;
                        return <circle key={i} cx={px(i)} cy={py(d.signups)} r={isHov ? 4 : 2.5} fill={isHov ? "#E2A23B" : "#1E1B16"} stroke={isHov ? "#1E1B16" : "none"} strokeWidth={isHov ? 1.5 : 0} />;
                      })}
                    </g>
                    {/* Peak dot — outside clip, scale-pops when line reaches it */}
                    {peakIdx >= 0 && (
                      <motion.g
                        key={`peak-${dateRange}`}
                        style={{ transformOrigin: `${px(peakIdx).toFixed(1)}px ${py(peakSignups).toFixed(1)}px` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type:"spring", stiffness:500, damping:22, delay: peakDelaySec + 0.05 }}>
                        <circle cx={px(peakIdx)} cy={py(peakSignups)} r={hov === peakIdx ? 6 : 5} fill="#E2A23B" stroke="#1E1B16" strokeWidth={1.5} />
                      </motion.g>
                    )}
                    {/* Hover zones */}
                    {growthData.map((d, i) => (
                      <rect key={i} x={px(i) - (pw/Math.max(n-1,1))/2} y={mt} width={pw/Math.max(n-1,1)} height={ph} fill="transparent" onMouseEnter={() => setHoveredGrowthIdx(i)} />
                    ))}
                  </svg>
                );
              })()}
              {/* Hover tooltip */}
              {hoveredGrowthIdx !== null && (() => {
                const d = growthData[hoveredGrowthIdx];
                const n = growthData.length;
                const pw = 800 - 34 - 10;
                const pct = (34 + (n < 2 ? pw/2 : (hoveredGrowthIdx/(n-1))*pw)) / 800;
                return (
                  <div className="absolute pointer-events-none bg-[#FCFAF3] border border-[#DCD4C2] rounded-[6px] px-3 py-2"
                    style={{ ...M, bottom:"calc(100% - 185px)", left:`clamp(8px, calc(${(pct*100).toFixed(1)}% - 52px), calc(100% - 110px))` }}>
                    <div className="text-[9px] text-[#9C8E7E] mb-1">{d.date}</div>
                    <div className="text-[10px] text-[#1E1B16] mb-0.5"><span className="text-[#9C8E7E]">Signups: </span><span className="font-semibold">{d.signups}</span></div>
                    <div className="text-[10px] text-[#1E1B16]"><span className="text-[#9C8E7E]">Events: </span><span className="font-semibold">{d.events}</span></div>
                  </div>
                );
              })()}
              {/* Legend */}
              <div className="flex items-center gap-5 mt-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-[1.5px] bg-[#1E1B16] inline-block" />
                  <span className="text-[9px] text-[#6B6355]" style={M}>Signups</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="20" height="3" className="inline-block">
                    <line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#1E1B16" strokeWidth="1.5" strokeDasharray="5 3" />
                  </svg>
                  <span className="text-[9px] text-[#6B6355]" style={M}>Events published</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E2A23B] border border-[#1E1B16] inline-block" />
                  <span className="text-[9px] text-[#6B6355]" style={M}>Peak signup day</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Row: engagement by role (2/5) + ranked lists (3/5) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Engagement by role */}
            <motion.div className="col-span-1 lg:col-span-2 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.25, ease:"easeOut", delay:0.1 }}>
              <div className="px-6 pt-5 pb-4 border-b border-[#DCD4C2]">
                <div className="text-[9px] tracking-widest uppercase text-[#6B6355]" style={M}>Engagement by Role</div>
                <div className="text-[11px] mt-0.5" style={{ ...M, color:"#9C8E7E" }}>Sessions · platform-wide</div>
              </div>
              <div className="px-4 pt-5 pb-4 relative">
                {/* Pure SVG horizontal bar chart */}
                {(() => {
                  const VW = 320, VH = 190;
                  const labelW = 62, mr = 10, mt = 6;
                  const pw = VW - labelW - mr;
                  const rows = ENGAGEMENT_BY_ROLE.length;
                  const rowH = (VH - mt) / rows;
                  const maxVal = Math.max(...ENGAGEMENT_BY_ROLE.map(d => d.sessions));
                  const barH = 8, gap = 4;
                  return (
                    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: VH, display:"block" }}
                      aria-hidden="true"
                      onMouseLeave={() => setHoveredRoleRow(null)}>
                      <defs>
                        <clipPath id={`admin-role-clip-${dateRange}`}>
                          <motion.rect
                            key={dateRange}
                            x={labelW} y={0} height={VH}
                            initial={{ width: 0 }}
                            animate={{ width: pw }}
                            transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1], delay: 0.12 }}
                          />
                        </clipPath>
                      </defs>
                      {ENGAGEMENT_BY_ROLE.map((d, i) => {
                        const cy = mt + i * rowH + rowH / 2;
                        const sessW = (d.sessions / maxVal) * pw;
                        const certW = (d.certsClaimed / maxVal) * pw;
                        const isHov = hoveredRoleRow === i;
                        return (
                          <g key={i} onMouseEnter={() => setHoveredRoleRow(i)}>
                            {isHov && <rect x={0} y={mt + i*rowH} width={VW} height={rowH} fill="rgba(30,27,22,0.03)" />}
                            <text x={labelW-4} y={cy - gap/2} textAnchor="end" fontSize={9} fill="#6B6355" fontFamily="'IBM Plex Mono',monospace" dominantBaseline="middle">{d.role}</text>
                            <g clipPath={`url(#admin-role-clip-${dateRange})`}>
                              <rect x={labelW} y={cy - barH - gap/2} width={Math.max(sessW, 2)} height={barH} fill="#1E1B16" rx={2} ry={2} />
                              <rect x={labelW} y={cy + gap/2} width={Math.max(certW, 2)} height={barH} fill="#DCD4C2" rx={2} ry={2} />
                            </g>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
                {/* Row hover tooltip */}
                {hoveredRoleRow !== null && (() => {
                  const d = ENGAGEMENT_BY_ROLE[hoveredRoleRow];
                  const rows = ENGAGEMENT_BY_ROLE.length;
                  const mt = 6, VH = 190;
                  const rowH = (VH - mt) / rows;
                  const topPct = ((mt + hoveredRoleRow * rowH + rowH / 2) / VH * 100).toFixed(1);
                  return (
                    <div className="absolute pointer-events-none right-3 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[6px] px-3 py-2 space-y-1"
                      style={{ ...M, top:`calc(${topPct}% - 28px)` }}>
                      <div className="text-[9px] text-[#9C8E7E] mb-0.5">{d.role}</div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-[2px] flex-shrink-0 bg-[#1E1B16]" />
                        <span className="text-[#6B6355]">Sessions: </span>
                        <span className="font-semibold text-[#1E1B16]">{d.sessions.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-[2px] flex-shrink-0 bg-[#DCD4C2]" />
                        <span className="text-[#6B6355]">Certs: </span>
                        <span className="font-semibold text-[#1E1B16]">{d.certsClaimed.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
                {/* Legend */}
                <div className="flex items-center gap-4 mt-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1E1B16] inline-block flex-shrink-0" />
                    <span className="text-[9px] text-[#6B6355]" style={M}>Sessions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DCD4C2] inline-block flex-shrink-0" />
                    <span className="text-[9px] text-[#6B6355]" style={M}>Certs claimed</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ranked top-organizers / top-events with tab toggle */}
            <motion.div className="col-span-1 lg:col-span-3 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden flex flex-col"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.25, ease:"easeOut", delay:0.13 }}>

              {/* Tab bar */}
              <div className="flex items-end gap-0 px-6 pt-4 border-b border-[#DCD4C2] flex-shrink-0">
                {(["organizers","events"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTopTab(t)}
                    role="tab"
                    aria-selected={topTab === t}
                    className={`flex items-center gap-1.5 px-3 pb-3 text-[11px] font-medium border-b-[2px] transition-colors capitalize ${
                      topTab === t
                        ? "border-[#1E1B16] text-[#1E1B16]"
                        : "border-transparent text-[#6B6355] hover:text-[#1E1B16]"
                    }`}
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                    {t === "organizers" ? "Top Organizers" : "Top Events"}
                  </button>
                ))}
              </div>

              {/* Column headers + rows — horizontally scrollable on narrow screens */}
              <div className="flex-1 overflow-auto">
              <div className="min-w-[480px]">
              <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] px-6 py-2"
                style={{ display:"grid",
                  gridTemplateColumns: topTab === "organizers"
                    ? "28px 1fr 80px 70px 70px 90px"
                    : "28px 1fr 130px 70px 70px 90px",
                  gap:"12px", alignItems:"center" }}>
                {(topTab === "organizers"
                  ? ["#","Organizer","Events","Check-ins","Certs","Rate"]
                  : ["#","Event","Organizer","Reg.","Check-ins","Rate"]
                ).map(h => (
                  <span key={h} className="text-[8px] tracking-widest uppercase text-[#9C8E7E]" style={M}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-[#DCD4C2]">
                <AnimatePresence mode="wait">
                  <motion.div key={topTab}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    transition={{ duration:0.15 }}>
                    {(topTab === "organizers" ? TOP_ORGANIZERS : TOP_EVENTS_PLATFORM).map((row, i) => {
                      const isTop = i === 0;
                      const isOrg = topTab === "organizers";
                      const org = row as typeof TOP_ORGANIZERS[0];
                      const ev  = row as typeof TOP_EVENTS_PLATFORM[0];
                      return (
                        <div key={row.rank}
                          className={`px-6 py-3.5 items-center ${isTop ? "bg-[#F6F1E7]" : ""}`}
                          style={{ display:"grid",
                            gridTemplateColumns: isOrg
                              ? "28px 1fr 80px 70px 70px 90px"
                              : "28px 1fr 130px 70px 70px 90px",
                            gap:"12px" }}>
                          {/* Rank badge */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 ${
                            isTop ? "bg-[#E2A23B] text-[#1E1B16]" : "bg-[#EDE7DA] text-[#6B6355]"}`}
                            style={M}>{row.rank}</div>

                          {/* Name / title */}
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium text-[#1E1B16] truncate"
                              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                              {isOrg ? org.name : ev.title}
                            </div>
                            <div className="text-[9px] truncate" style={{ ...M, color:"#9C8E7E" }}>
                              {isOrg ? org.dept : ev.organizer}
                            </div>
                          </div>

                          {/* Col 3 */}
                          <div className="text-[11px] font-medium text-[#1E1B16]" style={M}>
                            {isOrg ? org.events : ev.regs}
                          </div>

                          {/* Col 4 */}
                          <div className="text-[11px] font-medium text-[#1E1B16]" style={M}>
                            {isOrg ? org.checkins : ev.checkins}
                          </div>

                          {/* Col 5 */}
                          <div className="text-[11px] font-medium" style={{ ...M, color:"#2E6B4C" }}>
                            {isOrg ? (org.certs > 0 ? org.certs : <span style={{ color:"#DCD4C2" }}>—</span>) : ""}
                            {!isOrg ? ev.checkins : ""}
                          </div>

                          {/* Rate bar */}
                          {(isOrg ? org.rate : ev.rate) > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-[5px] bg-[#EDE7DA] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{
                                    width:`${isOrg ? org.rate : ev.rate}%`,
                                    background:(isOrg ? org.rate : ev.rate) >= 85 ? "#2E6B4C"
                                      : (isOrg ? org.rate : ev.rate) >= 70 ? "#6B6355"
                                      : "#DCD4C2",
                                  }} />
                              </div>
                              <span className="text-[10px] font-medium flex-shrink-0 w-9 text-right"
                                style={{ ...M,
                                  color:(isOrg ? org.rate : ev.rate) >= 85 ? "#2E6B4C" : "#6B6355" }}>
                                {isOrg ? org.rate : ev.rate}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px]" style={{ ...M, color:"#DCD4C2" }}>—</span>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
              </div>
              </div>
            </motion.div>

          </div>

        </div>
      </main>
    </AdminAppShell>
  );
}
