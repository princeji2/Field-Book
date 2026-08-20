import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Search, Check, X, Users, UserPlus, UserCheck, Ban, ShieldCheck, Mail, MoreHorizontal, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen, CertificateSeal } from "../shared";
import { AdminAppShell, ROLE_CONFIG, type UserRole } from "./shell";
import { signOutUser, type AuthedProfile } from "../../lib/auth";
import { listUsers, updateUserRole, logRoleChange, dbRoleToUserRole, userRoleToDbRole, type DirectoryUser } from "../../lib/users";

// ─── Admin Users ─────────────────────────────────────────────────────────────

type UserStatus = "Active" | "Suspended";

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dept: string;
  joined: string;
  joinedSort: number;
  status: UserStatus;
  lastActive: string;
};

// Fields with no backing column in `profiles` today (department, active/
// suspended status, last-active) stay cosmetic placeholders on real rows —
// per scope, only view-users and edit-role are wired to Supabase. Guest
// mode still renders the full mock dataset below, unchanged.
const REAL_USER_PLACEHOLDER = { dept: "—", status: "Active" as UserStatus, lastActive: "—" };

function formatJoined(iso: string): { joined: string; joinedSort: number } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { joined: "—", joinedSort: 0 };
  const joined = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const joinedSort = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return { joined, joinedSort };
}

function toPlatformUser(u: DirectoryUser): PlatformUser {
  const { joined, joinedSort } = formatJoined(u.memberSince);
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: dbRoleToUserRole(u.role),
    joined,
    joinedSort,
    ...REAL_USER_PLACEHOLDER,
  };
}

const PLATFORM_USERS: PlatformUser[] = [
  { id:"u1",  name:"Sarah Chen",          email:"s.chen@university.edu",        role:"Student",   dept:"Environmental Science", joined:"Sep 3, 2024",  joinedSort:20240903, status:"Active",    lastActive:"Today"       },
  { id:"u2",  name:"Marcus Williams",     email:"m.williams@university.edu",    role:"Student",   dept:"Political Science",     joined:"Sep 3, 2024",  joinedSort:20240903, status:"Active",    lastActive:"Today"       },
  { id:"u3",  name:"Dr. Marcus Webb",     email:"m.webb@university.edu",        role:"Organizer", dept:"Student Affairs",       joined:"Aug 19, 2024", joinedSort:20240819, status:"Active",    lastActive:"Today"       },
  { id:"u4",  name:"Prof. Linda Okonkwo", email:"l.okonkwo@university.edu",     role:"Organizer", dept:"Anthropology",          joined:"Aug 22, 2024", joinedSort:20240822, status:"Active",    lastActive:"2 days ago"  },
  { id:"u5",  name:"Dr. Helena Marsh",    email:"h.marsh@university.edu",       role:"Admin",     dept:"Dean's Office",         joined:"Jan 10, 2024", joinedSort:20240110, status:"Active",    lastActive:"Today"       },
  { id:"u6",  name:"Priya Patel",         email:"p.patel@university.edu",       role:"Student",   dept:"Computer Science",      joined:"Sep 3, 2024",  joinedSort:20240903, status:"Active",    lastActive:"Yesterday"   },
  { id:"u7",  name:"James Rodriguez",     email:"j.rodriguez@university.edu",   role:"Student",   dept:"Mechanical Engineering",joined:"Sep 4, 2024",  joinedSort:20240904, status:"Suspended", lastActive:"Oct 14, 2024"},
  { id:"u8",  name:"Dr. Yusuf Amara",     email:"y.amara@university.edu",       role:"Organizer", dept:"Medical School",        joined:"Aug 20, 2024", joinedSort:20240820, status:"Active",    lastActive:"3 days ago"  },
  { id:"u9",  name:"Aisha Thompson",      email:"a.thompson@university.edu",    role:"Student",   dept:"Sociology",             joined:"Sep 5, 2024",  joinedSort:20240905, status:"Active",    lastActive:"Yesterday"   },
  { id:"u10", name:"Dr. Mei-Ling Zhao",   email:"m.zhao@university.edu",        role:"Organizer", dept:"Bioinformatics",        joined:"Aug 25, 2024", joinedSort:20240825, status:"Active",    lastActive:"Today"       },
  { id:"u11", name:"Ben Torres",          email:"b.torres@university.edu",      role:"Student",   dept:"Architecture",          joined:"Sep 3, 2024",  joinedSort:20240903, status:"Active",    lastActive:"Today"       },
  { id:"u12", name:"Clara Huang",         email:"c.huang@university.edu",       role:"Student",   dept:"Fine Arts",             joined:"Sep 6, 2024",  joinedSort:20240906, status:"Suspended", lastActive:"Sep 28, 2024"},
  { id:"u13", name:"Student Union Board", email:"union@university.edu",         role:"Organizer", dept:"Student Affairs",       joined:"Aug 15, 2024", joinedSort:20240815, status:"Active",    lastActive:"Yesterday"   },
  { id:"u14", name:"Fatima Al-Rashid",    email:"f.alrashid@university.edu",    role:"Student",   dept:"Law",                   joined:"Sep 3, 2024",  joinedSort:20240903, status:"Active",    lastActive:"Today"       },
  { id:"u15", name:"Ivan Petrov",         email:"i.petrov@university.edu",      role:"Student",   dept:"Physics",               joined:"Sep 4, 2024",  joinedSort:20240904, status:"Active",    lastActive:"4 days ago"  },
];

