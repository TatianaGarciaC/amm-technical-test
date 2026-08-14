import { NavLink, Outlet } from "react-router-dom";
import { useLanguage } from "../i18n";
import { Languages } from "lucide-react";

export function Layout() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <NavLink to="/" className="brand" aria-label={t("homeLabel")}>
            <span className="brand-mark">PF</span>
            <span><strong>PurchaseFlow</strong><small>{t("brandSubtitle")}</small></span>
          </NavLink>
          <div className="header-actions"><nav aria-label={t("navPrimary")}>
            <NavLink to="/" end>{t("dashboardNav")}</NavLink><NavLink to="/requests/new">{t("newRequestNav")}</NavLink><NavLink to="/mock-mail">{t("mailboxNav")}</NavLink>
          </nav><div className="language-switcher" role="group" aria-label={t("languageSelector")}><Languages aria-hidden="true" />
            <button type="button" className={language === "es" ? "active" : ""} aria-pressed={language === "es"} aria-label={t("spanish")} onClick={() => setLanguage("es")}>ES</button><span aria-hidden="true">|</span><button type="button" className={language === "en" ? "active" : ""} aria-pressed={language === "en"} aria-label={t("english")} onClick={() => setLanguage("en")}>EN</button>
          </div></div>
        </div>
      </header>
      <main className="page-container"><Outlet /></main>
    </div>
  );
}
