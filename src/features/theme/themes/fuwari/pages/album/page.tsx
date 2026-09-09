import { ClientOnly, useRouteContext } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Images,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pin,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import type { AlbumItem } from "@/features/albums/albums.schema";
import type { AlbumPageProps } from "@/features/theme/contract/pages";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";

/** 动态正文超过该长度时折叠，提供“全文/收起”切换 */
const CONTENT_COLLAPSE_LENGTH = 160;
/** 九宫格最多直接展示的图片数，超出部分以 +N 角标收起 */
const GRID_MAX_IMAGES = 9;

export function AlbumPage({
  albums,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: AlbumPageProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });

  const [activeGallery, setActiveGallery] = useState<{
    album: AlbumItem;
    index: number;
  } | null>(null);

  const openLightbox = (album: AlbumItem, index: number) => {
    setActiveGallery({ album, index });
  };

  const closeLightbox = useCallback(() => {
    setActiveGallery(null);
  }, []);

  const prevImage = useCallback(() => {
    setActiveGallery((prev) =>
      prev
        ? {
            ...prev,
            index:
              (prev.index - 1 + prev.album.media.length) %
              prev.album.media.length,
          }
        : null,
    );
  }, []);

  const nextImage = useCallback(() => {
    setActiveGallery((prev) =>
      prev
        ? { ...prev, index: (prev.index + 1) % prev.album.media.length }
        : null,
    );
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!activeGallery) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGallery, closeLightbox, prevImage, nextImage]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (!activeGallery) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [activeGallery]);

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

      {/* Moments feed */}
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
              onImageClick={(index) => openLightbox(item, index)}
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

      {/* Lightbox */}
      {activeGallery && (
        <Lightbox
          album={activeGallery.album}
          index={activeGallery.index}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
          onSelect={(i) =>
            setActiveGallery((prev) => (prev ? { ...prev, index: i } : null))
          }
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 单条动态卡片（朋友圈 / Facebook 风格）                                */
/* ------------------------------------------------------------------ */

function MomentCard({
  album,
  authorName,
  authorAvatar,
  onImageClick,
}: {
  album: AlbumItem;
  authorName: string;
  authorAvatar?: string;
  onImageClick: (index: number) => void;
}) {
  const images = album.media ?? [];
  const isPinned = !!album.pinnedAt;
  const [expanded, setExpanded] = useState(false);
  const isLongContent = album.content.length > CONTENT_COLLAPSE_LENGTH;

  return (
    <article className="fuwari-card-base p-5 md:p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30">
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

      {/* Text content with expand/collapse */}
      <div className="mb-1">
        <p
          className={`text-sm md:text-[15px] leading-relaxed fuwari-text-75 whitespace-pre-wrap break-words ${
            !expanded && isLongContent ? "line-clamp-4" : ""
          }`}
        >
          {album.content}
        </p>
        {isLongContent && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-sm text-(--fuwari-primary) hover:underline underline-offset-2 font-medium"
          >
            {expanded ? "收起" : "全文"}
          </button>
        )}
      </div>

      {/* Images: WeChat-style nine-grid */}
      {images.length > 0 && (
        <NineGrid images={images} onImageClick={onImageClick} />
      )}

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
        <span className="ml-auto fuwari-text-30">
          <ClientOnly fallback="">
            {formatDate(album.publishedAt)}
          </ClientOnly>
        </span>
      </footer>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* 九宫格图片布局                                                       */
/* ------------------------------------------------------------------ */

function NineGrid({
  images,
  onImageClick,
}: {
  images: AlbumItem["media"];
  onImageClick: (index: number) => void;
}) {
  const count = images.length;

  // 单图：按原始宽高比展示，避免裁切
  if (count === 1) {
    const img = images[0];
    const ratio =
      img.width && img.height ? `${img.width} / ${img.height}` : "4 / 3";
    return (
      <div className="pt-2 max-w-md">
        <button
          type="button"
          onClick={() => onImageClick(0)}
          className="block w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 cursor-zoom-in group"
          style={{ aspectRatio: ratio, maxHeight: "26rem" }}
          aria-label={img.fileName || "查看大图"}
        >
          <img
            src={img.url}
            alt={img.fileName || "照片"}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </button>
      </div>
    );
  }

  const gridClass =
    count === 2 || count === 4
      ? "grid-cols-2 max-w-md"
      : count === 3
        ? "grid-cols-3 max-w-lg"
        : "grid-cols-3 max-w-xl";

  const visible = images.slice(0, GRID_MAX_IMAGES);
  const hiddenCount = count - visible.length;

  return (
    <div className={`pt-2 grid gap-1.5 ${gridClass}`}>
      {visible.map((img, i) => {
        const isLastWithMore = hiddenCount > 0 && i === visible.length - 1;
        return (
          <button
            key={img.id}
            type="button"
            onClick={() => onImageClick(i)}
            className="relative aspect-square overflow-hidden rounded-lg border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 cursor-zoom-in group"
            aria-label={img.fileName || `第 ${i + 1} 张照片`}
          >
            <img
              src={img.url}
              alt={img.fileName || "照片缩略图"}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            {/* Hover veil */}
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            {/* +N overlay */}
            {isLastWithMore && (
              <span className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-white text-xl font-bold tracking-wide">
                  +{hiddenCount}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lightbox 大图浏览                                                    */
/* ------------------------------------------------------------------ */

function Lightbox({
  album,
  index,
  onClose,
  onPrev,
  onNext,
  onSelect,
}: {
  album: AlbumItem;
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  const images = album.media;
  const current = images[index];
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) onPrev();
      else onNext();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="图片浏览"
    >
      {/* Top bar: counter + close */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-4 z-110 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-sm font-mono text-white/80 tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>
      </div>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-3 md:left-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/25 rounded-full transition-all active:scale-90 z-110"
            aria-label="上一张"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-3 md:right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/25 rounded-full transition-all active:scale-90 z-110"
            aria-label="下一张"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Image + caption */}
      <div
        className="max-w-5xl max-h-[88vh] px-4 pt-14 pb-10 flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={current?.url}
          src={current?.url}
          alt={current?.fileName || "相片"}
          className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        />

        {/* Caption: location + date */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/60">
          {album.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {album.location}
            </span>
          )}
          <ClientOnly fallback="">
            {formatDate(album.publishedAt)}
          </ClientOnly>
        </div>

        {/* Dot indicators */}
        {images.length > 1 && images.length <= 12 && (
          <div className="mt-3 flex items-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(i);
                }}
                aria-label={`第 ${i + 1} 张`}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-5 h-1.5 bg-white"
                    : "size-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
