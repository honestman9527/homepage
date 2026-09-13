import { init } from "@waline/client";
import walineStyles from "@waline/client/style?url";
import type { CommentMountOptions } from "./types";
import { loadCommentStylesheet } from "./style";

export async function mountWaline(options: CommentMountOptions) {
  if (options.config.provider !== "waline")
    throw new Error("Waline received a different comments provider");

  await loadCommentStylesheet("waline", walineStyles);

  const instance = init({
    el: options.container,
    serverURL: options.config.serverURL,
    path: options.path,
    lang: options.lang === "zh" ? "zh-CN" : "en-US",
    dark: "html.dark",
    pageSize: options.config.pageSize,
    login: options.config.login,
  });

  if (!instance) throw new Error("Waline could not mount its comments client");

  return () => instance.destroy();
}
