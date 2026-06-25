import { useState, useEffect } from "react";
import { useT } from "../i18n.js";

export default function InstallBanner() {
  const t = useT();
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    try { if (window.matchMedia("(display-mode: standalone)").matches) return; } catch { /* ignore */ }
    try { if (sessionStorage.getItem("vela_install_dismissed") === "1") return; } catch { /* ignore */ }
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
    const onBIP = (e) => { e.preventDefault(); setDeferred(e); setShow(true); };
    const onInstalled = () => setShow(false);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    let t;
    if (isIOS) t = setTimeout(() => { setIos(true); setShow(true); }, 1400);
    return () => { window.removeEventListener("beforeinstallprompt", onBIP); window.removeEventListener("appinstalled", onInstalled); clearTimeout(t); };
  }, []);

  function install() { if (deferred) { deferred.prompt(); deferred.userChoice.finally(() => setShow(false)); } else setIos(true); }
  function dismiss() { setShow(false); try { sessionStorage.setItem("vela_install_dismissed", "1"); } catch { /* ignore */ } }
  if (!show) return null;

  return (
    <div className="install-banner">
      <div className="ib-mark" aria-hidden="true">⬇</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ib-title">{t("ib_title")}</div>
        <div className="ib-sub">{ios ? t("ib_sub_ios") : t("ib_sub")}</div>
      </div>
      {!ios && <button className="ib-btn" onClick={install}>{t("ib_install")}</button>}
      <button className="ib-x" onClick={dismiss} aria-label="Dismiss">×</button>
    </div>
  );
}
