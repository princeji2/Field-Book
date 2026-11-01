import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App.tsx";
import "./styles/index.css";

// Service worker registration (vite-plugin-pwa). registerType is "autoUpdate",
// so a new build is fetched and activated in the background; onNeedRefresh
// reloads once the updated worker has taken control so the user lands on the
// latest version without a manual refresh. No-ops in dev (devOptions disabled).
const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
