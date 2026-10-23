import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { localWallpaperStorage, wallpaperFileError, MAX_WALLPAPER_BYTES } from './wallpaper-storage.ts';

it('stores, replaces, reads and removes an image in browser-local storage', async () => {
  await localWallpaperStorage.write(null);
  expect(await localWallpaperStorage.read()).toBeNull();
  await localWallpaperStorage.write(new Blob(['one'], { type: 'image/webp' }));
  expect(await (await localWallpaperStorage.read())?.text()).toBe('one');
  await localWallpaperStorage.write(new Blob(['two'], { type: 'image/png' }));
  expect(await (await localWallpaperStorage.read())?.text()).toBe('two');
  await localWallpaperStorage.write(null);
  expect(await localWallpaperStorage.read()).toBeNull();
});

it('rejects unsupported or oversized files before decoding or storing them', () => {
  expect(wallpaperFileError(new Blob(['png'], { type: 'image/png' }))).toBeNull();
  expect(wallpaperFileError(new Blob(['<svg/>'], { type: 'image/svg+xml' }))).toContain('JPG');
  expect(wallpaperFileError(new Blob(['<html/>'], { type: 'text/html' }))).toContain('JPG');
  expect(wallpaperFileError(new Blob([], { type: 'image/webp' }))).toContain('10 MB');
  expect(wallpaperFileError(new Blob([new Uint8Array(MAX_WALLPAPER_BYTES + 1)], { type: 'image/jpeg' }))).toContain('10 MB');
});
