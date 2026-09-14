export const languageIds = ["zh", "en"] as const;
export type Language = (typeof languageIds)[number];

export const languages: Record<Language, string> = {
  zh: "中文",
  en: "English",
};

export const defaultLanguage: Language = "zh";

export interface LanguageLink {
  href?: string;
  label: string;
  lang: Language;
}
