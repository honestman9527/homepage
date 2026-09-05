import {
  defaultLanguage,
  languagePrefixes,
  languages,
  ui,
  type Language,
  type TranslationKey,
} from "@/i18n/ui";

/**
 * Extracts the language from a URL under the scheme:
 * Chinese at `/...` (no prefix), English at `/en/...`.
 */
export function getLangFromUrl(url: URL): Language {
  const [, firstSegment] = url.pathname.split("/");
  if (firstSegment in languages && firstSegment !== defaultLanguage) {
    return firstSegment as Language;
  }
  return defaultLanguage;
}

/**
 * Returns a `t()` function bound to the given language. Falls back to the
 * default language for keys that are missing in the target locale.
 */
export function useTranslations(lang: Language) {
  return function translate(key: TranslationKey): string {
    return ui[lang][key] ?? ui[defaultLanguage][key] ?? key;
  };
}

/**
 * Maps an unprefixed path (e.g. `/blog`) to the given language's prefix,
 * e.g. `/blog` -> `/en/blog` for English, unchanged for Chinese.
 */
export function translatePath(lang: Language, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${languagePrefixes[lang]}${normalizedPath}`.replace(/\/+$/, "") || "/";
}

/**
 * Builds the same page in the other language, preserving any path suffix
 * (e.g. blog post ids). Used by the language switcher.
 */
export function alternatePath(lang: Language, currentPath: string): string {
  const otherPrefix = languagePrefixes[lang];
  const strippedPath = currentPath.replace(
    new RegExp(`^${languagePrefixes.en}(?=\/)`),
    "",
  );
  return `${otherPrefix}${strippedPath}` || "/";
}
