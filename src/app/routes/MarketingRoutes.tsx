import { PricingPage } from "../pricing";
import { ForCampusesPage } from "../campuses";
import { useScreenNav } from "./useScreenNav";
import { Fade } from "./Fade";

export function PricingRoute() {
  const onNavigate = useScreenNav();
  return (
    <Fade duration={0.18}>
      <PricingPage onNavigate={onNavigate} />
    </Fade>
  );
}

export function CampusesRoute() {
  const onNavigate = useScreenNav();
  return (
    <Fade duration={0.18}>
      <ForCampusesPage onNavigate={onNavigate} />
    </Fade>
  );
}
