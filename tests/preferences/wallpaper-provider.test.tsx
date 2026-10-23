// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { verifyWallpaperImage } from '../../src/preferences/wallpaper-storage.ts';
import {
  PreferencesProvider,
  defaultPreferences,
  usePreferences,
} from '../../src/preferences/index.ts';
import type { WallpaperStorage } from '../../src/preferences/wallpaper-storage.ts';

const revoke = vi.fn();
let counter = 0;
beforeEach(() => {
  const NativeURL = URL;
  vi.stubGlobal(
    'URL',
    class extends NativeURL {
      static createObjectURL() {
        return `blob:local-image-${counter++}`;
      }
      static revokeObjectURL = revoke;
    },
  );
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  revoke.mockClear();
});
const file = () => new Blob(['local-image'], { type: 'image/webp' });
function Probe() {
  const preferences = usePreferences();
  return (
    <>
      <output aria-label="图片状态">
        {preferences.imageStatus}:{String(preferences.preferences.customWallpaper)}
      </output>
      <output aria-label="图片地址">{preferences.customImage}</output>
      <button
        onClick={() => {
          void preferences.uploadWallpaper(file());
        }}
      >
        上传
      </button>
      <button onClick={() => preferences.reset()}>恢复默认</button>
      <button onClick={() => preferences.setWallpaper('day')}>内置壁纸</button>
      <button onClick={() => preferences.update({ customWallpaper: true })}>自选图片</button>
    </>
  );
}

it('restores a saved local image, switches between it and built-ins, and deletes it on reset', async () => {
  const write = vi.fn<WallpaperStorage['write']>().mockResolvedValue();
  const imageStorage = { read: async () => file(), write };
  render(
    <PreferencesProvider
      storage={{
        getItem: () => JSON.stringify({ ...defaultPreferences, customWallpaper: true }),
        setItem() {},
      }}
      motionQuery={null}
      imageStorage={imageStorage}
    >
      <Probe />
    </PreferencesProvider>,
  );
  await waitFor(() => expect(screen.getByLabelText('图片地址').textContent).toMatch(/^blob:/));
  const previous = screen.getByLabelText('图片地址').textContent;
  fireEvent.click(screen.getByText('内置壁纸'));
  expect(screen.getByLabelText('图片状态').textContent).toBe('saved:false');
  fireEvent.click(screen.getByText('自选图片'));
  expect(screen.getByLabelText('图片地址').textContent).toBe(previous);
  fireEvent.click(screen.getByText('恢复默认'));
  await waitFor(() => expect(write).toHaveBeenCalledWith(null));
  expect(screen.getByLabelText('图片地址').textContent).toBe('');
  expect(revoke).toHaveBeenCalledWith(previous);
});

it('keeps the selected image for the session and reports a storage failure', async () => {
  const write = vi.fn<WallpaperStorage['write']>().mockRejectedValue(new Error('quota'));
  render(
    <PreferencesProvider
      storage={null}
      motionQuery={null}
      imageStorage={{ read: async () => null, write }}
    >
      <Probe />
    </PreferencesProvider>,
  );
  fireEvent.click(screen.getByText('上传'));
  await waitFor(() => {
    expect(screen.getByLabelText('图片状态').textContent).toBe('unavailable:true');
    expect(screen.getByLabelText('图片地址').textContent).toMatch(/^blob:/);
  });
  expect(write).toHaveBeenCalledOnce();
});

it('serializes a pending upload and reset so an older image cannot reappear after resetting', async () => {
  let finish!: () => void;
  const stored: (Blob | null)[] = [];
  const write = vi.fn<WallpaperStorage['write']>().mockImplementation(async (image) => {
    if (image)
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
    stored.push(image);
  });
  render(
    <PreferencesProvider
      storage={null}
      motionQuery={null}
      imageStorage={{ read: async () => null, write }}
    >
      <Probe />
    </PreferencesProvider>,
  );
  fireEvent.click(screen.getByText('上传'));
  await waitFor(() => expect(write).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByText('恢复默认'));
  await act(async () => finish());
  await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
  expect(stored.at(-1)).toBeNull();
  expect(screen.getByLabelText('图片状态').textContent).toBe('saved:false');
  expect(screen.getByLabelText('图片地址').textContent).toBe('');
});

it('does not let a late image read overwrite a new upload', async () => {
  let restored!: (image: Blob) => void;
  const write = vi.fn<WallpaperStorage['write']>().mockResolvedValue();
  const imageStorage = {
    read: () =>
      new Promise<Blob>((resolve) => {
        restored = resolve;
      }),
    write,
  };
  render(
    <PreferencesProvider
      storage={{
        getItem: () => JSON.stringify({ ...defaultPreferences, customWallpaper: true }),
        setItem() {},
      }}
      motionQuery={null}
      imageStorage={imageStorage}
    >
      <Probe />
    </PreferencesProvider>,
  );
  fireEvent.click(screen.getByText('上传'));
  await waitFor(() => expect(write).toHaveBeenCalledOnce());
  await waitFor(() => expect(screen.getByLabelText('图片地址').textContent).toMatch(/^blob:/));
  const current = screen.getByLabelText('图片地址').textContent;
  await act(async () => restored(file()));
  expect(screen.getByLabelText('图片地址').textContent).toBe(current);
});

it('rejects an undecodable image and releases its temporary URL', async () => {
  vi.stubGlobal(
    'Image',
    class {
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    },
  );
  await expect(verifyWallpaperImage(file())).rejects.toThrow('无法读取');
  expect(revoke).toHaveBeenCalledOnce();
});
