import type { CollectionEntry } from "astro:content";
import type { Language } from "../../i18n/ui";
import { pageSizeSchema } from "../config/schema";

export type BlogEntry = CollectionEntry<"blog">;
export type ProjectEntry = CollectionEntry<"projects">;
export interface BlogGroup {
  key: string;
  original: BlogEntry;
  variants: BlogEntry[];
}

export function groupBlog(posts: BlogEntry[]): BlogGroup[] {
  const groups = new Map<string, BlogEntry[]>();
  for (const post of posts) {
    const group = groups.get(post.data.translationKey) ?? [];
    if (group.some((entry) => entry.data.lang === post.data.lang))
      throw new Error(
        `Duplicate blog translation: ${post.data.translationKey}/${post.data.lang}`,
      );
    group.push(post);
    groups.set(post.data.translationKey, group);
  }
  return [...groups]
    .map(([key, variants]) => {
      const originals = variants.filter((post) => post.data.isOriginal);
      if (originals.length !== 1)
        throw new Error(`Blog group ${key} must have exactly one original`);
      return { key, original: originals[0], variants };
    })
    .filter((group) => !group.original.data.draft)
    .sort(
      (a, b) =>
        b.original.data.pubDate.getTime() - a.original.data.pubDate.getTime() ||
        compareId(a.key, b.key),
    );
}
function compareId(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}
export function selectBlog(groups: BlogGroup[], lang: Language) {
  return groups.map((group) => ({
    ...group,
    post:
      group.variants.find(
        (post) => post.data.lang === lang && !post.data.draft,
      ) ?? group.original,
  }));
}
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
export function pageSlice<T>(items: T[], pageSize: number, currentPage = 1) {
  pageSizeSchema.parse(pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (
    !Number.isInteger(currentPage) ||
    currentPage < 1 ||
    currentPage > totalPages
  )
    throw new Error("Page out of range");
  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    currentPage,
    totalPages,
  };
}
export function pageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index): (number | "ellipsis")[] => {
    const previous = pages[index - 1];
    if (index && page - previous === 2) return [previous + 1, page];
    return index && page - previous > 2 ? ["ellipsis", page] : [page];
  });
}
