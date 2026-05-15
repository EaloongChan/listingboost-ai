"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type Locale,
  type TranslationStrings,
  translations,
  DEFAULT_LOCALE,
  getLocaleOption,
} from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationStrings;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Load saved locale from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("listingboost-locale");
      if (saved && saved in translations) {
        setLocaleState(saved as Locale);
      }
    } catch {
      // SSR or restricted env — ignore
    }
  }, []);

  // Persist locale to localStorage
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("listingboost-locale", newLocale);
    } catch {
      // Ignore write errors
    }
  }, []);

  const t = translations[locale];
  const dir = getLocaleOption(locale).dir ?? "ltr";

  // Update <html> dir and lang attributes after hydration
  useEffect(() => {
    // Use requestAnimationFrame to ensure we're past hydration
    const rafId = requestAnimationFrame(() => {
      const html = document.documentElement;
      if (html.getAttribute("dir") !== dir) {
        html.setAttribute("dir", dir);
      }
      if (html.getAttribute("lang") !== locale) {
        html.setAttribute("lang", locale);
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [locale, dir]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
