import { afterEach, describe, expect, it, vi } from "vitest";
import { masonryPositions, mountMasonry } from "../src/lib/albums/masonry";
import { mountAlbumViewer, swipeDirection } from "../src/lib/albums/viewer";

class Style {
  setProperty(key, value, priority = "") { this[key] = value; this[`${key}Priority`] = priority; }
  getPropertyValue(key) { return this[key] ?? ""; }
  getPropertyPriority(key) { return this[`${key}Priority`] ?? ""; }
  removeProperty(key) { delete this[key]; delete this[`${key}Priority`]; }
}
class Element extends EventTarget {
  dataset = {}; style = new Style(); selectors = new Map(); children = [];
  hidden = false; complete = false; naturalWidth = 0; isConnected = true;
  textContent = ""; focus = vi.fn();
  querySelector(selector) { return this.selectors.get(selector); }
  querySelectorAll(selector) { return this.selectors.get(selector) ?? []; }
  append(child) { child.parent = this; this.children.push(child); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
  showModal() { this.open = true; }
  close() { this.open = false; this.dispatchEvent(new Event("close")); }
}
const fire = (element, type, fields = {}) => {
  const event = Object.assign(new Event(type, { cancelable: true }), fields);
  element.dispatchEvent(event);
  return event;
};
const click = (element, fields) => fire(element, "click", { button: 0, ...fields });
afterEach(() => vi.unstubAllGlobals());

function masonryFixture() {
  const frames = new Map();
  const browser = new EventTarget();
  let id = 0;
  browser.requestAnimationFrame = (callback) => { frames.set(++id, callback); return id; };
  browser.cancelAnimationFrame = (key) => frames.delete(key);
  vi.stubGlobal("window", browser);
  const observers = [];
  vi.stubGlobal("ResizeObserver", class {
    disconnect = vi.fn(); observe = vi.fn();
    constructor(callback) { this.callback = callback; observers.push(this); }
  });
  const wall = new Element();
  wall.clientWidth = 900; wall.ownerDocument = {};
  const items = [1.5, 2 / 3, 1.2, 0.8, 1.8, 1].map((ratio, index) => {
    const item = new Element(); const image = new Element(); const error = new Element();
    item.dataset.photoState = "pending";
    image.naturalWidth = index === 0 ? 900 : 0;
    image.complete = index === 0;
    image.naturalHeight = image.naturalWidth / ratio;
    item.selectors.set("img", image); item.selectors.set("[data-photo-error]", error);
    Object.defineProperty(item, "offsetHeight", { get: () => {
      const width = parseFloat(item.style.width ?? "250");
      return width / (item.dataset.photoState === "ready" ? ratio : 1.5) + 28;
    } });
    return item;
  });
  wall.selectors.set("[data-album-photo]", items);
  const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback()); };
  return { wall, items, frames, flush, observers, browser };
}

describe("responsive masonry", () => {
  it("places successive mixed-height photos in the shortest column without reordering", () => {
    const result = masonryPositions([100, 300, 50, 200, 90], 3, 100);
    expect(result.positions).toEqual([{ x: 0, y: 0 }, { x: 116, y: 0 }, { x: 232, y: 0 }, { x: 232, y: 66 }, { x: 0, y: 116 }]);
    expect(result.height).toBe(300);
    expect(masonryPositions([], 1, 100).height).toBe(0);
  });

  it("reserves unloaded slots and responds to cached, out-of-order, failed and late images", () => {
    const { wall, items, frames, flush, observers } = masonryFixture();
    const stop = mountMasonry(wall); flush();
    expect(items[0].dataset.photoState).toBe("ready");
    expect(parseFloat(wall.style.height)).toBeGreaterThan(0);
    expect(items.every((item) => item.style.transform && item.offsetHeight > 0)).toBe(true);
    const before = wall.style.height;
    items[3].querySelector("img").naturalWidth = 800;
    fire(items[3].querySelector("img"), "load");
    fire(items[1].querySelector("img"), "error");
    expect(frames.size).toBe(1); flush();
    expect(items[1].dataset.photoState).toBe("error");
    expect(items[1].querySelector("[data-photo-error]").hidden).toBe(false);
    expect(wall.style.height).not.toBe(before);
    // The later lazy photo still has a real position and can finish loading.
    fire(items[5].querySelector("img"), "load"); flush();
    expect(items[5].dataset.photoState).toBe("ready");
    wall.clientWidth = 480;
    observers[0].callback([{ target: wall }]); flush();
    expect(items.every((item) => item.style.width === "480px" && item.style.transform.startsWith("translate(0px,"))).toBe(true);
    const expected = items.reduce((sum, item) => sum + item.offsetHeight + 16, -16);
    expect(parseFloat(wall.style.height)).toBeCloseTo(expected);
    fire(items[2].querySelector("img"), "load");
    stop();
    expect(frames.size).toBe(0); expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(wall.dataset.masonry).toBeUndefined(); expect(wall.style.height).toBeUndefined();
    fire(items[4].querySelector("img"), "load");
    expect(frames.size).toBe(0);
  });
});

