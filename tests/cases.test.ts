import { describe, expect, it, vi } from "vitest";
import { getCollection } from "astro:content";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
vi.mock("astro:content", () => ({ getCollection: vi.fn() }));
import { caseSchema } from "../src/lib/config/content";
import { getProjectCasePaths, selectProjectCases, type CaseEntry } from "../src/lib/content/cases";
import { getProjectItems, type ProjectEntry } from "../src/lib/content/projects";
import { ProjectCard } from "../src/components/react/content/ProjectCard";
import { projectPath } from "../src/config/routes";

function project(id: string): ProjectEntry {
  return { id, collection: "projects", data: {
    id, title: `作品 ${id}`, description: "项目目录中的简介", href: "https://example.com/project",
    year: 2026, tags: ["Astro"], featured: true,
  } };
}

function entry(slug: string, projectId: string, draft = false): CaseEntry {
  return { id: slug, collection: "cases", data: { slug, projectId, draft, toc: true } };
}

describe("case schema and identity", () => {
  it("defaults to an unpublished case with a table of contents", () => {
    expect(caseSchema.parse({ projectId: "existing", slug: "stable-case" })).toEqual({
      projectId: "existing", slug: "stable-case", draft: true, toc: true,
    });
    expect(projectPath("stable-case")).toBe("/projects/stable-case");
  });

  it.each([
    { projectId: "existing" },
    { projectId: " ", slug: "case" },
    { projectId: "existing", slug: "page" },
    { projectId: "existing", slug: "../escape" },
    { projectId: "existing", slug: "Case" },
    { projectId: "existing", slug: "case", title: "重复信息" },
    { projectId: "existing", slug: "case", comments: true },
    { projectId: "existing", slug: "case", draft: "false" },
  ])("rejects invalid or unknown fields: %j", (data) => {
    expect(caseSchema.safeParse(data).success).toBe(false);
  });

  it("validates all associations before excluding drafts", () => {
    const projects = [project("one"), project("two")];
    expect(() => selectProjectCases([entry("same", "one"), entry("same", "two", true)], projects))
      .toThrow("Duplicate case slug");
    expect(() => selectProjectCases([entry("a", "one"), entry("b", "one", true)], projects))
      .toThrow("Duplicate case project");
    expect(() => selectProjectCases([entry("a", "missing", true)], projects))
      .toThrow("Missing case project");
  });
});

describe("project case discovery", () => {
  it("joins published bodies with original project metadata without mutating inputs", () => {
    const original = project("one");
    const source = [entry("z", "one"), entry("a", "two", true)];
    const selected = selectProjectCases(source, [original, project("two")]);
    expect(selected).toEqual([{ entry: source[0], project: original, href: "/projects/z" }]);
    expect(source).toHaveLength(2);
    expect(selectProjectCases([], [original])).toEqual([]);
    expect(selectProjectCases([], [])).toEqual([]);
  });

  it("generates static paths only for published cases", async () => {
    vi.mocked(getCollection).mockResolvedValueOnce([entry("published", "one"), entry("draft", "two", true)])
      .mockResolvedValueOnce([project("one"), project("two")]);
    expect(await getProjectCasePaths()).toEqual([{
      params: { slug: "published" },
      props: { caseEntry: entry("published", "one"), project: project("one") },
    }]);
  });

  it("adds case links without replacing external links or project ordering", async () => {
    vi.mocked(getCollection).mockResolvedValueOnce([project("two"), project("one")])
      .mockResolvedValueOnce([entry("published", "one"), entry("draft", "two", true)]);
    const items = await getProjectItems();
    expect(items.map(({ id, caseHref }) => ({ id, caseHref }))).toEqual([
      { id: "one", caseHref: "/projects/published" }, { id: "two", caseHref: undefined },
    ]);
    expect(items[0].data.href).toBe("https://example.com/project");
  });
});

describe("project link rendering", () => {
  const props = {
    title: "作品", description: "简介", href: "https://example.com/project", year: 2026,
    tags: [], featured: false, featuredLabel: "精选", visitLabel: "查看项目",
    demoLabel: "在线演示", hasCover: false,
  };

  it("opens an external project title in a new tab when no case is published", () => {
    const html = renderToStaticMarkup(createElement(ProjectCard, props));
    expect(html).toMatch(/<h2><a[^>]*href="https:\/\/example.com\/project"[^>]*target="_blank"[^>]*rel="noreferrer"/);
  });

  it("uses same-tab case navigation while retaining external project and demo buttons", () => {
    const html = renderToStaticMarkup(createElement(ProjectCard, {
      ...props, caseHref: "/projects/case", demoHref: "https://example.com/demo",
    }));
    const title = html.match(/<h2>(.*?)<\/h2>/)?.[1];
    expect(title).toContain('href="/projects/case"');
    expect(title).not.toContain("target=");
    expect(html).toMatch(/<a[^>]*href="https:\/\/example.com\/project"[^>]*target="_blank"/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/example.com\/demo"[^>]*target="_blank"/);
  });
});
