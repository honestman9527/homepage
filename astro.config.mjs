// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import { satteri } from "@astrojs/markdown-satteri";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  site: "https://honestman.me",
  devToolbar: {
    enabled: false,
  },
  i18n: {
    locales: ["zh", "en"],
    defaultLocale: "zh",
    routing: { prefixDefaultLocale: false },
  },
  markdown: {
    processor: satteri(),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [expressiveCode(), react()],
});
