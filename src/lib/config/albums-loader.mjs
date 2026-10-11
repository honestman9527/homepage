import { access } from "node:fs/promises";
import { glob } from "astro/loaders";

/** @returns {import("astro/loaders").Loader} */
export function albumsLoader() {
  const loader = glob({ pattern: "albums.yaml", base: "./src/data", generateId: () => "albums" });
  return {
    ...loader,
    name: "albums-yaml",
    async load(context) {
      // A zero-match glob only warns and can retain cached content.
      await access(new URL("src/data/albums.yaml", context.config.root));
      await loader.load(context);
    },
  };
}
