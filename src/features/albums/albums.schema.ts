import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { MediaTable } from "@/lib/db/schema";
import { AlbumsTable } from "@/lib/db/schema/albums.table";

const coercedDate = z.union([z.date(), z.string().pipe(z.coerce.date())]);
const coercedDateNullable = coercedDate.nullable();

export const AlbumSelectSchema = createSelectSchema(AlbumsTable, {
  publishedAt: coercedDateNullable,
  pinnedAt: coercedDateNullable,
  createdAt: coercedDate,
  updatedAt: coercedDate,
});

export const MediaItemSchema = createSelectSchema(MediaTable, {
  createdAt: coercedDate,
});

export const AlbumItemSchema = AlbumSelectSchema.extend({
  media: z.array(MediaItemSchema),
});

export const AlbumListResponseSchema = z.object({
  items: z.array(AlbumItemSchema),
  nextCursor: z.number().nullable(),
});

// === Inputs ===

export const GetAlbumsCursorInputSchema = z.object({
  cursor: z.number().optional(),
  limit: z.number().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const CreateAlbumInputSchema = z.object({
  content: z.string().min(1),
  location: z.string().max(100).optional(),
  mediaIds: z.array(z.number()).default([]),
  status: z.enum(["draft", "published"]).default("published"),
});

export const UpdateAlbumInputSchema = z.object({
  id: z.number(),
  content: z.string().min(1).optional(),
  location: z.string().max(100).optional().nullable(),
  mediaIds: z.array(z.number()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  pinnedAt: coercedDateNullable.optional(),
});

export const DeleteAlbumInputSchema = z.object({
  id: z.number(),
});

export const FindAlbumByIdInputSchema = z.object({
  id: z.number(),
});

// === Types ===
export type AlbumItem = z.infer<typeof AlbumItemSchema>;
export type AlbumListResponse = z.infer<typeof AlbumListResponseSchema>;
export type GetAlbumsCursorInput = z.infer<typeof GetAlbumsCursorInputSchema>;
export type CreateAlbumInput = z.infer<typeof CreateAlbumInputSchema>;
export type UpdateAlbumInput = z.infer<typeof UpdateAlbumInputSchema>;
export type DeleteAlbumInput = z.infer<typeof DeleteAlbumInputSchema>;

// === Cache Keys ===
export const ALBUMS_CACHE_KEYS = {
  list: (version: string, limit: number, cursor?: number) =>
    ["albums", "list", version, limit, cursor ?? 0] as const,
  recent: (version: string, limit: number) =>
    ["albums", "recent", version, limit] as const,
  detail: (id: number) => ["albums", "detail", id] as const,
} as const;
