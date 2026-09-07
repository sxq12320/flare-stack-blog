import { ClientOnly, useRouteContext } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Pin,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AlbumItem } from "@/features/albums/albums.schema";
import type { AlbumPageProps } from "@/features/theme/contract/pages";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";

export function AlbumPage({
  albums,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: AlbumPageProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });

  const [activeGallery, setActiveGallery] = useState<{
    images: Array<{ url: string; fileName?: string }>;
    index: number;
  } | null>(null);

  const openLightbox = (
    images: Array<{ url: string; fileName?: string }>,
    index: number,
  ) => {
    setActiveGallery({ images, index });
  };

  const closeLightbox = useCallback(() => {
    setActiveGallery(null);
  }, []);

  const prevImage = useCallback(() => {
    if (!activeGallery) return;
    setActiveGallery((prev) =>
      prev
        ? {
            ...prev,
            index: (prev.index - 1 + prev.images.length) % prev.images.length,
          }
        : null,
    );
  }, [activeGallery]);

  const nextImage = useCallback(() => {
    if (!activeGallery) return;
    setActiveGallery((prev) =>
      prev
        ? {
            ...prev,
            index: (prev.index + 1) % prev.images.length,
          }
        : null,
    );
  }, [activeGallery]);

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

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Banner */}
      <div
        className="fuwari-card-base p-6 md:p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-48 fuwari-onload-animation bg-linear-to-br from-(--fuwari-primary)/5 to-transparent"
        style={{ animationDelay: "150ms" }}
      >
        <div className="flex items-center gap-3 mb-2 z-10">
          <ImageIcon className="size-8 text-(--fuwari-primary)" />
          <h1 className="text-3xl md:text-4xl font-bold fuwari-text-90">
            {m.nav_album ? m.nav_album() : "相册"}
          </h1>
        </div>
        <p className="fuwari-text-50 text-center max-w-xl z-10">
          定格生活中的美好瞬间与摄影印记。
        </p>
      </div>

      {/* Feed Card */}
      <div
        className="fuwari-card-base p-6 md:p-8 fuwari-onload-animation flex-1"
        style={{ animationDelay: "300ms" }}
      >
        {albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 fuwari-text-30">
            <p className="text-lg">暂无相册动态</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/10 space-y-10">
            {albums.map((item) => (
              <FuwariMomentItem
                key={item.id}
                album={item}
                authorName={siteConfig.author}
                onImageClick={(index) => openLightbox(item.media, index)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {hasNextPage && (
          <div className="pt-8 flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage?.()}
              disabled={isFetchingNextPage}
              className="fuwari-btn-regular px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
            >
              {isFetchingNextPage ? "加载中..." : "加载更多"}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeGallery && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-110"
            aria-label="关闭"
          >
            <X size={22} />
          </button>

          {activeGallery.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-6 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-110"
                aria-label="上一张"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-6 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-110"
                aria-label="下一张"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div
            className="max-w-4xl max-h-[85vh] p-4 flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeGallery.images[activeGallery.index]?.url}
              alt={activeGallery.images[activeGallery.index]?.fileName || "相片"}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            {activeGallery.images.length > 1 && (
              <span className="mt-4 text-xs font-mono text-white/70">
                {activeGallery.index + 1} / {activeGallery.images.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FuwariMomentItem({
  album,
  authorName,
  onImageClick,
}: {
  album: AlbumItem;
  authorName: string;
  onImageClick: (index: number) => void;
}) {
  const images = album.media ?? [];
  const isPinned = !!album.pinnedAt;

  return (
    <div className="pt-8 first:pt-0 flex gap-4 md:gap-5">
      {/* Avatar */}
      <div className="shrink-0">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-(--fuwari-radius-medium) bg-(--fuwari-primary)/10 text-(--fuwari-primary) border border-(--fuwari-primary)/20 flex items-center justify-center font-bold text-sm overflow-hidden">
          {authorName ? authorName.slice(0, 1).toUpperCase() : "A"}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold fuwari-text-90 text-sm md:text-base">
            {authorName}
          </span>
          {isPinned && (
            <span className="flex items-center gap-1 text-xs text-(--fuwari-primary) bg-(--fuwari-primary)/10 px-2 py-0.5 rounded-md font-medium">
              <Pin size={11} className="rotate-45" />
              置顶
            </span>
          )}
        </div>

        <p className="text-sm md:text-[15px] leading-relaxed fuwari-text-75 whitespace-pre-wrap break-words">
          {album.content}
        </p>

        {/* Images */}
        {images.length > 0 && (
          <div className="pt-1">
            {images.length === 1 ? (
              <div className="max-w-md">
                <img
                  src={images[0].url}
                  alt={images[0].fileName || "照片"}
                  onClick={() => onImageClick(0)}
                  className="max-h-96 w-auto object-cover rounded-(--fuwari-radius-medium) border border-black/5 dark:border-white/10 cursor-pointer hover:opacity-95 transition-opacity"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className={`grid gap-2 max-w-lg ${
                  images.length === 2 || images.length === 4
                    ? "grid-cols-2 max-w-sm"
                    : "grid-cols-3"
                }`}
              >
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    className="aspect-square overflow-hidden rounded-(--fuwari-radius-medium) border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 cursor-pointer group"
                    onClick={() => onImageClick(i)}
                  >
                    <img
                      src={img.url}
                      alt={img.fileName || "照片缩略图"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Meta */}
        <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs fuwari-text-40">
          <time dateTime={album.publishedAt?.toISOString?.()}>
            <ClientOnly fallback="-">
              {formatDate(album.publishedAt)}
            </ClientOnly>
          </time>

          {album.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {album.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
