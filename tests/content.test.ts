import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("astro:content", () => ({ getCollection: vi.fn() }));
vi.mock("astro:i18n", () => ({
  getRelativeLocaleUrl: (lang: "zh" | "en", path = "") => {
    const suffix = path ? `/${path}` : "";
    return lang === "zh" ? suffix || "/" : `/en${suffix}`;
  },
}));
import {
  groupBlog,
  getAdjacentItems,
  normalizeTags,
  selectBlog,
  type BlogEntry,
} from "../src/lib/content/blog";
import {
  selectProjects,
  type ProjectEntry,
} from "../src/lib/content/projects";
import { pageSlice, pageNumbers } from "../src/lib/content/pagination";
import { estimateReadingMinutes } from "../src/lib/content/reading";
import { searchBlogItems } from "../src/lib/content/search";
import {
  formatDate,
  getLangFromUrl,
  getTranslations,
  normalizePath,
} from "../src/i18n/utils";
import { commentPath } from "../src/lib/comments/runtime";
function post(
  key: string,
  lang: "zh" | "en" = "en",
  original = true,
  draft = false,
  date = "2026-01-01",
): BlogEntry {
  return {
    id: `${key}-${lang}`,
    collection: "blog",
    data: {
      translationKey: key,
      lang,
      isOriginal: original,
      draft,
      title: key,
      description: key,
      pubDate: new Date(date),
      tags: [],
      toc: true,
      comments: true,
    },
  };
}

describe("translation groups", () => {
  it("selects a published translation once, with original date ordering", () => {
    const groups = groupBlog([
      post("b"),
      post("a"),
      post("a", "zh", false, false, "2026-09-01"),
    ]);
    expect(
      selectBlog(groups, "zh").map((item) => [item.key, item.post.data.lang]),
    ).toEqual([
      ["a", "zh"],
      ["b", "en"],
    ]);
    expect(selectBlog(groups, "en").map((item) => item.key)).toEqual([
      "a",
      "b",
    ]);
  });
  it("falls back when the translation is a draft and hides draft originals", () => {
    const result = selectBlog(
      groupBlog([
        post("published"),
        post("published", "zh", false, true),
        post("private", "en", true, true),
        post("private", "zh", false),
      ]),
      "zh",
    );
    expect(result).toHaveLength(1);
    expect(result[0].post.data.lang).toBe("en");
  });
  it("rejects duplicate locales and invalid original associations", () => {
    expect(() => groupBlog([post("a"), post("a")])).toThrow("Duplicate");
    expect(() => groupBlog([post("a"), post("a", "zh")])).toThrow(
      "exactly one original",
    );
    expect(() => groupBlog([post("a", "zh", false)])).toThrow(
      "exactly one original",
    );
  });
  it("selects project translations while retaining shared links", () => {
    const project: ProjectEntry = {
      id: "a",
      collection: "projects",
      data: {
        id: "a",
        originalLang: "en",
        translations: {
          en: { title: "Original", description: "English" },
          zh: { title: "译文", description: "中文" },
        },
        href: "https://example.com/repo",
        demoHref: "https://example.com/demo",
        year: 2026,
        featured: false,
        tags: [],
      },
    };
    expect(selectProjects([project], "zh")[0]).toMatchObject({
      title: "译文",
      contentLang: "zh",
      data: {
        href: "https://example.com/repo",
        demoHref: "https://example.com/demo",
      },
    });
    delete project.data.translations.zh;
    expect(selectProjects([project], "zh")[0]).toMatchObject({
      title: "Original",
      contentLang: "en",
    });
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
  it("returns newer and older entries from the shared stable order", () => {
    const selected = selectBlog(
      groupBlog([
        post("older", "en", true, false, "2026-01-01"),
        post("middle", "en", true, false, "2026-02-01"),
        post("middle", "zh", false, false, "2026-02-02"),
        post("newer", "en", true, false, "2026-03-01"),
      ]),
      "zh",
    );
    expect(selected.map(({ key }) => key)).toEqual(["newer", "middle", "older"]);
    expect(getAdjacentItems(selected, "middle")).toMatchObject({
      newer: { key: "newer", post: { data: { lang: "en" } } },
      older: { key: "older", post: { data: { lang: "en" } } },
    });
    expect(getAdjacentItems(selected, "newer").newer).toBeUndefined();
    expect(getAdjacentItems(selected, "older").older).toBeUndefined();
    expect(getAdjacentItems([{ key: "only" }], "only")).toEqual({
      newer: undefined,
      older: undefined,
    });
    expect(() => getAdjacentItems(selected, "missing")).toThrow(
      "Missing current item",
    );
  });

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

  it("uses one stable comment identifier for every translation", () => {
    expect(commentPath("same-article")).toBe("/blog/same-article");
  });
});

describe("locale utilities", () => {
  it("normalizes slash differences and only recognizes a complete language segment", () => {
    expect(normalizePath("/en/")).toBe("/en");
    expect(normalizePath("/")).toBe("/");
    for (const path of ["/en", "/en/", "/en/blog/page/2"])
      expect(getLangFromUrl(new URL(path, "https://example.com"))).toBe("en");
    expect(getLangFromUrl(new URL("https://example.com/english"))).toBe("zh");
  });
  it("localizes pagination and fixes dates to UTC", () => {
    expect(
      getTranslations("zh")("pagination.summary", { page: 2, total: 3 }),
    ).toBe("第 2 / 3 页");
    expect(formatDate(new Date("2026-01-01T00:00:00Z"), "en")).toBe(
      "January 1, 2026",
    );
  });
});
