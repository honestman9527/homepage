import { defaultLanguage, ui, type Language, type TranslationKey } from "./ui";

export function normalizePath(path: string): string {
  return `/${path}`.replace(/\/+/g, "/").replace(/\/+$/, "") || "/";
}
export function getLangFromUrl(url: URL): Language {
  return url.pathname.split("/")[1] === "en" ? "en" : defaultLanguage;
}
export function getTranslations(lang: Language) {
  return (
    key: TranslationKey,
    values: Record<string, string | number> = {},
  ): string =>
    ui[lang][key].replace(/\{(\w+)\}/g, (placeholder, name) =>
      String(values[name] ?? placeholder),
    );
}
export function formatDate(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
export function otherLanguage(lang: Language): Language {
  return lang === "zh" ? "en" : "zh";
}
