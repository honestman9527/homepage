import { getEntry, type CollectionEntry } from "astro:content";
export type SiteConfig = CollectionEntry<"site">["data"];

export async function getSiteConfig(): Promise<SiteConfig> {
  const entry = await getEntry("site", "site");
  if (!entry) throw new Error("src/data/site.yaml must contain a site entry.");
  return entry.data;
}

export type AboutConfig = CollectionEntry<"about">["data"];

export async function getAboutConfig(): Promise<AboutConfig> {
  const entry = await getEntry("about", "about");
  if (!entry) throw new Error("src/data/about.yaml must contain an about entry.");
  return entry.data;
}
