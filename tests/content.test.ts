import { describe, expect, it, vi } from "vitest";
import { getCollection } from "astro:content";
vi.mock("astro:content", () => ({ getCollection: vi.fn() }));
vi.mock("../src/lib/site-config", () => ({
  getSiteConfig: async () => ({ listing: { blog: { pageSize: 2 } } }),
}));
import {
  getBlogPaths, getBlogListingPaths, getBlogTagPaths, getBlogTags, getBlogItems,
  getAdjacentItems, normalizeTags, selectBlog, type BlogEntry,
} from "../src/lib/content/blog";
import { selectProjects, type ProjectEntry } from "../src/lib/content/projects";
import { pageSlice, pageNumbers } from "../src/lib/content/pagination";
import { estimateReadingMinutes } from "../src/lib/content/reading";
import { searchBlogItems } from "../src/lib/content/search";
import { formatDate, uiText } from "../src/lib/ui";
import { commentPath } from "../src/lib/comments/runtime";
function post(key: string, draft = false, date = "2026-01-01", tags: string[] = []): BlogEntry {
  return { id: key, collection: "blog", data: {
    slug: key, draft, title: key, description: key, pubDate: new Date(date),
    tags, toc: true, comments: true,
  } };
}

describe("Chinese blog content", () => {
  it("filters drafts and sorts by each post's date, then slug", () => {
    const source = [post("b"), post("a"), post("newest", false, "2026-09-01"), post("private", true)];
    expect(selectBlog(source).map(({ key }) => key)).toEqual(["newest", "a", "b"]);
    expect(source.map(({ id }) => id)).toEqual(["b", "a", "newest", "private"]);
  });
  it("rejects duplicate slugs including drafts", () => {
    expect(() => selectBlog([post("a"), post("a", true)])).toThrow("Duplicate blog slug");
  });
  it("generates only published article paths and correct adjacent links", async () => {
    vi.mocked(getCollection).mockResolvedValue([post("older"), post("newer", false, "2026-02-01"), post("draft", true)]);
    const paths = await getBlogPaths();
    expect(paths.map(({ params }) => params.id)).toEqual(["newer", "older"]);
    expect(paths[0].props.navigation).toEqual({ older: { href: "/blog/older", title: "older" }, newer: undefined });
    expect(Object.keys(paths[0].props).sort()).toEqual(["navigation", "post"]);
    expect(getAdjacentItems([{ key: "only" }], "only")).toEqual({ older: undefined, newer: undefined });
    expect(() => getAdjacentItems([], "missing")).toThrow("Missing current item");
  });
  it("counts published tags and generates only nonempty later pages", async () => {
    vi.mocked(getCollection).mockResolvedValue([
      post("a", false, "2026-01-01", ["C++", "C++"]), post("b", false, "2026-01-02", ["C++"]),
      post("c", false, "2026-01-03", ["C++", "中文"]), post("draft", true, "2026-01-04", ["private"]),
    ]);
    expect(await getBlogListingPaths()).toMatchObject([{ params: { page: "2" }, props: { page: { currentPage: 2, totalPages: 2 } } }]);
    const tags = getBlogTags(await getBlogItems());
    expect(tags.find(({ name }) => name === "C++")).toEqual({ name: "C++", count: 3, href: "/blog/tags/C%2B%2B" });
    expect(tags.map(({ name }) => name)).not.toContain("private");
    expect(await getBlogTagPaths(true)).toMatchObject([{ params: { tag: "C++", page: "2" }, props: { page: { items: [{ key: "a" }] } } }]);
    vi.mocked(getCollection).mockResolvedValue([]);
    expect(await getBlogListingPaths()).toEqual([]);
    expect(await getBlogTagPaths()).toEqual([]);
  });
  it("sorts projects while retaining Chinese content and shared links", () => {
    const project: ProjectEntry = { id: "a", collection: "projects", data: {
      id: "a", title: "项目", description: "中文简介", href: "https://example.com/repo",
      demoHref: "https://example.com/demo", year: 2026, featured: false, tags: [],
    } };
    const older: ProjectEntry = { ...project, id: "b", data: { ...project.data, id: "b", year: 2025 } };
    expect(selectProjects([older, project]).map(({ id }) => id)).toEqual(["a", "b"]);
    expect(selectProjects([project])[0]).toMatchObject({ title: "项目", description: "中文简介", data: { href: "https://example.com/repo", demoHref: "https://example.com/demo" } });
  });
});

