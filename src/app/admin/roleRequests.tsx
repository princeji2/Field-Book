import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowLeft, X, XCircle, UserCog, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { F, M, dotGrid, type Screen } from "../shared";
import { AdminAppShell } from "./shell";
import { RoleBadge } from "./users";
import { signOutUser, type AuthedProfile } from "../../lib/auth";
import {
  listRoleChangeRequests, approveRoleChangeRequest, rejectRoleChangeRequest,
  type AdminRoleChangeRequest,
} from "../../lib/roleRequests";
import { dbRoleToUserRole } from "../../lib/users";

// ─── Admin Role Change Requests ───────────────────────────────────────────────
//
// Extends the same pending/approved/rejected review-queue pattern as
// ApprovalsScreen (admin/approvals.tsx), but wired to real Supabase data
// from the start (lib/roleRequests.ts) rather than that screen's mock
// dataset — same "load/error/retry" shape as UsersScreen's real listUsers()
// call, since this table has no seed/demo data to fall back to for guests
// either (guest mode here just shows an empty, harmless queue).

type RequestTab = "Pending" | "Approved" | "Rejected";

const STATUS_TO_TAB: Record<AdminRoleChangeRequest["status"], RequestTab> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function RoleRequestsScreen({
  onNavigate,
  onPendingChange,
  isGuest,
  profile,
}: {
  onNavigate: (s: Screen) => void;
  onPendingChange?: (n: number) => void;
  isGuest?: boolean;
  profile?: AuthedProfile | null;
}) {
  const [tab, setTab] = useState<RequestTab>("Pending");
  const [requests, setRequests] = useState<AdminRoleChangeRequest[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await listRoleChangeRequests();
    if (result.status === "error") {
      setLoadError(result.message);
      setLoading(false);
      return;
    }
    setRequests(result.requests);
    setLoading(false);
    onPendingChange?.(result.requests.filter(r => r.status === "pending").length);
  }, [onPendingChange]);

  useEffect(() => {
    // Guest mode has no real Supabase session — profiles_select_admin-style
    // RLS on this table would just return zero/one row anyway, so skip the
    // fetch and show an empty queue, matching UsersScreen's isGuest handling.
    if (isGuest) { setLoading(false); return; }
    void fetchRequests();
  }, [isGuest, fetchRequests]);

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const listed = requests.filter(r => STATUS_TO_TAB[r.status] === tab);

  async function doApprove(id: string) {
    setResolvingId(id);
    const result = await approveRoleChangeRequest(id);
    setResolvingId(null);

    if (result.status === "error") {
      toast.error(result.message);
      return;
    }

    toast.success("Role change approved");
    void fetchRequests();
  }

  async function doReject(id: string) {
    setResolvingId(id);
    const result = await rejectRoleChangeRequest(id, rejectNote);
    setResolvingId(null);
    setRejectingId(null);
    setRejectNote("");

    if (result.status === "error") {
      toast.error(result.message);
      return;
    }

    toast("Request rejected");
    void fetchRequests();
  }

  const tabs: RequestTab[] = ["Pending", "Approved", "Rejected"];

  return (
    <AdminAppShell
      activeNav="admin-role-requests"
      adminName={profile?.fullName ?? "Dr. Helena Marsh"}
      adminRole="Platform Administrator"
      pendingApprovals={0}
      pendingRoleRequests={pendingCount}
      notifCount={3}
      isGuest={isGuest}
      onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
      onNav={id => {
        if (id === "profile")         { onNavigate("profile");         return; }
        if (id === "admin-dashboard") { onNavigate("admin-dashboard"); return; }
        if (id === "admin-approvals") { onNavigate("admin-approvals"); return; }
        if (id === "admin-users")     { onNavigate("admin-users");     return; }
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
          <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Role Requests</span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8px] font-semibold"
              style={{ ...M, background:"#E2A23B", color:"#1E1B16" }}>
              {pendingCount} pending
            </span>
          )}
        </div>
      }
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* Tab bar */}
        <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] px-4 sm:px-8 flex items-end gap-0 pt-5">
          {tabs.map(t => {
            const count = requests.filter(r => STATUS_TO_TAB[r.status] === t).length;
            const active = tab === t;
            return (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-4 pb-3 text-[12px] font-medium border-b-[2px] transition-colors ${
                  active ? "border-[#1E1B16] text-[#1E1B16]" : "border-transparent text-[#6B6355] hover:text-[#1E1B16]"
                }`}
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                {t}
                <span className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-semibold ${
                  active
                    ? t === "Pending" ? "bg-[#E2A23B] text-[#1E1B16]" : "bg-[#1E1B16] text-[#F6F1E7]"
                    : "bg-[#EDE7DA] text-[#6B6355]"
                }`} style={M}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Column header + rows */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="min-w-[720px]">
        <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] px-8 py-2.5 grid gap-4"
          style={{ gridTemplateColumns:"1fr 130px 130px 160px 210px" }}>
          {["Requester","Current Role","Requested Role","Submitted","Actions"].map(h => (
            <span key={h} className="text-[8px] tracking-widest uppercase text-[#9C8E7E]" style={M}>{h}</span>
          ))}
        </div>

        <div style={dotGrid}>
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <RefreshCw size={22} strokeWidth={1.5} className="text-[#9C8E7E] animate-spin" />
              <span className="text-[12px] text-[#9C8E7E]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                Loading requests…
              </span>
            </div>
          )}
          {!loading && loadError && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <span className="text-[12px] text-[#B5432E] text-center max-w-[380px]"
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                Couldn't load role requests: {loadError}
              </span>
              <button type="button" onClick={() => void fetchRequests()}
                className="flex items-center gap-1.5 px-3 py-[6px] rounded-[6px] text-[11px] font-semibold border border-[#DCD4C2] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors"
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                <RefreshCw size={11} strokeWidth={1.75} /> Retry
              </button>
            </div>
          )}
          <AnimatePresence initial={false}>
            {!loading && !loadError && listed.length === 0 && (
              <motion.div key="empty"
                className="flex flex-col items-center justify-center h-48 gap-3"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <UserCog size={28} strokeWidth={1} className="text-[#DCD4C2]" />
                <span className="text-[12px] text-[#9C8E7E]" style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  {tab === "Pending" ? "Nothing pending — all caught up." : `No ${tab.toLowerCase()} requests yet.`}
                </span>
              </motion.div>
            )}
            {!loading && !loadError && listed.map((r, i) => {
              const isRejecting = rejectingId === r.id;
              const isResolving = resolvingId === r.id;
              const currentUiRole = dbRoleToUserRole(r.currentRole);
              const requestedUiRole = dbRoleToUserRole(r.requestedRole);
              return (
                <motion.div key={r.id}
                  layout
                  initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  transition={{ duration:0.15, delay:i * 0.03 }}
                  className="border-b border-[#DCD4C2] bg-[#FCFAF3]">
                  <div className="grid gap-4 px-8 py-4 items-center"
                    style={{ gridTemplateColumns:"1fr 130px 130px 160px 210px" }}>

                    {/* Requester */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background:"rgba(30,27,22,0.06)", border:"1px solid rgba(30,27,22,0.15)" }}>
                        <span className="text-[10px] font-semibold text-[#1E1B16]">{initialsOf(r.requesterName)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium text-[#1E1B16] truncate"
                          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{r.requesterName}</div>
                        <div className="text-[9px] text-[#9C8E7E] truncate" style={M}>{r.requesterEmail}</div>
                      </div>
                    </div>

                    {/* Current role */}
                    <div><RoleBadge role={currentUiRole} /></div>

                    {/* Requested role */}
                    <div><RoleBadge role={requestedUiRole} /></div>

                    {/* Submitted */}
                    <div className="text-[10px] text-[#9C8E7E]" style={M}>{formatDateTime(r.createdAt)}</div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {r.status === "pending" ? (
                        <>
                          <button type="button"
                            onClick={() => doApprove(r.id)}
                            disabled={isGuest || isResolving || !!rejectingId}
                            title={isGuest ? "Disabled in guest mode" : "Approve"}
                            className="flex items-center gap-1 px-2.5 py-[5px] rounded-[5px] text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background:"rgba(46,107,76,0.12)", border:"1px solid rgba(46,107,76,0.3)", color:"#2E6B4C", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                            {isResolving ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} strokeWidth={2.2} />} Approve
                          </button>
                          <button type="button"
                            onClick={() => { setRejectingId(r.id); setRejectNote(""); }}
                            disabled={isGuest || isResolving}
                            title={isGuest ? "Disabled in guest mode" : "Reject"}
                            className="flex items-center gap-1 px-2.5 py-[5px] rounded-[5px] text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background:"rgba(181,67,46,0.10)", border:"1px solid rgba(181,67,46,0.28)", color:"#B5432E", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                            <X size={11} strokeWidth={2.2} /> Reject
                          </button>
                        </>
                      ) : r.status === "approved" ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium" style={{ ...M, color:"#2E6B4C" }}>
                          <Check size={10} strokeWidth={2.5} /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium" style={{ ...M, color:"#B5432E" }}>
                          <XCircle size={10} strokeWidth={1.75} /> Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason (if given) */}
                  {r.reason && (
                    <div className="px-8 pb-3 -mt-1 flex items-start gap-1.5">
                      <MessageSquare size={10} strokeWidth={1.75} className="text-[#9C8E7E] flex-shrink-0 mt-[1px]" />
                      <p className="text-[11px] text-[#6B6355] leading-relaxed"
                        style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{r.reason}</p>
                    </div>
                  )}

                  {/* Admin note (if resolved with one) */}
                  {r.status !== "pending" && r.adminNote && (
                    <div className="px-8 pb-3 -mt-1">
                      <div className="text-[9px] tracking-widest uppercase text-[#9C8E7E] mb-1" style={M}>Admin note</div>
                      <p className="text-[11px] text-[#1E1B16] leading-relaxed"
                        style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{r.adminNote}</p>
                    </div>
                  )}

                  {/* Inline reject-note textarea */}
                  {isRejecting && (
                    <motion.div
                      initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                      transition={{ duration:0.15 }}
                      className="px-8 pb-4 space-y-2">
                      <label className="block text-[8px] tracking-widest uppercase text-[#6B6355] mb-1.5" style={M}>
                        Note to requester <span className="normal-case tracking-normal text-[#9C8E7E]">(optional)</span>
                      </label>
                      <textarea
                        value={rejectNote}
                        onChange={e => setRejectNote(e.target.value)}
                        rows={2}
                        placeholder="Explain why this request is being rejected…"
                        className="w-full bg-[#F6F1E7] border border-[#DCD4C2] rounded-[7px] px-3 py-2.5 text-[12px] text-[#1E1B16] placeholder:text-[#DCD4C2] outline-none resize-none focus:border-[#1E1B16]/35 transition-colors"
                        style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}
                      />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => doReject(r.id)}
                          disabled={isResolving}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] text-[11px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60"
                          style={{ background:"#B5432E", color:"#FCFAF3", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                          {isResolving ? <RefreshCw size={11} className="animate-spin" /> : <XCircle size={11} strokeWidth={2} />}
                          Confirm Rejection
                        </button>
                        <button type="button" onClick={() => { setRejectingId(null); setRejectNote(""); }}
                          disabled={isResolving}
                          className="px-3.5 py-2 rounded-[6px] text-[11px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#1E1B16]/30 hover:text-[#1E1B16] transition-colors disabled:opacity-60"
                          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        </div>{/* min-w */}
        </div>{/* overflow */}

      </div>
    </AdminAppShell>
  );
}
