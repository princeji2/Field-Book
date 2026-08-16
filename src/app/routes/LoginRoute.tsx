import { useState } from "react";
import { useNavigate } from "react-router";
import { AdminLoginScreen, AdminRoleConfirmScreen } from "../admin";
import type { Screen } from "../shared";
import { screenToPath, roleHome } from "../../lib/screenPaths";
import { useAuth, type UiRole } from "../../lib/AuthContext";
import { Fade } from "./Fade";

/**
 * "/login" hosts both the role-selection screen and the sign-in form (the
 * two used to be separate Screen values, "admin-role-confirm" and
 * "admin-login", toggled back and forth by their own onNavigate calls to
 * each other). Since the requested URL structure is a single "/login ->
 * role selection + sign-in" route, this component keeps that back-and-forth
 * as local subview state instead of a route change, and only pushes a real
 * navigation for destinations outside the login flow itself (forgot,
 * signup, or a resolved dashboard after a successful sign-in / guest entry).
 */
export function LoginRoute() {
  const [subview, setSubview] = useState<"signin" | "role">("signin");
  // Shared between the role-confirm screen (sets it) and the guest-login
  // button on the sign-in form (reads it) — same relationship as App.tsx's
  // old `pendingRole` state.
  const [pendingRole, setPendingRole] = useState<UiRole>("admin");
  const navigate = useNavigate();
  const { profile, setAuthenticated, loginAsGuest, clearSession } = useAuth();

  function goTo(screen: Screen, eventId?: string) {
    if (screen === "admin-role-confirm") { setSubview("role"); return; }
    if (screen === "admin-login") { setSubview("signin"); return; }
    if (screen === "landing") clearSession();
    navigate(screenToPath(screen, eventId));
  }

  function handleGuestLogin() {
    loginAsGuest(pendingRole);
    navigate(roleHome(pendingRole));
  }

  return (
    <Fade duration={0.22} y={subview === "role" ? 8 : undefined}>
      {subview === "signin" ? (
        <AdminLoginScreen onNavigate={goTo} onGuestLogin={handleGuestLogin} onAuthenticated={setAuthenticated} />
      ) : (
        <AdminRoleConfirmScreen onNavigate={goTo} onRoleSelect={setPendingRole} onGuestLogin={handleGuestLogin} profile={profile} />
      )}
    </Fade>
  );
}
