import type { CollectionEntry } from "astro:content";
import type { Language } from "../../i18n/types";

export type BlogEntry = CollectionEntry<"blog">;

export interface BlogGroup {
  key: string;
  original: BlogEntry;
  variants: BlogEntry[];
}

export interface AdjacentItems<T> {
  older?: T;
  newer?: T;
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

export function getAdjacentItems<T extends { key: string }>(
  items: T[],
  currentKey: string,
): AdjacentItems<T> {
  const index = items.findIndex((item) => item.key === currentKey);
  if (index === -1) throw new Error(`Missing current item: ${currentKey}`);
  return {
    newer: index > 0 ? items[index - 1] : undefined,
    older: index < items.length - 1 ? items[index + 1] : undefined,
  };
}
