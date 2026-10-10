import { getCollection, type CollectionEntry } from "astro:content";
import { projectPath } from "../../config/routes";

export type CaseEntry = CollectionEntry<"cases">;

export function selectProjectCases(
  cases: CaseEntry[],
  projects: CollectionEntry<"projects">[],
) {
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const slugs = new Set<string>();
  const projectIds = new Set<string>();

  // Validate drafts too: publishing must not reveal an existing conflict.
  for (const entry of cases) {
    const { slug, projectId } = entry.data;
    if (slugs.has(slug)) throw new Error(`Duplicate case slug: ${slug}`);
    if (projectIds.has(projectId))
      throw new Error(`Duplicate case project: ${projectId}`);
    if (!projectsById.has(projectId))
      throw new Error(`Missing case project: ${projectId} (${slug})`);
    slugs.add(slug);
    projectIds.add(projectId);
  }

  return cases
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => a.data.slug < b.data.slug ? -1 : a.data.slug > b.data.slug ? 1 : 0)
    .map((entry) => ({
      entry,
      project: projectsById.get(entry.data.projectId)!,
      href: projectPath(entry.data.slug),
    }));
}

export async function getProjectCases() {
  const [cases, projects] = await Promise.all([
    getCollection("cases"),
    getCollection("projects"),
  ]);
  return selectProjectCases(cases, projects);
}

export async function getProjectCasePaths() {
  return (await getProjectCases()).map(({ entry, project }) => ({
    params: { slug: entry.data.slug },
    props: { caseEntry: entry, project },
  }));
}
