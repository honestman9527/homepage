// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  site: "https://honestman.me",
  devToolbar: {
    enabled: false,
  },
  prerenderConflictBehavior: "error",
  markdown: {
    processor: satteri(),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [expressiveCode(), mdx(), react()],
});
