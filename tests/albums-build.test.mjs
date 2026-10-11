import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { expect, it } from "vitest";

it("builds published local/remote albums with static links, responsive assets and page-local scripts", async () => {
  const project = resolve(import.meta.dirname, "..");
  const cache = join(project, ".cache");
  await mkdir(cache, { recursive: true });
  const fixture = await mkdtemp(join(cache, "albums-build-"));
  const astroRequire = createRequire(import.meta.resolve("astro/package.json"));
  try {
    await Promise.all(["src", "public", "astro.config.mjs", "tsconfig.json", "package.json", "ec.config.mjs"].map((file) => cp(join(project, file), join(fixture, file), { recursive: true })));
    await symlink(join(project, "node_modules"), join(fixture, "node_modules"), "junction");
    await mkdir(join(fixture, "src/assets/albums"), { recursive: true });
    const sharp = astroRequire("sharp");
    await writeFile(join(fixture, "src/assets/albums/landscape.png"), await sharp({ create: { width: 900, height: 600, channels: 3, background: "#3563d9" } }).png().toBuffer());
    await writeFile(join(fixture, "src/assets/albums/portrait.png"), await sharp({ create: { width: 600, height: 900, channels: 3, background: "#74736d" } }).png().toBuffer());
    await writeFile(join(fixture, "src/data/albums.yaml"), `albums:
  items:
    - id: second
      title: 临时公开相册
      coverPhotoId: portrait
      photos:
        - id: landscape
          src: ../assets/albums/landscape.png
          alt: 横向照片
          caption: 日常记录
          takenAt: "2026-10-11"
          location: 杭州
        - id: portrait
          src: ../assets/albums/portrait.png
          alt: 竖向照片
        - id: remote
          src: https://images.invalid/original.jpg
          thumbnail: https://images.invalid/preview.jpg
          alt: 远程照片
        - id: late
          src: https://images.invalid/late.jpg
          alt: 稍后加载的照片
    - id: hidden
      title: 不应公开的相册
      draft: true
    - id: first
      title: 排在最后的相册
      coverPhotoId: remote
      photos:
        - id: remote
          src: https://images.invalid/last.jpg
          alt: 最后一张
`);
    const bin = join(dirname(astroRequire.resolve("astro/package.json")), "bin/astro.mjs");
    const build = spawnSync(process.execPath, [bin, "build"], {
      cwd: fixture, windowsHide: true, encoding: "utf8", timeout: 90000,
      env: { ...process.env, NODE_ENV: "production", ASTRO_TELEMETRY_DISABLED: "1" },
    });
    if (build.status !== 0) throw new Error((build.error?.message ?? "") + build.stdout + build.stderr);
    const dist = join(fixture, "dist");
    const listing = await readFile(join(dist, "albums/index.html"), "utf8");
    const detail = await readFile(join(dist, "albums/second/index.html"), "utf8");
    expect(listing.indexOf("/albums/second")).toBeLessThan(listing.indexOf("/albums/first"));
    expect(listing).not.toContain("不应公开的相册");
    expect((await readdir(join(dist, "albums"))).sort()).toEqual(["first", "index.html", "second"]);
    expect(detail.indexOf('alt="横向照片"')).toBeLessThan(detail.indexOf('alt="竖向照片"'));
    expect(detail).toContain("https://images.invalid/preview.jpg");
    expect(detail).toContain('href="https://images.invalid/original.jpg"');
    expect(detail).toContain('loading="lazy"');
    expect(detail).toContain('data-photo-date="2026年10月11日"');
    expect(detail).toContain('rel="canonical" href="https://honestman.me/albums/second"');
    // AppShell is the only hydrated island; the photo wall and lightbox are static.
    expect([...detail.matchAll(/<astro-island\b/g)]).toHaveLength(1);
    const photoReferences = [...detail.matchAll(/(?:href|src|srcset)="([^"]+)"/g)]
      .flatMap(([, value]) => value.split(",").map((part) => part.trim().split(/\s+/)[0]))
      .filter((value) => value.startsWith("/_astro/") && /\.(png|webp)(?:$|\?)/.test(value));
    expect(photoReferences.some((value) => value.includes(".webp"))).toBe(true);
    expect(photoReferences.some((value) => value.includes(".png"))).toBe(true);
    for (const asset of photoReferences) expect((await readFile(join(dist, asset.slice(1)))).byteLength).toBeGreaterThan(0);
    const scriptReferences = (html) => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(([, src]) => src);
    const detailOnlyScripts = scriptReferences(detail).filter((src) => !scriptReferences(listing).includes(src));
    expect(detailOnlyScripts.length).toBeGreaterThan(0);
    const home = await readFile(join(dist, "index.html"), "utf8");
    expect(detailOnlyScripts.every((src) => !home.includes(src))).toBe(true);
    const homeCss = (await Promise.all([...home.matchAll(/<link\b[^>]*href="([^"<>]+\.css)"/g)].map(([, href]) => readFile(join(dist, href.slice(1)), "utf8")))).join("\n");
    expect(homeCss).not.toContain(".album-wall");
  } finally {
    if (!resolve(fixture).startsWith(resolve(cache) + sep)) throw new Error("临时构建目录越界");
    await rm(fixture, { recursive: true, force: true });
  }
}, 120000);
