import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getAllAlbumsAdminFn } from "../api/albums.admin.api";
import {
  getPublicAlbumsCursorFn,
  getRecentAlbumsFn,
} from "../api/albums.public.api";

export const ALBUMS_KEYS = {
  all: ["albums"] as const,
  lists: ["albums", "list"] as const,
  recent: ["albums", "recent"] as const,
  admin: ["albums", "admin"] as const,

  list: (limit = 12) => ["albums", "list", { limit }] as const,
  adminList: (limit = 20) => ["albums", "admin", { limit }] as const,
  recentQuery: (limit = 6) => ["albums", "recent", { limit }] as const,
};

export function recentAlbumsQuery(limit = 6) {
  return queryOptions({
    queryKey: ALBUMS_KEYS.recentQuery(limit),
    queryFn: async () => {
      return await getRecentAlbumsFn({ data: { limit } });
    },
  });
}

export function albumsInfiniteQueryOptions(limit = 12) {
  return infiniteQueryOptions({
    queryKey: ALBUMS_KEYS.list(limit),
    queryFn: async ({ pageParam }) => {
      return await getPublicAlbumsCursorFn({
        data: {
          cursor: pageParam,
          limit,
        },
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as number | undefined,
  });
}

export function adminAlbumsInfiniteQueryOptions(limit = 20) {
  return infiniteQueryOptions({
    queryKey: ALBUMS_KEYS.adminList(limit),
    queryFn: async ({ pageParam }) => {
      return await getAllAlbumsAdminFn({
        data: {
          cursor: pageParam,
          limit,
        },
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as number | undefined,
  });
}
