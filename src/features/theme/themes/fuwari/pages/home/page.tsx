import { ClientOnly, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MapPin,
  Pin,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AlbumItem } from "@/features/albums/albums.schema";
import { useViewCounts } from "@/features/pageview/queries";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import type { HomePageProps } from "@/features/theme/contract/pages";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { PostBlockCard } from "../../components/post-block-card";
import { PostCard } from "../../components/post-card";

interface MergedPost {
  post: PostItem;
  pinned: boolean;
  popular: boolean;
}

export function HomePage({
  posts,
  pinnedPosts,
  popularPosts,
  recentAlbums = [],
}: HomePageProps) {
  const delayOffset = 40;

  // View mode: 'grid' (Bento block stacking, default) vs 'list' (single column)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "posts" | "albums">("all");

  useEffect(() => {
    const saved = localStorage.getItem("fuwari_home_view_mode") as
      | "grid"
      | "list"
      | null;
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const handleToggleView = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("fuwari_home_view_mode", mode);
  };

  const mergedPosts = useMemo(() => {
    const seen = new Set<string>();
    const result: MergedPost[] = [];
    const popularSlugs = new Set((popularPosts ?? []).map((p) => p.slug));

    // 1. Pinned first
    for (const post of pinnedPosts ?? []) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      result.push({ post, pinned: true, popular: popularSlugs.has(post.slug) });
    }

    // 2. Popular next
    for (const post of popularPosts ?? []) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      result.push({ post, pinned: false, popular: true });
    }

    // 3. Recent
    for (const post of posts) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      result.push({ post, pinned: false, popular: false });
    }

    return result;
  }, [posts, pinnedPosts, popularPosts]);

  const allSlugs = useMemo(
    () => mergedPosts.map((m) => m.post.slug),
    [mergedPosts],
  );
  const { data: viewCounts, isPending: isPendingViewCounts } =
    useViewCounts(allSlugs);

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar with tabs & view switch */}
      <div className="flex flex-wrap items-center justify-between px-2 pt-1 pb-0 text-sm fuwari-text-50 gap-2">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-(--fuwari-card-bg) text-(--fuwari-primary) shadow-xs"
                : "fuwari-text-50 hover:text-(--fuwari-primary)"
            }`}
          >
            全部
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === "posts"
                ? "bg-(--fuwari-card-bg) text-(--fuwari-primary) shadow-xs"
                : "fuwari-text-50 hover:text-(--fuwari-primary)"
            }`}
          >
            <BookOpen size={12} />
            文章
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("albums")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === "albums"
                ? "bg-(--fuwari-card-bg) text-(--fuwari-primary) shadow-xs"
                : "fuwari-text-50 hover:text-(--fuwari-primary)"
            }`}
          >
            <ImageIcon size={12} />
            相册
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleToggleView("grid")}
            aria-label="方块堆叠视图"
            title="方块堆叠视图"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-(--fuwari-card-bg) text-(--fuwari-primary) shadow-xs"
                : "fuwari-text-50 hover:text-(--fuwari-primary)"
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleView("list")}
            aria-label="单栏列表视图"
            title="单栏列表视图"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-(--fuwari-card-bg) text-(--fuwari-primary) shadow-xs"
                : "fuwari-text-50 hover:text-(--fuwari-primary)"
            }`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Grid or List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Albums shown if activeTab is 'all' or 'albums' */}
          {activeTab !== "posts" &&
            recentAlbums.map((album, i) => (
              <div
                key={`album-${album.id}`}
                className="fuwari-onload-animation"
                style={{
                  animationDelay: `calc(var(--fuwari-content-delay) + ${i * delayOffset}ms)`,
                }}
              >
                <FuwariAlbumCard album={album} />
              </div>
            ))}

          {/* Posts shown if activeTab is 'all' or 'posts' */}
          {activeTab !== "albums" &&
            mergedPosts.map(({ post, pinned, popular }, i) => {
              const isWide = pinned && activeTab === "posts";
              return (
                <div
                  key={post.slug}
                  className={`fuwari-onload-animation ${isWide ? "md:col-span-2" : ""}`}
                  style={{
                    animationDelay: `calc(var(--fuwari-content-delay) + ${(i + (activeTab === "all" ? recentAlbums.length : 0)) * delayOffset}ms)`,
                  }}
                >
                  <PostBlockCard
                    post={post}
                    pinned={pinned}
                    popular={!pinned && popular}
                    views={viewCounts?.[post.slug]}
                    isLoadingViews={isPendingViewCounts}
                    isWide={isWide}
                  />
                </div>
              );
            })}
        </div>
      ) : (
        <div className="flex flex-col rounded-(--fuwari-radius-large) bg-(--fuwari-card-bg) py-1 md:py-0 md:bg-transparent md:gap-4">
          {activeTab !== "posts" &&
            recentAlbums.map((album, i) => (
              <div
                key={`album-list-${album.id}`}
                className="fuwari-onload-animation"
                style={{
                  animationDelay: `calc(var(--fuwari-content-delay) + ${i * delayOffset}ms)`,
                }}
              >
                <FuwariAlbumCard album={album} />
              </div>
            ))}

          {activeTab !== "albums" &&
            mergedPosts.map(({ post, pinned, popular }, i) => (
              <div
                key={post.slug}
                className="fuwari-onload-animation"
                style={{
                  animationDelay: `calc(var(--fuwari-content-delay) + ${(i + (activeTab === "all" ? recentAlbums.length : 0)) * delayOffset}ms)`,
                }}
              >
                <PostCard
                  post={post}
                  pinned={pinned}
                  popular={!pinned && popular}
                  views={viewCounts?.[post.slug]}
                  isLoadingViews={isPendingViewCounts}
                />
                <div className="border-t border-dashed mx-6 border-black/10 dark:border-white/15 last:border-t-0 md:hidden" />
              </div>
            ))}
        </div>
      )}

      {/* View All Links */}
      <div
        className="fuwari-onload-animation flex flex-wrap items-center justify-center gap-3 mt-4"
        style={{
          animationDelay: `calc(var(--fuwari-content-delay) + ${mergedPosts.length * delayOffset}ms)`,
        }}
      >
        <Link
          to="/posts"
          className="fuwari-btn-regular rounded-xl h-10 px-6 flex items-center justify-center text-sm font-medium"
        >
          {m.home_view_all_posts()}
        </Link>
        <Link
          to="/album"
          className="fuwari-btn-regular rounded-xl h-10 px-6 flex items-center justify-center text-sm font-medium"
        >
          浏览相册
        </Link>
      </div>
    </div>
  );
}

