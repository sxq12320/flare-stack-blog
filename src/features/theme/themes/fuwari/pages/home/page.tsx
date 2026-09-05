import { Link } from "@tanstack/react-router";
import { LayoutGrid, List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useViewCounts } from "@/features/pageview/queries";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import type { HomePageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";
import { PostBlockCard } from "../../components/post-block-card";
import { PostCard } from "../../components/post-card";

interface MergedPost {
  post: PostItem;
  pinned: boolean;
  popular: boolean;
}

export function HomePage({ posts, pinnedPosts, popularPosts }: HomePageProps) {
  const delayOffset = 40;

  // View mode: 'grid' (Bento block stacking, default) vs 'list' (single column)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

    // 2. Popular next (excluding already added)
    for (const post of popularPosts ?? []) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      result.push({ post, pinned: false, popular: true });
    }

    // 3. Recent fills the rest
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
      {/* Header bar with view switch */}
      <div className="flex items-center justify-between px-2 pt-1 pb-0 text-sm fuwari-text-50">
        <span className="font-medium text-xs tracking-wider uppercase opacity-75">
          {m.home_latest_posts()} · {mergedPosts.length}
        </span>

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

      {/* Posts Section: Grid (Block Stacking) or List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mergedPosts.map(({ post, pinned, popular }, i) => {
            const isWide = pinned;
            return (
              <div
                key={post.slug}
                className={`fuwari-onload-animation ${isWide ? "md:col-span-2" : ""}`}
                style={{
                  animationDelay: `calc(var(--fuwari-content-delay) + ${i * delayOffset}ms)`,
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
          {mergedPosts.map(({ post, pinned, popular }, i) => (
            <div
              key={post.slug}
              className="fuwari-onload-animation"
              style={{
                animationDelay: `calc(var(--fuwari-content-delay) + ${i * delayOffset}ms)`,
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

      {/* View All Posts Button */}
      <div
        className="fuwari-onload-animation"
        style={{
          animationDelay: `calc(var(--fuwari-content-delay) + ${mergedPosts.length * delayOffset}ms)`,
        }}
      >
        <Link
          to="/posts"
          className="fuwari-btn-regular mx-6 rounded-lg h-10 px-6 mt-2 flex items-center justify-center mb-4 md:mb-0 md:mx-auto"
        >
          {m.home_view_all_posts()}
        </Link>
      </div>
    </div>
  );
}
