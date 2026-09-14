import { afterEach, describe, expect, it, vi } from "vitest";
import { readSidebarPreference } from "../src/lib/sidebar-preference";

describe("sidebar preference", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the provided default when document is unavailable", () => {
    expect(readSidebarPreference(false)).toBe(false);
    expect(readSidebarPreference(true)).toBe(true);
  });

  it("reads the persisted sidebar cookie", () => {
    vi.stubGlobal("document", {
      cookie: "theme=dark; sidebar_state=false; locale=zh",
    });
    expect(readSidebarPreference(true)).toBe(false);

    vi.stubGlobal("document", { cookie: "sidebar_state=true" });
    expect(readSidebarPreference(false)).toBe(true);
  });
});
