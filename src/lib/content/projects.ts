import { getCollection, type CollectionEntry } from "astro:content";
import type { Language } from "../../i18n/types";
import { getTranslations } from "../../i18n/utils";
import { getSiteConfig } from "../site-config";
import { pageSlice } from "./pagination";

export type ProjectEntry = CollectionEntry<"projects">;

export function selectProjects(projects: ProjectEntry[], lang: Language) {
  return [...projects]
    .sort((a, b) => b.data.year - a.data.year || compareId(a.id, b.id))
    .map((project) => {
      const contentLang = project.data.translations[lang]
        ? lang
        : project.data.originalLang;
      const translation = project.data.translations[contentLang];
      if (!translation)
        throw new Error(
          `Project ${project.id} is missing its original translation`,
        );
      return { ...project, contentLang, ...translation };
    });
}

export async function getProjectItems(lang: Language) {
  const t = getTranslations(lang);
  return selectProjects(await getCollection("projects"), lang).map((item) => ({
    ...item,
    originalLabel:
      item.contentLang !== lang ? t(`original.${item.contentLang}`) : undefined,
  }));
}

export type ProjectItem = Awaited<ReturnType<typeof getProjectItems>>[number];

export async function getProjectPage(lang: Language, currentPage = 1) {
  const site = await getSiteConfig();
  return pageSlice(
    await getProjectItems(lang),
    site.listing.projects.pageSize,
    currentPage,
  );
}

export async function getProjectListingPaths(lang: Language) {
  const site = await getSiteConfig();
  const items = await getProjectItems(lang);
  const first = pageSlice(items, site.listing.projects.pageSize);
  return Array.from(
    { length: first.totalPages - 1 },
    (_, index) => index + 2,
  ).map((currentPage) => ({
        params: { page: String(currentPage) },
        props: {
          page: pageSlice(items, site.listing.projects.pageSize, currentPage),
        },
      }));
}

function compareId(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}
