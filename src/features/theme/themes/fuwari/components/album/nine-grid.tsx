import type { AlbumItem } from "@/features/albums/albums.schema";

/** 九宫格最多直接展示的图片数，超出部分以 +N 角标收起 */
const GRID_MAX_IMAGES = 9;

interface NineGridProps {
  images: AlbumItem["media"];
  /** 是否可点击打开大图；列表卡片整体已是链接时应传 false */
  interactive?: boolean;
  /** feed：列表页紧凑尺寸；detail：详情页加宽展示 */
  variant?: "feed" | "detail";
  onImageClick?: (index: number) => void;
}

/**
 * 微信九宫格图片布局。
 * - 单图按原始宽高比展示，避免裁切
 * - 2/4 张双列，其余三列
 * - 超过 9 张时第 9 格显示 +N 蒙层
 */
export function NineGrid({
  images,
  interactive = true,
  variant = "feed",
  onImageClick,
}: NineGridProps) {
  const count = images.length;
  const isDetail = variant === "detail";

  // 单图：按原始宽高比展示，避免裁切
  if (count === 1) {
    const img = images[0];
    const ratio =
      img.width && img.height ? `${img.width} / ${img.height}` : "4 / 3";
    const className =
      "block w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 group";
    const inner = (
      <img
        src={img.url}
        alt={img.fileName || "照片"}
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        loading="lazy"
      />
    );
    return (
      <div className={`pt-2 ${isDetail ? "max-w-2xl" : "max-w-md"}`}>
        {interactive ? (
          <button
            type="button"
            onClick={() => onImageClick?.(0)}
            className={`${className} cursor-zoom-in`}
            style={{ aspectRatio: ratio, maxHeight: "26rem" }}
            aria-label={img.fileName || "查看大图"}
          >
            {inner}
          </button>
        ) : (
          <div
            className={className}
            style={{ aspectRatio: ratio, maxHeight: "26rem" }}
          >
            {inner}
          </div>
        )}
      </div>
    );
  }

  const gridClass = isDetail
    ? count === 2 || count === 4
      ? "grid-cols-2 max-w-2xl"
      : "grid-cols-3 max-w-3xl"
    : count === 2 || count === 4
      ? "grid-cols-2 max-w-md"
      : count === 3
        ? "grid-cols-3 max-w-lg"
        : "grid-cols-3 max-w-xl";

  const visible = images.slice(0, GRID_MAX_IMAGES);
  const hiddenCount = count - visible.length;

  const cellClass =
    "relative aspect-square overflow-hidden rounded-lg border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 group";

  return (
    <div className={`pt-2 grid gap-1.5 ${gridClass}`}>
      {visible.map((img, i) => {
        const isLastWithMore = hiddenCount > 0 && i === visible.length - 1;
        const inner = (
          <>
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
          </>
        );
        return interactive ? (
          <button
            key={img.id}
            type="button"
            onClick={() => onImageClick?.(i)}
            className={`${cellClass} cursor-zoom-in`}
            aria-label={img.fileName || `第 ${i + 1} 张照片`}
          >
            {inner}
          </button>
        ) : (
          <div key={img.id} className={cellClass}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
