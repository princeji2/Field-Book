import { LandingPage } from "../organizer";
import { SignupPage, ForgotPage } from "../shared";
import { useScreenNav } from "./useScreenNav";
import { useAuth } from "../../lib/AuthContext";
import { Fade } from "./Fade";

export function LandingRoute() {
  const onNavigate = useScreenNav();
  return (
    <Fade duration={0.18}>
      <LandingPage onNavigate={onNavigate} />
    </Fade>
  );
}

export function SignupRoute() {
  const onNavigate = useScreenNav();
  const { setAuthenticated } = useAuth();
  return (
    <Fade duration={0.18}>
      <SignupPage onNavigate={onNavigate} onAuthenticated={setAuthenticated} />
    </Fade>
  );
}

export function ForgotRoute() {
  const onNavigate = useScreenNav();
  return (
    <Fade duration={0.18}>
      <ForgotPage onNavigate={onNavigate} />
    </Fade>
  );
}
