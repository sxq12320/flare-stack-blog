import { ClientOnly, useRouteContext } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Image as ImageIcon, MapPin, Pin, X } from "lucide-react";
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

  // Lightbox modal state
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

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-6 md:px-0 py-12 md:py-20 space-y-16">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-foreground flex items-center gap-3">
          <ImageIcon className="size-8 text-muted-foreground" />
          <span>{m.nav_album ? m.nav_album() : "相册"}</span>
        </h1>
        <p className="text-base text-muted-foreground font-light">
          记录生活点滴、日常随想与摄影瞬间。
        </p>
      </header>

      {/* Album Posts Feed */}
      {albums.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground font-light text-sm">
          暂无动态，期待博主的分享～
        </div>
      ) : (
        <div className="divide-y divide-border/40 space-y-12">
          {albums.map((item) => (
            <MomentCard
              key={item.id}
              album={item}
              authorName={siteConfig.author}
              onImageClick={(index) => openLightbox(item.media, index)}
            />
          ))}
        </div>
      )}

      {/* Pagination / Load more */}
      {hasNextPage && (
        <div className="pt-6 flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage?.()}
            disabled={isFetchingNextPage}
            className="px-6 py-2.5 rounded-full text-xs font-mono border border-border/60 hover:border-foreground/40 hover:bg-muted/30 transition-all disabled:opacity-50"
          >
            {isFetchingNextPage ? "加载中..." : "加载更多动态"}
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeGallery && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2 text-foreground/70 hover:text-foreground bg-muted/40 rounded-full transition-colors z-110"
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
                className="absolute left-6 p-3 text-foreground/70 hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-full transition-colors z-110"
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
                className="absolute right-6 p-3 text-foreground/70 hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-full transition-colors z-110"
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
              alt={
                activeGallery.images[activeGallery.index]?.fileName || "图片大图"
              }
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {activeGallery.images.length > 1 && (
              <span className="mt-4 text-xs font-mono text-muted-foreground">
                {activeGallery.index + 1} / {activeGallery.images.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MomentCard({
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
    <div className="pt-10 first:pt-0 flex gap-4 md:gap-5">
      {/* Avatar */}
      <div className="shrink-0">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-muted/70 border border-border/50 flex items-center justify-center font-serif text-sm font-semibold text-foreground/80 overflow-hidden">
          {authorName ? authorName.slice(0, 1).toUpperCase() : "A"}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3.5">
        {/* Author + Pin */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground tracking-tight">
            {authorName}
          </span>
          {isPinned && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/30">
              <Pin size={11} className="rotate-45" />
              置顶
            </span>
          )}
        </div>

        {/* Text Content */}
        <p className="text-sm md:text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
          {album.content}
        </p>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="pt-1">
            {images.length === 1 ? (
              <div className="max-w-md">
                <img
                  src={images[0].url}
                  alt={images[0].fileName || "相册照片"}
                  onClick={() => onImageClick(0)}
                  className="max-h-96 w-auto object-cover rounded-xl border border-border/30 cursor-pointer hover:opacity-95 transition-opacity"
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
                    className="aspect-square overflow-hidden rounded-lg border border-border/30 bg-muted/20 cursor-pointer group"
                    onClick={() => onImageClick(i)}
                  >
                    <img
                      src={img.url}
                      alt={img.fileName || "相册缩略图"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meta (Location + Time) */}
        <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground/60">
          <time dateTime={album.publishedAt?.toISOString?.()}>
            <ClientOnly fallback="-">
              {formatDate(album.publishedAt)}
            </ClientOnly>
          </time>

          {album.location && (
            <span className="flex items-center gap-1 text-muted-foreground/70">
              <MapPin size={12} />
              {album.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
