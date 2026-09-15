export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";
/** Self-contained so the same function can run in the pre-paint inline script. */
export function readTheme(): { theme: Theme; preference: ThemePreference } {
  let preference: ThemePreference = "system";
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") preference = stored;
  } catch {
    /* Storage can be blocked; keep the system preference. */
  }
  return {
    preference,
    theme:
      preference !== "system" ? preference :
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"),
  };
}

/** Self-contained for reuse before the first paint and after hydration. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  const favicon = document.querySelector<HTMLLinkElement>("link[data-theme-favicon]");
  const href = favicon?.dataset[theme];
  if (favicon && href) favicon.setAttribute("href", href);
}
