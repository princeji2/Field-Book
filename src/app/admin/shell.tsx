import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookMarked, Menu, Home, CheckCircle2, Users, FileText,
  BarChart3, Settings, Bell, Eye, ChevronLeft, Plus,
  ArrowLeft, User, LogOut, X, UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { F, M, type Screen, useSidebarState, SidebarFrame } from "../shared";

// ─── Admin nav ────────────────────────────────────────────────────────────────

const ADMIN_NAV_ITEMS = [
  { id:"admin-dashboard",  label:"Dashboard",             icon:Home         },
  { id:"admin-approvals",  label:"Approvals",             icon:CheckCircle2 },
  { id:"admin-users",      label:"Users",                 icon:Users        },
  { id:"admin-role-requests", label:"Role Requests",      icon:UserCog      },
  { id:"admin-templates",  label:"Certificate Templates", icon:FileText     },
  { id:"admin-analytics",  label:"Analytics",             icon:BarChart3    },
  { id:"admin-settings",   label:"Settings",              icon:Settings     },
  { id:"admin-notifs",     label:"Notifications",         icon:Bell         },
] as const;

type AdminNavId = typeof ADMIN_NAV_ITEMS[number]["id"];

export const SWITCH_ACCOUNTS = [
  { initials:"DH", name:"Dr. Helena Marsh",   role:"Platform Administrator", active:true  },
  { initials:"TC", name:"T. Chen",            role:"Admin (Read-only)",       active:false },
  { initials:"JO", name:"J. Osei-Bonsu",      role:"Admin (Approvals)",       active:false },
];

// ─── Role config ──────────────────────────────────────────────────────────────

export type UserRole = "Student" | "Organizer" | "Admin";

export const ROLE_CONFIG: Record<UserRole, { bg: string; border: string; text: string; dot: string }> = {
  Student:   { bg:"rgba(30,27,22,0.05)",   border:"rgba(30,27,22,0.15)",  text:"#1E1B16", dot:"#6B6355" },
  Organizer: { bg:"rgba(226,162,59,0.10)", border:"rgba(226,162,59,0.3)", text:"#8A5C00", dot:"#E2A23B" },
  Admin:     { bg:"rgba(181,67,46,0.09)",  border:"rgba(181,67,46,0.25)", text:"#8A2210", dot:"#B5432E" },
};

// ─── Admin app shell ──────────────────────────────────────────────────────────

