import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { glob } from "astro/loaders";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { blogSchema, caseSchema } from "../src/lib/config/content";

it.each([
  ["blog", blogSchema(() => z.never()), { slug: "stable-article", title: "文章", description: "简介", pubDate: "2026-01-01" }],
  ["cases", caseSchema, { slug: "stable-article", projectId: "existing" }],
])("%s uses native slugs independently of filenames and rejects collisions", async (collection, schema, article) => {
  const directory = await mkdtemp(join(tmpdir(), "homepage-slug-"));
  const root = pathToFileURL(`${directory}${sep}`);
  const entries = new Map();
  // The native glob loader receives parsed entry data from Astro's entry type.
  // JSON keeps this integration test focused on identity and schema validation.
  const context = {
    collection,
    config: { root, srcDir: new URL("src/", root), prerenderConflictBehavior: "error" },
    store: {
      keys: () => [...entries.keys()],
      get: (id) => entries.get(id),
      set: (entry) => entries.set(entry.id, entry),
      delete: (id) => entries.delete(id),
    },
    logger: { warn: vi.fn(), error: vi.fn() },
    parseData: async ({ data }) => schema.parse(data),
    generateDigest: (contents) => contents,
    entryTypes: new Map([
      [".json", { getEntryInfo: ({ contents }) => ({ data: JSON.parse(contents) }) }],
    ]),
  };

  try {
    await writeFile(join(directory, "arbitrary-filename.json"), JSON.stringify(article));
    await glob({ pattern: "*.json", base: "./" }).load(context);
    expect([...entries.keys()]).toEqual(["stable-article"]);

    await writeFile(join(directory, "another-filename.json"), JSON.stringify({ ...article, draft: true }));
    await expect(glob({ pattern: "*.json", base: "./" }).load(context)).rejects.toThrow(/same slug/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
