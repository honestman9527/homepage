import { describe, expect, it } from "vitest";

import {
  navigationIds,
  routeConfig,
  type NavId,
  type RouteId,
} from "../src/config/routes";
import {
  normalizePath,
  blogPath,
  getBlogSectionFromPath,
  listingPath,
  routePath,
  searchPath,
  tagListingPath,
  tagPath,
  tagsPath,
} from "../src/config/routes";
import { aboutSchema } from "../src/lib/config/schema";

describe("route configuration", () => {
  it("derives route and navigation identifiers from one ordered table", () => {
    const route: RouteId = "about";
    const navigation: NavId = "blog";
    expect(routeConfig[route].segment).toBe("about");
    expect(routeConfig[navigation].navigation).toBe(true);
    expect(navigationIds).toEqual(["home", "projects", "blog", "albums", "about"]);
  });

  it("keeps public URLs stable and encodes complete tag names", () => {
    expect(normalizePath("//blog///")).toBe("/blog");
    expect(routePath("home")).toBe("/");
    expect(routePath("about")).toBe("/about");
    expect(listingPath("blog")).toBe("/blog");
    expect(listingPath("projects", 2)).toBe("/projects/page/2");
    expect(blogPath("stable-key")).toBe("/blog/stable-key");
    expect(searchPath()).toBe("/blog/search");
    expect(tagsPath()).toBe("/blog/tags");
    expect(tagPath("C++")).toBe("/blog/tags/C%2B%2B");
    expect(tagPath("网页设计")).toBe(
      "/blog/tags/%E7%BD%91%E9%A1%B5%E8%AE%BE%E8%AE%A1",
    );
    expect(tagListingPath("Astro", 2)).toBe(
      "/blog/tags/Astro/page/2",
    );
  });

  it("selects the matching blog sidebar section", () => {
    expect(getBlogSectionFromPath("/blog")).toBe("posts");
    expect(getBlogSectionFromPath("/blog/page/2")).toBe("posts");
    expect(getBlogSectionFromPath("/blog/a-post")).toBe("posts");
    expect(getBlogSectionFromPath("/blog/tags")).toBe("tags");
    expect(getBlogSectionFromPath("/blog/tags/C%2B%2B/page/2")).toBe(
      "tags",
    );
    expect(getBlogSectionFromPath("/blog/search")).toBe("search");
  });

  it.each([0, -1, 1.5])("rejects invalid pagination page %s", (page) => {
    expect(() => listingPath("blog", page)).toThrow("positive integer");
    expect(() => tagListingPath("Astro", page)).toThrow(
      "positive integer",
    );
  });
});

describe("about configuration", () => {
  const about = {
    title: "关于",
    description: "简单介绍",
    sections: [
      { id: "introduction", title: "自我介绍", paragraphs: ["你好"] },
    ],
  };

  it("accepts Chinese content without language wrappers", () => {
    expect(aboutSchema.parse(about).title).toBe("关于");
    expect(aboutSchema.safeParse({ ...about, zh: about }).success).toBe(false);
    expect(aboutSchema.safeParse({ ...about, en: about }).success).toBe(false);
  });

  it("rejects duplicate, invalid, and empty sections", () => {
    const duplicate = {
      ...about,
      sections: [...about.sections, about.sections[0]],
    };
    expect(aboutSchema.safeParse(duplicate).success).toBe(false);
    expect(
      aboutSchema.safeParse({
        ...about,
        sections: [{ ...about.sections[0], id: "Bad ID" }],
      }).success,
    ).toBe(false);
    expect(
      aboutSchema.safeParse({
        ...about,
        sections: [{ ...about.sections[0], paragraphs: [] }],
      }).success,
    ).toBe(false);
  });
});
