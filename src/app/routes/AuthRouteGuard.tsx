import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../lib/AuthContext";

/**
 * Guard for routes that just require *some* signed-in (or guest) session,
 * regardless of role — currently only /profile, since it's a single shared
 * URL that role-dispatches internally (see ProfileRoute.tsx), same as the
 * old App.tsx `screen === "profile"` block did via `currentRole`.
 */
export function AuthRouteGuard() {
  const { role, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!role) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
