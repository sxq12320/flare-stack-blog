import type { AlbumItem } from "@/features/albums/albums.schema";

export interface AlbumPageProps {
  albums: Array<AlbumItem>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export interface AlbumDetailPageProps {
  album: AlbumItem;
}
