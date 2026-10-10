import { blogPath } from "../../config/routes";
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

export function commentPath(slug: string): string {
  return blogPath(slug);
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
