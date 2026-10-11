import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { AppHeader } from "../src/components/react/layout/AppHeader";

vi.mock("@/components/react/ui/sidebar", () => ({ SidebarTrigger: () => null }));

const header = { title: "博客", sticky: true, sidebarToggleLabel: "切换侧栏" };
const music = {
  tracks: [{ title: "歌曲", artist: "歌手", src: "/music/song.mp3" }],
  desktop: { position: "bottom-right" as const, defaultCollapsed: false },
};

describe("music header rendering", () => {
  it("renders a stable placeholder without a streamed Suspense boundary on every page", () => {
    for (const title of ["博客", "关于", "博客"]) {
      const html = renderToString(createElement(AppHeader, { viewModel: { ...header, title, music } }));
      expect(html).toContain(title);
      expect(html).toContain("data-music-placeholder");
      expect(html).toContain("md:hidden");
      expect(html).not.toContain("<!--$");
      expect(html).not.toContain("<template");
      expect(html).not.toContain("data-music-capsule");
    }
  });
  it("omits the placeholder when music is disabled or empty", () => {
    for (const config of [undefined, { ...music, tracks: [] }]) {
      const html = renderToString(createElement(AppHeader, { viewModel: { ...header, music: config } }));
      expect(html).not.toContain("data-music-placeholder");
    }
  });
});
