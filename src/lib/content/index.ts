import { getCollection } from "astro:content";
import type { PaginateFunction } from "astro";
import type { Language } from "../../i18n/ui";
import { blogPath } from "../../i18n/routes";
import { getTranslations, otherLanguage } from "../../i18n/utils";
import { getSiteConfig } from "../site-config";
import { groupBlog, selectBlog, selectProjects } from "./model";

export async function getBlogItems(lang: Language) {
  const t = getTranslations(lang);
  return selectBlog(groupBlog(await getCollection("blog")), lang).map(
    (item) => ({
      ...item,
      href: blogPath(item.post.data.lang, item.key),
      originalLabel:
        item.post.data.lang !== lang
          ? t(`original.${item.post.data.lang}`)
          : undefined,
    }),
  );
}
export async function getProjectItems(lang: Language) {
  const t = getTranslations(lang);
  return selectProjects(await getCollection("projects"), lang).map((item) => ({
    ...item,
    originalLabel:
      item.contentLang !== lang ? t(`original.${item.contentLang}`) : undefined,
  }));
}
export type BlogItem = Awaited<ReturnType<typeof getBlogItems>>[number];
export type ProjectItem = Awaited<ReturnType<typeof getProjectItems>>[number];
export interface LanguageLink {
  href?: string;
  label: string;
  lang: Language;
}
export async function getBlogPaths(lang: Language) {
  const t = getTranslations(lang);
  return selectBlog(groupBlog(await getCollection("blog")), lang).map(
    (item) => {
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
        },
      };
    },
  );
}
export async function getListingPaths(
  paginate: PaginateFunction,
  lang: Language,
  kind: "blog" | "projects",
) {
  const site = await getSiteConfig();
  const items: (BlogItem | ProjectItem)[] =
    kind === "blog" ? await getBlogItems(lang) : await getProjectItems(lang);
  return paginate(items, {
    pageSize: site.listing[kind].pageSize,
    format: (url) => url.replace(/\/page\/1\/?$/, ""),
  }).filter(({ props }) => props.page.currentPage > 1);
}
