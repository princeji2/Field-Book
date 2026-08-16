import { useParams } from "react-router";
import {
  StudentDashboard, ExploreScreen, EventDetailScreen,
  MyEventsScreen, ScannerScreen, CertificatesScreen, NotificationsScreen,
} from "../student";
import { useAuth } from "../../lib/AuthContext";
import { useScreenNav } from "./useScreenNav";
import { Fade } from "./Fade";

export function StudentDashboardRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <StudentDashboard onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function ExploreRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <ExploreScreen
        onNavigate={onNavigate}
        onViewDetail={id => onNavigate("details", id)}
        isGuest={isGuest}
        profile={profile}
      />
    </Fade>
  );
}

export function EventDetailRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  const { eventId } = useParams();
  return (
    <Fade>
      <EventDetailScreen eventId={eventId ?? "1"} onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}

export function MyEventsRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <MyEventsScreen
        onNavigate={onNavigate}
        onScanEvent={id => onNavigate("scanner", id)}
        isGuest={isGuest}
        profile={profile}
      />
    </Fade>
  );
}

export function ScannerRoute() {
  const onNavigate = useScreenNav();
  const { isGuest } = useAuth();
  const { eventId } = useParams();
  return (
    <Fade duration={0.2}>
      <ScannerScreen eventId={eventId ?? "1"} onNavigate={onNavigate} isGuest={isGuest} />
    </Fade>
  );
}

export function CertificatesRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <CertificatesScreen
        onNavigate={onNavigate}
        onViewEventDetail={id => onNavigate("details", id)}
        isGuest={isGuest}
        profile={profile}
      />
    </Fade>
  );
}

export function StudentNotificationsRoute() {
  const onNavigate = useScreenNav();
  const { isGuest, profile } = useAuth();
  return (
    <Fade>
      <NotificationsScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />
    </Fade>
  );
}
