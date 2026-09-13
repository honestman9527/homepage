export function loadCommentStylesheet(
  provider: "waline" | "twikoo",
  href: string,
): Promise<void> {
  const selector = `link[data-comments-styles="${provider}"]`;
  const existing = document.querySelector<HTMLLinkElement>(selector);
  if (existing?.sheet) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = existing ?? document.createElement("link");
    const loaded = () => resolve();
    const failed = () => {
      link.remove();
      reject(new Error(`Failed to load ${provider} styles`));
    };
    link.addEventListener("load", loaded, { once: true });
    link.addEventListener("error", failed, { once: true });
    if (!existing) {
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.commentsStyles = provider;
      document.head.append(link);
    }
  });
}
