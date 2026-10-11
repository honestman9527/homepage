export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  return Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5 ? (dx < 0 ? 1 : -1) : 0;
}

export function mountAlbumViewer(root: HTMLElement): () => void {
  const dialog = root.querySelector<HTMLDialogElement>("[data-album-viewer]")!;
  // Normal image links keep working when modal dialogs are unavailable.
  if (typeof dialog.showModal !== "function") return () => {};
  const links = [...root.querySelectorAll<HTMLAnchorElement>("[data-album-open]")];
  const previous = dialog.querySelector<HTMLButtonElement>("[data-viewer-previous]")!;
  const next = dialog.querySelector<HTMLButtonElement>("[data-viewer-next]")!;
  const close = dialog.querySelector<HTMLButtonElement>("[data-viewer-close]")!;
  const retry = dialog.querySelector<HTMLButtonElement>("[data-viewer-retry]")!;
  const original = dialog.querySelector<HTMLAnchorElement>("[data-viewer-original]")!;
  const stage = dialog.querySelector<HTMLElement>("[data-viewer-stage]")!;
  const loading = dialog.querySelector<HTMLElement>("[data-viewer-loading]")!;
  const error = dialog.querySelector<HTMLElement>("[data-viewer-error]")!;
  const counter = dialog.querySelector<HTMLElement>("[data-viewer-counter]")!;
  const caption = dialog.querySelector<HTMLElement>("[data-viewer-caption]")!;
  const date = dialog.querySelector<HTMLElement>("[data-viewer-date]")!;
  const location = dialog.querySelector<HTMLElement>("[data-viewer-location]")!;
  const scroll = root.ownerDocument.documentElement.style;
  const listeners = new AbortController();
  let image: HTMLImageElement | undefined;
  let imageListeners: AbortController | undefined;
  let current = 0;
  let opener: HTMLAnchorElement | undefined;
  let savedOverflow: { value: string; priority: string } | undefined;
  let active = true;
  let touch: { x: number; y: number } | undefined;

  const clearImage = () => {
    imageListeners?.abort();
    image?.remove();
    image = undefined;
  };
  const text = (element: HTMLElement, value: string | undefined) => {
    element.textContent = value ?? "";
    element.hidden = !value;
  };
  const render = () => {
    clearImage();
    const link = links[current];
    original.href = link.href;
    previous.disabled = current === 0;
    next.disabled = current === links.length - 1;
    counter.textContent = `${current + 1} / ${links.length}`;
    text(caption, link.dataset.photoCaption);
    text(date, link.dataset.photoDate);
    text(location, link.dataset.photoLocation);
    loading.hidden = false;
    error.hidden = true;
    const pending = root.ownerDocument.createElement("img");
    pending.alt = link.querySelector<HTMLImageElement>("img")!.alt;
    pending.hidden = true;
    pending.decoding = "async";
    image = pending;
    imageListeners = new AbortController();
    const settle = (failed: boolean) => {
      if (!active || !dialog.open || image !== pending) return;
      loading.hidden = true;
      error.hidden = !failed;
      pending.hidden = failed;
    };
    pending.addEventListener("load", () => settle(false), { signal: imageListeners.signal });
    pending.addEventListener("error", () => settle(true), { signal: imageListeners.signal });
    stage.append(pending);
    pending.src = link.href;
    if (pending.complete) settle(pending.naturalWidth === 0);
  };
  const move = (direction: number) => {
    const index = current + direction;
    if (!dialog.open || index < 0 || index >= links.length) return;
    current = index;
    render();
  };
  const release = (restoreFocus: boolean) => {
    clearImage();
    touch = undefined;
    if (savedOverflow) {
      if (savedOverflow.value) scroll.setProperty("overflow", savedOverflow.value, savedOverflow.priority);
      else scroll.removeProperty("overflow");
      savedOverflow = undefined;
    }
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    opener = undefined;
  };

  links.forEach((link, index) => link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
    event.preventDefault();
    current = index;
    opener = link;
    savedOverflow = { value: scroll.getPropertyValue("overflow"), priority: scroll.getPropertyPriority("overflow") };
    dialog.showModal();
    scroll.setProperty("overflow", "hidden");
    render();
  }, { signal: listeners.signal }));
  previous.addEventListener("click", () => move(-1), { signal: listeners.signal });
  next.addEventListener("click", () => move(1), { signal: listeners.signal });
  retry.addEventListener("click", render, { signal: listeners.signal });
  close.addEventListener("click", () => dialog.close(), { signal: listeners.signal });
  dialog.addEventListener("close", () => { if (!dialog.open) release(active); }, { signal: listeners.signal });
  dialog.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  }, { signal: listeners.signal });
  stage.addEventListener("touchstart", (event) => {
    touch = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : undefined;
  }, { passive: true, signal: listeners.signal });
  stage.addEventListener("touchmove", (event) => { if (event.touches.length !== 1) touch = undefined; }, { passive: true, signal: listeners.signal });
  stage.addEventListener("touchcancel", () => { touch = undefined; }, { passive: true, signal: listeners.signal });
  stage.addEventListener("touchend", (event) => {
    const start = touch;
    touch = undefined;
    if (!start || event.touches.length || !event.changedTouches.length) return;
    const end = event.changedTouches[0];
    const direction = swipeDirection(end.clientX - start.x, end.clientY - start.y);
    if (direction) move(direction);
  }, { passive: true, signal: listeners.signal });

  return () => {
    active = false;
    listeners.abort();
    if (dialog.open) dialog.close();
    release(false);
  };
}
