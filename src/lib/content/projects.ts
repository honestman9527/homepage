import type { CollectionEntry } from "astro:content";
import type { Language } from "../../i18n/types";

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

function compareId(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}
