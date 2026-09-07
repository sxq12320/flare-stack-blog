import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
import type { AlbumItem } from "@/features/albums/albums.schema";
import type { AlbumStatus } from "@/lib/db/schema";
import { AlbumMediaTable, AlbumsTable, MediaTable } from "@/lib/db/schema";

const DEFAULT_PAGE_SIZE = 12;

export async function insertAlbum(
  db: DB,
  data: {
    content: string;
    location?: string | null;
    status?: AlbumStatus;
    publishedAt?: Date | null;
    pinnedAt?: Date | null;
    mediaIds?: number[];
  },
): Promise<AlbumItem> {
  const publishedAt =
    data.publishedAt ?? (data.status === "published" ? new Date() : null);

  const [album] = await db
    .insert(AlbumsTable)
    .values({
      content: data.content,
      location: data.location ?? null,
      status: data.status ?? "published",
      publishedAt,
      pinnedAt: data.pinnedAt ?? null,
    })
    .returning();

  if (data.mediaIds && data.mediaIds.length > 0) {
    const mediaInserts = data.mediaIds.map((mediaId, sortOrder) => ({
      albumId: album.id,
      mediaId,
      sortOrder,
    }));
    await db.insert(AlbumMediaTable).values(mediaInserts);
  }

  return (await findAlbumById(db, album.id))!;
}

export async function findAlbumById(
  db: DB,
  id: number,
): Promise<AlbumItem | null> {
  const [album] = await db
    .select()
    .from(AlbumsTable)
    .where(eq(AlbumsTable.id, id));

  if (!album) return null;

  const mediaRows = await db
    .select({
      id: MediaTable.id,
      key: MediaTable.key,
      url: MediaTable.url,
      fileName: MediaTable.fileName,
      width: MediaTable.width,
      height: MediaTable.height,
      mimeType: MediaTable.mimeType,
      sizeInBytes: MediaTable.sizeInBytes,
      createdAt: MediaTable.createdAt,
    })
    .from(AlbumMediaTable)
    .innerJoin(MediaTable, eq(AlbumMediaTable.mediaId, MediaTable.id))
    .where(eq(AlbumMediaTable.albumId, id))
    .orderBy(asc(AlbumMediaTable.sortOrder));

  return {
    ...album,
    media: mediaRows,
  };
}

export async function getAlbumsCursor(
  db: DB,
  options: {
    cursor?: number;
    limit?: number;
    status?: AlbumStatus;
    publicOnly?: boolean;
  } = {},
): Promise<{
  items: Array<AlbumItem>;
  nextCursor: number | null;
}> {
  const { cursor, limit = DEFAULT_PAGE_SIZE, status, publicOnly = false } = options;

  const conditions = [];

  if (publicOnly) {
    conditions.push(eq(AlbumsTable.status, "published"));
    conditions.push(
      or(
        sql`${AlbumsTable.publishedAt} IS NULL`,
        sql`${AlbumsTable.publishedAt} <= unixepoch()`,
      ),
    );
  } else if (status) {
    conditions.push(eq(AlbumsTable.status, status));
  }

  if (cursor) {
    const reference = await db.query.AlbumsTable.findFirst({
      where: eq(AlbumsTable.id, cursor),
      columns: { publishedAt: true, id: true },
    });

    if (reference?.publishedAt) {
      conditions.push(
        or(
          lt(AlbumsTable.publishedAt, reference.publishedAt),
          and(
            eq(AlbumsTable.publishedAt, reference.publishedAt),
            lt(AlbumsTable.id, reference.id),
          ),
        ),
      );
    } else {
      conditions.push(lt(AlbumsTable.id, cursor));
    }
  }

  const itemsWithPotentialNext = await db
    .select()
    .from(AlbumsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      desc(AlbumsTable.pinnedAt),
      desc(AlbumsTable.publishedAt),
      desc(AlbumsTable.id),
    )
    .limit(limit + 1);

  const hasMore = itemsWithPotentialNext.length > limit;
  const albumRows = itemsWithPotentialNext.slice(0, limit);

  if (albumRows.length === 0) {
    return { items: [], nextCursor: null };
  }

  const albumIds = albumRows.map((a) => a.id);
  const mediaRows = await db
    .select({
      albumId: AlbumMediaTable.albumId,
      media: {
        id: MediaTable.id,
        key: MediaTable.key,
        url: MediaTable.url,
        fileName: MediaTable.fileName,
        width: MediaTable.width,
        height: MediaTable.height,
        mimeType: MediaTable.mimeType,
        sizeInBytes: MediaTable.sizeInBytes,
        createdAt: MediaTable.createdAt,
      },
    })
    .from(AlbumMediaTable)
    .innerJoin(MediaTable, eq(AlbumMediaTable.mediaId, MediaTable.id))
    .where(inArray(AlbumMediaTable.albumId, albumIds))
    .orderBy(asc(AlbumMediaTable.sortOrder));

  const mediaByAlbumId = new Map<number, typeof mediaRows[0]["media"][]>();
  for (const row of mediaRows) {
    const list = mediaByAlbumId.get(row.albumId) ?? [];
    list.push(row.media);
    mediaByAlbumId.set(row.albumId, list);
  }

  const items: Array<AlbumItem> = albumRows.map((album) => ({
    ...album,
    media: mediaByAlbumId.get(album.id) ?? [],
  }));

  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor };
}

