import { useNavigate } from "react-router";
import type { Screen } from "../shared";
import { screenToPath } from "../../lib/screenPaths";
import { useAuth } from "../../lib/AuthContext";

/**
 * Every existing screen component still calls its `onNavigate` prop with the
 * legacy `(screen: Screen, eventId?: string) => void` signature from the old
 * useState<Screen> app. This hook is a drop-in replacement: it translates
 * those same calls into real URL navigations via react-router, so none of
 * the page components need to change.
 *
 * It also reproduces the one side effect App.tsx's old `navigateTo` had
 * beyond routing: navigating to "landing" or "admin-login" cleared the
 * signed-in profile / guest-mode flag (the app's de-facto "log out" reset,
 * used by every real logout path — see AppShell/OrgAppShell/AdminAppShell's
 * "Log Out" actions, which call signOutUser() then onNavigate("landing" |
 * "admin-login")).
 */
export function useScreenNav() {
  const navigate = useNavigate();
  const { clearSession } = useAuth();

  return function onNavigate(screen: Screen, eventId?: string) {
    if (screen === "landing" || screen === "admin-login") clearSession();
    navigate(screenToPath(screen, eventId));
  };
}
