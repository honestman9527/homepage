import { z } from "zod";
import { publicPathSchema, textSchema } from "./shared";

const assetSchema = z.union([
  publicPathSchema.refine((value) => !/[\\\s]/.test(value), "Use an encoded public path"),
  z.url().refine((value) => value.startsWith("https://"), "Use an HTTPS URL"),
]);

export const musicTrackSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a stable lowercase track ID"),
  title: textSchema,
  artist: textSchema,
  src: assetSchema,
  cover: assetSchema.optional(),
}).strict();

export const musicSchema = z.object({
  enabled: z.boolean().default(false),
  tracks: z.array(musicTrackSchema).default([]),
}).strict().superRefine(({ enabled, tracks }, ctx) => {
  if (enabled && !tracks.length)
    ctx.addIssue({ code: "custom", path: ["tracks"], message: "Enabled music needs at least one track" });
  const ids = new Set<string>();
  tracks.forEach((track, index) => {
    if (ids.has(track.id))
      ctx.addIssue({ code: "custom", path: ["tracks", index, "id"], message: "Track IDs must be unique" });
    ids.add(track.id);
  });
});

export type MusicTrack = z.infer<typeof musicTrackSchema>;
export type MusicConfig = z.infer<typeof musicSchema>;
