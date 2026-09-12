import { z } from "zod";
import type { ImageMetadata } from "astro";

export const languageSchema = z.enum(["zh", "en"]);
const text = z.string().trim().min(1);
const url = z
  .url()
  .refine((value) => /^https?:\/\//.test(value), "Use an HTTP(S) URL");
export const pageSizeSchema = z.number().int().min(1).max(48).default(6);
const topographicFields = {
  seed: text,
  density: z.number().int().min(4).max(32),
  strokeWidth: z.number().min(0.25).max(3),
  palette: z.enum(["blue", "teal", "neutral"]),
};
export const topographicSchema = z
  .object({
    seed: topographicFields.seed.default("honestman"),
    density: topographicFields.density.default(12),
    strokeWidth: topographicFields.strokeWidth.default(1),
    palette: topographicFields.palette.default("blue"),
  })
  .strict();
export type TopographicOptions = z.infer<typeof topographicSchema>;

export function coverSchema(image: () => z.ZodType<ImageMetadata>) {
  return z.discriminatedUnion("type", [
    z.object({ type: z.literal("none") }).strict(),
    z
      .object({
        type: z.literal("topographic"),
        ...z.object(topographicFields).partial().shape,
      })
      .strict(),
    z
      .object({
        type: z.literal("image"),
        src: z.union([
          z
            .url()
            .refine(
              (value) => value.startsWith("https://"),
              "Remote covers require HTTPS",
            ),
          image(),
        ]),
        alt: z.string(),
      })
      .strict(),
  ]);
}
export type Cover = z.infer<ReturnType<typeof coverSchema>>;

export function siteSchema(image: () => z.ZodType<ImageMetadata>) {
  const cover = coverSchema(image);
  const listing = z
    .object({ pageSize: pageSizeSchema, defaultCover: cover.optional() })
    .strict();
  const profile = z
    .object({
      bio: text,
      location: text,
      availability: text,
      about: z.array(text).min(1),
    })
    .strict();
  return z
    .object({
      name: text,
      initials: text,
      email: z.email(),
      social: z.array(
        z
          .object({
            type: z.enum(["github", "linkedin", "x", "website"]),
            label: text,
            url,
          })
          .strict(),
      ),
      profile: z.object({ zh: profile, en: profile }).strict(),
      skills: z.array(text),
      listing: z
        .object({
          blog: listing.default({ pageSize: 6 }),
          projects: listing.default({ pageSize: 6 }),
        })
        .strict()
        .default({ blog: { pageSize: 6 }, projects: { pageSize: 6 } }),
      covers: z
        .object({
          aspectRatio: z.enum(["16:9", "4:3", "1:1"]).default("16:9"),
          default: cover.default({ type: "topographic" }),
          topographic: topographicSchema.default({
            seed: "honestman",
            density: 12,
            strokeWidth: 1,
            palette: "blue",
          }),
        })
        .strict()
        .default({
          aspectRatio: "16:9",
          default: { type: "topographic" },
          topographic: {
            seed: "honestman",
            density: 12,
            strokeWidth: 1,
            palette: "blue",
          },
        }),
    })
    .strict();
}

export function blogSchema(image: () => z.ZodType<ImageMetadata>) {
  return z
    .object({
      title: text,
      description: text,
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(text).default([]),
      draft: z.boolean().default(false),
      lang: languageSchema,
      translationKey: z
        .string()
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Use a stable lowercase hyphenated slug",
        ),
      isOriginal: z.boolean(),
      cover: coverSchema(image).optional(),
    })
    .strict();
}

export function projectSchema(image: () => z.ZodType<ImageMetadata>) {
  const translation = z.object({ title: text, description: text }).strict();
  return z
    .object({
      // file() keeps the source id in data as well as CollectionEntry.id.
      id: text,
      originalLang: languageSchema,
      translations: z
        .object({ zh: translation.optional(), en: translation.optional() })
        .strict(),
      tags: z.array(text).default([]),
      href: url,
      demoHref: url.optional(),
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
