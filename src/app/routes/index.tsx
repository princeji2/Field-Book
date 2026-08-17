import { AnimatePresence } from "motion/react";
import { Routes, Route, useLocation } from "react-router";
import { ErrorBoundary } from "../shared";
import { RoleGuard } from "./RoleGuard";
import { AuthRouteGuard } from "./AuthRouteGuard";
import { AdminUiProvider } from "./AdminUiContext";

import { LandingRoute, SignupRoute, ForgotRoute } from "./PublicRoutes";
import { LoginRoute } from "./LoginRoute";
import { AuthCallbackRoute } from "./AuthCallbackRoute";
import { ProfileRoute } from "./ProfileRoute";

import {
  StudentDashboardRoute, ExploreRoute, EventDetailRoute, MyEventsRoute,
  ScannerRoute, CertificatesRoute, StudentNotificationsRoute,
} from "./StudentRoutes";

import {
  OrganizerDashboardRoute, EventsWorkspaceRoute, EventsWorkspaceCreateRoute,
  OrgQRRoute, OrgAttendeesRoute, OrgAnalyticsRoute, OrgCertificatesRoute,
} from "./OrganizerRoutes";

import {
  AdminDashboardRoute, AdminApprovalsRoute, AdminUsersRoute,
  AdminTemplatesRoute, AdminAnalyticsRoute, AdminSettingsRoute,
  AdminNotificationsRoute,
} from "./AdminRoutes";

/**
 * Central route table. Structure mirrors the URL scheme requested:
 *   /                    -> landing
 *   /login               -> role selection + sign-in
 *   /admin/*             -> guarded, admin only
 *   /organizer/*         -> guarded, organizer only
 *   /student/*           -> guarded, student only
 *   /profile             -> guarded, any signed-in role
 *
 * <RoleGuard allow="..."> is a layout route (renders <Outlet/> on match, or
 * redirects otherwise) — see routes/RoleGuard.tsx for the redirect rules.
 *
 * Wrapped in <AnimatePresence mode="wait"> keyed by pathname to reproduce
 * the fade/slide transitions the old per-screen <motion.div> blocks in
 * App.tsx had between screens.
 */
export function AnimatedRoutes() {
  const location = useLocation();
  return (
    // AdminUiProvider lives outside the pathname-keyed remount below so
    // livePendingApprovals survives navigating between /admin/dashboard and
    // /admin/approvals (that cross-screen sync is the whole point of it —
    // see AdminUiContext.tsx). Everything inside <ErrorBoundary> remounts
    // per-route on purpose, to replay each screen's enter animation exactly
    // like the old per-screen <motion.div key={screen}> blocks did.
    <AdminUiProvider>
    <ErrorBoundary key={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/signup" element={<SignupRoute />} />
          <Route path="/forgot" element={<ForgotRoute />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/auth/callback" element={<AuthCallbackRoute />} />

          <Route element={<AuthRouteGuard />}>
            <Route path="/profile" element={<ProfileRoute />} />
          </Route>

          <Route path="/student" element={<RoleGuard allow="student" />}>
            <Route path="dashboard" element={<StudentDashboardRoute />} />
            <Route path="explore" element={<ExploreRoute />} />
            <Route path="explore/:eventId" element={<EventDetailRoute />} />
            <Route path="events" element={<MyEventsRoute />} />
            <Route path="scanner" element={<ScannerRoute />} />
            <Route path="scanner/:eventId" element={<ScannerRoute />} />
            <Route path="certificates" element={<CertificatesRoute />} />
            <Route path="notifications" element={<StudentNotificationsRoute />} />
          </Route>

          <Route path="/organizer" element={<RoleGuard allow="org" />}>
            <Route path="dashboard" element={<OrganizerDashboardRoute />} />
            <Route path="events" element={<EventsWorkspaceRoute />} />
            <Route path="events/create" element={<EventsWorkspaceCreateRoute />} />
            <Route path="qr" element={<OrgQRRoute />} />
            <Route path="attendees" element={<OrgAttendeesRoute />} />
            <Route path="attendees/:eventId" element={<OrgAttendeesRoute />} />
            <Route path="analytics" element={<OrgAnalyticsRoute />} />
            <Route path="certificates" element={<OrgCertificatesRoute />} />
          </Route>

          <Route path="/admin" element={<RoleGuard allow="admin" />}>
            <Route path="dashboard" element={<AdminDashboardRoute />} />
            <Route path="approvals" element={<AdminApprovalsRoute />} />
            <Route path="users" element={<AdminUsersRoute />} />
            <Route path="templates" element={<AdminTemplatesRoute />} />
            <Route path="analytics" element={<AdminAnalyticsRoute />} />
            <Route path="settings" element={<AdminSettingsRoute />} />
            <Route path="notifications" element={<AdminNotificationsRoute />} />
          </Route>

          <Route path="*" element={<LandingRoute />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
    </AdminUiProvider>
  );
}
