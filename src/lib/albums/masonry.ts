const gap = 16;

/** Keep DOM/configuration order; each successive photo goes in the shortest column. */
export function masonryPositions(heights: readonly number[], columns: number, width: number, spacing = gap) {
  const bottoms = Array<number>(columns).fill(0);
  const positions = heights.map((height) => {
    const column = bottoms.indexOf(Math.min(...bottoms));
    const position = { x: column * (width + spacing), y: bottoms[column] };
    bottoms[column] += height + spacing;
    return position;
  });
  return { positions, height: Math.max(0, ...bottoms) - (heights.length ? spacing : 0) };
}

export function mountMasonry(wall: HTMLElement): () => void {
  const items = [...wall.querySelectorAll<HTMLElement>("[data-album-photo]")];
  const listeners = new AbortController();
  let frame = 0;
  let active = true;
  let lastWidth = 0;
  let lastGeometry = "";

  const update = () => {
    frame = 0;
    if (!active || wall.clientWidth <= 0) return;
    const width = wall.clientWidth;
    const columns = Math.max(1, Math.min(3, Math.floor((width + gap) / (250 + gap))));
    const columnWidth = (width - gap * (columns - 1)) / columns;
    wall.dataset.masonry = "";
    for (const item of items) item.style.width = `${columnWidth}px`;
    const heights = items.map((item) => item.offsetHeight);
    const geometry = `${width}:${heights.join(",")}`;
    lastWidth = width;
    if (geometry === lastGeometry) return;
    lastGeometry = geometry;
    const layout = masonryPositions(heights, columns, columnWidth);
    items.forEach((item, index) => {
      const { x, y } = layout.positions[index];
      item.style.transform = `translate(${x}px, ${y}px)`;
    });
    wall.style.height = `${layout.height}px`;
  };
  const schedule = () => {
    if (active && !frame) frame = window.requestAnimationFrame(update);
  };

  for (const item of items) {
    const image = item.querySelector<HTMLImageElement>("img")!;
    const error = item.querySelector<HTMLElement>("[data-photo-error]")!;
    const settle = (failed: boolean) => {
      item.dataset.photoState = failed ? "error" : "ready";
      error.hidden = !failed;
      schedule();
    };
    image.addEventListener("load", () => settle(false), { signal: listeners.signal });
    image.addEventListener("error", () => settle(true), { signal: listeners.signal });
    if (image.complete) settle(image.naturalWidth === 0);
  }

  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver((entries) => {
    if (wall.clientWidth !== lastWidth || entries.some((entry) => entry.target !== wall)) schedule();
  });
  observer?.observe(wall);
  items.forEach((item) => observer?.observe(item));
  window.addEventListener("resize", schedule, { passive: true, signal: listeners.signal });
  void wall.ownerDocument.fonts?.ready.then(() => { if (active) schedule(); });
  schedule();

  return () => {
    active = false;
    listeners.abort();
    observer?.disconnect();
    window.cancelAnimationFrame(frame);
    frame = 0;
    delete wall.dataset.masonry;
    wall.style.removeProperty("height");
    for (const item of items) {
      item.style.removeProperty("width");
      item.style.removeProperty("transform");
    }
  };
}
