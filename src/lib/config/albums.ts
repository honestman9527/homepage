import type { ImageMetadata } from "astro";
import { z } from "zod";
import { textSchema } from "./shared";

const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "请使用小写字母、数字和单连字符组成的稳定 ID");

export function albumsSchema(image: () => z.ZodType<ImageMetadata>) {
  // image() also accepts URL-shaped strings; guard the local branch before it.
  const source = z.union([
    z.url().refine((value) => value.startsWith("https://"), "远程照片必须使用 HTTPS"),
    z.string().regex(/^\.{1,2}\//, "本地照片路径须以 ./ 或 ../ 开头，相对于 albums.yaml")
      .pipe(image() as z.ZodType<ImageMetadata, string>),
  ]);
  const photo = z.object({
    id: idSchema,
    src: source,
    alt: textSchema,
    thumbnail: source.optional(),
    caption: textSchema.optional(),
    takenAt: z.iso.date().optional(),
    location: textSchema.optional(),
  }).strict();
  const album = z.object({
    id: idSchema,
    title: textSchema,
    description: textSchema.optional(),
    draft: z.boolean().default(false),
    coverPhotoId: idSchema.optional(),
    photos: z.array(photo).default([]),
  }).strict().superRefine((value, ctx) => {
    const ids = new Set<string>();
    value.photos.forEach((item, index) => {
      if (ids.has(item.id)) ctx.addIssue({ code: "custom", path: ["photos", index, "id"], message: `相册 ${value.id} 中照片 ID 重复：${item.id}` });
      ids.add(item.id);
    });
    if (!value.draft && !value.photos.length) ctx.addIssue({ code: "custom", path: ["photos"], message: "公开相册至少需要一张照片" });
    if (!value.draft && !value.coverPhotoId) ctx.addIssue({ code: "custom", path: ["coverPhotoId"], message: "公开相册必须指定封面照片" });
    if (value.coverPhotoId && !ids.has(value.coverPhotoId)) ctx.addIssue({ code: "custom", path: ["coverPhotoId"], message: `封面必须引用本相册的照片：${value.coverPhotoId}` });
  });
  return z.object({
    albums: z.object({
      items: z.array(album).superRefine((items, ctx) => {
        const ids = new Set<string>();
        items.forEach((item, index) => {
          if (ids.has(item.id)) ctx.addIssue({ code: "custom", path: [index, "id"], message: `相册 ID 重复：${item.id}` });
          ids.add(item.id);
        });
      }),
    }).strict(),
  }).strict();
}

export type Album = z.infer<ReturnType<typeof albumsSchema>>["albums"]["items"][number];
export type AlbumPhoto = Album["photos"][number];
export type PhotoSource = AlbumPhoto["src"];