export function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_CONFIG[role];
  return (
    <span className="inline-flex items-center gap-[5px] px-2.5 py-[4px] rounded-full text-[9px] font-semibold tracking-[0.07em] uppercase flex-shrink-0"
      style={{ ...M, background:c.bg, border:`1px solid ${c.border}`, color:c.text }}>
      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background:c.dot }} />
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: UserStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium`}
      style={{ ...M, color: status === "Active" ? "#2E6B4C" : "#B5432E" }}>
      <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
        style={{ background: status === "Active" ? "#2E6B4C" : "#B5432E",
                 boxShadow: status === "Active" ? "0 0 0 2px rgba(46,107,76,0.18)" : "0 0 0 2px rgba(181,67,46,0.15)" }} />
      {status}
    </span>
  );
}

// Overflow menu for a user row
function UserOverflowMenu({
  user,
  onEditRole,
  onToggleSuspend,
}: {
  user: PlatformUser;
  onEditRole: (id: string) => void;
  onToggleSuspend: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-[5px] hover:bg-[#EDE7DA] transition-colors"
        aria-label="More actions">
        <MoreHorizontal size={14} strokeWidth={1.75} className="text-[#6B6355]" />
      </button>
      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] overflow-hidden min-w-[164px]"
            style={{ boxShadow:"0 4px 16px rgba(30,27,22,0.08)" }}>
            <button type="button"
              onClick={() => { onEditRole(user.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors text-left"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              <ShieldCheck size={12} strokeWidth={1.75} className="text-[#6B6355]" />
              Edit role
            </button>
            <button type="button"
              onClick={() => { onToggleSuspend(user.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] hover:bg-[#F6F1E7] transition-colors text-left"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif",
                       color: user.status === "Active" ? "#B5432E" : "#2E6B4C" }}>
              {user.status === "Active"
                ? <><Ban size={12} strokeWidth={1.75} />Suspend user</>
                : <><UserCheck size={12} strokeWidth={1.75} />Reinstate user</>}
            </button>
            <div className="border-t border-[#DCD4C2]" />
            <button type="button"
              onClick={() => { toast(`Email sent to ${user.email}`); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#6B6355] hover:bg-[#F6F1E7] transition-colors text-left"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              <Mail size={12} strokeWidth={1.75} />
              Send email
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Role-change inline modal
function EditRoleModal({
  user,
  isSelf,
  onSave,
  onClose,
}: {
  user: PlatformUser;
  // True when the row being edited is the signed-in admin's own account.
  // Guards against accidental self-lockout: an admin editing their own row
  // can't select anything other than Admin, so there's no path to demote
  // yourself out of admin access through this UI. This is a UX safeguard
  // only — profiles_update_admin's RLS would still allow the write if it
  // somehow reached the server, so it's not a security boundary, just a
  // guardrail against a misclick.
  isSelf: boolean;
  onSave: (id: string, role: UserRole) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<UserRole>(user.role);
  const [saving, setSaving] = useState(false);
  const roles: UserRole[] = ["Student", "Organizer", "Admin"];

  async function handleSave() {
    setSaving(true);
    await onSave(user.id, selected);
    // Whether it succeeded or the parent already toasted an error, the
    // modal's job is done either way — the caller's state only actually
    // changed on real success, so re-opening this same modal shows the
    // unchanged role again if the write failed.
    setSaving(false);
    onClose();
  }
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.15 }}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-[#1E1B16]/20" onClick={onClose} />
      <motion.div className="relative bg-[#FCFAF3] border border-[#DCD4C2] rounded-[10px] overflow-hidden w-full max-w-[340px] mx-4"
        initial={{ scale:0.95, y:8 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:8 }}
        transition={{ duration:0.18, ease:"easeOut" }}>
        <div className="h-[3px] bg-[#E2A23B]" />
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-1" style={M}>Edit Role</div>
              <h3 className="text-[1.1rem] font-semibold text-[#1E1B16] leading-tight" style={F}>{user.name}</h3>
              <p className="text-[10px] mt-0.5" style={{ ...M, color:"#9C8E7E" }}>{user.email}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-[5px] hover:bg-[#EDE7DA] transition-colors">
              <X size={13} strokeWidth={1.75} className="text-[#6B6355]" />
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {roles.map(r => {
              const c = ROLE_CONFIG[r];
              const active = selected === r;
              const locked = isSelf && r !== "Admin";
              return (
                <button key={r} type="button" disabled={locked}
                  onClick={() => setSelected(r)}
                  title={locked ? "You can't remove your own admin access." : undefined}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[7px] border transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: active ? c.bg : "transparent",
                           borderColor: active ? c.border : "#DCD4C2" }}>
                  <span className="w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: active ? c.dot : "#DCD4C2",
                             background: active ? c.dot : "transparent" }}>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#FCFAF3]" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold" style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:active ? c.text : "#1E1B16" }}>{r}</div>
                    <div className="text-[9px] mt-0.5" style={{ ...M, color:"#9C8E7E" }}>
                      {r === "Student" && "Can register for events and receive certificates"}
                      {r === "Organizer" && "Can create events, manage attendees and certs"}
                      {r === "Admin" && "Full platform access — use with caution"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {isSelf && (
            <p className="text-[9px] mb-3 -mt-1" style={{ ...M, color:"#9C8E7E" }}>
              You can't demote your own account — ask another admin to change this if needed.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background:"#E2A23B", color:"#1E1B16", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              {saving && <RefreshCw size={12} className="animate-spin" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2.5 rounded-[6px] text-[12px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#1E1B16]/30 hover:text-[#1E1B16] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Invite User modal
function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Student");
  const [sent, setSent] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
    setTimeout(() => { toast.success(`Invitation sent to ${email}`); onClose(); }, 900);
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.15 }}>
      <div className="absolute inset-0 bg-[#1E1B16]/20" onClick={onClose} />
      <motion.div className="relative bg-[#FCFAF3] border border-[#DCD4C2] rounded-[10px] overflow-hidden w-full max-w-[380px] mx-4"
        initial={{ scale:0.95, y:8 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:8 }}
        transition={{ duration:0.18, ease:"easeOut" }}>
        <div className="h-[3px] bg-[#E2A23B]" />
        <div className="px-6 pt-6 pb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-1" style={M}>Invite User</div>
              <h3 className="text-[1.15rem] font-semibold text-[#1E1B16]" style={F}>Add to Fieldbook</h3>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-[5px] hover:bg-[#EDE7DA] transition-colors">
              <X size={13} strokeWidth={1.75} className="text-[#6B6355]" />
            </button>
          </div>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" className="flex flex-col items-center py-6 gap-3"
                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}>
                <CertificateSeal size={64} rotate={-9} delay={0.1} />
                <p className="text-[12px] text-[#6B6355] text-center" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  Sending invitation to<br />
                  <span className="font-semibold text-[#1E1B16]">{email}</span>
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSend} className="space-y-4"
                initial={{ opacity:0 }} animate={{ opacity:1 }}>
                <div>
                  <label className="block text-[8px] tracking-widest uppercase text-[#6B6355] mb-1.5" style={M}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="user@university.edu" autoFocus
                    className="w-full bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px] px-3 py-2.5 text-[13px] text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none focus:border-[#1E1B16]/40 transition-colors"
                    style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }} />
                </div>
                <div>
                  <label className="block text-[8px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Student","Organizer","Admin"] as UserRole[]).map(r => {
                      const c = ROLE_CONFIG[r];
                      const active = role === r;
                      return (
                        <button key={r} type="button" onClick={() => setRole(r)}
                          className="py-2.5 rounded-[6px] text-[11px] font-semibold border transition-colors"
                          style={{ background: active ? c.bg : "transparent",
                                   borderColor: active ? c.border : "#DCD4C2",
                                   color: active ? c.text : "#6B6355",
                                   fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[6px] text-[13px] font-semibold transition-opacity hover:opacity-85"
                  style={{ background:"#E2A23B", color:"#1E1B16", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  <UserPlus size={14} strokeWidth={2} /> Send Invitation
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

const ALL_ROLES: Array<UserRole | "All"> = ["All","Student","Organizer","Admin"];

export function UsersScreen({ onNavigate, isGuest, profile }: { onNavigate: (s: Screen) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  // Guest mode never holds a real Supabase session, so profiles_select_admin
  // would just return zero/one row anyway — skip the fetch entirely and show
  // the mock dataset, same as every other screen's isGuest treatment.
  const [users, setUsers] = useState<PlatformUser[]>(isGuest ? PLATFORM_USERS : []);
  const [loading, setLoading] = useState(!isGuest);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All">("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [sortKey, setSortKey] = useState<"name" | "joined" | "role">("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await listUsers();
    if (result.status === "error") {
      setLoadError(result.message);
      setLoading(false);
      return;
    }
    setUsers(result.users.map(toPlatformUser));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isGuest) return;
    void fetchUsers();
  }, [isGuest, fetchUsers]);

  const filtered = users
    .filter(u => {
      const q = query.toLowerCase();
      return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.dept.toLowerCase().includes(q))
        && (roleFilter === "All" || u.role === roleFilter)
        && (statusFilter === "All" || u.status === statusFilter);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")   cmp = a.name.localeCompare(b.name);
      if (sortKey === "joined") cmp = a.joinedSort - b.joinedSort;
      if (sortKey === "role")   cmp = a.role.localeCompare(b.role);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const allSelected  = selected.size === filtered.length && filtered.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() { setSelected(allSelected ? new Set() : new Set(filtered.map(u => u.id))); }
  function toggleOne(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleEditRole(id: string, newRole: UserRole) {
    // Guest mode has no real session to write with — keep it a local-only
    // demo change, same as the rest of this screen's mock actions.
    if (isGuest) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role:newRole } : u));
      toast.success("Role updated");
      return;
    }

    // Backend-side belt-and-suspenders for the same rule EditRoleModal
    // already enforces by disabling the other options: even if this
    // handler were somehow called with a self-demotion (e.g. a future
    // bulk-action path), refuse it here too rather than relying solely on
    // the modal's disabled buttons.
    if (profile?.id === id && newRole !== "Admin") {
      toast.error("You can't remove your own admin access.");
      return;
    }

    const target = users.find(u => u.id === id);
    const oldRole = target?.role;

    const result = await updateUserRole(id, newRole);

    if (result.status === "error") {
      toast.error(result.message);
      return;
    }

    // Only reflect the change locally once Postgres/RLS actually confirmed
    // it — the profiles_update_admin policy is the real gate, this is just
    // reacting to its outcome.
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role:newRole } : u));
    toast.success("Role updated");

    // Best-effort audit entry — logged after the real change succeeded, so
    // a logging hiccup never blocks or rolls back the role change itself.
    // See logRoleChange()'s docstring for why this is fire-and-forget.
    if (profile?.id && oldRole && oldRole !== newRole) {
      const logResult = await logRoleChange({
        actorId: profile.id,
        targetId: id,
        oldRole: userRoleToDbRole(oldRole),
        newRole: userRoleToDbRole(newRole),
      });
      if (logResult.status === "error") {
        console.error("Failed to write audit_log entry for role change:", logResult.message);
      }
    }
  }

  function handleToggleSuspend(id: string) {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = u.status === "Active" ? "Suspended" : "Active";
      toast(next === "Suspended" ? `${u.name} suspended` : `${u.name} reinstated`);
      return { ...u, status:next };
    }));
  }

  function handleBulkSuspend() {
    setUsers(prev => prev.map(u => selected.has(u.id) ? { ...u, status:"Suspended" } : u));
    toast(`${selected.size} user${selected.size > 1 ? "s" : ""} suspended`);
    setSelected(new Set());
  }

  function handleBulkReinstate() {
    setUsers(prev => prev.map(u => selected.has(u.id) ? { ...u, status:"Active" } : u));
    toast.success(`${selected.size} user${selected.size > 1 ? "s" : ""} reinstated`);
    setSelected(new Set());
  }

  function cycleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const SortBtn = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <button type="button" onClick={() => cycleSort(k)}
      className="flex items-center gap-1 text-[8px] tracking-widest uppercase hover:text-[#1E1B16] transition-colors"
      style={{ ...M, color: sortKey === k ? "#1E1B16" : "#9C8E7E" }}>
      {label}
      <span className="text-[7px]" style={{ opacity: sortKey === k ? 1 : 0 }}>
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    </button>
  );

  const editUser = editingId ? users.find(u => u.id === editingId) ?? null : null;

  const roleCounts = { All: users.length, Student: 0, Organizer: 0, Admin: 0 } as Record<UserRole | "All", number>;
  users.forEach(u => roleCounts[u.role]++);

  return (
    <AdminAppShell
      activeNav="admin-users"
      adminName={profile?.fullName ?? "Dr. Helena Marsh"}
      adminRole="Platform Administrator"
      pendingApprovals={0}
      notifCount={3}
      isGuest={isGuest}
      onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
      onNav={id => {
        if (id === "profile")          { onNavigate("profile");          return; }
        if (id === "admin-dashboard")  { onNavigate("admin-dashboard");  return; }
        if (id === "admin-approvals")  { onNavigate("admin-approvals");  return; }
        if (id === "admin-role-requests") { onNavigate("admin-role-requests"); return; }
        if (id === "admin-templates")  { onNavigate("admin-templates");  return; }
        if (id === "admin-analytics")  { onNavigate("admin-analytics");  return; }
        if (id === "admin-settings")   { onNavigate("admin-settings");   return; }
        if (id === "admin-notifs")     { onNavigate("admin-notifs");     return; }
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
          <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Users</span>
          <span className="text-[9px] px-2 py-[3px] rounded-full border border-[#DCD4C2] text-[#6B6355]"
            style={M}>{users.length} total</span>
        </div>
      }
      topBarActions={
        <button type="button" onClick={() => setShowInvite(true)}
          disabled={isGuest}
          className="flex items-center gap-2 px-4 py-[7px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background:"#E2A23B", color:"#1E1B16", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
          <UserPlus size={13} strokeWidth={2} /> Invite User
        </button>
      }
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ── Toolbar ── */}
        <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] px-4 sm:px-8 py-4 flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-[320px]">
            <Search size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8E7E]" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, email or department…"
              className="w-full bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] pl-9 pr-3 py-2 text-[12px] text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none focus:border-[#1E1B16]/35 transition-colors"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }} />
          </div>

          {/* Role filter pills */}
          <div className="flex items-center gap-1.5 p-[3px] bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px]">
            {ALL_ROLES.map(r => {
              const active = roleFilter === r;
              return (
                <button key={r} type="button" onClick={() => setRoleFilter(r)}
                  className={`px-3 py-[5px] rounded-[5px] text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                    active ? "bg-[#1E1B16] text-[#F6F1E7]" : "text-[#6B6355] hover:text-[#1E1B16]"
                  }`}
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  {r}
                  <span className={`text-[9px] ${active ? "text-[#F6F1E7]/60" : "text-[#9C8E7E]"}`} style={M}>
                    {roleCounts[r]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 p-[3px] bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px]">
            {(["All","Active","Suspended"] as const).map(s => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className={`px-3 py-[5px] rounded-[5px] text-[11px] font-medium transition-colors ${
                  statusFilter === s ? "bg-[#1E1B16] text-[#F6F1E7]" : "text-[#6B6355] hover:text-[#1E1B16]"
                }`}
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                {s}
              </button>
            ))}
          </div>

          {/* Result count */}
          <span className="text-[10px] text-[#9C8E7E] ml-auto flex-shrink-0" style={M}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Bulk action bar ── */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              className="flex-shrink-0 bg-[#1E1B16] px-4 sm:px-8 py-3 flex flex-wrap items-center gap-4"
              initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
              exit={{ height:0, opacity:0 }} transition={{ duration:0.18 }}>
              <span className="text-[11px] font-medium text-[#F6F1E7]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                {selected.size} selected
              </span>
              <button type="button" onClick={handleBulkSuspend}
                disabled={isGuest}
                className="flex items-center gap-1.5 px-3 py-[5px] rounded-[5px] text-[11px] font-medium border transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor:"rgba(181,67,46,0.5)", color:"#F4907E", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                <Ban size={11} strokeWidth={1.75} /> Suspend selected
              </button>
              <button type="button" onClick={handleBulkReinstate}
                disabled={isGuest}
                className="flex items-center gap-1.5 px-3 py-[5px] rounded-[5px] text-[11px] font-medium border transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor:"rgba(46,107,76,0.5)", color:"#7ECB9A", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                <UserCheck size={11} strokeWidth={1.75} /> Reinstate selected
              </button>
              <button type="button" onClick={() => setSelected(new Set())}
                className="ml-auto text-[10px] text-[#9C8E7E] hover:text-[#F6F1E7] transition-colors"
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                Clear selection
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Column headers + rows — horizontally scrollable on small screens ── */}
        <div className="flex-1 overflow-auto">
        <div className="min-w-[900px]">
        {/* Column headers */}
        <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] px-8 py-2.5
          grid gap-4 items-center"
          style={{ gridTemplateColumns:"20px 1fr 200px 110px 110px 100px 80px 36px" }}>
          {/* Select-all */}
          <button type="button" onClick={toggleAll}
            aria-label={allSelected ? "Deselect all" : "Select all"}
            className={`w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors ${
              allSelected ? "bg-[#E2A23B] border-[#E2A23B]"
              : someSelected ? "bg-[#EDE7DA] border-[#DCD4C2]"
              : "border-[#DCD4C2] hover:border-[#6B6355]"}`}>
            {(allSelected || someSelected) && <Check size={9} className="text-[#1E1B16]" strokeWidth={2.5} />}
          </button>
          <SortBtn k="name" label="User" />
          <span className="text-[8px] tracking-widest uppercase text-[#9C8E7E]" style={M}>Department</span>
          <SortBtn k="role" label="Role" />
          <span className="text-[8px] tracking-widest uppercase text-[#9C8E7E]" style={M}>Status</span>
          <SortBtn k="joined" label="Joined" />
          <span className="text-[8px] tracking-widest uppercase text-[#9C8E7E]" style={M}>Last active</span>
          <span />
        </div>

        {/* ── Table rows ── */}
        <div className="" style={dotGrid}>
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <RefreshCw size={22} strokeWidth={1.5} className="text-[#9C8E7E] animate-spin" />
              <span className="text-[12px] text-[#9C8E7E]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                Loading users…
              </span>
            </div>
          )}
          {!loading && loadError && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <span className="text-[12px] text-[#B5432E] text-center max-w-[380px]"
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                Couldn't load users: {loadError}
              </span>
              <button type="button" onClick={() => void fetchUsers()}
                className="flex items-center gap-1.5 px-3 py-[6px] rounded-[6px] text-[11px] font-semibold border border-[#DCD4C2] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors"
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                <RefreshCw size={11} strokeWidth={1.75} /> Retry
              </button>
            </div>
          )}
          <AnimatePresence initial={false}>
            {!loading && !loadError && filtered.length === 0 && (
              <motion.div key="empty" className="flex flex-col items-center justify-center h-48 gap-3"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <Users size={28} strokeWidth={1} className="text-[#DCD4C2]" />
                <span className="text-[12px] text-[#9C8E7E]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  No users match your filters.
                </span>
              </motion.div>
            )}
            {!loading && !loadError && filtered.map((u, i) => {
              const isChecked = selected.has(u.id);
              const isSuspended = u.status === "Suspended";
              return (
                <motion.div key={u.id}
                  layout
                  initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  transition={{ duration:0.15, delay:i * 0.018 }}
                  className={`grid gap-4 px-8 py-3.5 border-b border-[#DCD4C2] items-center transition-colors ${
                    isChecked ? "bg-[#FDFAF0]" : isSuspended ? "bg-[rgba(181,67,46,0.025)]" : "bg-[#FCFAF3] hover:bg-[#F6F1E7]/80"
                  }`}
                  style={{ gridTemplateColumns:"20px 1fr 200px 110px 110px 100px 80px 36px" }}>

                  {/* Checkbox */}
                  <button type="button" onClick={() => toggleOne(u.id)}
                    aria-label={`Select ${u.name}`}
                    className={`w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isChecked ? "bg-[#E2A23B] border-[#E2A23B]" : "border-[#DCD4C2] hover:border-[#6B6355]"}`}>
                    {isChecked && <Check size={9} className="text-[#1E1B16]" strokeWidth={2.5} />}
                  </button>

                  {/* Avatar + name + email */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: u.role === "Admin" ? "rgba(181,67,46,0.12)"
                          : u.role === "Organizer" ? "rgba(226,162,59,0.15)"
                          : "rgba(30,27,22,0.08)",
                        border: u.role === "Admin" ? "1px solid rgba(181,67,46,0.3)"
                          : u.role === "Organizer" ? "1px solid rgba(226,162,59,0.3)"
                          : "1px solid rgba(30,27,22,0.12)",
                        opacity: isSuspended ? 0.5 : 1,
                      }}>
                      <span className="text-[10px] font-semibold"
                        style={{ color: u.role === "Admin" ? "#8A2210" : u.role === "Organizer" ? "#8A5C00" : "#1E1B16" }}>
                        {u.name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0,2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-medium truncate ${isSuspended ? "text-[#9C8E7E] line-through decoration-[#DCD4C2]" : "text-[#1E1B16]"}`}
                        style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{u.name}</div>
                      <div className="text-[9px] text-[#9C8E7E] truncate" style={M}>{u.email}</div>
                    </div>
                  </div>

                  {/* Dept */}
                  <div className="text-[10px] text-[#6B6355] truncate" style={M}>{u.dept}</div>

                  {/* Role badge */}
                  <div><RoleBadge role={u.role} /></div>

                  {/* Status */}
                  <div><StatusDot status={u.status} /></div>

                  {/* Joined */}
                  <div className="text-[10px] text-[#6B6355]" style={M}>{u.joined}</div>

                  {/* Last active */}
                  <div className="text-[10px] text-[#9C8E7E]" style={M}>{u.lastActive}</div>

                  {/* Overflow menu */}
                  <div className="flex items-center justify-end">
                    <UserOverflowMenu
                      user={u}
                      onEditRole={id => setEditingId(id)}
                      onToggleSuspend={handleToggleSuspend}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        </div>{/* min-w */}
        </div>{/* overflow-auto */}

        {/* ── Table footer ── */}
        <div className="flex-shrink-0 border-t border-[#DCD4C2] bg-[#F6F1E7] px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-5">
            {(["Student","Organizer","Admin"] as UserRole[]).map(r => (
              <div key={r} className="flex items-center gap-1.5">
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{ background: ROLE_CONFIG[r].dot }} />
                <span className="text-[9px] text-[#6B6355]" style={M}>{roleCounts[r]} {r}{roleCounts[r] !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-[#9C8E7E]" style={M}>
              {users.filter(u => u.status === "Suspended").length} suspended
            </span>
            <span className="text-[9px] text-[#9C8E7E]" style={M}>
              {filtered.length} of {users.length} shown
            </span>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {editUser && (
          <EditRoleModal key="edit-role" user={editUser}
            isSelf={!isGuest && profile?.id === editUser.id}
            onSave={handleEditRole} onClose={() => setEditingId(null)} />
        )}
        {showInvite && (
          <InviteUserModal key="invite" onClose={() => setShowInvite(false)} />
        )}
      </AnimatePresence>

    </AdminAppShell>
  );
}
