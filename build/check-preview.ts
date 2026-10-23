import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { preview } from 'vite';

// Exercise the actual Cloudflare preview after a build, including its runtime.
// Unit tests cannot catch incompatible Vite-plugin / Miniflare versions here.
const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
try {
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const origin = `http://127.0.0.1:${address.port}`;
  const html = await readFile('dist/index.html', 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]!);
  const paths = ['/', '/avatar.webp', '/hm-light.svg', '/hm-dark.svg', '/favicon.svg', ...assets];
  await Promise.all(paths.map(async path => {
    const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200, path);
    const expected = await readFile(path === '/' ? 'dist/index.html' : `dist${path}`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected, path);
  }));
  for (const path of ['/wrangler.json', '/missing-asset']) {
    const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 404, path);
    await response.body?.cancel();
  }
  console.log(`Cloudflare preview: ${paths.length} built assets verified; configuration and missing paths return 404.`);
} finally {
  await server.close();
}
