import type { CommentsConfig } from "@/lib/config/schema";
import type {
  ActiveCommentsConfig,
  CommentCleanup,
  CommentMountOptions,
} from "./types";

export function resolveCommentsConfig(
  config: CommentsConfig,
  enabled: boolean,
): ActiveCommentsConfig | undefined {
  return enabled && config.provider !== "none" ? config : undefined;
}

export function commentPath(translationKey: string): string {
  return `/blog/${translationKey}`;
}

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