function FuwariAlbumCard({ album }: { album: AlbumItem }) {
  const coverImage = album.media?.[0];
  const imageCount = album.media?.length ?? 0;

  return (
    <Link
      to="/album"
      className="fuwari-card-base overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300 h-full"
    >
      {coverImage && (
        <div className="relative aspect-4/3 w-full bg-black/5 dark:bg-white/5 overflow-hidden">
          <img
            src={coverImage.url}
            alt={coverImage.fileName || "相册封面"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {imageCount > 1 && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] font-mono flex items-center gap-1 backdrop-blur-xs">
              <ImageIcon size={11} />
              {imageCount}
            </span>
          )}
          {album.pinnedAt && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-(--fuwari-primary) text-white text-[11px] font-medium flex items-center gap-1 shadow-xs">
              <Pin size={11} className="rotate-45" />
              置顶
            </span>
          )}
        </div>
      )}

      <div className="p-4 flex flex-col justify-between flex-1 gap-2.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md bg-(--fuwari-primary)/10 text-(--fuwari-primary) text-[10px] font-bold">
              相册
            </span>
            {album.location && (
              <span className="text-xs fuwari-text-40 flex items-center gap-1">
                <MapPin size={10} />
                {album.location}
              </span>
            )}
          </div>
          <p className="text-sm fuwari-text-80 line-clamp-2 leading-relaxed">
            {album.content}
          </p>
        </div>

        <div className="pt-2 border-t border-black/5 dark:border-white/5 text-xs fuwari-text-40 flex items-center justify-between">
          <time dateTime={album.publishedAt?.toISOString?.()}>
            <ClientOnly fallback="-">
              {formatDate(album.publishedAt)}
            </ClientOnly>
          </time>
          <span className="group-hover:text-(--fuwari-primary) transition-colors font-medium">
            查看详情 →
          </span>
        </div>
      </div>
    </Link>
  );
}
