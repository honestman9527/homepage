import type { CommentsConfig } from "@/lib/config/schema";
import type { ActiveCommentsConfig } from "./types";

export function resolveCommentsConfig(
  config: CommentsConfig,
  enabled: boolean,
): ActiveCommentsConfig | undefined {
  return enabled && config.provider !== "none" ? config : undefined;
}
