import { useState } from "react";
import { useT } from "../i18n.js";
import { useRole } from "../role.js";
import { journeyDays } from "../journey.js";
import { cacheGet } from "../secure.js";

const LVLC = { Low: "#1f9d57", Medium: "#c98510", High: "#e0671f", Crisis: "#d83a3a" };
const RANK = { Crisis: 4, High: 3, Medium: 2, Low: 1 };
const DAYS = Array.from({ length: 30 }, (_, i) => (i === 12 || i === 23 ? "m" : "s"));
const MILESTONES = [
  { d: "Day 1", txt: "Joined the programme. First session with social worker." },
  { d: "Day 7", txt: "One week sober. Started medication reminders." },
  { d: "Day 14", txt: "Attended first peer support group (NA)." },
  { d: "Day 21", txt: "Family check-in - improved sleep and mood." },
];
const SORTS = {
  risk: (a, b) => RANK[b.level] - RANK[a.level],
  days: (a, b) => a.days - b.days,
  missed: (a, b) => b.missed - a.missed,
  name: (a, b) => a.initials.localeCompare(b.initials),
};

function Journey({ t, days, cal = DAYS }) {
  const reached = MILESTONES.filter((m) => parseInt(m.d.replace(/\D/g, ""), 10) <= days);
  return (
    <>
      <div className="journey">
        <div><div className="streak">{days}</div><div className="muted small">{t("progress_days")}</div></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="cal">{cal.map((d, i) => <i key={i} className={d} />)}</div>
          <div className="tiny muted">green = sober day</div>
        </div>
      </div>
      <h3>Milestones</h3>
      {reached.length === 0
        ? <p className="muted small">Your journey is just beginning - every day from here counts.</p>
        : reached.map((m) => (<div className="milestone" key={m.d}><span className="dot2" /><div><strong className="small">{m.d}</strong><div className="muted small">{m.txt}</div></div></div>))}
    </>
  );
}

export default function Progress({ caseload = [], onStartCheckin }) {
  const t = useT();
  const { role } = useRole();
  const [selId, setSelId] = useState(caseload[0]?.id);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("risk");

  if (role === "social") {
    const q = query.trim().toLowerCase();
    const list = caseload
      .filter((c) => !q || c.initials.toLowerCase().includes(q) || c.area.toLowerCase().includes(q))
      .sort(SORTS[sortBy]);
    const sel = list.find((c) => c.id === selId) || list[0];
    const urgent = caseload.filter((c) => c.level === "Crisis" || c.level === "High").length;
    return (
      <section className="card">
        <div className="eyebrow">{t("nav_progress")}</div>
        <h2>{t("progress_title")}</h2>
        <p className="muted small">{t("progress_role")}: <strong>{t("role_social")}</strong> &middot; {caseload.length} people &middot; {urgent} need attention</p>

        <h3>Your caseload</h3>
        <div className="case-toolbar">
          <input className="case-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or area..." />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
            <option value="risk">Sort: risk (urgent first)</option>
            <option value="days">Sort: days sober</option>
            <option value="missed">Sort: missed doses</option>
            <option value="name">Sort: name (A-Z)</option>
          </select>
        </div>

        {list.length === 0 && <p className="muted small">No one matches "{query}".</p>}
        {list.map((c) => (
          <div key={c.id} className={"case-row" + (sel && c.id === sel.id ? " on" : "")} onClick={() => setSelId(c.id)} role="button">
            <div className="case-ava" style={{ background: LVLC[c.level] }}>{c.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="case-name">{c.initials} <span className="muted small">&middot; {c.area}</span>{c.updated && <span className="upd-badge">updated</span>}</div>
              <div className="tiny muted">{c.days} {t("progress_days").toLowerCase()} &middot; {c.missed} missed{c.score != null ? ` · last score ${c.score}` : ""} &middot; review {c.next}</div>
            </div>
            <span className="case-pill" style={{ color: LVLC[c.level], borderColor: LVLC[c.level] }}>{c.level}</span>
          </div>
        ))}

        {sel && (<>
          <div className="divider" />
          <h3>{sel.initials} &middot; journey {sel.updated && <span className="upd-badge">just assessed</span>}</h3>
          <Journey t={t} days={sel.days} />
          <div className="callout" style={{ marginTop: 12 }}><span className="small"><strong>Social worker note:</strong> {sel.missed > 1 ? "Missed evening doses this month - worth gently exploring triggers at the next review." : "Engagement is steady. Keep reinforcing the wins."}</span></div>
          <button className="btn full" style={{ marginTop: 12 }} onClick={() => onStartCheckin && onStartCheckin(sel)}>Start a check-in for {sel.initials} &rarr;</button>
        </>)}
        <p className="tiny muted" style={{ marginTop: 12 }}><span className="lock">Consent-based &middot; demo data &middot; names anonymised &middot; nothing real is stored.</span></p>
      </section>
    );
  }

  const days = journeyDays();
  const cal = Array.from({ length: 30 }, (_, i) => (i < days ? "s" : "p"));
  return (
    <section className="card">
      <div className="eyebrow">{t("nav_progress")}</div>
      <h2>{t("progress_title")}</h2>
      <p className="muted small">{t("progress_sub")} &middot; {t("progress_role")}: <strong>{t("role_" + role)}</strong> <span className="muted">(change at the top)</span></p>
      <Journey t={t} days={days} cal={cal} />
      <h3>Past results</h3>
      {(() => {
        const hist = cacheGet("history") || [];
        if (hist.length === 0) return <p className="muted small">No check-ins yet. Do one from the Check-in tab to start your log.</p>;
        const last = hist[hist.length - 1].score, prev = hist.length > 1 ? hist[hist.length - 2].score : null;
        const trend = prev == null ? "This is your first recorded check-in - a brave first step."
          : last < prev ? `Your score went down ${prev - last} since last time - that's a good direction.`
          : last > prev ? `Your score went up ${last - prev} since last time - it may help to check in with someone.`
          : "Your score is about the same as last time.";
        return (<>
          <div className="callout"><span className="small">{trend}</span></div>
          {hist.slice(-8).reverse().map((h, i) => (
            <div className="case-row" key={i} style={{ cursor: "default" }}>
              <div className="case-ava" style={{ background: LVLC[h.level] || "var(--muted)" }}>{h.score}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="case-name">{h.level}</div>
                <div className="tiny muted">{new Date(h.ts).toLocaleDateString()} {new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{h.top ? " · " + h.top : ""}</div>
              </div>
            </div>
          ))}
        </>);
      })()}
      {role === "guardian"
        ? <div className="callout warm" style={{ marginTop: 12 }}><span className="small"><strong>For the guardian:</strong> Your role is encouragement, not surveillance. You see only what the person has chosen to share.</span></div>
        : <div className="callout" style={{ marginTop: 12 }}><span className="small"><strong>You're doing the work.</strong> Every green day counts. You decide what to share with your guardian or social worker.</span></div>}
      <p className="tiny muted" style={{ marginTop: 12 }}><span className="lock">Consent-based &middot; demo data &middot; nothing real is stored.</span></p>
    </section>
  );
}
