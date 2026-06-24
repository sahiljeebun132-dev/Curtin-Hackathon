import { useState } from "react";
import { useT, useLang, LANGS } from "./i18n.js";
import AssessmentFlow from "./components/AssessmentFlow.jsx";
import Medication from "./components/Medication.jsx";
import Support from "./components/Support.jsx";
import Progress from "./components/Progress.jsx";
import Privacy from "./components/Privacy.jsx";
import SosButton from "./components/SosButton.jsx";

function Brand() {
  const t = useT();
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
        </svg>
      </div>
      <div>
        <div className="brand-name">VELA</div>
        <div className="brand-sub">{t("tagline")}</div>
      </div>
    </div>
  );
}

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch">
      {Object.entries(LANGS).map(([k, label]) => (
        <button key={k} className={lang === k ? "on" : ""} onClick={() => setLang(k)}>{label}</button>
      ))}
    </div>
  );
}

export default function App() {
  const t = useT();
  const [tab, setTab] = useState("checkin");
  const TABS = [
    ["checkin", t("nav_checkin")], ["meds", t("nav_meds")],
    ["support", t("nav_support")], ["progress", t("nav_progress")], ["privacy", t("nav_privacy")],
  ];
  return (
    <div className="shell">
      <div className="topbar"><Brand /><LangSwitch /></div>
      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      <div key={tab} className="fade-key">
        {tab === "checkin" && <AssessmentFlow />}
        {tab === "meds" && <Medication />}
        {tab === "support" && <Support />}
        {tab === "progress" && <Progress />}
        {tab === "privacy" && <Privacy />}
      </div>

      <p className="footer-note" style={{ textAlign: "center", marginTop: 26 }}>
        VELA / ARIA v1.0 - an AI-assisted support flag, not a clinical diagnosis. Reviewed by a qualified
        person before any action. Built for Game of Code 2026, Curtin Mauritius.
      </p>
      <SosButton />
    </div>
  );
}
