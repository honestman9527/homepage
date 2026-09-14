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

export type ListingRouteId = Extract<RouteId, "blog" | "projects">;

export const navigationOrder = Object.keys(routeConfig).filter(
  (id): id is NavId => routeConfig[id as RouteId].navigation,
);
