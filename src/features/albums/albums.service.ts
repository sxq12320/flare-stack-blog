import * as CacheService from "@/features/cache/cache.service";
import { purgeCDNCache } from "@/lib/invalidate";
import type {
  CreateAlbumInput,
  DeleteAlbumInput,
  GetAlbumsCursorInput,
  UpdateAlbumInput,
} from "./albums.schema";
import { ALBUMS_CACHE_KEYS, AlbumItemSchema, AlbumListResponseSchema } from "./albums.schema";
import * as AlbumRepo from "./data/albums.data";

function invalidateCache(
  context: DbContext & { executionCtx?: ExecutionContext },
) {
  if (context.executionCtx) {
    context.executionCtx.waitUntil(
      Promise.all([
        CacheService.bumpVersion(context, "albums:list"),
        purgeCDNCache(context.env, {
          urls: ["/album", "/"],
        }),
      ]),
    );
  }
}

// ============ Public Methods ============

export async function getPublicAlbums(
  context: DbContext & { executionCtx: ExecutionContext },
  input: GetAlbumsCursorInput,
) {
  const fetcher = async () => {
    try {
      return await AlbumRepo.getAlbumsCursor(context.db, {
        cursor: input.cursor,
        limit: input.limit ?? 12,
        publicOnly: true,
      });
    } catch (err) {
      console.error("Failed to fetch public albums:", err);
      return { items: [], nextCursor: null };
    }
  };

  try {
    return await CacheService.getVersioned(
      context,
      "albums:list",
      (version) => ALBUMS_CACHE_KEYS.list(version, input.limit ?? 12, input.cursor),
      AlbumListResponseSchema,
      fetcher,
      { ttl: "1h" },
    );
  } catch (err) {
    console.error("Cache getVersioned failed, falling back to fetcher:", err);
    return await fetcher();
  }
}

export async function getRecentAlbums(
  context: DbContext & { executionCtx: ExecutionContext },
  limit = 6,
) {
  const fetcher = async () => {
    try {
      return await AlbumRepo.getRecentAlbums(context.db, limit);
    } catch (err) {
      console.error("Failed to fetch recent albums:", err);
      return [];
    }
  };

  try {
    return await CacheService.getVersioned(
      context,
      "albums:list",
      (version) => ALBUMS_CACHE_KEYS.recent(version, limit),
      AlbumListResponseSchema.shape.items,
      fetcher,
      { ttl: "1h" },
    );
  } catch (err) {
    console.error("Cache getVersioned failed, falling back to fetcher:", err);
    return await fetcher();
  }
}

// ============ Admin Methods ============

export async function getAllAlbumsAdmin(
  context: DbContext,
  input: GetAlbumsCursorInput,
) {
  return await AlbumRepo.getAlbumsCursor(context.db, {
    cursor: input.cursor,
    limit: input.limit ?? 20,
    status: input.status,
    publicOnly: false,
  });
}

export async function createAlbum(
  context: DbContext & { executionCtx?: ExecutionContext },
  input: CreateAlbumInput,
) {
  const album = await AlbumRepo.insertAlbum(context.db, {
    content: input.content,
    location: input.location,
    status: input.status,
    mediaIds: input.mediaIds,
  });

  invalidateCache(context);

  return album;
}

export async function updateAlbum(
  context: DbContext & { executionCtx?: ExecutionContext },
  input: UpdateAlbumInput,
) {
  const album = await AlbumRepo.updateAlbum(context.db, input.id, {
    content: input.content,
    location: input.location,
    status: input.status,
    pinnedAt: input.pinnedAt ? new Date(input.pinnedAt) : input.pinnedAt,
    mediaIds: input.mediaIds,
  });

  invalidateCache(context);

  return album;
}

export async function deleteAlbum(
  context: DbContext & { executionCtx?: ExecutionContext },
  input: DeleteAlbumInput,
) {
  const success = await AlbumRepo.deleteAlbum(context.db, input.id);

  invalidateCache(context);

  return { success };
}
