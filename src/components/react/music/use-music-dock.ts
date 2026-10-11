import { useLayoutEffect, useState } from "react";

interface DockBounds { left: number; right: number; width: number }

/** Measure the content area, since a body portal does not inherit sidebar widths. */
export function useMusicDock(enabled: boolean): DockBounds | null {
  const [bounds, setBounds] = useState<DockBounds | null>(null);
  useLayoutEffect(() => {
    if (!enabled) return;
    const content = document.getElementById("main-content");
    if (!content) return;
    let frame = 0;
    const measure = () => {
      const rect = content.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      const left = Math.max(0, rect.left);
      const right = Math.max(0, viewport - rect.right);
      const width = Math.max(0, viewport - left - right);
      setBounds((previous) => previous?.left === left && previous.right === right && previous.width === width
        ? previous : { left, right, width });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(content);
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);
  return enabled ? bounds : null;
}
