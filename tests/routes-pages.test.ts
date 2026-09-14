import { describe, expect, it, vi } from "vitest";

vi.mock("astro:i18n", () => ({
  getRelativeLocaleUrl: (lang: "zh" | "en", path = "") => {
    const suffix = path ? `/${path}` : "";
    return lang === "zh" ? suffix || "/" : `/en${suffix}`;
  },
}));

import {
  navigationIds,
  routeConfig,
  type NavId,
  type RouteId,
} from "../src/config/routes";
import {
  blogPath,
  getBlogSectionFromPath,
  listingPath,
  routePath,
  searchPath,
  tagListingPath,
  tagPath,
  tagsPath,
} from "../src/i18n/routes";
import { aboutSchema } from "../src/lib/config/schema";

describe("route configuration", () => {
  it("derives route and navigation identifiers from one ordered table", () => {
    const route: RouteId = "about";
    const navigation: NavId = "blog";
    expect(routeConfig[route].segment).toBe("about");
    expect(routeConfig[navigation].navigation).toBe(true);
    expect(navigationIds).toEqual(["home", "projects", "blog", "about"]);
  });

  it("keeps public URLs stable and encodes complete tag names", () => {
    expect(routePath("zh", "home")).toBe("/");
    expect(routePath("en", "home")).toBe("/en");
    expect(routePath("zh", "about")).toBe("/about");
    expect(listingPath("zh", "blog")).toBe("/blog");
    expect(listingPath("en", "projects", 2)).toBe("/en/projects/page/2");
    expect(blogPath("zh", "stable-key")).toBe("/blog/stable-key");
    expect(searchPath("en")).toBe("/en/blog/search");
    expect(tagsPath("zh")).toBe("/blog/tags");
    expect(tagPath("zh", "C++")).toBe("/blog/tags/C%2B%2B");
    expect(tagPath("en", "网页设计")).toBe(
      "/en/blog/tags/%E7%BD%91%E9%A1%B5%E8%AE%BE%E8%AE%A1",
    );
    expect(tagListingPath("zh", "Astro", 2)).toBe(
      "/blog/tags/Astro/page/2",
    );
  });

  it("selects the matching blog sidebar section", () => {
    expect(getBlogSectionFromPath("/blog")).toBe("posts");
    expect(getBlogSectionFromPath("/blog/page/2")).toBe("posts");
    expect(getBlogSectionFromPath("/en/blog/a-post")).toBe("posts");
    expect(getBlogSectionFromPath("/blog/tags")).toBe("tags");
    expect(getBlogSectionFromPath("/en/blog/tags/C%2B%2B/page/2")).toBe(
      "tags",
    );
    expect(getBlogSectionFromPath("/en/blog/search")).toBe("search");
  });

  it.each([0, -1, 1.5])("rejects invalid pagination page %s", (page) => {
    expect(() => listingPath("zh", "blog", page)).toThrow("positive integer");
    expect(() => tagListingPath("zh", "Astro", page)).toThrow(
      "positive integer",
    );
  });
});

describe("about configuration", () => {
  const localized = {
    title: "About",
    description: "A short introduction",
    sections: [
      { id: "introduction", title: "Introduction", paragraphs: ["Hello"] },
    ],
  };

  it("requires complete Chinese and English content", () => {
    expect(aboutSchema.parse({ zh: localized, en: localized }).zh.title).toBe(
      "About",
    );
    expect(aboutSchema.safeParse({ zh: localized }).success).toBe(false);
  });

  it("rejects duplicate, invalid, and empty sections", () => {
    const duplicate = {
      ...localized,
      sections: [...localized.sections, localized.sections[0]],
    };
    expect(aboutSchema.safeParse({ zh: duplicate, en: localized }).success).toBe(
      false,
    );
    expect(
      aboutSchema.safeParse({
        zh: { ...localized, sections: [{ ...localized.sections[0], id: "Bad ID" }] },
        en: localized,
      }).success,
    ).toBe(false);
    expect(
      aboutSchema.safeParse({
        zh: {
          ...localized,
          sections: [{ ...localized.sections[0], paragraphs: [] }],
        },
        en: localized,
      }).success,
    ).toBe(false);
  });
});
