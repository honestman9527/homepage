import { describe, expect, it, vi } from "vitest";
import { onPageLifecycle } from "../src/lib/page-lifecycle";

describe("page feature lifecycle", () => {
  it("keeps a single live feature across initial load, repeated navigation and history restoration", () => {
    const page = new EventTarget(); const browser = new EventTarget();
    let active = 0;
    const disposeFeature = vi.fn(() => { active--; });
    const initialize = vi.fn(() => { active++; return disposeFeature; });
    const stop = onPageLifecycle(initialize, page, browser);
    expect(active).toBe(1);
    page.dispatchEvent(new Event("astro:page-load"));
    expect(active).toBe(1);
    for (let i = 0; i < 5; i++) {
      page.dispatchEvent(new Event("astro:before-swap")); expect(active).toBe(0);
      page.dispatchEvent(new Event("astro:page-load")); expect(active).toBe(1);
    }
    browser.dispatchEvent(new Event("pagehide")); expect(active).toBe(0);
    browser.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); expect(active).toBe(1);
    stop(); expect(active).toBe(0);
    const count = initialize.mock.calls.length;
    page.dispatchEvent(new Event("astro:page-load"));
    expect(initialize).toHaveBeenCalledTimes(count);
  });
  it("handles pages without a feature and duplicate cleanup events", () => {
    const page = new EventTarget(); const browser = new EventTarget();
    const stop = onPageLifecycle(() => undefined, page, browser);
    expect(() => { page.dispatchEvent(new Event("astro:before-swap")); browser.dispatchEvent(new Event("pagehide")); stop(); stop(); }).not.toThrow();
  });
});
