import type { ImageMetadata } from "astro";
import { z } from "zod";
import { commentsSchema } from "./comments";
import { coverSchema, topographicSchema } from "./cover";
import { httpUrlSchema, pageSizeSchema, textSchema } from "./shared";

export function siteSchema(image: () => z.ZodType<ImageMetadata>) {
  const cover = coverSchema(image);
  const listing = z
    .object({ pageSize: pageSizeSchema, defaultCover: cover.optional() })
    .strict();
  const profile = z
    .object({
      bio: textSchema,
      location: textSchema,
      availability: textSchema,
    })
    .strict();

  return z
    .object({
      name: textSchema,
      initials: textSchema,
      avatar: httpUrlSchema.optional(),
      email: z.email(),
      social: z.array(
        z
          .object({
            type: z.enum(["github", "linkedin", "x", "website"]),
            label: textSchema,
            url: httpUrlSchema,
          })
          .strict(),
      ),
      comments: commentsSchema,
      layout: z
        .object({
          header: z
            .object({ sticky: z.boolean().default(true) })
            .strict()
            .default({ sticky: true }),
        })
        .strict()
        .default({ header: { sticky: true } }),
      profile: z.object({ zh: profile, en: profile }).strict(),
      skills: z.array(textSchema),
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