export function AdminAppShell({
  activeNav,
  adminName,
  adminRole,
  pendingApprovals,
  pendingApprovalsKey,
  pendingRoleRequests,
  pendingRoleRequestsKey,
  notifCount,
  notifCountKey,
  onNav,
  onLogOut,
  topBarLeft,
  topBarActions,
  isGuest,
  children,
}: {
  activeNav: AdminNavId | string;
  adminName: string;
  adminRole: string;
  pendingApprovals: number;
  pendingApprovalsKey?: number;
  pendingRoleRequests?: number;
  pendingRoleRequestsKey?: number;
  notifCount: number;
  notifCountKey?: number;
  onNav?: (id: string) => void;
  onLogOut?: () => void;
  topBarLeft?: React.ReactNode;
  topBarActions?: React.ReactNode;
  isGuest?: boolean;
  children: React.ReactNode;
}) {
  const initials = adminName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0,2).toUpperCase();
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  const { isMobile, mobileOpen, setMobileOpen, sidebarCollapsed, handleMenuToggle } = useSidebarState();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [switchOpen,  setSwitchOpen]  = useState(false);
  const [logOutOpen,  setLogOutOpen]  = useState(false);
  const avatarRef = React.useRef<HTMLButtonElement>(null);

  function closeAll() { setMenuOpen(false); setSwitchOpen(false); }

  return (
    <>
    <SidebarFrame isMobile={isMobile} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} sidebarCollapsed={sidebarCollapsed}
      sidebar={<>
        {/* Logo + toggle */}
        <div className={`h-14 border-b border-[#DCD4C2] flex-shrink-0 flex items-center ${sidebarCollapsed ? "justify-center px-3" : "px-3 gap-2"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookMarked size={15} className="text-[#E2A23B] flex-shrink-0" strokeWidth={1.75} />
              <div className="min-w-0">
                <div className="text-base font-semibold text-[#1E1B16] tracking-tight leading-tight whitespace-nowrap" style={F}>Fieldbook</div>
                <div className="text-[7px] tracking-[0.14em] uppercase leading-none mt-[2px] whitespace-nowrap" style={{ ...M, color:"#9C8E7E" }}>Admin</div>
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
          {ADMIN_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id;
            const hasBadge = (id === "admin-approvals" && pendingApprovals > 0)
              || (id === "admin-role-requests" && !!pendingRoleRequests && pendingRoleRequests > 0)
              || (id === "admin-notifs" && notifCount > 0);
            const badgeNum  = id === "admin-approvals" ? pendingApprovals
              : id === "admin-role-requests" ? (pendingRoleRequests ?? 0)
              : notifCount;
            const badgeKey  = id === "admin-approvals" ? (pendingApprovalsKey ?? pendingApprovals)
              : id === "admin-role-requests" ? (pendingRoleRequestsKey ?? pendingRoleRequests ?? 0)
              : (notifCountKey ?? notifCount);
            return (
              <div key={id} className="relative group">
                <button type="button" onClick={() => { onNav?.(id); if (isMobile) setMobileOpen(false); }}
                  aria-label={sidebarCollapsed ? label : undefined}
                  className={`w-full flex items-center rounded-[6px] text-sm transition-colors ${
                    sidebarCollapsed ? "justify-center py-2" : "gap-3 px-3 py-2 text-left"
                  } ${active ? "bg-[#1E1B16] text-[#F6F1E7]" : "text-[#6B6355] hover:bg-[#F6F1E7] hover:text-[#1E1B16]"}`}>
                  <div className="relative flex-shrink-0">
                    <Icon size={14} strokeWidth={1.5} style={{ color: active ? "#E2A23B" : undefined }} />
                    {sidebarCollapsed && hasBadge && (
                      <span className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-[#E2A23B]" />
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{label}</span>
                      {hasBadge && (
                        <motion.span
                          key={badgeKey}
                          className="w-[18px] h-[18px] rounded-full bg-[#E2A23B] text-[#1E1B16] text-[8px] font-semibold flex items-center justify-center flex-shrink-0"
                          style={M}
                          initial={{ scale: 1.35 }}
                          animate={{ scale: 1 }}
                          transition={{ type:"spring", stiffness:500, damping:18 }}>
                          {badgeNum}
                        </motion.span>
                      )}
                    </>
                  )}
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

        {/* Admin profile */}
        <div className={`border-t border-[#DCD4C2] p-4 flex items-center flex-shrink-0 ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background:"rgba(181,67,46,0.12)", border:"1px solid rgba(181,67,46,0.3)" }}>
            <span className="text-[10px] font-semibold" style={{ color:"#8A2210" }}>{initials}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#1E1B16] truncate">{adminName}</div>
              <div className="text-[9px] truncate" style={{ ...M, color:"#6B6355" }}>{adminRole}</div>
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
          <div className="flex-1 min-w-0">
            {topBarLeft ?? (
              <div>
                <p className="text-[13px] font-semibold text-[#1E1B16] leading-tight" style={F}>
                  {greeting}, {adminName.split(" ")[0]}.
                </p>
                <p className="text-[9px] mt-[1px]" style={{ ...M, color:"#9C8E7E" }}>
                  Platform Administrator · Fieldbook
                </p>
              </div>
            )}
          </div>
          {topBarActions && <div className="flex items-center gap-2 flex-shrink-0">{topBarActions}</div>}
          {/* Guest badge */}
          {isGuest && (
            <div className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full border border-[#DCD4C2] flex-shrink-0"
              style={{ background:"rgba(107,99,85,0.08)" }}>
              <Eye size={10} strokeWidth={1.75} style={{ color:"#6B6355" }} />
              <span className="text-[9px] font-medium tracking-wide" style={{ ...M, color:"#6B6355" }}>Viewing as Guest</span>
            </div>
          )}
          {/* Bell */}
          <button type="button"
            onClick={() => onNav?.("admin-notifs")}
            className="relative p-1 flex-shrink-0" aria-label="Notifications">
            <Bell size={15} strokeWidth={1.5} color="#6B6355" />
            {notifCount > 0 && (
              <span className="absolute top-0 right-0 w-[7px] h-[7px] rounded-full border border-[#F6F1E7]" style={{ background:"#E2A23B" }} />
            )}
          </button>
          {/* Avatar — opens profile menu */}
          <div className="relative flex-shrink-0">
            <button
              ref={avatarRef}
              type="button"
              aria-label="Profile menu"
              onClick={() => { setSwitchOpen(false); setMenuOpen(v => !v); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ background:"rgba(181,67,46,0.12)", border:"1px solid rgba(181,67,46,0.3)" }}>
              <span className="text-[10px] font-semibold select-none" style={{ color:"#8A2210" }}>{initials}</span>
            </button>

            {/* Dismiss backdrop */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div key="bd" className="fixed inset-0 z-40"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.1 }}
                  onClick={closeAll} />
              )}
            </AnimatePresence>

            {/* ── Profile dropdown ── */}
            <AnimatePresence>
              {menuOpen && !switchOpen && (
                <motion.div
                  key="profile-menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
                  style={{ boxShadow:"0 4px 20px rgba(30,27,22,0.10)" }}
                  initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                  transition={{ duration:0.15, ease:"easeOut" }}>

                  {/* Identity block */}
                  <div className="px-4 py-3.5 border-b border-[#DCD4C2]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background:"rgba(181,67,46,0.12)", border:"1px solid rgba(181,67,46,0.3)" }}>
                        <span className="text-[11px] font-semibold" style={{ color:"#8A2210" }}>{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#1E1B16] truncate"
                          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{adminName}</div>
                        <div className="text-[9px] truncate mt-[1px]" style={{ ...M, color:"#6B6355" }}>{adminRole}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu rows */}
                  <div className="py-1">
                    {[
                      { label:"Switch Account", icon:Users,    action:() => setSwitchOpen(true)                                     },
                      { label:"My Profile",     icon:User,     action:() => { closeAll(); onNav?.("profile"); }                     },
                      { label:"Settings",       icon:Settings, action:() => { closeAll(); onNav?.("admin-settings"); }              },
                      { label:"Log Out",        icon:LogOut,   action:() => { closeAll(); setLogOutOpen(true); }, danger:true       },
                    ].map(row => (
                      <button key={row.label} type="button"
                        onClick={row.action}
                        className={`w-full flex items-center gap-3 px-4 py-[9px] text-[12px] text-left transition-colors ${
                          row.danger
                            ? "text-[#B5432E] hover:bg-[#FFF0ED]"
                            : "text-[#1E1B16] hover:bg-[#F6F1E7]"
                        }`}
                        style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                        <row.icon size={13} strokeWidth={1.5} className="flex-shrink-0" />
                        {row.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Switch Account panel ── */}
            <AnimatePresence>
              {menuOpen && switchOpen && (
                <motion.div
                  key="switch-menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden"
                  style={{ boxShadow:"0 4px 20px rgba(30,27,22,0.10)" }}
                  initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                  transition={{ duration:0.15, ease:"easeOut" }}>

                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[#DCD4C2] flex items-center gap-2">
                    <button type="button" onClick={() => setSwitchOpen(false)}
                      aria-label="Back"
                      className="p-0.5 rounded text-[#9C8E7E] hover:text-[#1E1B16] transition-colors">
                      <ChevronLeft size={13} strokeWidth={1.75} />
                    </button>
                    <span className="text-[9px] tracking-widest uppercase font-semibold"
                      style={{ ...M, color:"#9C8E7E" }}>Switch Account</span>
                  </div>

                  {/* Account rows */}
                  <div className="py-1">
                    {SWITCH_ACCOUNTS.map(acct => (
                      <button key={acct.name} type="button"
                        onClick={() => closeAll()}
                        className="w-full flex items-center gap-3 px-4 py-[10px] text-left transition-colors hover:bg-[#F6F1E7]">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: acct.active ? "rgba(181,67,46,0.12)" : "rgba(30,27,22,0.07)",
                            border: acct.active ? "1px solid rgba(181,67,46,0.3)" : "1px solid rgba(30,27,22,0.15)",
                          }}>
                          <span className="text-[9px] font-semibold"
                            style={{ color: acct.active ? "#8A2210" : "#6B6355" }}>{acct.initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-[#1E1B16] truncate"
                            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{acct.name}</div>
                          <div className="text-[9px] truncate" style={{ ...M, color:"#9C8E7E" }}>{acct.role}</div>
                        </div>
                        {acct.active && (
                          <span className="w-[6px] h-[6px] rounded-full bg-[#2E6B4C] flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {/* Add Account row */}
                    <div className="border-t border-[#DCD4C2] mt-1 pt-1">
                      <button type="button" onClick={closeAll}
                        className="w-full flex items-center gap-3 px-4 py-[9px] text-left text-[#6B6355] hover:text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors">
                        <Plus size={13} strokeWidth={1.75} className="flex-shrink-0" />
                        <span className="text-[12px]"
                          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>Add Account</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

      {/* Page content */}
      {children}
    </SidebarFrame>

    {/* ── Log Out confirmation modal ── */}
      <AnimatePresence>
        {logOutOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background:"rgba(30,27,22,0.45)" }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.15 }}
            onClick={e => { if (e.target === e.currentTarget) setLogOutOpen(false); }}>
            <motion.div
              className="w-full max-w-[340px] bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] overflow-hidden"
              initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }}
              transition={{ duration:0.15, ease:"easeOut" }}
              onClick={e => e.stopPropagation()}>
              <div className="px-7 pt-7 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background:"rgba(181,67,46,0.10)", border:"1px solid rgba(181,67,46,0.25)" }}>
                    <ArrowLeft size={13} strokeWidth={1.75} style={{ color:"#B5432E" }} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#1E1B16]"
                      style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                      Log out of Fieldbook?
                    </div>
                    <div className="text-[10px] mt-[2px]" style={{ ...M, color:"#9C8E7E" }}>
                      Signed in as {adminName}
                    </div>
                  </div>
                </div>
                <p className="text-[12px] leading-[1.55] mb-6"
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#6B6355" }}>
                  You will be returned to the sign-in screen. Any unsaved changes will be lost.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button type="button" onClick={() => setLogOutOpen(false)}
                    className="px-4 py-[7px] text-[12px] font-medium text-[#6B6355] border border-[#DCD4C2] rounded-[6px] hover:text-[#1E1B16] hover:border-[#9C8E7E] transition-colors"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                    Cancel
                  </button>
                  <button type="button"
                    onClick={() => { setLogOutOpen(false); onLogOut?.(); }}
                    className="px-4 py-[7px] text-[12px] font-semibold bg-[#1E1B16] text-[#F6F1E7] rounded-[6px] hover:bg-[#2E2A24] transition-colors"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                    Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
