import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { expect, it, vi } from "vitest";
import { albumsSchema } from "../src/lib/config/albums";
import { albumsLoader } from "../src/lib/config/albums-loader.mjs";

const astroRequire = createRequire(import.meta.resolve("astro/package.json"));
const { load } = astroRequire("js-yaml");
const { getEntryData } = await import(pathToFileURL(join(dirname(astroRequire.resolve("astro/package.json")), "dist/content/utils.js")).href);
const source = (src) => ({ albums: { items: [{ id: "walk", title: "散步", coverPhotoId: "river", photos: [{ id: "river", src, alt: "河流" }] }] } });
const validate = (data, filePath, plugin) => getEntryData({
  id: "albums", collection: "albums", unvalidatedData: data, _internal: { filePath },
}, { type: "content_layer", schema: ({ image }) => albumsSchema(image) }, false, plugin);

it("uses Astro's real image helper to separate HTTPS from relative local assets", async () => {
  const directory = await mkdtemp(join(tmpdir(), "homepage-album-image-"));
  try {
    const filePath = join(directory, "albums.yaml");
    const sharp = astroRequire("sharp");
    await writeFile(join(directory, "river.png"), await sharp({ create: { width: 90, height: 60, channels: 3, background: "#3563d9" } }).png().toBuffer());
    const plugin = { resolve: async (path, importer) => ({ id: resolve(dirname(importer), path) }) };
    expect((await validate(source("./river.png"), filePath, plugin)).albums.items[0].photos[0].src).toMatchObject({ width: 90, height: 60, format: "png" });
    expect((await validate(source("https://example.com/a.jpg"), filePath)).albums.items[0].photos[0].src).toBe("https://example.com/a.jpg");
    for (const invalid of ["http://example.com/a.jpg", "//example.com/a.jpg", "data:image/png;base64,abc"]) {
      await expect(validate(source(invalid), filePath)).rejects.toThrow();
    }
    await expect(validate(source("./missing.png"), filePath, plugin)).rejects.toThrow();
  } finally {
    if (!resolve(directory).startsWith(resolve(tmpdir()) + sep)) throw new Error("临时目录越界");
    await rm(directory, { recursive: true, force: true });
  }
});

it("loads the whole YAML root, fails invalid YAML/schema and rejects a missing file despite cached data", async () => {
  const directory = await mkdtemp(join(tmpdir(), "homepage-album-loader-"));
  const root = pathToFileURL(`${directory}${sep}`);
  const entries = new Map();
  const path = join(directory, "src/data/albums.yaml");
  const context = {
    collection: "albums", config: { root, srcDir: new URL("src/", root), prerenderConflictBehavior: "error" },
    store: {
      keys: () => [...entries.keys()], get: (id) => entries.get(id),
      set: (entry) => entries.set(entry.id, entry), delete: (id) => entries.delete(id),
    },
    logger: { warn: vi.fn(), error: vi.fn() },
    parseData: ({ data, filePath }) => validate(data, filePath),
    generateDigest: (contents) => contents,
    entryTypes: new Map([[".yaml", { getEntryInfo: ({ contents }) => ({ data: load(contents) }) }]]),
  };
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, "albums:\n  items: []\n");
    await albumsLoader().load(context);
    expect(entries.get("albums").data).toEqual({ albums: { items: [] } });
    await writeFile(path, "albums:\n  items:\n    - title: missing-id\n      draft: true\n");
    await expect(albumsLoader().load(context)).rejects.toThrow();
    await writeFile(path, "albums: { items: [] }\nextra: true\n");
    await expect(albumsLoader().load(context)).rejects.toThrow();
    await writeFile(path, "albums: [\n");
    await expect(albumsLoader().load(context)).rejects.toThrow();
    await rm(path);
    await expect(albumsLoader().load(context)).rejects.toThrow();
  } finally {
    if (!resolve(directory).startsWith(resolve(tmpdir()) + sep)) throw new Error("临时目录越界");
    await rm(directory, { recursive: true, force: true });
  }
});
