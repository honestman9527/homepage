import { defineCollection, z } from "astro:content";
import { file, glob } from "astro/loaders";

const site = defineCollection({
  loader: file("src/data/site.yaml"),
  schema: z.object({
    name: z.string(),
    domain: z.string(),
    initials: z.string(),
    email: z.string(),
    social: z.array(
      z.object({
        label: z.string(),
        url: z.string(),
      }),
    ),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: file("src/data/projects.yaml"),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    href: z.string(),
    demoHref: z.string().optional(),
    year: z.number(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { site, blog, projects };
