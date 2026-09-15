import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, readTheme } from "../src/lib/theme";

function mockBrowser(stored: string | null, dark: boolean, blocked = false) {
  vi.stubGlobal("window", {
    localStorage: { getItem: () => {
      if (blocked) throw new Error("Storage blocked");
      return stored;
    } },
    matchMedia: () => ({ matches: dark }),
  });
  const toggle = vi.fn();
  const setAttribute = vi.fn();
  vi.stubGlobal("document", {
    documentElement: { classList: { toggle } },
    querySelector: () => ({ dataset: { light: "/hm-light.svg", dark: "/hm-dark.svg" }, setAttribute }),
  });
  return { toggle, setAttribute };
}

afterEach(() => vi.unstubAllGlobals());

describe("theme preference", () => {
  it.each(["light", "dark"] as const)("preserves saved %s despite the opposite system theme", (theme) => {
    mockBrowser(theme, theme === "light");
    expect(readTheme()).toEqual({ preference: theme, theme });
  });

  it.each([null, "system", "invalid"])("follows the system for %s", (stored) => {
    for (const dark of [false, true]) {
      mockBrowser(stored, dark);
      expect(readTheme()).toEqual({ preference: "system", theme: dark ? "dark" : "light" });
    }
  });

  it("uses the system when storage is blocked", () => {
    mockBrowser("light", true, true);
    expect(readTheme()).toEqual({ preference: "system", theme: "dark" });
  });
});

describe("theme application", () => {
  it("updates the page and favicon together in both directions", () => {
    const { toggle, setAttribute } = mockBrowser(null, false);
    for (const theme of ["dark", "light"] as const) {
      applyTheme(theme);
      expect(toggle).toHaveBeenLastCalledWith("dark", theme === "dark");
      expect(setAttribute).toHaveBeenLastCalledWith("href", `/hm-${theme}.svg`);
    }
  });

  it("works without a favicon element", () => {
    const { toggle } = mockBrowser(null, false);
    document.querySelector = vi.fn().mockReturnValue(null);
    expect(() => applyTheme("dark")).not.toThrow();
    expect(toggle).toHaveBeenCalledWith("dark", true);
  });

  it.each(["light", "dark", "system", null])("executes the pre-paint functions without module dependencies for %s", (stored) => {
    const { toggle, setAttribute } = mockBrowser(stored, true);
    const script = `(${applyTheme.toString()})((${readTheme.toString()})().theme);`;
    new Function(script)();
    const dark = stored !== "light";
    expect(toggle).toHaveBeenCalledWith("dark", dark);
    expect(setAttribute).toHaveBeenCalledWith("href", dark ? "/hm-dark.svg" : "/hm-light.svg");
  });
});
