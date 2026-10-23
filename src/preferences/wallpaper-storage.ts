/** Images stay local. One transaction replaces the single stored wallpaper. */
export interface WallpaperStorage {
  read(): Promise<Blob | null>;
  write(image: Blob | null): Promise<void>;
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('honestos.images', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('wallpaper');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Image storage is blocked'));
  });
}
export const localWallpaperStorage: WallpaperStorage = {
  async read() {
    const db = await database();
    try {
      return await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction('wallpaper', 'readonly');
        const request = tx.objectStore('wallpaper').get('custom');
        request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  },
  async write(image) {
    const db = await database();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('wallpaper', 'readwrite');
        const store = tx.objectStore('wallpaper');
        if (image) store.put(image, 'custom'); else store.delete('custom');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  },
};
export const MAX_WALLPAPER_BYTES = 10 * 1024 * 1024;
export function wallpaperFileError(file: Blob): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) return '请选择 JPG、PNG、WebP 或 AVIF 图片。';
  if (!file.size || file.size > MAX_WALLPAPER_BYTES) return '请选择不超过 10 MB 的图片。';
  return null;
}
/** Check decoding before changing the desktop, so a corrupt image never becomes active. */
export async function verifyWallpaperImage(file: Blob): Promise<void> {
  const error = wallpaperFileError(file);
  if (error) throw new Error(error);
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('无法读取这张图片，请换一张。'));
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}
