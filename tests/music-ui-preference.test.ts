import { afterEach, describe, expect, it, vi } from "vitest";
import { MUSIC_STORAGE_KEY } from "../src/lib/music/player";
import { getBrowserMusicUiPreferences, MUSIC_UI_STORAGE_KEY, MusicUiPreferenceStore } from "../src/lib/music/ui-preference";

const defaults = { position: "bottom-right" as const, defaultCollapsed: false };
function storage(saved: string | null = null) {
  return { getItem: vi.fn(() => saved), setItem: vi.fn() };
}
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe("music UI preferences", () => {
  it("reads before writing and uses webmaster defaults on first visit", () => {
    const port = storage();
    const store = new MusicUiPreferenceStore({ position: "bottom-left", defaultCollapsed: true }, port);
    expect(store.getSnapshot()).toEqual({ position: "bottom-left", collapsed: true });
    expect(port.getItem).toHaveBeenCalledWith(MUSIC_UI_STORAGE_KEY);
    expect(port.setItem).not.toHaveBeenCalled();
  });
  it("restores visitor choices over webmaster defaults without rewriting them", () => {
    const port = storage(JSON.stringify({ position: "bottom-left", collapsed: true }));
    const store = new MusicUiPreferenceStore(defaults, port);
    expect(store.getSnapshot()).toEqual({ position: "bottom-left", collapsed: true });
    expect(store.getSnapshot()).toBe(store.getSnapshot());
    expect(port.setItem).not.toHaveBeenCalled();
  });
  it.each([
    "broken json", "null", "[]", "false", "{}",
    '{"position":"top-right","collapsed":true}',
    '{"position":"bottom-left","collapsed":"false"}',
    '{"position":"bottom-left","collapsed":false,"open":true}',
  ])("resets corrupt data to defaults: %s", (saved) => {
    const store = new MusicUiPreferenceStore(defaults, storage(saved));
    expect(store.getSnapshot()).toEqual({ position: "bottom-right", collapsed: false });
  });
  it("writes only the independent UI key and preserves the other preference", () => {
    const port = storage();
    const store = new MusicUiPreferenceStore(defaults, port);
    store.update({ collapsed: true });
    store.update({ position: "bottom-left" });
    expect(MUSIC_UI_STORAGE_KEY).not.toBe(MUSIC_STORAGE_KEY);
    expect(port.setItem).toHaveBeenLastCalledWith(MUSIC_UI_STORAGE_KEY,
      JSON.stringify({ position: "bottom-left", collapsed: true }));
  });
  it("retains session choices and notifies subscribers when storage reads/writes fail", () => {
    const store = new MusicUiPreferenceStore(defaults, {
      getItem() { throw Error("unavailable"); }, setItem() { throw Error("quota"); },
    });
    const first = vi.fn();
    const detach = store.subscribe(first);
    expect(() => store.update({ collapsed: true })).not.toThrow();
    expect(first).toHaveBeenCalledTimes(1);
    detach();
    const second = vi.fn();
    const detachSecond = store.subscribe(second);
    store.update({ position: "bottom-left" });
    expect(store.getSnapshot()).toEqual({ position: "bottom-left", collapsed: true });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    detachSecond();
  });
  it("keeps the browser session store across island remounts with localStorage blocked", async () => {
    vi.stubGlobal("window", Object.defineProperty({}, "localStorage", { get() { throw Error("blocked"); } }));
    const module = await import("../src/lib/music/ui-preference");
    const first = module.getBrowserMusicUiPreferences(defaults);
    first.update({ position: "bottom-left", collapsed: true });
    const second = module.getBrowserMusicUiPreferences(defaults);
    expect(second).toBe(first);
    expect(second.getSnapshot()).toEqual({ position: "bottom-left", collapsed: true });
  });
  it("does not share visitor preferences between server renders", () => {
    const first = getBrowserMusicUiPreferences(defaults);
    first.update({ collapsed: true });
    expect(getBrowserMusicUiPreferences(defaults).getSnapshot().collapsed).toBe(false);
  });
});
