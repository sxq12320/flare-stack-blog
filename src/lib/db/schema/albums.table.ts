import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createdAt, id, updatedAt } from "./helper";
import { MediaTable } from "./media.table";

export const ALBUM_STATUSES = ["draft", "published"] as const;
export type AlbumStatus = (typeof ALBUM_STATUSES)[number];

export const AlbumsTable = sqliteTable(
  "albums",
  {
    id,
    content: text().notNull(),
    location: text(),
    status: text("status", { enum: ALBUM_STATUSES })
      .notNull()
      .default("published"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    pinnedAt: integer("pinned_at", { mode: "timestamp" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("albums_published_at_idx").on(table.publishedAt, table.status),
    index("albums_created_at_idx").on(table.createdAt),
  ],
);

export const AlbumMediaTable = sqliteTable(
  "album_media",
  {
    albumId: integer("album_id")
      .notNull()
      .references(() => AlbumsTable.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => MediaTable.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.mediaId] }),
    index("album_media_album_idx").on(table.albumId),
    index("album_media_media_idx").on(table.mediaId),
  ],
);

// ==================== relations ====================
export const albumsRelations = relations(AlbumsTable, ({ many }) => ({
  albumMedia: many(AlbumMediaTable),
}));

export const albumMediaRelations = relations(AlbumMediaTable, ({ one }) => ({
  album: one(AlbumsTable, {
    fields: [AlbumMediaTable.albumId],
    references: [AlbumsTable.id],
  }),
  media: one(MediaTable, {
    fields: [AlbumMediaTable.mediaId],
    references: [MediaTable.id],
  }),
}));

// ==================== types ====================
export type Album = typeof AlbumsTable.$inferSelect;
export type NewAlbum = typeof AlbumsTable.$inferInsert;
export type AlbumMedia = typeof AlbumMediaTable.$inferSelect;
