import { getCollection, type CollectionEntry } from "astro:content";
import { blogPath, tagPath } from "../../config/routes";
import { getSiteConfig } from "../site-config";
import { pageSlice } from "./pagination";

export type BlogEntry = CollectionEntry<"blog">;

export interface ArticleNavigationItem {
  href: string;
  title: string;
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
  date: string;
  dateTime: string;
  tags: { label: string; href: string }[];
}

export function normalizeTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

export function selectBlog(posts: BlogEntry[]) {
  const keys = new Set<string>();
  for (const post of posts) {
    if (keys.has(post.data.slug))
      throw new Error(`Duplicate blog slug: ${post.data.slug}`);
    keys.add(post.data.slug);
  }
  return posts
    .filter((post) => !post.data.draft)
    .sort(
      (a, b) =>
        b.data.pubDate.getTime() - a.data.pubDate.getTime() ||
        compareId(a.data.slug, b.data.slug),
    )
    .map((post) => ({ key: post.data.slug, post }));
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

export async function getBlogItems() {
  return selectBlog(await getCollection("blog")).map((item) => ({
    ...item,
    href: blogPath(item.key),
    tags: normalizeTags(item.post.data.tags),
  }));
}

export type BlogItem = Awaited<ReturnType<typeof getBlogItems>>[number];

export async function getBlogPage(currentPage = 1) {
  const site = await getSiteConfig();
  return pageSlice(await getBlogItems(), site.listing.blog.pageSize, currentPage);
}

export async function getBlogListingPaths() {
  const site = await getSiteConfig();
  const items = await getBlogItems();
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

export function getBlogTags(items: BlogItem[]) {
  const counts = new Map<string, number>();
  for (const item of items)
    for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
    .map(([name, count]) => ({ name, count, href: tagPath(name) }));
}

export function filterBlogByTag(items: BlogItem[], tag: string): BlogItem[] {
  return items.filter((item) => item.tags.includes(tag));
}

export async function getBlogTagPaths(paginated = false) {
  const site = await getSiteConfig();
  const items = await getBlogItems();
  return getBlogTags(items).flatMap(({ name }) => {
    const matches = filterBlogByTag(items, name);
    const totalPages = pageSlice(matches, site.listing.blog.pageSize).totalPages;
    const pages = paginated
      ? Array.from({ length: totalPages - 1 }, (_, index) => index + 2)
      : [1];
    return pages.map((currentPage) => ({
      params: { tag: name, ...(paginated ? { page: String(currentPage) } : {}) },
      props: {
        tag: name,
        page: pageSlice(matches, site.listing.blog.pageSize, currentPage),
      },
    }));
  });
}

function compareId(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export async function getBlogPaths() {
  const items = await getBlogItems();
  const toNavigationItem = (
    item: BlogItem | undefined,
  ): ArticleNavigationItem | undefined =>
    item ? { href: item.href, title: item.post.data.title } : undefined;
  return items.map((item) => {
    const adjacent = getAdjacentItems(items, item.key);
    return {
      params: { id: item.key },
      props: {
        post: item.post,
        navigation: {
          older: toNavigationItem(adjacent.older),
          newer: toNavigationItem(adjacent.newer),
        } satisfies ArticleNavigation,
      },
    };
  });
}
