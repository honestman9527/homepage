import type { ImageMetadata } from "astro";
import { z } from "zod";
import { coverSchema } from "./cover";
import { httpUrlSchema, textSchema } from "./shared";

const reservedBlogKeys = new Set(["page", "search", "tags"]);
const stableSlugSchema = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Use a stable lowercase hyphenated slug",
);

export const caseSchema = z.object({
  projectId: textSchema,
  slug: stableSlugSchema.refine(
    (slug) => slug !== "page",
    "This case slug is reserved by a project route",
  ),
  draft: z.boolean().default(true),
  toc: z.boolean().default(true),
}).strict();

export function blogSchema(image: () => z.ZodType<ImageMetadata>) {
  return z
    .object({
      title: textSchema,
      description: textSchema,
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(textSchema).default([]),
      draft: z.boolean().default(false),
      slug: stableSlugSchema.refine(
        (key) => !reservedBlogKeys.has(key),
        "This blog key is reserved by a blog route",
      ),
      toc: z.boolean().default(true),
      comments: z.boolean().default(true),
      cover: coverSchema(image).optional(),
    })
    .strict();
}

export function projectSchema(image: () => z.ZodType<ImageMetadata>) {
  return z
    .object({
      // file() keeps the source id in data as well as CollectionEntry.id.
      id: textSchema,
      title: textSchema,
      description: textSchema,
      tags: z.array(textSchema).default([]),
      href: httpUrlSchema,
      demoHref: httpUrlSchema.optional(),
      year: z.number().int().min(1900).max(9999),
      featured: z.boolean().default(false),
      cover: coverSchema(image).optional(),
    })
    .strict();
}
