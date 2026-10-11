import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { getEntry } from "astro:content";
import { albumsSchema } from "../src/lib/config/albums";
import { albumPath, navigationIds } from "../src/config/routes";
import { getAlbumItems, getAlbumPaths, selectAlbums } from "../src/lib/content/albums";

vi.mock("astro:content", () => ({ getEntry: vi.fn() }));
const schema = albumsSchema(() => z.never());
const photo = { id: "river", src: "https://example.com/river.jpg", alt: "河流" };
const album = { id: "walk", title: "散步", coverPhotoId: "river", photos: [photo] };
const parse = (items: unknown[]) => schema.parse({ albums: { items } }).albums.items;

describe("album configuration", () => {
  it("accepts empty collections, defaults and basic photo metadata without dimensions", () => {
    expect(parse([])).toEqual([]);
    expect(parse([album])[0].draft).toBe(false);
    expect(parse([{ id: "preparing", title: "准备中", draft: true }])[0].photos).toEqual([]);
    expect(parse([{ ...album, photos: [{ ...photo, caption: "说明", takenAt: "2024-02-29", location: "杭州", thumbnail: "https://example.com/small.webp" }] }])[0].photos[0].takenAt).toBe("2024-02-29");
  });

  it.each([
    { ...album, id: "Bad-ID" },
    { ...album, id: undefined },
    { ...album, title: " " },
    { ...album, photos: [] },
    { ...album, coverPhotoId: undefined },
    { ...album, coverPhotoId: "missing" },
    { ...album, draft: true, coverPhotoId: "missing" },
    { ...album, photos: [photo, photo] },
    { ...album, hidden: true },
    ...[
      { id: undefined }, { id: "../bad" }, { alt: " " }, { takenAt: "2026-02-30" },
      { takenAt: "2026-10-11T12:00:00Z" }, { width: 1200 },
      { src: "http://example.com/a.jpg" }, { src: "//example.com/a.jpg" },
      { src: "data:image/png;base64,abc" }, { src: "javascript:alert(1)" },
      { thumbnail: "http://example.com/small.jpg" },
    ].map((fields) => ({ ...album, photos: [{ ...photo, ...fields }] })),
  ])("rejects invalid configuration %#", (invalid) => {
    expect(() => parse([invalid])).toThrow();
  });

  it("rejects unknown root fields, missing roots and duplicate album IDs including drafts", () => {
    expect(schema.safeParse({ albums: { items: [] }, extra: {} }).success).toBe(false);
    expect(schema.safeParse({ albums: { items: [], typo: true } }).success).toBe(false);
    expect(schema.safeParse({ items: [] }).success).toBe(false);
    expect(() => parse([album, { ...album, draft: true }])).toThrow("相册 ID 重复");
  });
});

describe("published albums", () => {
  it("retains album/photo order and explicit covers while excluding drafts", async () => {
    const items = parse([
      { ...album, id: "second", photos: [{ ...photo, id: "first" }, photo] },
      { ...album, id: "draft", draft: true },
      { ...album, id: "first" },
    ]);
    const published = selectAlbums(items);
    expect(published.map((item) => item.id)).toEqual(["second", "first"]);
    expect(published[0].photos.map((item) => item.id)).toEqual(["first", "river"]);
    expect(published[0].cover.id).toBe("river");
    expect(items).toHaveLength(3);
    vi.mocked(getEntry).mockResolvedValue({ id: "albums", collection: "albums", data: { albums: { items } } });
    expect((await getAlbumPaths()).map((item) => item.params.id)).toEqual(["second", "first"]);
    expect(albumPath("second")).toBe("/albums/second");
    expect(navigationIds).toContain("albums");
  });

  it("fails when the required collection entry is absent", async () => {
    vi.mocked(getEntry).mockResolvedValue(undefined);
    await expect(getAlbumItems()).rejects.toThrow("albums.yaml");
  });
});
