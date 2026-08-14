import { Link } from "react-router-dom";
import { useLanguage } from "../i18n";

export function NotFoundPage() {
  const { t } = useLanguage();
  return <div className="empty-state"><p className="eyebrow">404</p><h1>{t("notFoundTitle")}</h1><p>{t("notFoundDescription")}</p><Link className="button button-primary" to="/">{t("goDashboard")}</Link></div>;
}
