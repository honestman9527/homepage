import type { Cover, TopographicOptions } from "../config/schema";

export function resolveCover(...candidates: (Cover | undefined)[]): Cover {
  return (
    candidates.find((candidate) => candidate !== undefined) ?? {
      type: "topographic",
    }
  );
}
function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}
/** Deterministic closed contours, generated only at build time. */
export function contourPaths(
  key: string,
  options: TopographicOptions,
): string[] {
  const seed = hash(`${options.seed}:${key}`);
  const phase = (seed % 628) / 100;
  const cx = 280 + (seed % 240);
  const cy = 170 + ((seed >>> 8) % 110);
  return Array.from({ length: options.density }, (_, line) => {
    const radius = 28 + line * (480 / options.density);
    const points = Array.from({ length: 121 }, (_, step) => {
      const angle = (step / 120) * Math.PI * 2;
      const ripple =
        1 +
        0.1 * Math.sin(3 * angle + phase) +
        0.045 * Math.sin(5 * angle - phase);
      const x = cx + Math.cos(angle) * radius * 1.35 * ripple;
      const y = cy + Math.sin(angle) * radius * 0.85 * ripple;
      return `${step ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return `${points.join(" ")} Z`;
  });
}
