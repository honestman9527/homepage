// @ts-check
import { defineEcConfig } from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

export default defineEcConfig({
  plugins: [pluginLineNumbers()],
  themes: ["github-light", "github-dark"],
  useDarkModeMediaQuery: false,
  themeCssSelector: (theme) =>
    theme.name === "github-dark" ? ".dark" : ":not(.dark)",
  defaultProps: {
    showLineNumbers: false,
  },
  frames: {
    showCopyToClipboardButton: true,
  },
  getBlockLocale: ({ file }) => {
    const astroFile = /** @type {{ data?: { astro?: { frontmatter?: { lang?: unknown } } } }} */ (
      file
    );
    return astroFile.data?.astro?.frontmatter?.lang === "zh" ? "zh-CN" : "en";
  },
});
