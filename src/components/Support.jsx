import { useEffect, useRef } from "react";
import { useT } from "../i18n.js";
import { SUPPORT_GROUPS } from "../data/supportGroups.js";
import { AWARENESS_ZONES, SERVICE_POINTS } from "../data/zones.js";

export default function Support() {
  const t = useT();
  const mapRef = useRef(null);
  const elRef = useRef(null);
  const maxCount = Math.max(...AWARENESS_ZONES.map((z) => z.count));

  useEffect(() => {
    const L = window.L;
    if (!L || !elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([-20.22, 57.52], 10);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap", maxZoom: 18 }).addTo(map);
    const color = (lvl) => (lvl === "high" ? "#d83a3a" : "#c98510");
    AWARENESS_ZONES.forEach((z) => {
      const r = 8 + (z.count / maxCount) * 16; // size by anonymous aggregate count
      L.circleMarker([z.lat, z.lng], { radius: r, color: color(z.level), fillColor: color(z.level), fillOpacity: 0.35, weight: 2 })
        .addTo(map).bindPopup(`<b>${z.name}</b><br/>${z.count} check-ins · ${z.high} higher-risk<br/><i>anonymous totals</i>`);
    });
    SERVICE_POINTS.forEach((s) => {
      L.circleMarker([s.lat, s.lng], { radius: 9, color: "#0e9488", fillColor: "#0e9488", fillOpacity: 0.8, weight: 2 }).addTo(map).bindPopup(`<b>${s.name}</b><br/>Support service`);
    });
    setTimeout(() => map.invalidateSize(), 200);
  }, [maxCount]);

  const zones = [...AWARENESS_ZONES].sort((a, b) => b.count - a.count);

  return (
    <section className="card">
      <div className="eyebrow">{t("nav_support")}</div>
      <h2>{t("support_title")}</h2>
      <p className="muted small">{t("support_sub")}</p>

      <h3>{t("support_map")}</h3>
      <div id="map" ref={elRef} />
      <div className="legend">
        <span><i style={{ background: "#d83a3a" }} /> Higher-risk zone</span>
        <span><i style={{ background: "#c98510" }} /> Watch zone</span>
        <span><i style={{ background: "#0e9488" }} /> Support service</span>
      </div>
      <p className="tiny muted" style={{ marginTop: 8 }}>{t("support_map_note")} Marker size = number of check-ins (anonymous totals, never individuals).</p>

      <h3>Area insights (anonymous)</h3>
      {zones.map((z) => (
        <div key={z.name} className="insight-row">
          <span className="insight-name">{z.name}</span>
          <div className="insight-bar"><div className="insight-fill" style={{ width: (z.count / maxCount) * 100 + "%", background: z.level === "high" ? "#d83a3a" : "#c98510" }} /></div>
          <span className="insight-val">{z.count} <span className="muted">({z.high} high)</span></span>
        </div>
      ))}

      <h3>{t("support_groups")}</h3>
      {SUPPORT_GROUPS.map((g) => (
        <div className="group-item" key={g.name}>
          <div className="g-top">
            <span className="g-name">{g.name} {g.verified ? <span className="badge-v">verified</span> : <span className="badge-u">confirm</span>}</span>
            <span className="g-contact">{g.contact}</span>
          </div>
          <div className="muted small">{g.type} - {g.note}</div>
        </div>
      ))}
    </section>
  );
}
