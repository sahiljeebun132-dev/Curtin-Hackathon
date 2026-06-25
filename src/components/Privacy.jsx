import { useT } from "../i18n.js";
import { cacheClearAll } from "../secure.js";

function clearAll() {
  cacheClearAll();
  try { location.reload(); } catch { /* ignore */ }
}

export default function Privacy() {
  const t = useT();
  return (
    <section className="card">
      <div className="eyebrow">{t("nav_privacy")}</div>
      <h2>{t("privacy_title")}</h2>
      <p className="muted small">{t("privacy_sub")}</p>

      <h3>{t("pv_today_h")}</h3>
      <p className="small">{t("pv_today_p")}</p>

      <h3>{t("pv_deploy_h")}</h3>
      <div className="callout"><span className="small"><strong>{t("pv_consent_t")}</strong> {t("pv_consent_d")}</span></div>
      <div className="callout"><span className="small"><strong>{t("pv_enc_t")}</strong> {t("pv_enc_d")}</span></div>
      <div className="callout"><span className="small"><strong>{t("pv_priv_t")}</strong> {t("pv_priv_d")}</span></div>
      <div className="callout"><span className="small"><strong>{t("pv_min_t")}</strong> {t("pv_min_d")}</span></div>
      <div className="callout"><span className="small"><strong>{t("pv_comp_t")}</strong> {t("pv_comp_d")}</span></div>

      <h3>{t("pv_id_h")}</h3>
      <div className="callout"><span className="small"><strong>{t("pv_pseudo_t")}</strong> {t("pv_pseudo_d")}</span></div>
      <div className="callout"><span className="small"><strong>{t("pv_oneway_t")}</strong> {t("pv_oneway_d")}</span></div>
      <div className="callout"><span className="small"><strong>{t("pv_staff_t")}</strong> {t("pv_staff_d")}</span></div>
      <div className="callout"><span className="small"><strong>{t("pv_agg_t")}</strong> {t("pv_agg_d")}</span></div>

      <h3>{t("pv_why_h")}</h3>
      <p className="small muted">{t("pv_why_p")}</p>
      <div className="divider" />
      <h3>{t("pv_control_h")}</h3>
      <p className="small muted">{t("pv_control_p")}</p>
      <button className="btn ghost full" onClick={clearAll}>{t("pv_delete")}</button>
    </section>
  );
}
