import { z } from "zod";
import { httpUrlSchema, textSchema } from "./shared";

const commentPageSizeSchema = z.number().int().min(1).max(50).default(10);

export const commentsSchema = z
  .discriminatedUnion("provider", [
    z.object({ provider: z.literal("none") }).strict(),
    z
      .object({
        provider: z.literal("waline"),
        serverURL: httpUrlSchema,
        pageSize: commentPageSizeSchema,
        login: z.enum(["enable", "disable", "force"]).default("enable"),
      })
      .strict(),
    z
      .object({
        provider: z.literal("twikoo"),
        envId: textSchema,
        region: z.enum(["ap-shanghai", "ap-guangzhou"]).optional(),
      })
      .strict(),
  ])
  .default({ provider: "none" });

export type CommentsConfig = z.infer<typeof commentsSchema>;
