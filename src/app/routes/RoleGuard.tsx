import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth, type UiRole } from "../../lib/AuthContext";
import { roleHome } from "../../lib/screenPaths";

/**
 * Route guard for /admin/*, /organizer/*, /student/* :
 *  - No authenticated Supabase session and not browsing as a guest ->
 *    redirect to /login (the original landing/login page never enforced
 *    this; every screen was reachable by just flipping local state, so this
 *    is new protective behavior requested for the router migration).
 *  - Signed in (or guest) as a *different* role than the one this branch of
 *    routes requires -> redirect to that user's own dashboard, rather than
 *    letting them view another role's URLs directly.
 */
export function RoleGuard({ allow }: { allow: UiRole }) {
  const { role, loading } = useAuth();
  const location = useLocation();

  // Session bootstrap (checking for an existing Supabase session) hasn't
  // resolved yet — avoid a flash redirect to /login for a user who turns
  // out to already be signed in.
  if (loading) return null;

  if (!role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== allow) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return <Outlet />;
}