function viewerFixture() {
  const root = new Element(); const dialog = new Element();
  root.selectors.set("[data-album-viewer]", dialog);
  const controls = {};
  for (const name of ["previous", "next", "close", "retry", "original", "stage", "loading", "error", "counter", "caption", "date", "location"]) {
    controls[name] = new Element(); dialog.selectors.set(`[data-viewer-${name}]`, controls[name]);
  }
  const images = [];
  root.ownerDocument = { documentElement: { style: new Style() }, createElement: () => { const image = new Element(); images.push(image); return image; } };
  const links = Array.from({ length: 3 }, (_, index) => {
    const link = new Element(); const thumb = new Element();
    link.href = `https://example.com/${index}.jpg`; thumb.alt = `照片 ${index}`;
    link.selectors.set("img", thumb);
    if (index === 0) link.dataset = { photoCaption: "说明", photoDate: "2026年10月11日", photoLocation: "杭州" };
    return link;
  });
  root.selectors.set("[data-album-open]", links);
  return { root, dialog, controls, links, images, scroll: root.ownerDocument.documentElement.style };
}

describe("album lightbox", () => {
  it("keeps links usable with modifiers and restores scroll/focus after modal close", () => {
    const { root, dialog, controls, links, scroll } = viewerFixture();
    scroll.setProperty("overflow", "clip", "important");
    const stop = mountAlbumViewer(root);
    expect(click(links[0], { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(click(links[0]).defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true); expect(scroll.overflow).toBe("hidden");
    expect(controls.previous.disabled).toBe(true); expect(controls.next.disabled).toBe(false);
    expect(controls.original.href).toBe(links[0].href);
    expect(controls.caption.textContent).toBe("说明");
    click(controls.close);
    expect(dialog.open).toBe(false); expect(scroll.overflow).toBe("clip");
    expect(scroll.getPropertyPriority("overflow")).toBe("important");
    expect(links[0].focus).toHaveBeenCalledOnce();
    stop();
  });

  it("ignores stale image callbacks, retries failures, stops at boundaries and clears absent metadata", () => {
    const { root, dialog, controls, links, images } = viewerFixture();
    const stop = mountAlbumViewer(root); click(links[0]);
    const stale = images[0]; click(controls.next);
    fire(stale, "load"); expect(controls.loading.hidden).toBe(false);
    fire(images[1], "error"); expect(controls.error.hidden).toBe(false);
    click(controls.retry); expect(images).toHaveLength(3);
    expect(controls.error.hidden).toBe(true); fire(images[2], "load");
    expect(images[2].hidden).toBe(false); expect(controls.loading.hidden).toBe(true);
    expect(controls.caption.hidden).toBe(true); expect(controls.date.hidden).toBe(true);
    fire(dialog, "keydown", { key: "ArrowRight" });
    expect(controls.counter.textContent).toBe("3 / 3"); expect(controls.next.disabled).toBe(true);
    click(controls.next); expect(images).toHaveLength(4);
    fire(dialog, "keydown", { key: "ArrowLeft" }); expect(controls.counter.textContent).toBe("2 / 3");
    stop();
    expect(dialog.open).toBe(false); expect(controls.stage.children).toHaveLength(0);
    const count = images.length;
    click(links[0]); fire(images.at(-1), "error"); expect(images).toHaveLength(count);
  });

  it("switches with horizontal single-touch swipes while ignoring vertical/multitouch gestures", () => {
    const { root, controls, links } = viewerFixture();
    const stop = mountAlbumViewer(root); click(links[0]);
    const start = { clientX: 200, clientY: 100 };
    fire(controls.stage, "touchstart", { touches: [start] });
    fire(controls.stage, "touchend", { touches: [], changedTouches: [{ clientX: 100, clientY: 110 }] });
    expect(controls.counter.textContent).toBe("2 / 3");
    fire(controls.stage, "touchstart", { touches: [start] });
    fire(controls.stage, "touchmove", { touches: [start, start] });
    fire(controls.stage, "touchend", { touches: [], changedTouches: [{ clientX: 100, clientY: 110 }] });
    expect(controls.counter.textContent).toBe("2 / 3");
    expect(swipeDirection(-90, 100)).toBe(0); expect(swipeDirection(20, 0)).toBe(0);
    expect(swipeDirection(100, 10)).toBe(-1);
    stop();
  });

  it("leaves image links alone without native dialog support and handles cached large images", () => {
    const { root, dialog, links, controls } = viewerFixture();
    dialog.showModal = undefined;
    mountAlbumViewer(root)();
    expect(click(links[0]).defaultPrevented).toBe(false);
    dialog.showModal = () => { dialog.open = true; };
    root.ownerDocument.createElement = () => Object.assign(new Element(), { complete: true, naturalWidth: 1200 });
    const stop = mountAlbumViewer(root); click(links[0]);
    expect(controls.loading.hidden).toBe(true); expect(controls.error.hidden).toBe(true);
    stop();
  });
});
