import type { Screen } from "../app/shared";
import type { UiRole } from "./AuthContext";

/**
 * Maps a legacy `Screen` value (the old useState<Screen> destinations that
 * every page component still calls via its `onNavigate` prop) to a real URL.
 *
 * This is the single source of truth for the Screen -> URL mapping, so every
 * route wrapper stays in sync without duplicating path strings.
 *
 * "admin-login" and "admin-role-confirm" intentionally share one path
 * ("/login") — the login page itself decides which of the two sub-views to
 * show via local state (see routes/PublicPages.tsx), matching the requested
 * "/login -> role selection + sign-in" URL structure.
 */
export function screenToPath(screen: Screen, id?: string): string {
  switch (screen) {
    case "landing": return "/";
    case "signup": return "/signup";
    case "forgot": return "/forgot";
    case "pricing": return "/pricing";
    case "campuses": return "/campuses";
    case "admin-login": return "/login";
    case "admin-role-confirm": return "/login";
    case "profile": return "/profile";

    case "dashboard": return "/student/dashboard";
    case "explore": return "/student/explore";
    case "details": return `/student/explore/${id ?? ""}`;
    case "myevents": return "/student/events";
    case "scanner": return id ? `/student/scanner/${id}` : "/student/scanner";
    case "certs": return "/student/certificates";
    case "notifs": return "/student/notifications";

    case "org-dashboard": return "/organizer/dashboard";
    case "org-events": return "/organizer/events";
    case "org-events-create": return "/organizer/events/create";
    case "org-qr": return id ? `/organizer/qr?event=${id}` : "/organizer/qr";
    case "org-attendees": return id ? `/organizer/attendees/${id}` : "/organizer/attendees";
    case "org-analytics": return "/organizer/analytics";
    case "org-certs": return "/organizer/certificates";

    case "admin-dashboard": return "/admin/dashboard";
    case "admin-approvals": return "/admin/approvals";
    case "admin-users": return "/admin/users";
    case "admin-role-requests": return "/admin/role-requests";
    case "admin-templates": return "/admin/templates";
    case "admin-analytics": return "/admin/analytics";
    case "admin-settings": return "/admin/settings";
    case "admin-notifs": return "/admin/notifications";

    default: return "/";
  }
}

/** Where a role's own dashboard lives — used by guards to redirect. */
export function roleHome(role: UiRole): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "org") return "/organizer/dashboard";
  return "/student/dashboard";
}
