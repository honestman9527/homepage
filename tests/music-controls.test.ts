import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MusicControls, type MusicSection } from "../src/components/react/music/MusicControls";
import { initialMusicState, type MusicState } from "../src/lib/music/player";

// Decorative icons are irrelevant to the semantic controls under test.
vi.mock("@phosphor-icons/react", () => Object.fromEntries([
  "MusicNotesIcon", "PauseIcon", "PlayIcon", "SkipBackIcon", "SkipForwardIcon", "ListIcon", "SlidersHorizontalIcon",
].map((name) => [name, () => null])));

const tracks = [{ title: "一首歌曲", artist: "作者", src: "/music/song.wav" }];
const render = (section: MusicSection = null, state: MusicState = initialMusicState(tracks[0].src)) => renderToStaticMarkup(createElement(MusicControls, {
  tracks, state, player: null, section, onSectionChange: () => {},
}));

describe("music control presentation", () => {
  it("keeps single-track transport and disclosures accessible without a cover", () => {
    const html = render();
    expect(html).toContain("一首歌曲");
    expect(html).toContain('data-slot="avatar-fallback"');
    for (const label of ["上一首", "播放音乐", "下一首"]) expect(html).toContain(`aria-label="${label}"`);
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2);
    expect(html.match(/<section[^>]* hidden=""/g)).toHaveLength(2);
    expect(html).toContain("播放进度");
  });

  it("exposes only the selected detail region with labelled controls", () => {
    for (const section of ["playlist", "settings"] as const) {
      const html = render(section);
      expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
      expect(html.match(/<section[^>]* hidden=""/g)).toHaveLength(1);
      expect(html).toMatch(new RegExp(`<section[^>]*id="[^"]*-${section}"[^>]*aria-labelledby="[^"]*-${section}-toggle"(?![^>]*hidden)[^>]*>`));
    }
    const unsupported = render("settings", { ...initialMusicState(tracks[0].src), volumeSupported: false });
    expect(unsupported).toContain("请使用设备音量键调节音量。");
    expect(unsupported).toMatch(/aria-describedby="[^"]+-volume-help"/);
  });

  it("keeps failure feedback and recovery actions outside the hidden details", () => {
    for (const status of ["loading", "blocked", "error", "exhausted"] as const) {
      const html = render(null, { ...initialMusicState(tracks[0].src), status, skipIn: status === "error" ? 3 : null });
      const visibleContent = html.split('<section class="music-detail"')[0];
      expect(visibleContent).toMatch(/role="status"[^>]*>[^<]+/);
      if (status === "error" || status === "exhausted") expect(visibleContent).toContain("重试当前歌曲");
      if (status === "error") {
        expect(visibleContent).toContain("3 秒后切换下一首");
        expect(visibleContent).toContain("停止自动切歌");
      }
    }
  });
});
