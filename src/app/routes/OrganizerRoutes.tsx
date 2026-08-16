import { useParams } from "react-router";
import {
  OrganizerDashboard, EventsWorkspaceScreen, OrgAnalyticsScreen,
  OrgCertificatesScreen, OrgQRScreen, OrgAttendeesScreen,
} from "../organizer";
import { useAuth } from "../../lib/AuthContext";
import { useScreenNav } from "./useScreenNav";
import { Fade } from "./Fade";

export function OrganizerDashboardRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <OrganizerDashboard onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function EventsWorkspaceRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <EventsWorkspaceScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function EventsWorkspaceCreateRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <EventsWorkspaceScreen onNavigate={onNavigate} initialView="create" isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function OrgQRRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <OrgQRScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function OrgAttendeesRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  const { eventId } = useParams();
  return (
    <Fade>
      <OrgAttendeesScreen onNavigate={onNavigate} eventId={eventId ?? "oe4"} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function OrgAnalyticsRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <OrgAnalyticsScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function OrgCertificatesRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <OrgCertificatesScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}
