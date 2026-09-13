import type { CommentCleanup, CommentMountOptions } from "./types";

export async function mountComments(
  options: CommentMountOptions,
): Promise<CommentCleanup> {
  if (options.config.provider === "waline") {
    const { mountWaline } = await import("./waline");
    return mountWaline(options);
  }
  const { mountTwikoo } = await import("./twikoo");
  return mountTwikoo(options);
}
