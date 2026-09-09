import { ClientOnly, Link, useRouteContext } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Pin,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AlbumDetailPageProps } from "@/features/theme/contract/pages";
import { formatDate } from "@/lib/utils";

export function AlbumDetailPage({ album }: AlbumDetailPageProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const authorName = siteConfig.author;
  const images = album.media ?? [];
  const isPinned = !!album.pinnedAt;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setActiveIndex(null), []);

  const prevImage = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null ? null : (prev - 1 + images.length) % images.length,
    );
  }, [images.length]);

  const nextImage = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null ? null : (prev + 1) % images.length,
    );
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, closeLightbox, prevImage, nextImage]);

  useEffect(() => {
    if (activeIndex === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [activeIndex]);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-6 md:px-0 py-12 md:py-20 space-y-10">
      {/* Back navigation */}
      <div>
        <Link
          to="/album"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          返回相册
        </Link>
      </div>

      <article className="space-y-8">
        {/* Author header */}
        <header className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-muted/70 border border-border/50 flex items-center justify-center font-serif text-sm font-semibold text-foreground/80 overflow-hidden shrink-0">
            {authorName ? authorName.slice(0, 1).toUpperCase() : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
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
            <time
              dateTime={album.publishedAt?.toISOString?.()}
              className="text-xs font-mono text-muted-foreground/60"
            >
              <ClientOnly fallback="-">
                {formatDate(album.publishedAt, { includeTime: true })}
              </ClientOnly>
            </time>
          </div>
        </header>

        {/* Full content */}
        <p className="text-base md:text-lg leading-relaxed text-foreground/90 font-light whitespace-pre-wrap break-words">
          {album.content}
        </p>

        {/* Images */}
        {images.length > 0 && (
          <div className="space-y-3">
            {images.length === 1 ? (
              <img
                src={images[0].url}
                alt={images[0].fileName || "相册照片"}
                onClick={() => setActiveIndex(0)}
                className="max-h-[32rem] w-auto object-cover rounded-xl border border-border/30 cursor-zoom-in hover:opacity-95 transition-opacity"
                loading="lazy"
              />
            ) : (
              <div
                className={`grid gap-2 ${
                  images.length === 2 || images.length === 4
                    ? "grid-cols-2 max-w-lg"
                    : "grid-cols-3"
                }`}
              >
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    className="aspect-square overflow-hidden rounded-lg border border-border/30 bg-muted/20 cursor-zoom-in group"
                    onClick={() => setActiveIndex(i)}
                  >
                    <img
                      src={img.url}
                      alt={img.fileName || "相册照片"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meta footer */}
        <footer className="pt-6 border-t border-border/40 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground/60">
          {album.location && (
            <span className="flex items-center gap-1 text-muted-foreground/70">
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
        </footer>
      </article>

      {/* Lightbox */}
      {activeIndex !== null && images[activeIndex] && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="图片浏览"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2 text-foreground/70 hover:text-foreground bg-muted/40 rounded-full transition-colors z-110"
            aria-label="关闭"
          >
            <X size={22} />
          </button>

          {images.length > 1 && (
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
              src={images[activeIndex].url}
              alt={images[activeIndex].fileName || "图片大图"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {images.length > 1 && (
              <span className="mt-4 text-xs font-mono text-muted-foreground">
                {activeIndex + 1} / {images.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
