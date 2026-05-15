export type Locale =
  | "en"
  | "zh"
  | "es"
  | "de"
  | "fr"
  | "ja"
  | "ko"
  | "pt"
  | "ar"
  | "ru"
  | "id"
  | "th"
  | "vi";

export interface LocaleOption {
  code: Locale;
  label: string;
  flag: string;
  dir?: "ltr" | "rtl";
}

export const LOCALES: LocaleOption[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

export function getLocaleOption(code: Locale): LocaleOption {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

export interface TranslationStrings {
  nav: {
    generator: string;
    features: string;
    pricing: string;
    login: string;
    startFree: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    cta: string;
    ctaSecondary: string;
    statSellers: string;
    statListings: string;
    statRating: string;
  };
  workspace: {
    sectionTitle: string;
    sectionSubtitle: string;
    productDetails: string;
    productName: string;
    productNameRequired: string;
    productNamePlaceholder: string;
    keySellingPoints: string;
    keySellingPointsPlaceholder: string;
    targetAudience: string;
    tone: string;
    platform: string;
    outputLanguage: string;
    generateBtn: string;
    generatingBtn: string;
    generatedListing: string;
    copyAll: string;
    copied: string;
    emptyState: string;
    emptyStateBtn: string;
    labelTitle: string;
    labelBullets: string;
    labelDescription: string;
  };
  features: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    items: readonly { title: string; description: string }[];
  };
  footer: {
    brandDescription: string;
    product: string;
    resources: string;
    company: string;
    copyright: string;
    productLinks: readonly string[];
    resourcesLinks: readonly string[];
    companyLinks: readonly string[];
  };
  about: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    mission: { title: string; p1: string; p2: string };
    techTitle: string;
    techSubtitle: string;
    techItems: readonly { title: string; description: string }[];
    valuesTitle: string;
    values: readonly { title: string; description: string }[];
    ctaTitle: string;
    ctaDescription: string;
    ctaBtn: string;
    statSellers: string;
    statListings: string;
    statLanguages: string;
    statRating: string;
  };
  faq: {
    badge: string;
    title: string;
    subtitle: string;
    categories: {
      general: string;
      platforms: string;
      data: string;
      tips: string;
    };
    questions: Record<string, string>;
    answers: Record<string, string>;
    stillHaveQuestions: string;
    contactBtn: string;
  };
  contact: {
    badge: string;
    title: string;
    subtitle: string;
    sentTitle: string;
    sentMessage: string;
    sendAnother: string;
    emailLabel: string;
    websiteLabel: string;
    responseLabel: string;
    nameField: string;
    emailField: string;
    subjectField: string;
    messageField: string;
    sendBtn: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
  };
  options: {
    audiences: readonly { value: string; label: string }[];
    tones: readonly { value: string; label: string }[];
    platforms: readonly { value: string; label: string }[];
  };
  langSelector: {
    label: string;
  };
}

import { en } from "./en";
import { zh } from "./zh";
import { es } from "./es";
import { de } from "./de";
import { fr } from "./fr";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import { ar } from "./ar";
import { ru } from "./ru";
import { id } from "./id";
import { th } from "./th";
import { vi } from "./vi";

export const translations: Record<Locale, TranslationStrings> = {
  en, zh, es, de, fr, ja, ko, pt, ar, ru, id, th, vi,
};

export const DEFAULT_LOCALE: Locale = "en";
