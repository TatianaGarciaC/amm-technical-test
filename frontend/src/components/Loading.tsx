import { useLanguage } from "../i18n";

export function Loading({ label }: { label?: string }) {
  const { t } = useLanguage();
  return <div className="loading" role="status"><span className="spinner" />{label ?? t("loading")}</div>;
}
