/** Mount page-local features on both full loads and Astro client navigation. */
export function onPageLifecycle(
  initialize: () => (() => void) | void,
  page: EventTarget = document,
  browser: EventTarget = window,
): () => void {
  let cleanup: (() => void) | void;
  const unmount = () => { cleanup?.(); cleanup = undefined; };
  const mount = () => { unmount(); cleanup = initialize(); };
  const restore = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) mount();
  };
  page.addEventListener("astro:before-swap", unmount);
  page.addEventListener("astro:page-load", mount);
  browser.addEventListener("pagehide", unmount);
  browser.addEventListener("pageshow", restore);
  mount();
  return () => {
    unmount();
    page.removeEventListener("astro:before-swap", unmount);
    page.removeEventListener("astro:page-load", mount);
    browser.removeEventListener("pagehide", unmount);
    browser.removeEventListener("pageshow", restore);
  };
}
