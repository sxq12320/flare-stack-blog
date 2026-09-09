import { ClientOnly } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Images, MapPin, X } from "lucide-react";
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
 * Facebook 风格照片查看器。
 * - 纯黑全屏，图片占满主区域
 * - 桌面端右侧信息栏：作者、正文、定位/日期、缩略图跳页
 * - 移动端：顶部计数 + 关闭，底部说明条
 * - 点击黑色背景关闭，点击图片不关闭；键盘/滑动切换
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
      className="fixed inset-0 z-100 flex bg-black animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="图片浏览"
    >
      {/* ===== 主图区域（点击黑背景关闭） ===== */}
      <div
        className="relative flex-1 min-w-0 flex items-center justify-center"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top-left counter */}
        <span className="absolute top-4 left-5 z-20 text-sm font-medium text-white/70 tabular-nums select-none">
          {index + 1} / {images.length}
        </span>

        {/* Close (mobile: top-right; desktop 端关闭按钮在侧边栏顶部) */}
        <button
          type="button"
          onClick={onClose}
          className="md:hidden absolute top-3 right-3 z-20 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-3 md:left-5 z-20 size-11 flex items-center justify-center text-white/85 bg-neutral-800/80 hover:bg-neutral-700 rounded-full shadow-lg transition-all active:scale-90"
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
              className="absolute right-3 md:right-5 z-20 size-11 flex items-center justify-center text-white/85 bg-neutral-800/80 hover:bg-neutral-700 rounded-full shadow-lg transition-all active:scale-90"
              aria-label="下一张"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image：尽量占满视口，点击图片不关闭 */}
        <img
          key={current?.url}
          src={current?.url}
          alt={current?.fileName || "相片"}
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full w-auto h-auto object-contain select-none animate-in fade-in zoom-in-95 duration-200"
          draggable={false}
        />

        {/* Mobile bottom caption */}
        <div className="md:hidden absolute inset-x-0 bottom-0 z-20 px-5 pt-10 pb-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-sm text-white/85 line-clamp-2 leading-relaxed">
            {album.content}
          </p>
          {images.length > 1 && images.length <= 12 && (
            <div className="mt-2.5 flex items-center gap-1.5">
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
                      ? "w-5 h-1.5 bg-white"
                      : "size-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== 桌面端右侧信息栏（Facebook 布局） ===== */}
      <aside
        className="hidden md:flex w-[380px] lg:w-[420px] shrink-0 flex-col bg-neutral-900 border-l border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar top bar: close */}
        <div className="flex items-center justify-end px-4 py-3 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/15 rounded-full transition-colors"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 px-5 pt-4">
          <div className="size-10 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10 bg-white/10 flex items-center justify-center">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-sm text-white/80">
                {authorName ? authorName.slice(0, 1).toUpperCase() : "A"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white/90 text-[15px] truncate">
              {authorName}
            </div>
            <div className="text-xs text-white/50 mt-0.5">
              <ClientOnly fallback="-">
                {formatDate(album.publishedAt, { includeTime: true })}
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap break-words">
            {album.content}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/50">
            {album.location && (
              <span className="flex items-center gap-1">
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

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="border-t border-white/10 px-4 py-3">
            <div className="grid grid-cols-6 gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`第 ${i + 1} 张`}
                  className={`relative aspect-square overflow-hidden rounded-md transition-all duration-200 ${
                    i === index
                      ? "ring-2 ring-white opacity-100"
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
      </aside>
    </div>
  );
}
