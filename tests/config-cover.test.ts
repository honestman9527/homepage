import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  blogSchema,
  coverSchema,
  projectSchema,
  siteSchema,
  topographicSchema,
  type Cover,
} from "../src/lib/config/schema";
import { resolveCover, contourPaths } from "../src/lib/content/cover";
// Asset loading is tested by the Astro fixture build; these tests isolate config semantics.
const image = () => z.never();
const options = topographicSchema.parse({});

describe("cover configuration", () => {
  it("honors all precedence levels and explicit none", () => {
    const article: Cover = {
      type: "image",
      src: "https://example.com/post.png",
      alt: "Post",
    };
    const original: Cover = {
      type: "image",
      src: "https://example.com/original.png",
      alt: "Original",
    };
    const collection: Cover = { type: "topographic", palette: "teal" };
    const global: Cover = { type: "topographic", palette: "neutral" };
    expect(resolveCover(article, original, collection, global)).toBe(article);
    expect(resolveCover(undefined, original, collection, global)).toBe(
      original,
    );
    expect(resolveCover(undefined, undefined, collection, global)).toBe(
      collection,
    );
    expect(resolveCover(undefined, undefined, undefined, global)).toBe(global);
    expect(resolveCover({ type: "none" }, article)).toEqual({ type: "none" });
    expect(resolveCover()).toEqual({ type: "topographic" });
  });
  it("generates stable finite contours, with independent content identities", () => {
    const first = contourPaths("article", options);
    expect(first).toEqual(contourPaths("article", options));
    expect(first).not.toEqual(contourPaths("another", options));
    expect(first).toHaveLength(12);
    expect(first.join("")).not.toMatch(/NaN|Infinity/);
    expect(contourPaths("article", { ...options, seed: "other" })).not.toEqual(
      first,
    );
  });
  it("leaves omitted per-cover settings available for site defaults", () => {
    expect(coverSchema(image).parse({ type: "topographic" })).toEqual({
      type: "topographic",
    });
    expect(
      coverSchema(image).parse({ type: "topographic", palette: "teal" }),
    ).toEqual({ type: "topographic", palette: "teal" });
  });
  it("validates discriminated cover properties and HTTPS", () => {
    const schema = coverSchema(image);
    expect(
      schema.parse({ type: "image", src: "https://example.com/a.png", alt: "" })
        .type,
    ).toBe("image");
    for (const value of [
      { type: "image", src: "http://example.com/a.png", alt: "" },
      { type: "topographic", density: 100 },
      { type: "none", src: "x" },
      { type: "topographic", palette: "red" },
    ])
      expect(schema.safeParse(value).success).toBe(false);
  });
});

describe("strict content schemas", () => {
  const blog = {
    title: "Title",
    description: "Description",
    lang: "en",
    translationKey: "article",
    isOriginal: true,
    pubDate: "2026-01-01",
  };
  it("rejects misspelled cover fields, empty content and invalid dates", () => {
    expect(blogSchema(image).parse(blog).pubDate).toBeInstanceOf(Date);
    for (const value of [
      { ...blog, corver: {} },
      { ...blog, title: " " },
      { ...blog, pubDate: "not a date" },
      { ...blog, translationKey: "../escape" },
    ])
      expect(blogSchema(image).safeParse(value).success).toBe(false);
  });
  it("requires the project's original translation and valid links", () => {
    const project = {
      id: "demo",
      originalLang: "en",
      translations: { en: { title: "Demo", description: "Demo" } },
      href: "https://example.com",
      year: 2026,
    };
    expect(projectSchema(image).parse(project).featured).toBe(false);
    expect(
      projectSchema(image).safeParse({ ...project, originalLang: "zh" })
        .success,
    ).toBe(false);
    expect(
      projectSchema(image).safeParse({
        ...project,
        href: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it("provides defaults and validates nested site settings", () => {
    const profile = {
      bio: "Bio",
      location: "Remote",
      availability: "Available",
      about: ["About"],
    };
    const site = {
      name: "Name",
      initials: "N",
      avatar: "https://example.com/avatar.png",
      email: "me@example.com",
      social: [],
      profile: { zh: profile, en: profile },
      skills: [],
    };
    expect(siteSchema(image).parse(site).listing.blog.pageSize).toBe(6);
    expect(siteSchema(image).parse(site).avatar).toBe(
      "https://example.com/avatar.png",
    );
    expect(siteSchema(image).safeParse({ ...site, email: "bad" }).success).toBe(
      false,
    );
    expect(
      siteSchema(image).safeParse({ ...site, avatar: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      siteSchema(image).safeParse({
        ...site,
        listing: { blog: { pageSize: 0 } },
      }).success,
    ).toBe(false);
  });
});
