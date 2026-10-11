import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const walk = async (directory) => (await Promise.all((await readdir(directory, { withFileTypes: true }))
  .map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
const files = (await walk(dist)).map((file) => path.relative(dist, file).replaceAll("\\", "/"));
assert(files.includes("index.html"), "缺少 dist/index.html，请先运行 pnpm build");
assert(!files.some((file) => file.startsWith("_worker.js")), "静态部署产物不应包含 Worker 服务端入口");
const pages = files.filter((file) => file.endsWith(".html") && file !== "404.html");
const routeFor = (file) => "/" + file.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "");
const routes = new Set(pages.map(routeFor));
const assets = new Set();

// 选择可用端口，避免与开发者现有预览冲突。
const portProbe = createServer();
await new Promise((resolve, reject) => {
  portProbe.once("error", reject);
  portProbe.listen(0, "127.0.0.1", resolve);
});
const port = portProbe.address().port;
await new Promise((resolve, reject) => portProbe.close((error) => error ? reject(error) : resolve()));
const origin = `http://127.0.0.1:${port}`;
const require = createRequire(import.meta.url);
const wranglerPackage = require.resolve("wrangler/package.json");
const wranglerBin = path.resolve(path.dirname(wranglerPackage), require(wranglerPackage).bin.wrangler);
const worker = spawn(process.execPath, [wranglerBin, "dev", "--local", "--ip", "127.0.0.1", "--port", String(port)], {
  cwd: root,
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
});
let logs = "";
let spawnError;
let interrupted = false;
let exited = false;
const stopped = new Promise((resolve) => worker.once("exit", () => { exited = true; resolve(); }));
const stopWorker = () => {
  if (exited || !worker.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(worker.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
  } else {
    worker.kill("SIGTERM");
  }
};
const onSignal = () => { interrupted = true; stopWorker(); };
process.once("SIGINT", onSignal);
process.once("SIGTERM", onSignal);
worker.on("error", (error) => { spawnError = error; });
for (const stream of [worker.stdout, worker.stderr]) {
  stream.on("data", (chunk) => { logs = (logs + chunk).slice(-12000); });
}
const request = (route) => {
  assert(!interrupted, "Workers 验证已中断");
  return fetch(new URL(route, origin), { redirect: "manual", signal: AbortSignal.timeout(5000) });
};

try {
  const deadline = Date.now() + 45000;
  while (true) {
    assert(!interrupted, "Workers 验证已中断");
    if (spawnError) throw spawnError;
    assert(!exited, `Wrangler 提前退出：${worker.exitCode ?? worker.signalCode}`);
    try {
      if ((await request("/")).status === 200) break;
    } catch { /* 服务初始化期间重试。 */ }
    assert(Date.now() < deadline, "Workers 本地服务未在 45 秒内就绪");
    await delay(250);
  }

  for (const file of pages) {
    const route = routeFor(file);
    const response = await request(encodeURI(route));
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/, route);
    const html = await response.text();
    assert.equal(html, await readFile(path.join(dist, file), "utf8"), `${route} 应直接返回静态产物`);
    const references = [...html.matchAll(/(?:src|href)="([^"<>]+)"/g)].map(([, href]) => href);
    for (const [, value] of html.matchAll(/\bsrcset="([^"<>]+)"/g)) {
      references.push(...value.split(",").map((candidate) => candidate.trim().split(/\s+/)[0]));
    }
    for (const href of references) {
      const url = new URL(href.replaceAll("&amp;", "&"), new URL(encodeURI(route), origin));
      if (url.origin !== origin) continue;
      const pathname = decodeURIComponent(url.pathname);
      const normalized = pathname.replace(/\/+$/, "") || "/";
      assert(routes.has(normalized) || files.includes(pathname.slice(1)), `${route} 包含不存在的站内地址：${href}`);
      if (!routes.has(normalized)) assets.add(url.pathname);
    }
  }
  for (const asset of assets) {
    const response = await request(asset);
    assert.equal(response.status, 200, asset);
    if (asset.endsWith(".css")) assert.match(response.headers.get("content-type") ?? "", /text\/css/);
    if (asset.endsWith(".js")) assert.match(response.headers.get("content-type") ?? "", /javascript/);
    if (/\.(?:png|jpe?g|webp|avif|gif|svg)$/.test(asset)) assert.match(response.headers.get("content-type") ?? "", /^image\//, asset);
    await response.arrayBuffer();
  }
  for (const route of ["/__workers_verify_missing__", "/projects/__workers_verify_missing__", "/albums/__workers_verify_missing__", "/_astro/__workers_verify_missing__.css", "/en"]) {
    assert.equal((await request(route)).status, 404, route);
  }
  for (const route of routes) {
    if (route === "/") continue;
    const response = await request(encodeURI(`${route}/`));
    assert.equal(response.status, 307, `${route}/`);
    assert.equal(new URL(response.headers.get("location"), origin).pathname, encodeURI(route));
  }
  console.log(`Workers 静态验证通过：${pages.length} 个页面、${assets.size} 个资源，站内链接、末尾斜杠跳转及 404 正常。`);
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  if (!exited && worker.pid) {
    stopWorker();
    await Promise.race([stopped, delay(5000, undefined, { ref: false })]);
    if (!exited) worker.kill("SIGKILL");
  }
  process.removeListener("SIGINT", onSignal);
  process.removeListener("SIGTERM", onSignal);
}
