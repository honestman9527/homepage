import { z } from "zod";
import { textSchema } from "./shared";

const sectionSchema = z
  .object({
    id: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase hyphenated id"),
    title: textSchema,
    paragraphs: z.array(textSchema).min(1),
  })
  .strict();

const localizedAboutSchema = z
  .object({
    title: textSchema,
    description: textSchema,
    sections: z.array(sectionSchema),
  })
  .strict()
  .refine(
    ({ sections }) => new Set(sections.map(({ id }) => id)).size === sections.length,
    { message: "About section ids must be unique", path: ["sections"] },
  );

export const aboutSchema = z
  .object({
    zh: localizedAboutSchema,
    en: localizedAboutSchema,
  })
  .strict();
