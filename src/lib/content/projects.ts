import { getCollection, type CollectionEntry } from "astro:content";
import { getSiteConfig } from "../site-config";
import { pageSlice } from "./pagination";

export type ProjectEntry = CollectionEntry<"projects">;

export function selectProjects(projects: ProjectEntry[]) {
  return [...projects]
    .sort((a, b) => b.data.year - a.data.year || compareId(a.id, b.id))
    .map((project) => ({
      ...project,
      title: project.data.title,
      description: project.data.description,
    }));
}

export async function getProjectItems() {
  return selectProjects(await getCollection("projects"));
}

export type ProjectItem = Awaited<ReturnType<typeof getProjectItems>>[number];

export async function getProjectPage(currentPage = 1) {
  const site = await getSiteConfig();
  return pageSlice(
    await getProjectItems(),
    site.listing.projects.pageSize,
    currentPage,
  );
}

export async function getProjectListingPaths() {
  const site = await getSiteConfig();
  const items = await getProjectItems();
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
