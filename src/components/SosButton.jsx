import { useState } from "react";
import { useT } from "../i18n.js";
import { CRISIS_LINES } from "../aria/referrals.js";

export default function SosButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [notified, setNotified] = useState(false);
  const lines = [...CRISIS_LINES, { organisation: "SAMU (medical emergency)", contact: "114" }];

  return (
    <>
      <button className="sos-fab" onClick={() => setOpen(true)} aria-label="SOS">{t("sos")}</button>
      {open && (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("sos_title")}</h2>
            <p className="muted small">{t("sos_help")}</p>
            {lines.map((l) => (
              <div className="sos-line" key={l.organisation}>
                <div><strong>{l.organisation}</strong><div className="muted small">{l.contact}</div></div>
                <a href={`tel:${String(l.contact).replace(/[^0-9]/g, "")}`}><button className="call-btn">{t("sos_call")}</button></a>
              </div>
            ))}
            {notified ? (
              <div className="callout" style={{ marginTop: 12 }}><span className="small">{t("sos_notified")}</span></div>
            ) : (
              <button className="btn full" style={{ marginTop: 12 }} onClick={() => setNotified(true)}>{t("sos_notify")}</button>
            )}
            <p className="tiny muted" style={{ textAlign: "center", marginTop: 12 }}>{t("sos_stay")}</p>
            <button className="btn soft full" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
