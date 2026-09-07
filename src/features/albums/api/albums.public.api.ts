import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GetAlbumsCursorInputSchema } from "@/features/albums/albums.schema";
import * as AlbumService from "@/features/albums/albums.service";
import { dbMiddleware } from "@/lib/middlewares";

export const getPublicAlbumsCursorFn = createServerFn()
  .middleware([dbMiddleware])
  .inputValidator(GetAlbumsCursorInputSchema)
  .handler(async ({ data, context }) => {
    return await AlbumService.getPublicAlbums(context, data);
  });

export const getRecentAlbumsFn = createServerFn()
  .middleware([dbMiddleware])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(50).optional() }))
  .handler(async ({ data, context }) => {
    return await AlbumService.getRecentAlbums(context, data.limit ?? 6);
  });
