import type { Language } from "@/i18n/ui";
import type { CommentsConfig } from "@/lib/config/schema";

export type ActiveCommentsConfig = Exclude<
  CommentsConfig,
  { provider: "none" }
>;

export interface CommentMountOptions {
  container: HTMLElement;
  path: string;
  lang: Language;
  config: ActiveCommentsConfig;
}

export type CommentCleanup = (() => void) | void;
