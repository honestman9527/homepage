import type { ImageMetadata } from "astro";
import { z } from "zod";
import { coverSchema } from "./cover";
import { httpUrlSchema, languageSchema, textSchema } from "./shared";

const reservedBlogKeys = new Set(["page", "search", "tags"]);

export function blogSchema(image: () => z.ZodType<ImageMetadata>) {
  return z
    .object({
      title: textSchema,
      description: textSchema,
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(textSchema).default([]),
      draft: z.boolean().default(false),
      lang: languageSchema,
      translationKey: z
        .string()
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Use a stable lowercase hyphenated slug",
        )
        .refine(
          (key) => !reservedBlogKeys.has(key),
          "This blog key is reserved by a blog route",
        ),
      isOriginal: z.boolean(),
      toc: z.boolean().default(true),
      comments: z.boolean().default(true),
      cover: coverSchema(image).optional(),
    })
    .strict();
}

export function projectSchema(image: () => z.ZodType<ImageMetadata>) {
  const translation = z
    .object({ title: textSchema, description: textSchema })
    .strict();

  return z
    .object({
      // file() keeps the source id in data as well as CollectionEntry.id.
      id: textSchema,
      originalLang: languageSchema,
      translations: z
        .object({ zh: translation.optional(), en: translation.optional() })
        .strict(),
      tags: z.array(textSchema).default([]),
      href: httpUrlSchema,
      demoHref: httpUrlSchema.optional(),
      year: z.number().int().min(1900).max(9999),
      featured: z.boolean().default(false),
      cover: coverSchema(image).optional(),
    })
    .strict()
    .refine((project) => !!project.translations[project.originalLang], {
      message: "The project's original language must have a translation",
      path: ["translations"],
    });
}
