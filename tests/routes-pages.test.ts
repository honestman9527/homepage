import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("astro:i18n", () => ({
  getRelativeLocaleUrl: (lang: "zh" | "en", path = "") => {
    const suffix = path ? `/${path}` : "";
    return lang === "zh" ? suffix || "/" : `/en${suffix}`;
  },
}));

import {
  navigationOrder,
  routeConfig,
  type NavId,
  type RouteId,
} from "../src/config/routes";
import {
  blogPath,
  listingPath,
  routePath,
} from "../src/i18n/routes";
import { pageSchema } from "../src/lib/config/schema";
import {
  getPageEntry,
  indexPages,
  validatePages,
  type PageEntryLike,
} from "../src/lib/content/pages";

const image = () => z.never();

describe("route configuration", () => {
  it("derives route and navigation identifiers from one ordered table", () => {
    const route: RouteId = "about";
    const navigation: NavId = "blog";
    expect(routeConfig[route].segment).toBe("about");
    expect(routeConfig[navigation].navigation).toBe(true);
    expect(navigationOrder).toEqual(["home", "projects", "blog", "about"]);
  });

  it("keeps every public localized URL stable", () => {
    expect(routePath("zh", "home")).toBe("/");
    expect(routePath("en", "home")).toBe("/en");
    expect(routePath("zh", "about")).toBe("/about");
    expect(routePath("en", "about")).toBe("/en/about");
    expect(listingPath("zh", "blog")).toBe("/blog");
    expect(listingPath("en", "projects", 2)).toBe("/en/projects/page/2");
    expect(blogPath("zh", "stable-key")).toBe("/blog/stable-key");
    expect(blogPath("en", "stable-key")).toBe("/en/blog/stable-key");
  });

  it.each([0, -1, 1.5])("rejects invalid listing page %s", (page) => {
    expect(() => listingPath("zh", "blog", page)).toThrow(
      "positive integer",
    );
  });
});

describe("page content model", () => {
  const page = {
    routeId: "about",
    lang: "zh",
    title: "关于",
    description: "关于页面",
  } as const;

  it("applies TOC defaults and accepts an explicit HTTPS cover", () => {
    expect(pageSchema(image).parse(page).toc).toBe(true);
    expect(
      pageSchema(image).parse({
        ...page,
        cover: {
          type: "image",
          src: "https://cdn.example.com/about.webp",
          alt: "About",
        },
      }).cover,
    ).toEqual({
      type: "image",
      src: "https://cdn.example.com/about.webp",
      alt: "About",
    });
  });

  it.each([
    { ...page, routeId: "home" },
    { ...page, lang: "fr" },
    { ...page, title: " " },
    { ...page, unknown: true },
    {
      ...page,
      cover: {
        type: "image",
        src: "http://cdn.example.com/about.webp",
        alt: "About",
      },
    },
  ])("rejects invalid page frontmatter", (frontmatter) => {
    expect(pageSchema(image).safeParse(frontmatter).success).toBe(false);
  });

  it("indexes exactly one entry for every route and language", () => {
    const entries = [
      { id: "about.zh", data: { routeId: "about", lang: "zh" } },
      { id: "about.en", data: { routeId: "about", lang: "en" } },
    ] as const satisfies readonly PageEntryLike[];

    expect(validatePages(entries)).toBe(entries);
    expect(indexPages(entries).get("about")?.get("zh")?.id).toBe("about.zh");
    expect(getPageEntry(entries, "about", "en")).toBe(entries[1]);
  });

  it("rejects missing and duplicate localized pages", () => {
    expect(() =>
      validatePages([
        { id: "about.zh", data: { routeId: "about", lang: "zh" } },
      ]),
    ).toThrow("Missing page translation: about/en");

    expect(() =>
      validatePages([
        { id: "about.zh", data: { routeId: "about", lang: "zh" } },
        { id: "about-copy.zh", data: { routeId: "about", lang: "zh" } },
        { id: "about.en", data: { routeId: "about", lang: "en" } },
      ]),
    ).toThrow("Duplicate page translation: about/zh");
  });
});
