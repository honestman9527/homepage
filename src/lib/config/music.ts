import { z } from "zod";
import { publicPathSchema, textSchema } from "./shared";

const assetSchema = z.union([
  publicPathSchema.refine((value) => !/[\\\s]/.test(value), "Use an encoded public path"),
  z.url().refine((value) => value.startsWith("https://"), "Use an HTTPS URL"),
]);

export const musicTrackSchema = z.object({
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
  const sources = new Set<string>();
  tracks.forEach((track, index) => {
    if (sources.has(track.src))
      ctx.addIssue({ code: "custom", path: ["tracks", index, "src"], message: "Track sources must be unique" });
    sources.add(track.src);
  });
});

export type MusicTrack = z.infer<typeof musicTrackSchema>;
export type MusicConfig = z.infer<typeof musicSchema>;
