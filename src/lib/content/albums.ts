import { getEntry } from "astro:content";
import { albumPath } from "../../config/routes";
import type { Album, PhotoSource } from "../config/albums";

export function selectAlbums(albums: readonly Album[]) {
  return albums.filter((album) => !album.draft).map((album) => {
    const cover = album.photos.find((photo) => photo.id === album.coverPhotoId);
    if (!cover) throw new Error(`相册 ${album.id} 缺少有效封面照片`);
    return { ...album, cover, href: albumPath(album.id) };
  });
}

export async function getAlbumItems() {
  const entry = await getEntry("albums", "albums");
  if (!entry) throw new Error("src/data/albums.yaml 必须包含 albums 配置");
  return selectAlbums(entry.data.albums.items);
}

export async function getAlbumPaths() {
  return (await getAlbumItems()).map((album) => ({ params: { id: album.id }, props: { album } }));
}

export function photoUrl(source: PhotoSource) {
  return typeof source === "string" ? source : source.src;
}

export type AlbumItem = ReturnType<typeof selectAlbums>[number];
