import { z } from "zod";
import { languageIds } from "../../i18n/types";

export const languageSchema = z.enum(languageIds);
export const textSchema = z.string().trim().min(1);
export const httpUrlSchema = z
  .url()
  .refine((value) => /^https?:\/\//.test(value), "Use an HTTP(S) URL");
export const pageSizeSchema = z.number().int().min(1).max(48).default(6);
