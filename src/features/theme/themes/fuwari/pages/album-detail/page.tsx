import { ClientOnly, Link, useRouteContext } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Images,
  Image as ImageIcon,
  MapPin,
  Pin,
} from "lucide-react";
import { useState } from "react";
import type { AlbumDetailPageProps } from "@/features/theme/contract/pages";
import { formatDate } from "@/lib/utils";
import { AlbumLightbox } from "../../components/album/album-lightbox";
import { NineGrid } from "../../components/album/nine-grid";

export function AlbumDetailPage({ album }: AlbumDetailPageProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = album.media ?? [];
  const isPinned = !!album.pinnedAt;
  const authorName = siteConfig.author;
  const authorAvatar = siteConfig.theme.fuwari.avatar;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Back navigation */}
      <div className="fuwari-onload-animation" style={{ animationDelay: "100ms" }}>
        <Link
          to="/album"
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl fuwari-btn-regular text-sm font-medium active:scale-95 transition-all"
        >
          <ArrowLeft size={16} />
          返回相册
        </Link>
      </div>

      {/* Post card */}
      <article
        className="fuwari-card-base p-5 md:p-8 fuwari-onload-animation"
        style={{ animationDelay: "180ms" }}
      >
        {/* Author header */}
        <header className="flex items-center gap-3 mb-5">
          <div className="size-12 rounded-full overflow-hidden shrink-0 ring-2 ring-(--fuwari-primary)/15 bg-(--fuwari-primary)/10 flex items-center justify-center">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-base text-(--fuwari-primary)">
                {authorName ? authorName.slice(0, 1).toUpperCase() : "A"}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold fuwari-text-90 text-base truncate">
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

        {/* Full content */}
        <p className="text-[15px] md:text-base leading-relaxed fuwari-text-75 whitespace-pre-wrap break-words mb-2">
          {album.content}
        </p>

        {/* Images */}
        {images.length > 0 && (
          <div className="mt-3">
            <NineGrid
              images={images}
              onImageClick={(i) => setLightboxIndex(i)}
            />
          </div>
        )}

        {/* Meta footer */}
        <footer className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs fuwari-text-50">
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
          <span className="flex items-center gap-1 ml-auto fuwari-text-30">
            <Images size={12} />
            点击图片可放大查看
          </span>
        </footer>
      </article>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <AlbumLightbox
          album={album}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