describe("blog discovery", () => {
  it("trims and deduplicates tags while preserving case", () => {
    expect(normalizeTags([" Astro ", "Astro", "astro", "C++"])).toEqual([
      "Astro",
      "astro",
      "C++",
    ]);
  });

  it("matches every whitespace-separated term across metadata", () => {
    const items = [
      {
        title: "Astro homepage",
        description: "A fast personal site",
        tags: [{ label: "Design" }],
      },
      {
        title: "React notes",
        description: "Component patterns",
        tags: [{ label: "Astro" }],
      },
    ];
    expect(searchBlogItems(items, "ASTRO site")).toEqual([items[0]]);
    expect(searchBlogItems(items, "astro design")).toEqual([items[0]]);
    expect(searchBlogItems(items, "  ")).toEqual([]);
  });
});

describe("pagination", () => {
  it.each([
    [0, 1],
    [1, 1],
    [6, 1],
    [7, 2],
    [13, 3],
  ])(
    "paginates %i items into %i pages without losing items",
    (count, total) => {
      const items = Array.from({ length: count }, (_, index) => index);
      expect(pageSlice(items, 6).totalPages).toBe(total);
      const pages = Array.from(
        { length: total },
        (_, index) => pageSlice(items, 6, index + 1).items,
      );
      expect(pages.flat()).toEqual(items);
    },
  );
  it.each([0, -1, 1.5, 49])("rejects invalid page size %s", (size) =>
    expect(() => pageSlice([], size)).toThrow(),
  );
  it("rejects out of bounds pages", () => {
    for (const page of [0, -1, 1.5, 3])
      expect(() => pageSlice([1, 2], 1, page)).toThrow("Page out of range");
  });
  it("keeps first, last, nearby pages and fills a single gap", () => {
    expect(pageNumbers(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ]);
    expect(pageNumbers(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageNumbers(1, 1)).toEqual([1]);
  });
});

describe("article reading model", () => {
  it("estimates Chinese, English and mixed reading time without fenced code", () => {
    expect(estimateReadingMinutes("")).toBe(1);
    expect(estimateReadingMinutes("字".repeat(300))).toBe(1);
    expect(estimateReadingMinutes("字".repeat(301))).toBe(2);
    expect(estimateReadingMinutes("word ".repeat(200))).toBe(1);
    expect(
      estimateReadingMinutes(
        Array.from({ length: 201 }, (_, index) => `word${index}`).join(" "),
      ),
    ).toBe(2);
    expect(
      estimateReadingMinutes(`字${"word ".repeat(100)}\n\n~~~ts\n${"code ".repeat(500)}\n~~~~`),
    ).toBe(1);
    expect(
      estimateReadingMinutes(`Intro\n\n\`\`\`ts\n${"code ".repeat(500)}\n\`\`\``),
    ).toBe(1);
  });

  it("uses one stable comment identifier for the article slug", () => {
    expect(commentPath("same-article")).toBe("/blog/same-article");
  });
});


describe("Chinese UI text", () => {
  it("interpolates pagination and formats Chinese dates in UTC", () => {
    expect(uiText("pagination.summary", { page: 2, total: 3 })).toBe("第 2 / 3 页");
    expect(formatDate(new Date("2026-01-01T00:00:00Z"))).toBe("2026年1月1日");
  });
});
