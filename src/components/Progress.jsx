import { useState } from "react";
import { useT } from "../i18n.js";
import { useRole } from "../role.js";
import { journeyDays } from "../journey.js";
import { cacheGet } from "../secure.js";

const LVLC = { Low: "#1f9d57", Medium: "#c98510", High: "#e0671f", Crisis: "#d83a3a" };
const RANK = { Crisis: 4, High: 3, Medium: 2, Low: 1 };
const DAYS = Array.from({ length: 30 }, (_, i) => (i === 12 || i === 23 ? "m" : "s"));
const MILESTONES = [
  { n: 1, txt: "pr_ms1" }, { n: 7, txt: "pr_ms2" }, { n: 14, txt: "pr_ms3" }, { n: 21, txt: "pr_ms4" },
];
const SORTS = {
  risk: (a, b) => RANK[b.level] - RANK[a.level],
  days: (a, b) => a.days - b.days,
  missed: (a, b) => b.missed - a.missed,
  name: (a, b) => a.initials.localeCompare(b.initials),
};

function Journey({ t, days, cal = DAYS }) {
  const reached = MILESTONES.filter((m) => m.n <= days);
  return (
    <>
      <div className="journey">
        <div><div className="streak">{days}</div><div className="muted small">{t("progress_days")}</div></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="cal">{cal.map((d, i) => <i key={i} className={d} />)}</div>
          <div className="tiny muted">{t("pr_green")}</div>
        </div>
      </div>
      <h3>{t("pr_milestones")}</h3>
      {reached.length === 0
        ? <p className="muted small">{t("pr_journey_begin")}</p>
        : reached.map((m) => (<div className="milestone" key={m.n}><span className="dot2" /><div><strong className="small">{t("pr_day")} {m.n}</strong><div className="muted small">{t(m.txt)}</div></div></div>))}
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
        <p className="muted small">{t("progress_role")}: <strong>{t("role_social")}</strong> &middot; {caseload.length} {t("pr_people")} &middot; {urgent} {t("pr_need")}</p>

        <h3>{t("pr_caseload")}</h3>
        <div className="case-toolbar">
          <input className="case-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("pr_search_ph")} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label={t("pr_sortby")}>
            <option value="risk">{t("pr_sort_risk")}</option>
            <option value="days">{t("pr_sort_days")}</option>
            <option value="missed">{t("pr_sort_missed")}</option>
            <option value="name">{t("pr_sort_name")}</option>
          </select>
        </div>

        {list.length === 0 && <p className="muted small">{t("pr_nomatch").replace("{q}", query)}</p>}
        {list.map((c) => (
          <div key={c.id} className={"case-row" + (sel && c.id === sel.id ? " on" : "")} onClick={() => setSelId(c.id)} role="button">
            <div className="case-ava" style={{ background: LVLC[c.level] }}>{c.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="case-name">{c.initials} <span className="muted small">&middot; {c.area}</span>{c.updated && <span className="upd-badge">{t("pr_updated")}</span>}</div>
              <div className="tiny muted">{c.days} {t("progress_days").toLowerCase()} &middot; {c.missed} {t("pr_rowmissed")}{c.score != null ? ` · ${t("pr_lastscore")} ${c.score}` : ""} &middot; {t("pr_review")} {c.next}</div>
            </div>
            <span className="case-pill" style={{ color: LVLC[c.level], borderColor: LVLC[c.level] }}>{c.level}</span>
          </div>
        ))}

        {sel && (<>
          <div className="divider" />
          <h3>{sel.initials} &middot; {t("pr_journey_word")} {sel.updated && <span className="upd-badge">{t("pr_just")}</span>}</h3>
          <Journey t={t} days={sel.days} />
          <div className="callout" style={{ marginTop: 12 }}><span className="small"><strong>{t("pr_swnote")}</strong> {sel.missed > 1 ? t("pr_note_missed") : t("pr_note_steady")}</span></div>
          <button className="btn full" style={{ marginTop: 12 }} onClick={() => onStartCheckin && onStartCheckin(sel)}>{t("pr_startfor").replace("{name}", sel.initials)} &rarr;</button>
        </>)}
        <p className="tiny muted" style={{ marginTop: 12 }}><span className="lock">{t("pr_consent_full")}</span></p>
      </section>
    );
  }

  const days = journeyDays();
  const cal = Array.from({ length: 30 }, (_, i) => (i < days ? "s" : "p"));
  return (
    <section className="card">
      <div className="eyebrow">{t("nav_progress")}</div>
      <h2>{t("progress_title")}</h2>
      <p className="muted small">{t("progress_sub")} &middot; {t("progress_role")}: <strong>{t("role_" + role)}</strong> <span className="muted">{t("pr_changetop")}</span></p>
      <Journey t={t} days={days} cal={cal} />
      <h3>{t("pr_past")}</h3>
      {(() => {
        const hist = cacheGet("history") || [];
        if (hist.length === 0) return <p className="muted small">{t("pr_nohist")}</p>;
        const last = hist[hist.length - 1].score, prev = hist.length > 1 ? hist[hist.length - 2].score : null;
        const trend = prev == null ? t("pr_first")
          : last < prev ? t("pr_down").replace("{n}", prev - last)
          : last > prev ? t("pr_up").replace("{n}", last - prev)
          : t("pr_same");
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
        ? <div className="callout warm" style={{ marginTop: 12 }}><span className="small"><strong>{t("pr_guardian_t")}</strong> {t("pr_guardian_d")}</span></div>
        : <div className="callout" style={{ marginTop: 12 }}><span className="small"><strong>{t("pr_youwork_t")}</strong> {t("pr_youwork_d")}</span></div>}
      <p className="tiny muted" style={{ marginTop: 12 }}><span className="lock">{t("pr_consent")}</span></p>
    </section>
  );
}
