import type { Language } from "../i18n";

export function formatAmount(amount: number, language: Language = "en"): string {
  return new Intl.NumberFormat(language === "es" ? "es-CO" : "en-US", { maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(value: string, language: Language = "en"): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? (language === "es" ? "No disponible" : "Unavailable") : new Intl.DateTimeFormat(language === "es" ? "es-CO" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
