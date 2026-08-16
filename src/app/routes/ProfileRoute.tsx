import { AdminProfileScreen } from "../admin";
import { OrgProfileScreen } from "../organizer";
import { StudentProfileScreen } from "../student";
import { useAuth } from "../../lib/AuthContext";
import { useScreenNav } from "./useScreenNav";
import { Fade } from "./Fade";

/**
 * "/profile" is one shared URL across all three roles — same as the old
 * `screen === "profile"` block in App.tsx, which switch-rendered on
 * `currentRole` rather than having a role-specific Screen value.
 */
export function ProfileRoute() {
  const onNavigate = useScreenNav();
  const { role, isGuest, profile } = useAuth();

  return (
    <Fade duration={0.18} style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {role === "admin" && <AdminProfileScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />}
      {role === "org" && <OrgProfileScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />}
      {role === "student" && <StudentProfileScreen onNavigate={onNavigate} isGuest={isGuest} profile={profile} />}
    </Fade>
  );
}
