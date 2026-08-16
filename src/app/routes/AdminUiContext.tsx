import { createContext, useContext, useState, type ReactNode } from "react";

interface AdminUiContextValue {
  livePendingApprovals: number;
  setLivePendingApprovals: (n: number) => void;
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
  return (
    <AdminUiContext.Provider value={{ livePendingApprovals, setLivePendingApprovals }}>
      {children}
    </AdminUiContext.Provider>
  );
}

export function useAdminUi(): AdminUiContextValue {
  const ctx = useContext(AdminUiContext);
  if (!ctx) throw new Error("useAdminUi() must be used within an AdminUiProvider");
  return ctx;
}
