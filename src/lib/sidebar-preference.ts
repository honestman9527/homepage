/** Self-contained so the same function can run in the pre-paint inline script. */
export function readSidebarPreference(defaultOpen = true): boolean {
  try {
    const value = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("sidebar_state="))
      ?.split("=")[1];

    if (value === "true" || value === "false") return value === "true";
  } catch {
    /* Cookie access may be unavailable during SSR or in the browser. */
  }

  return defaultOpen;
}

/** Applies the persisted desktop state before the browser's first paint. */
export function applyInitialSidebarPreference(
  readPreference: (defaultOpen?: boolean) => boolean,
): void {
  if (readPreference(true)) return;

  const apply = () => {
    const sidebar = document.querySelector<HTMLElement>(
      '[data-slot="sidebar"][data-state]',
    );
    if (!sidebar) return false;

    sidebar.dataset.state = "collapsed";
    sidebar.dataset.collapsible = "icon";
    return true;
  };

  if (apply()) return;

  const observer = new MutationObserver(() => {
    if (!apply()) return;
    observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
