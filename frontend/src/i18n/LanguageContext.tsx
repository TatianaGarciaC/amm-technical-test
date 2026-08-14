/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 * Mantiene el idioma en memoria y expone traducciones tipadas con interpolación simple.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { translations, type TranslationKey } from "./translations";

export type Language = "es" | "en";
type Variables = Record<string, string | number>;
interface LanguageValue { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey, variables?: Variables) => string; }

const fallback: LanguageValue = { language: "en", setLanguage: () => undefined, t: (key, variables) => interpolate(translations.en[key], variables) };
const LanguageContext = createContext<LanguageValue>(fallback);

export function LanguageProvider({ children, initialLanguage = "es" }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const value = useMemo<LanguageValue>(() => ({ language, setLanguage, t: (key, variables) => interpolate(translations[language][key], variables) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue { return useContext(LanguageContext); }

function interpolate(template: string, variables?: Variables): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(variables?.[key] ?? `{${key}}`));
}
