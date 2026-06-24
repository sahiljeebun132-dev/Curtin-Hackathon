import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { LangProvider } from "./i18n.js";
import { RoleProvider } from "./role.js";
import { MedsProvider } from "./meds.js";
import { IdentityProvider } from "./identity.js";
import "./styles.css";

// Strict-mode wrapper intentionally omitted: its dev-only double mount
// re-acquired the webcam and raced getUserMedia (false 'no camera access').
ReactDOM.createRoot(document.getElementById("root")).render(
  <LangProvider>
    <RoleProvider>
      <MedsProvider>
        <IdentityProvider>
          <App />
        </IdentityProvider>
      </MedsProvider>
    </RoleProvider>
  </LangProvider>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
