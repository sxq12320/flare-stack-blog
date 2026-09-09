import { ClientOnly } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Images,
  MapPin,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import type { AlbumItem } from "@/features/albums/albums.schema";
import { formatDate } from "@/lib/utils";

interface AlbumLightboxProps {
  album: AlbumItem;
  initialIndex?: number;
  authorName: string;
  authorAvatar?: string;
  onClose: () => void;
}

/**
 * 小红书 / Facebook 风格照片弹窗。
 * 居中浮动卡片：左侧黑色看图区（箭头 + 圆点），右侧信息栏
 * （作者、正文、定位日期、缩略图跳页）。点击遮罩关闭，
 * 键盘左右键 / 触屏滑动切换。
 */
export function AlbumLightbox({
  album,
  initialIndex = 0,
  authorName,
  authorAvatar,
  onClose,
}: AlbumLightboxProps) {
  const images = album.media;
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const prevImage = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const nextImage = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, prevImage, nextImage]);

  // Lock body scroll while open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prevImage();
      else nextImage();
    }
    touchStartX.current = null;
  };

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="图片浏览"
    >
      {/* Floating card */}
      <div
        className="relative w-full max-w-5xl h-[88vh] md:h-[82vh] md:max-h-[720px] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-(--fuwari-card-bg) animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== 左侧看图区 ===== */}
        <div
          className="relative shrink-0 h-[45%] md:h-auto md:flex-1 md:min-w-0 bg-black flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Counter */}
          {images.length > 1 && (
            <span className="absolute top-3 left-4 z-20 text-xs font-medium text-white/70 tabular-nums select-none">
              {index + 1} / {images.length}
            </span>
          )}

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 z-20 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="关闭"
          >
            <X size={18} />
          </button>

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 z-20 size-9 flex items-center justify-center text-white/85 bg-neutral-800/70 hover:bg-neutral-700 rounded-full shadow-lg transition-all active:scale-90"
                aria-label="上一张"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 z-20 size-9 flex items-center justify-center text-white/85 bg-neutral-800/70 hover:bg-neutral-700 rounded-full shadow-lg transition-all active:scale-90"
                aria-label="下一张"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Image */}
          <img
            key={current?.url}
            src={current?.url}
            alt={current?.fileName || "相片"}
            className="max-w-full max-h-full w-auto h-auto object-contain select-none animate-in fade-in zoom-in-95 duration-200"
            draggable={false}
          />

          {/* Dots (mobile only, desktop 用缩略图) */}
          {images.length > 1 && images.length <= 12 && (
            <div className="md:hidden absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  aria-label={`第 ${i + 1} 张`}
                  className={`rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-4 h-1.5 bg-white"
                      : "size-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ===== 右侧信息栏 ===== */}
        <div className="flex-1 md:flex-none md:w-[340px] lg:w-[380px] min-h-0 flex flex-col border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10">
          {/* Author header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/5 dark:border-white/10 shrink-0">
            <div className="size-10 rounded-full overflow-hidden shrink-0 ring-2 ring-(--fuwari-primary)/15 bg-(--fuwari-primary)/10 flex items-center justify-center">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bold text-sm text-(--fuwari-primary)">
                  {authorName ? authorName.slice(0, 1).toUpperCase() : "A"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold fuwari-text-90 text-[15px] truncate">
                {authorName}
              </div>
              <div className="flex items-center gap-1 text-xs fuwari-text-50 mt-0.5">
                <Calendar size={10} />
                <ClientOnly fallback="-">
                  {formatDate(album.publishedAt, { includeTime: true })}
                </ClientOnly>
              </div>
            </div>
            {/* Desktop close */}
            <button
              type="button"
              onClick={onClose}
              className="hidden md:flex p-1.5 fuwari-text-50 hover:text-(--fuwari-primary) hover:bg-(--fuwari-primary)/10 rounded-full transition-colors"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content (scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 fuwari-toc-scrollbar">
            <p className="text-sm leading-relaxed fuwari-text-75 whitespace-pre-wrap break-words">
              {album.content}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs fuwari-text-50">
              {album.location && (
                <span className="flex items-center gap-1 text-(--fuwari-primary)/80">
                  <MapPin size={12} />
                  {album.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Images size={12} />
                共 {images.length} 张
              </span>
            </div>
          </div>

          {/* Thumbnail strip (desktop) */}
          {images.length > 1 && (
            <div className="hidden md:block border-t border-black/5 dark:border-white/10 px-4 py-3 shrink-0">
              <div className="grid grid-cols-6 gap-1.5">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`第 ${i + 1} 张`}
                    className={`relative aspect-square overflow-hidden rounded-md transition-all duration-200 ${
                      i === index
                        ? "ring-2 ring-(--fuwari-primary) opacity-100"
                        : "opacity-50 hover:opacity-90"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.fileName || `第 ${i + 1} 张`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
