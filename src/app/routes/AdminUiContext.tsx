import { createContext, useContext, useState, type ReactNode } from "react";

interface AdminUiContextValue {
  livePendingApprovals: number;
  setLivePendingApprovals: (n: number) => void;
  livePendingRoleRequests: number;
  setLivePendingRoleRequests: (n: number) => void;
}

const AdminUiContext = createContext<AdminUiContextValue | null>(null);

/**
 * Holds the one piece of state that used to be lifted in App.tsx and shared
 * between two *different* screens: `livePendingApprovals` was read by
 * AdminDashboard (for its badge count) and written by ApprovalsScreen (via
 * onPendingChange) whenever an approval was resolved. Now that those are
 * separate routes instead of siblings under one parent's state, this small
 * provider (mounted once, above the pathname-keyed remount in
 * routes/index.tsx, so it survives navigating between admin routes) keeps
 * that same cross-screen behavior.
 */
export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [livePendingApprovals, setLivePendingApprovals] = useState(4);
  // Starts at 0 (unlike livePendingApprovals' mock-data default of 4) since
  // role_change_requests is real data from the start — RoleRequestsRoute's
  // fetch on mount corrects this to the real pending count immediately.
  const [livePendingRoleRequests, setLivePendingRoleRequests] = useState(0);
  return (
    <AdminUiContext.Provider value={{
      livePendingApprovals, setLivePendingApprovals,
      livePendingRoleRequests, setLivePendingRoleRequests,
    }}>
      {children}
    </AdminUiContext.Provider>
  );
}

export function useAdminUi(): AdminUiContextValue {
  const ctx = useContext(AdminUiContext);
  if (!ctx) throw new Error("useAdminUi() must be used within an AdminUiProvider");
  return ctx;
}
