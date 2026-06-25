import { useState } from "react";
import { useT } from "../i18n.js";
import { CRISIS_LINES } from "../aria/referrals.js";
import { useIdentity } from "../identity.js";

const clean = (p) => String(p || "").replace(/[^0-9+]/g, "");

export default function SosButton() {
  const t = useT();
  const { trustedName, trustedPhone, setTrusted, clearTrusted } = useIdentity();
  const [open, setOpen] = useState(false);
  const [tName, setTName] = useState("");
  const [tPhone, setTPhone] = useState("");
  const lines = [...CRISIS_LINES, { organisation: "SAMU (medical emergency)", contact: "114" }];
  const msg = encodeURIComponent("I need help right now. Please contact me.");

  return (
    <>
      <button className="sos-fab" onClick={() => setOpen(true)} aria-label="SOS - get help">{t("sos")}</button>
      {open && (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("sos_title")}</h2>
            <p className="muted small">{t("sos_help")}</p>

            {lines.map((l) => (
              <div className="sos-line" key={l.organisation}>
                <div><strong>{l.organisation}</strong><div className="muted small">{l.contact}</div></div>
                <a href={`tel:${clean(l.contact)}`}><button className="call-btn">{t("sos_call")}</button></a>
              </div>
            ))}

            <h3>{t("sos_trusted")}</h3>
            {trustedPhone ? (
              <>
                <div className="sos-line">
                  <div><strong>{trustedName || t("sos_trusted")}</strong><div className="muted small">{trustedPhone}</div></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href={`sms:${clean(trustedPhone)}?body=${msg}`}><button className="call-btn" style={{ background: "var(--primary)" }}>{t("sos_text")}</button></a>
                    <a href={`tel:${clean(trustedPhone)}`}><button className="call-btn">Call</button></a>
                  </div>
                </div>
                <p className="tiny muted" style={{ textAlign: "right" }}><span onClick={clearTrusted} style={{ cursor: "pointer", textDecoration: "underline" }}>{t("sos_change")}</span></p>
              </>
            ) : (
              <div className="callout">
                <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>{t("sos_add_trusted")}</div>
                <div className="grid2">
                  <input value={tName} onChange={(e) => setTName(e.target.value)} placeholder={t("sos_name_ph")} />
                  <input value={tPhone} onChange={(e) => setTPhone(e.target.value)} inputMode="tel" placeholder={t("sos_phone_ph")} />
                </div>
                <button className="btn full" style={{ marginTop: 8 }} disabled={!tPhone.trim()} onClick={() => setTrusted(tName.trim(), tPhone.trim())}>{t("sos_save_trusted")}</button>
                <p className="tiny muted" style={{ marginTop: 4 }}>{t("sos_trusted_note")}</p>
              </div>
            )}

            <p className="tiny muted" style={{ textAlign: "center", marginTop: 12 }}>{t("sos_stay")}</p>
            <button className="btn soft full" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>{t("sos_close")}</button>
          </div>
        </div>
      )}
    </>
  );
}
