import {
  AdminDashboard, ApprovalsScreen, UsersScreen,
  CertificateTemplatesScreen, AdminAnalyticsScreen,
  AdminSettingsScreen, AdminNotifsScreen,
} from "../admin";
import { useAuth } from "../../lib/AuthContext";
import { useScreenNav } from "./useScreenNav";
import { useAdminUi } from "./AdminUiContext";
import { Fade } from "./Fade";

export function AdminDashboardRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  const { livePendingApprovals } = useAdminUi();
  return (
    <Fade>
      <AdminDashboard
        onNavigate={onNavigate}
        livePendingApprovals={livePendingApprovals}
        isGuest={isGuest}
        profile={profile}
      />
    </Fade>
  );
}

export function AdminApprovalsRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  const { setLivePendingApprovals } = useAdminUi();
  return (
    <Fade>
      <ApprovalsScreen
        onNavigate={onNavigate}
        onPendingChange={setLivePendingApprovals}
        isGuest={isGuest}
        profile={profile}
      />
    </Fade>
  );
}

export function AdminUsersRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <UsersScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function AdminTemplatesRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <CertificateTemplatesScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function AdminAnalyticsRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <AdminAnalyticsScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function AdminSettingsRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <AdminSettingsScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function AdminNotificationsRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <AdminNotifsScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}
