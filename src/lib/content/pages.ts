import { languageIds, type Language } from "../../i18n/types";
import {
  pageRouteIds,
  type PageData,
  type PageRouteId,
} from "../config/content";

export interface PageEntryLike {
  id: string;
  data: Pick<PageData, "routeId" | "lang">;
}

export type PageIndex<T extends PageEntryLike> = ReadonlyMap<
  PageRouteId,
  ReadonlyMap<Language, T>
>;

export function indexPages<T extends PageEntryLike>(
  entries: readonly T[],
): PageIndex<T> {
  const index = new Map<PageRouteId, Map<Language, T>>();

  for (const entry of entries) {
    const route = index.get(entry.data.routeId) ?? new Map<Language, T>();
    if (route.has(entry.data.lang))
      throw new Error(
        `Duplicate page translation: ${entry.data.routeId}/${entry.data.lang}`,
      );
    route.set(entry.data.lang, entry);
    index.set(entry.data.routeId, route);
  }

  for (const routeId of pageRouteIds) {
    const route = index.get(routeId);
    for (const lang of languageIds) {
      if (!route?.has(lang))
        throw new Error(`Missing page translation: ${routeId}/${lang}`);
    }
  }

  return index;
}

export function validatePages<T extends PageEntryLike>(
  entries: readonly T[],
): readonly T[] {
  indexPages(entries);
  return entries;
}

export function getPageEntry<T extends PageEntryLike>(
  entries: readonly T[],
  routeId: PageRouteId,
  lang: Language,
): T {
  const entry = indexPages(entries).get(routeId)?.get(lang);
  if (!entry) throw new Error(`Missing page translation: ${routeId}/${lang}`);
  return entry;
}
