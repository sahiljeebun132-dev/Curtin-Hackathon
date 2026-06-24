import { useState, useEffect } from "react";
import { useT, useLang, LANGS } from "./i18n.js";
import { useRole } from "./role.js";
import AssessmentFlow from "./components/AssessmentFlow.jsx";
import Medication from "./components/Medication.jsx";
import Support from "./components/Support.jsx";
import Progress from "./components/Progress.jsx";
import Privacy from "./components/Privacy.jsx";
import SosButton from "./components/SosButton.jsx";
import { INITIAL_CASELOAD } from "./data/caseload.js";

function Brand() {
  const t = useT();
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
        </svg>
      </div>
      <div><div className="brand-name">VELA</div><div className="brand-sub">{t("tagline")}</div></div>
    </div>
  );
}
function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch">
      {Object.entries(LANGS).map(([k, label]) => (<button key={k} className={lang === k ? "on" : ""} onClick={() => setLang(k)}>{label}</button>))}
    </div>
  );
}
function RoleSelect() {
  const t = useT();
  const { role, setRole } = useRole();
  return (
    <label className="role-select">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
      <select value={role} onChange={(e) => setRole(e.target.value)} aria-label={t("progress_role")}>
        <option value="patient">{t("role_patient")}</option>
        <option value="guardian">{t("role_guardian")}</option>
        <option value="social">{t("role_social")}</option>
      </select>
    </label>
  );
}

const TAB_ROLES = {
  checkin: ["patient", "guardian", "social"],
  meds: ["patient", "guardian"],
  support: ["patient", "guardian", "social"],
  progress: ["patient", "guardian", "social"],
  privacy: ["patient", "guardian", "social"],
};

export default function App() {
  const t = useT();
  const { role } = useRole();
  const [tab, setTab] = useState("checkin");
  const [seed, setSeed] = useState(null);   // pre-filled check-in context
  const [nonce, setNonce] = useState(0);     // forces a fresh check-in
  const [caseload, setCaseload] = useState(INITIAL_CASELOAD);

  const ALL = [
    ["checkin", t("nav_checkin")], ["meds", t("nav_meds")],
    ["support", t("nav_support")], ["progress", t("nav_progress")], ["privacy", t("nav_privacy")],
  ];
  const visible = ALL.filter(([k]) => TAB_ROLES[k].includes(role));

  useEffect(() => {
    if (!visible.find(([k]) => k === tab)) setTab(visible[0][0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  function openTab(k) {
    if (k === "checkin") { setSeed(null); setNonce((n) => n + 1); } // manual = blank
    setTab(k);
  }
  function startCheckinFor(person) {
    setSeed({ id: person.id, meta: { geographic_zone: person.area, referrer_type: "counsellor" }, label: person.initials });
    setNonce((n) => n + 1);
    setTab("checkin");
  }
  function recordResult(id, summary) {
    setCaseload((cl) => cl.map((c) => c.id === id ? { ...c, level: summary.level, score: summary.score, updated: true } : c));
  }

  return (
    <div className="shell">
      <div className="topbar">
        <Brand />
        <div className="topbar-right"><RoleSelect /><LangSwitch /></div>
      </div>
      <div className="tabs">
        {visible.map(([k, label]) => (<button key={k} className={tab === k ? "on" : ""} onClick={() => openTab(k)}>{label}</button>))}
      </div>

      <div key={tab + role + nonce} className="fade-key">
        {tab === "checkin" && <AssessmentFlow seed={seed} onResult={(sum) => seed && recordResult(seed.id, sum)} />}
        {tab === "meds" && <Medication />}
        {tab === "support" && <Support />}
        {tab === "progress" && <Progress caseload={caseload} onStartCheckin={startCheckinFor} />}
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
