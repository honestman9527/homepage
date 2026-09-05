import { getEntry } from "astro:content";

export interface SiteConfig {
  name: string;
  domain: string;
  initials: string;
  email: string;
  social: { label: string; url: string }[];
}

/**
 * Loads the site configuration from `src/data/site.yaml` (the `site`
 * content collection). Throws if the file is missing or malformed so a
 * broken config fails the build instead of rendering an empty site.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const entry = await getEntry("site", "site");
  if (!entry) {
    throw new Error("src/data/site.yaml is missing — cannot build the site.");
  }
  return entry.data as unknown as SiteConfig;
}
