export type Theme = "light" | "dark";
/** Self-contained so the same function can run in the pre-paint inline script. */
export function readTheme(): { theme: Theme; preference: Theme | null } {
  let preference: Theme | null = null;
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") preference = stored;
  } catch {
    /* Storage can be blocked; keep the system preference. */
  }
  return {
    preference,
    theme:
      preference ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"),
  };
}
