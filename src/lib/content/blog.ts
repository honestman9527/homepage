import { getCollection, type CollectionEntry } from "astro:content";
import type { Language } from "../../i18n/types";
import {
  blogPath,
  tagListingPath,
  tagPath,
  tagsPath,
} from "../../i18n/routes";
import { getTranslations, otherLanguage } from "../../i18n/utils";
import { getSiteConfig } from "../site-config";
import { pageSlice } from "./pagination";

export type BlogEntry = CollectionEntry<"blog">;

export interface BlogGroup {
  key: string;
  original: BlogEntry;
  variants: BlogEntry[];
}

export interface ArticleNavigationItem {
  href: string;
  title: string;
  lang: Language;
  originalLabel?: string;
}

export interface ArticleNavigation {
  older?: ArticleNavigationItem;
  newer?: ArticleNavigationItem;
}

export interface BlogSearchItem {
  key: string;
  title: string;
  description: string;
  href: string;
  lang: Language;
  date: string;
  dateTime: string;
  originalLabel?: string;
  tags: { label: string; href: string }[];
}

export function normalizeTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
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
) {
  const index = items.findIndex((item) => item.key === currentKey);
  if (index === -1) throw new Error(`Missing current item: ${currentKey}`);
  return {
    newer: index > 0 ? items[index - 1] : undefined,
    older: index < items.length - 1 ? items[index + 1] : undefined,
  };
}

export async function getBlogItems(lang: Language) {
  const t = getTranslations(lang);
  return selectBlog(groupBlog(await getCollection("blog")), lang).map((item) => ({
    ...item,
    href: blogPath(item.post.data.lang, item.key),
    tags: normalizeTags(item.post.data.tags),
    originalLabel:
      item.post.data.lang !== lang
        ? t(`original.${item.post.data.lang}`)
        : undefined,
  }));
}

export type BlogItem = Awaited<ReturnType<typeof getBlogItems>>[number];

export async function getBlogPage(lang: Language, currentPage = 1) {
  const site = await getSiteConfig();
  return pageSlice(await getBlogItems(lang), site.listing.blog.pageSize, currentPage);
}

export async function getBlogListingPaths(lang: Language) {
  const site = await getSiteConfig();
  const items = await getBlogItems(lang);
  const first = pageSlice(items, site.listing.blog.pageSize);
  return Array.from(
    { length: first.totalPages - 1 },
    (_, index) => index + 2,
  ).map((currentPage) => ({
        params: { page: String(currentPage) },
        props: {
          page: pageSlice(items, site.listing.blog.pageSize, currentPage),
        },
      }));
}

export function getBlogTags(items: BlogItem[], lang: Language) {
  const counts = new Map<string, number>();
  for (const item of items)
    for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .sort(([a], [b]) => a.localeCompare(b, lang))
    .map(([name, count]) => ({ name, count, href: tagPath(lang, name) }));
}

export function filterBlogByTag(items: BlogItem[], tag: string): BlogItem[] {
  return items.filter((item) => item.tags.includes(tag));
}

export async function getBlogTagPaths(lang: Language, paginated = false) {
  const site = await getSiteConfig();
  const items = await getBlogItems(lang);
  const other = otherLanguage(lang);
  const otherItems = await getBlogItems(other);
  const tags = getBlogTags(items, lang);
  const paths = tags.flatMap(({ name }) => {
    const totalPages = pageSlice(
      filterBlogByTag(items, name),
      site.listing.blog.pageSize,
    ).totalPages;
    const pages = paginated
      ? Array.from({ length: totalPages - 1 }, (_, index) => index + 2)
      : [1];
    const matches = filterBlogByTag(items, name);
    const otherMatches = filterBlogByTag(otherItems, name);
    const otherTotalPages = otherMatches.length
      ? pageSlice(otherMatches, site.listing.blog.pageSize).totalPages
      : 0;
    return pages.map((currentPage) => ({
        params: {
          tag: name,
          ...(paginated ? { page: String(currentPage) } : {}),
        },
        props: {
          tag: name,
          page: pageSlice(matches, site.listing.blog.pageSize, currentPage),
          languageHref: otherMatches.length
            ? tagListingPath(other, name, Math.min(currentPage, otherTotalPages))
            : tagsPath(other),
        },
      }));
  });
  return paths;
}

function compareId(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export async function getBlogPaths(lang: Language) {
  const t = getTranslations(lang);
  const selected = selectBlog(groupBlog(await getCollection("blog")), lang);
  const navigationItems = selected.map((item) => ({
    ...item,
    href: blogPath(item.post.data.lang, item.key),
    originalLabel:
      item.post.data.lang !== lang
        ? t(`original.${item.post.data.lang}`)
        : undefined,
  }));
  const toNavigationItem = (
    item: (typeof navigationItems)[number] | undefined,
  ): ArticleNavigationItem | undefined =>
    item
      ? {
          href: item.href,
          title: item.post.data.title,
          lang: item.post.data.lang,
          originalLabel: item.originalLabel,
        }
      : undefined;

  return selected.map((item) => {
    if (item.post.data.lang !== lang)
      return {
        params: { id: item.key },
        props: {
          kind: "redirect" as const,
          destination: blogPath(item.post.data.lang, item.key),
        },
      };
    const other = otherLanguage(lang);
    const translation = item.variants.find(
      (entry) => entry.data.lang === other && !entry.data.draft,
    );
    const adjacent = getAdjacentItems(navigationItems, item.key);
    return {
      params: { id: item.key },
      props: {
        kind: "article" as const,
        post: item.post,
        original: item.original,
        lang,
        languageLink: {
          lang: other,
          href: translation ? blogPath(other, item.key) : undefined,
          label: translation
            ? other === "en"
              ? "English"
              : "中文"
            : t(`missing.${other}`),
        },
        alternates: item.variants
          .filter((entry) => !entry.data.draft)
          .map((entry) => ({
            lang: entry.data.lang,
            href: blogPath(entry.data.lang, item.key),
          })),
        navigation: {
          older: toNavigationItem(adjacent.older),
          newer: toNavigationItem(adjacent.newer),
        } satisfies ArticleNavigation,
      },
    };
  });
}
