import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import {
  blogSchema,
  aboutSchema,
  projectSchema,
  siteSchema,
} from "./lib/config/schema";

const site = defineCollection({
  loader: file("src/data/site.yaml"),
  schema: ({ image }) => siteSchema(image),
});
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) => blogSchema(image),
});
const about = defineCollection({
  loader: file("src/data/about.yaml"),
  schema: aboutSchema,
});
const projects = defineCollection({
  loader: file("src/data/projects.yaml"),
  schema: ({ image }) => projectSchema(image),
});
export const collections = { site, about, blog, projects };
