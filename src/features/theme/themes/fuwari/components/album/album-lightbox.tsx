import { ClientOnly } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import type { AlbumItem } from "@/features/albums/albums.schema";
import { formatDate } from "@/lib/utils";

interface AlbumLightboxProps {
  album: AlbumItem;
  initialIndex?: number;
  onClose: () => void;
}

/**
 * 相册大图浏览器：键盘左右切换、移动端滑动、圆点跳页、
 * 打开时锁定背景滚动。
 */
export function AlbumLightbox({
  album,
  initialIndex = 0,
  onClose,
}: AlbumLightboxProps) {
  const images = album.media;
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const prevImage = () => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setIndex((i) => (i + 1) % images.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

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
              prevImage();
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
              nextImage();
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
  );
}
