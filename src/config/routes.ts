export const routeConfig = {
  home: { segment: "", navigation: true },
  projects: { segment: "projects", navigation: true },
  blog: { segment: "blog", navigation: true },
  about: { segment: "about", navigation: true },
} as const satisfies Record<
  string,
  { segment: string; navigation: boolean }
>;

export type RouteId = keyof typeof routeConfig;

export type NavId = {
  [Id in RouteId]: (typeof routeConfig)[Id]["navigation"] extends true
    ? Id
    : never;
}[RouteId];

export const navigationIds = [
  "home",
  "projects",
  "blog",
  "about",
] as const satisfies readonly NavId[];

export type ListingRouteId = Extract<RouteId, "blog" | "projects">;

export function normalizePath(path: string): string {
  return `/${path}`.replace(/\/+/g, "/").replace(/\/+$/, "") || "/";
}

export type BlogSectionId = "posts" | "tags" | "search";

export function getBlogSectionFromPath(pathname: string): BlogSectionId {
  const path = normalizePath(pathname);
  if (path === "/blog/search") return "search";
  if (path === "/blog/tags" || path.startsWith("/blog/tags/")) return "tags";
  return "posts";
}

export function routePath(routeId: RouteId): string {
  return normalizePath(routeConfig[routeId].segment);
}

export function listingPath(
  kind: ListingRouteId,
  page = 1,
): string {
  if (!Number.isInteger(page) || page < 1)
    throw new RangeError("Listing page must be a positive integer");
  const segment = routeConfig[kind].segment;
  return normalizePath(page === 1 ? segment : `${segment}/page/${page}`);
}

export function blogPath(key: string): string {
  return normalizePath(`${routeConfig.blog.segment}/${key}`);
}

export function searchPath(): string {
  return normalizePath(`${routeConfig.blog.segment}/search`);
}

export function tagsPath(): string {
  return normalizePath(`${routeConfig.blog.segment}/tags`);
}

export function tagPath(tag: string): string {
  return normalizePath(
    `${routeConfig.blog.segment}/tags/${encodeURIComponent(tag)}`,
  );
}

export function tagListingPath(
  tag: string,
  page = 1,
): string {
  if (!Number.isInteger(page) || page < 1)
    throw new RangeError("Tag page must be a positive integer");
  return page === 1 ? tagPath(tag) : `${tagPath(tag)}/page/${page}`;
}