export async function getRecentAlbums(
  db: DB,
  limit = 6,
): Promise<Array<AlbumItem>> {
  try {
    const res = await getAlbumsCursor(db, {
      limit,
      publicOnly: true,
    });
    return res.items;
  } catch (err) {
    console.error("getRecentAlbums failed:", err);
    return [];
  }
}

export async function updateAlbum(
  db: DB,
  id: number,
  data: {
    content?: string;
    location?: string | null;
    status?: AlbumStatus;
    publishedAt?: Date | null;
    pinnedAt?: Date | null;
    mediaIds?: number[];
  },
): Promise<AlbumItem | null> {
  const updateFields: Partial<typeof AlbumsTable.$inferInsert> = {};
  if (data.content !== undefined) updateFields.content = data.content;
  if (data.location !== undefined) updateFields.location = data.location;
  if (data.status !== undefined) {
    updateFields.status = data.status;
    if (data.status === "published" && !data.publishedAt) {
      updateFields.publishedAt = new Date();
    }
  }
  if (data.publishedAt !== undefined) updateFields.publishedAt = data.publishedAt;
  if (data.pinnedAt !== undefined) updateFields.pinnedAt = data.pinnedAt;

  if (Object.keys(updateFields).length > 0) {
    await db
      .update(AlbumsTable)
      .set(updateFields)
      .where(eq(AlbumsTable.id, id));
  }

  if (data.mediaIds !== undefined) {
    await db.delete(AlbumMediaTable).where(eq(AlbumMediaTable.albumId, id));
    if (data.mediaIds.length > 0) {
      const inserts = data.mediaIds.map((mediaId, sortOrder) => ({
        albumId: id,
        mediaId,
        sortOrder,
      }));
      await db.insert(AlbumMediaTable).values(inserts);
    }
  }

  return await findAlbumById(db, id);
}

export async function deleteAlbum(db: DB, id: number): Promise<boolean> {
  const [deleted] = await db
    .delete(AlbumsTable)
    .where(eq(AlbumsTable.id, id))
    .returning({ id: AlbumsTable.id });
  return !!deleted;
}

export async function getAlbumsCount(
  db: DB,
  options: { status?: AlbumStatus; publicOnly?: boolean } = {},
): Promise<number> {
  const conditions = [];
  if (options.publicOnly) {
    conditions.push(eq(AlbumsTable.status, "published"));
    conditions.push(
      sql`${AlbumsTable.publishedAt} <= ${Math.floor(Date.now() / 1000)}`,
    );
  } else if (options.status) {
    conditions.push(eq(AlbumsTable.status, options.status));
  }

  const [row] = await db
    .select({ count: count() })
    .from(AlbumsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return row?.count ?? 0;
}
