import { getRelativeLocaleUrl } from "astro:i18n";
import type { Language } from "./ui";
import { normalizePath } from "./utils";

export function localePath(lang: Language, path = ""): string {
  return normalizePath(getRelativeLocaleUrl(lang, path.replace(/^\//, "")));
}
export function listingPath(
  lang: Language,
  kind: "blog" | "projects",
  page = 1,
): string {
  return localePath(lang, page === 1 ? kind : `${kind}/page/${page}`);
}
export function blogPath(lang: Language, key: string): string {
  return localePath(lang, `blog/${key}`);
}
