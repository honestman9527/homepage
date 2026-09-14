import { getRelativeLocaleUrl } from "astro:i18n";
import {
  routeConfig,
  type ListingRouteId,
  type RouteId,
} from "../config/routes";
import type { Language } from "./types";
import { normalizePath } from "./utils";

export function localePath(lang: Language, path = ""): string {
  return normalizePath(getRelativeLocaleUrl(lang, path.replace(/^\//, "")));
}

export function routePath(lang: Language, routeId: RouteId): string {
  return localePath(lang, routeConfig[routeId].segment);
}

export function listingPath(
  lang: Language,
  kind: ListingRouteId,
  page = 1,
): string {
  if (!Number.isInteger(page) || page < 1)
    throw new RangeError("Listing page must be a positive integer");
  const segment = routeConfig[kind].segment;
  return localePath(lang, page === 1 ? segment : `${segment}/page/${page}`);
}

export function blogPath(lang: Language, key: string): string {
  return localePath(lang, `${routeConfig.blog.segment}/${key}`);
}
