import { ClientOnly, Link, useRouteContext } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Images,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MapPin,
  Pin,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
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

type FeedTab = "all" | "posts" | "albums";
type ViewMode = "grid" | "list";

const TAB_OPTIONS: Array<{
  id: FeedTab;
  label: string;
  icon: ComponentType<{ size?: number }> | null;
}> = [
  { id: "all", label: "全部", icon: Sparkles },
  { id: "posts", label: "文章", icon: BookOpen },
  { id: "albums", label: "相册", icon: ImageIcon },
];

export function HomePage({
  posts,
  pinnedPosts,
  popularPosts,
  recentAlbums = [],
}: HomePageProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const delayOffset = 40;

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<FeedTab>("all");

  useEffect(() => {
    const saved = localStorage.getItem("fuwari_home_view_mode") as
      | ViewMode
      | null;
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("fuwari_home_view_mode", mode);
  };

  const mergedPosts = useMemo(() => {
    const seen = new Set<string>();
    const result: MergedPost[] = [];
    const popularSlugs = new Set((popularPosts ?? []).map((p) => p.slug));

    for (const post of pinnedPosts ?? []) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      result.push({ post, pinned: true, popular: popularSlugs.has(post.slug) });
    }
    for (const post of popularPosts ?? []) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      result.push({ post, pinned: false, popular: true });
    }
    for (const post of posts) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      result.push({ post, pinned: false, popular: false });
    }
    return result;
  }, [posts, pinnedPosts, popularPosts]);

  const allSlugs = useMemo(
    () => mergedPosts.map((item) => item.post.slug),
    [mergedPosts],
  );
  const { data: viewCounts, isPending: isPendingViewCounts } =
    useViewCounts(allSlugs);

  const showAlbums = activeTab !== "posts";
  const showPosts = activeTab !== "albums";
  const isEmpty =
    (!showAlbums || recentAlbums.length === 0) &&
    (!showPosts || mergedPosts.length === 0);

  const activeTabLabel =
    TAB_OPTIONS.find((t) => t.id === activeTab)?.label ?? "全部";

  const albumOffset = activeTab === "all" ? recentAlbums.length : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Welcome hero */}
      <section
        className="fuwari-card-base relative overflow-hidden p-6 md:p-8 fuwari-onload-animation"
        style={{ animationDelay: "calc(var(--fuwari-content-delay))" }}
      >
        {/* Ambient decoration */}
        <div
          aria-hidden
          className="absolute -top-20 -right-14 size-60 rounded-full bg-(--fuwari-primary)/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 right-32 size-44 rounded-full bg-(--fuwari-primary)/5 blur-2xl pointer-events-none"
        />

        <div className="relative z-10">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-(--fuwari-primary) mb-2">
            {siteConfig.title}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold fuwari-text-90 leading-snug mb-2.5">
            {m.home_greeting()}，欢迎来到 {siteConfig.author} 的小站
            <span className="inline-block animate-wave origin-[70%_70%] ml-2">
              👋
            </span>
          </h1>
          <p className="fuwari-text-50 text-sm md:text-[15px] leading-relaxed max-w-2xl">
            {siteConfig.description}
          </p>
        </div>
      </section>

      {/* Toolbar: tabs + view switch */}
      <div
        className="fuwari-card-base px-4 py-3 md:px-5 flex flex-wrap items-center justify-between gap-3 fuwari-onload-animation"
        style={{
          animationDelay: "calc(var(--fuwari-content-delay) + 40ms)",
        }}
      >
        {/* Segmented tabs */}
        <div
          className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl"
          role="tablist"
          aria-label="内容筛选"
        >
          {TAB_OPTIONS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-(--fuwari-card-bg) text-(--fuwari-primary) shadow-sm"
                    : "fuwari-text-50 hover:text-(--fuwari-primary)"
                }`}
              >
                {Icon && <Icon size={13} />}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs fuwari-text-30">
            {activeTabLabel} ·{" "}
            {showPosts && activeTab === "posts"
              ? `${mergedPosts.length} 篇`
              : showAlbums && activeTab === "albums"
                ? `${recentAlbums.length} 条`
                : `${mergedPosts.length + recentAlbums.length} 项`}
          </span>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleToggleView("grid")}
              aria-label="方块堆叠视图"
              title="方块堆叠视图"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-(--fuwari-card-bg) text-(--fuwari-primary) shadow-sm"
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
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-(--fuwari-card-bg) text-(--fuwari-primary) shadow-sm"
                  : "fuwari-text-50 hover:text-(--fuwari-primary)"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      {isEmpty ? (
        <div className="fuwari-card-base py-20 flex flex-col items-center justify-center gap-3 fuwari-text-30 fuwari-onload-animation">
          <Sparkles size={36} strokeWidth={1.5} />
          <p className="text-base">这里还空空如也</p>
          <p className="text-sm">去文章或相册页看看其他内容吧</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showAlbums &&
            recentAlbums.map((album, i) => (
              <div
                key={`album-${album.id}`}
                className="fuwari-onload-animation"
                style={{
                  animationDelay: `calc(var(--fuwari-content-delay) + ${(i + 2) * delayOffset}ms)`,
                }}
              >
                <FuwariAlbumCard album={album} />
              </div>
            ))}

          {showPosts &&
            mergedPosts.map(({ post, pinned, popular }, i) => {
              const isWide = pinned;
              return (
                <div
                  key={post.slug}
                  className={`fuwari-onload-animation ${isWide ? "md:col-span-2" : ""}`}
                  style={{
                    animationDelay: `calc(var(--fuwari-content-delay) + ${(i + albumOffset + 2) * delayOffset}ms)`,
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
          {showAlbums &&
            recentAlbums.map((album, i) => (
              <div
                key={`album-list-${album.id}`}
                className="fuwari-onload-animation"
                style={{
                  animationDelay: `calc(var(--fuwari-content-delay) + ${(i + 2) * delayOffset}ms)`,
                }}
              >
                <FuwariAlbumCard album={album} />
              </div>
            ))}

          {showPosts &&
            mergedPosts.map(({ post, pinned, popular }, i) => (
              <div
                key={post.slug}
                className="fuwari-onload-animation"
                style={{
                  animationDelay: `calc(var(--fuwari-content-delay) + ${(i + albumOffset + 2) * delayOffset}ms)`,
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

      {/* View all links */}
      <div
        className="fuwari-onload-animation flex flex-wrap items-center justify-center gap-3 mt-2 mb-2"
        style={{
          animationDelay: `calc(var(--fuwari-content-delay) + ${(mergedPosts.length + albumOffset + 2) * delayOffset}ms)`,
        }}
      >
        <Link
          to="/posts"
          className="fuwari-btn-primary rounded-xl h-11 px-7 flex items-center justify-center gap-2 text-sm font-medium active:scale-95 transition-transform"
        >
          <BookOpen size={15} />
          {m.home_view_all_posts()}
        </Link>
        <Link
          to="/album"
          className="fuwari-btn-regular rounded-xl h-11 px-7 flex items-center justify-center gap-2 text-sm font-medium active:scale-95 transition-transform"
        >
          <Images size={15} />
          浏览相册
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 相册卡片（小红书封面流风格）                                          */
/* ------------------------------------------------------------------ */

function FuwariAlbumCard({ album }: { album: AlbumItem }) {
  const coverImage = album.media?.[0];
  const imageCount = album.media?.length ?? 0;
  const coverRatio =
    coverImage?.width && coverImage?.height
      ? coverImage.width / coverImage.height
      : 4 / 3;
  // 限制封面比例范围，避免超长图/超宽图破坏网格
  const clampedRatio = Math.min(Math.max(coverRatio, 3 / 4), 16 / 9);

  return (
    <Link
      to="/album"
      className="fuwari-card-base overflow-hidden flex flex-col group h-full border border-black/5 dark:border-white/5 hover:border-(--fuwari-primary)/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-300"
    >
      {/* Cover */}
      <div
        className="relative w-full bg-black/5 dark:bg-white/5 overflow-hidden"
        style={{ aspectRatio: `${clampedRatio}` }}
      >
        {coverImage ? (
          <img
            src={coverImage.url}
            alt={coverImage.fileName || "相册封面"}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center fuwari-text-30 bg-(--fuwari-primary)/5">
            <ImageIcon size={36} strokeWidth={1.5} />
          </div>
        )}

        {/* Bottom gradient for readability */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent pointer-events-none"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {album.pinnedAt && (
            <span className="px-2 py-0.5 rounded-lg bg-(--fuwari-primary) text-white text-[11px] font-medium flex items-center gap-1 shadow-sm">
              <Pin size={11} className="rotate-45" />
              置顶
            </span>
          )}
        </div>
        {imageCount > 1 && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/55 text-white text-[11px] font-mono flex items-center gap-1 backdrop-blur-sm">
            <Images size={11} />
            {imageCount}
          </span>
        )}

        {/* Location on cover */}
        {album.location && (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/45 text-white/90 text-[11px] flex items-center gap-1 backdrop-blur-sm">
            <MapPin size={10} />
            {album.location}
          </span>
        )}
      </div>

      {/* Caption */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        <p className="text-sm fuwari-text-80 line-clamp-2 leading-relaxed">
          {album.content}
        </p>

        <div className="pt-2.5 border-t border-black/5 dark:border-white/5 text-xs fuwari-text-50 flex items-center justify-between">
          <time dateTime={album.publishedAt?.toISOString?.()}>
            <ClientOnly fallback="-">
              {formatDate(album.publishedAt)}
            </ClientOnly>
          </time>
          <span className="flex items-center gap-1 font-medium fuwari-text-30 group-hover:text-(--fuwari-primary) transition-colors">
            查看
            <ArrowRight
              size={12}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
