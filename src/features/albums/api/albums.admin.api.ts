import { createServerFn } from "@tanstack/react-start";
import {
  CreateAlbumInputSchema,
  DeleteAlbumInputSchema,
  GetAlbumsCursorInputSchema,
  UpdateAlbumInputSchema,
} from "@/features/albums/albums.schema";
import * as AlbumService from "@/features/albums/albums.service";
import { adminMiddleware } from "@/lib/middlewares";

export const getAllAlbumsAdminFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(GetAlbumsCursorInputSchema)
  .handler(async ({ data, context }) => {
    return await AlbumService.getAllAlbumsAdmin(context, data);
  });

export const createAlbumFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(CreateAlbumInputSchema)
  .handler(async ({ data, context }) => {
    return await AlbumService.createAlbum(context, data);
  });

export const updateAlbumFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(UpdateAlbumInputSchema)
  .handler(async ({ data, context }) => {
    return await AlbumService.updateAlbum(context, data);
  });

export const deleteAlbumFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(DeleteAlbumInputSchema)
  .handler(async ({ data, context }) => {
    return await AlbumService.deleteAlbum(context, data);
  });
