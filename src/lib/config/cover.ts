import type { ImageMetadata } from "astro";
import { z } from "zod";
import { textSchema } from "./shared";

const topographicFields = {
  seed: textSchema,
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
