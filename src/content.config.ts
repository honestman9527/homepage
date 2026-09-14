import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import {
  blogSchema,
  pageSchema,
  projectSchema,
  siteSchema,
} from "./lib/config/schema";

const site = defineCollection({
  loader: file("src/data/site.yaml"),
  schema: ({ image }) => siteSchema(image),
});
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) => blogSchema(image),
});
const pages = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/pages" }),
  schema: ({ image }) => pageSchema(image),
});
const projects = defineCollection({
  loader: file("src/data/projects.yaml"),
  schema: ({ image }) => projectSchema(image),
});
export const collections = { site, blog, pages, projects };
