import { ClientOnly, Link, useRouteContext } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Images,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pin,
} from "lucide-react";
import { useState } from "react";
import type { AlbumItem } from "@/features/albums/albums.schema";
import type { AlbumPageProps } from "@/features/theme/contract/pages";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { AlbumLightbox } from "../../components/album/album-lightbox";
import { NineGrid } from "../../components/album/nine-grid";

export function AlbumPage({
  albums,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: AlbumPageProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const [activeAlbum, setActiveAlbum] = useState<AlbumItem | null>(null);

  const totalPhotos = albums.reduce(
    (sum, item) => sum + (item.media?.length ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Banner */}
      <div
        className="fuwari-card-base p-6 md:p-8 relative overflow-hidden fuwari-onload-animation"
        style={{ animationDelay: "150ms" }}
      >
        {/* Ambient decoration */}
        <div
          aria-hidden
          className="absolute -top-16 -right-16 size-56 rounded-full bg-(--fuwari-primary)/10 blur-2xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-10 size-48 rounded-full bg-(--fuwari-primary)/5 blur-2xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="size-11 rounded-xl bg-(--fuwari-primary)/10 text-(--fuwari-primary) flex items-center justify-center">
                <Images size={22} />
              </span>
              <h1 className="text-3xl md:text-4xl font-bold fuwari-text-90">
                {m.nav_album ? m.nav_album() : "相册"}
              </h1>
            </div>
            <p className="fuwari-text-50 max-w-xl">
              定格生活中的美好瞬间与摄影印记。
            </p>
          </div>

          {/* Stats */}
          {albums.length > 0 && (
            <div className="flex items-center gap-6 md:gap-8 md:pb-1">
              <div className="flex flex-col">
                <span className="text-2xl font-bold fuwari-text-90 tabular-nums">
                  {albums.length}
                  {hasNextPage ? "+" : ""}
                </span>
                <span className="text-xs fuwari-text-50">条动态</span>
              </div>
              <div className="w-px h-8 bg-black/10 dark:bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold fuwari-text-90 tabular-nums">
                  {totalPhotos}
                  {hasNextPage ? "+" : ""}
                </span>
                <span className="text-xs fuwari-text-50">张照片</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moments feed：点击条目直接放大 */}
      {albums.length === 0 ? (
        <div
          className="fuwari-card-base py-24 flex flex-col items-center justify-center gap-3 fuwari-text-30 fuwari-onload-animation"
          style={{ animationDelay: "300ms" }}
        >
          <ImageIcon size={40} strokeWidth={1.5} />
          <p className="text-lg">暂无相册动态</p>
          <p className="text-sm fuwari-text-30">期待博主的第一条分享～</p>
        </div>
      ) : (
        albums.map((item, i) => (
          <div
            key={item.id}
            className="fuwari-onload-animation"
            style={{
              animationDelay: `calc(250ms + ${Math.min(i, 8) * 60}ms)`,
            }}
          >
            <MomentCard
              album={item}
              authorName={siteConfig.author}
              authorAvatar={siteConfig.theme.fuwari.avatar}
              onOpen={() => setActiveAlbum(item)}
            />
          </div>
        ))
      )}

      {/* Pagination */}
      {hasNextPage && (
        <div className="pt-2 pb-4 flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage?.()}
            disabled={isFetchingNextPage}
            className="fuwari-btn-regular px-8 h-11 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60 transition-all active:scale-95"
          >
            {isFetchingNextPage && <Loader2 size={15} className="animate-spin" />}
            {isFetchingNextPage ? "加载中..." : "加载更多动态"}
          </button>
        </div>
      )}

      {/* 点击条目弹出的查看器 */}
      {activeAlbum && (
        <AlbumLightbox
          album={activeAlbum}
          authorName={siteConfig.author}
          authorAvatar={siteConfig.theme.fuwari.avatar}
          onClose={() => setActiveAlbum(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 单条动态卡片（点击直接弹出大图查看器）                                  */
/* ------------------------------------------------------------------ */

function MomentCard({
  album,
  authorName,
  authorAvatar,
  onOpen,
}: {
  album: AlbumItem;
  authorName: string;
  authorAvatar?: string;
  onOpen: () => void;
}) {
  const images = album.media ?? [];
  const isPinned = !!album.pinnedAt;

  return (
    <article
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="放大查看动态"
      className="fuwari-card-base p-5 md:p-6 border border-transparent cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 hover:border-(--fuwari-primary)/20 group"
    >
      {/* Header: avatar + author + date */}
      <header className="flex items-center gap-3 mb-3.5">
        <div className="size-11 rounded-full overflow-hidden shrink-0 ring-2 ring-(--fuwari-primary)/15 bg-(--fuwari-primary)/10 flex items-center justify-center">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="font-bold text-sm text-(--fuwari-primary)">
              {authorName ? authorName.slice(0, 1).toUpperCase() : "A"}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold fuwari-text-90 text-[15px] truncate">
              {authorName}
            </span>
            {isPinned && (
              <span className="flex items-center gap-1 text-[11px] text-(--fuwari-primary) bg-(--fuwari-primary)/10 px-2 py-0.5 rounded-full font-medium shrink-0">
                <Pin size={10} className="rotate-45" />
                置顶
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs fuwari-text-50 mt-0.5">
            <Calendar size={11} />
            <time dateTime={album.publishedAt?.toISOString?.()}>
              <ClientOnly fallback="-">
                {formatDate(album.publishedAt, { includeTime: true })}
              </ClientOnly>
            </time>
          </div>
        </div>
      </header>

      {/* Text content (truncated, full text in viewer / detail page) */}
      <p className="text-sm md:text-[15px] leading-relaxed fuwari-text-75 whitespace-pre-wrap break-words line-clamp-4 mb-1">
        {album.content}
      </p>

      {/* Images: nine-grid (non-interactive, whole card opens the viewer) */}
      {images.length > 0 && <NineGrid images={images} interactive={false} />}

      {/* Footer meta */}
      <footer className="mt-4 pt-3.5 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs fuwari-text-50">
        {album.location && (
          <span className="flex items-center gap-1 text-(--fuwari-primary)/80">
            <MapPin size={12} />
            {album.location}
          </span>
        )}
        {images.length > 0 && (
          <span className="flex items-center gap-1">
            <ImageIcon size={12} />
            共 {images.length} 张
          </span>
        )}
        <Link
          to="/album/$id"
          params={{ id: String(album.id) }}
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex items-center gap-1 font-medium fuwari-text-30 hover:text-(--fuwari-primary) transition-colors"
        >
          查看详情
          <ArrowRight
            size={12}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      </footer>
    </article>
  );
}
