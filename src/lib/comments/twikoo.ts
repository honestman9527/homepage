import twikoo from "twikoo/dist/twikoo.nocss.js";
import twikooStyles from "twikoo/dist/twikoo.css?url";
import type { CommentMountOptions } from "./types";
import { loadCommentStylesheet } from "./style";

export async function mountTwikoo(options: CommentMountOptions) {
  if (options.config.provider !== "twikoo")
    throw new Error("Twikoo received a different comments provider");

  await loadCommentStylesheet("twikoo", twikooStyles);
  await twikoo.init({
    el: options.container,
    envId: options.config.envId,
    path: options.path,
    lang: options.lang === "zh" ? "zh-CN" : "en",
    region: options.config.region,
  });
}
