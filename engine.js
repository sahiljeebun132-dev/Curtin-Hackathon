import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { LangProvider } from "./i18n.js";
import { RoleProvider } from "./role.js";
import { MedsProvider } from "./meds.js";
import { IdentityProvider } from "./identity.js";
import { loadAll } from "./secure.js";
import "./styles.css";

function start() {
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
}
// Decrypt any stored on-device data first, then start (start anyway if it fails).
loadAll().then(start, start);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
