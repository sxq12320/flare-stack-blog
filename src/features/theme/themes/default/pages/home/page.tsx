import { ClientOnly, Link, useRouteContext } from "@tanstack/react-router";
import {
  BookOpen,
  Eye,
  Image as ImageIcon,
  MapPin,
  Pin,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AlbumItem } from "@/features/albums/albums.schema";
import {
  resolveSocialHref,
  SOCIAL_PLATFORMS,
} from "@/features/config/utils/social-platforms";
import { useViewCounts } from "@/features/pageview/queries";
import type { PostItem as PostItemType } from "@/features/posts/schema/posts.schema";
import type { HomePageProps } from "@/features/theme/contract/pages";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";

type FeedItem =
  | { type: "post"; data: PostItemType; isPinned: boolean; date: Date | null }
  | { type: "album"; data: AlbumItem; isPinned: boolean; date: Date | null };

export function HomePage({
  posts,
  pinnedPosts,
  recentAlbums = [],
}: HomePageProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const [filter, setFilter] = useState<"all" | "posts" | "albums">("all");

  // Merge articles & album items into a unified card feed
  const displayItems = useMemo(() => {
    const items: FeedItem[] = [];

    // Articles
    const pinned = (pinnedPosts ?? []).map((p) => ({
      type: "post" as const,
      data: p,
      isPinned: true,
      date: p.publishedAt,
    }));
    const regularPosts = posts.map((p) => ({
      type: "post" as const,
      data: p,
      isPinned: false,
      date: p.publishedAt,
    }));

    const seenPosts = new Set<number>();
    for (const item of [...pinned, ...regularPosts]) {
      if (!seenPosts.has(item.data.id)) {
        seenPosts.add(item.data.id);
        items.push(item);
      }
    }

    // Albums
    for (const album of recentAlbums) {
      items.push({
        type: "album" as const,
        data: album,
        isPinned: !!album.pinnedAt,
        date: album.publishedAt,
      });
    }

    // Sort items: pinned first, then by date desc
    return items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
  }, [posts, pinnedPosts, recentAlbums]);

  const filteredItems = useMemo(() => {
    if (filter === "posts") return displayItems.filter((i) => i.type === "post");
    if (filter === "albums") return displayItems.filter((i) => i.type === "album");
    return displayItems;
  }, [displayItems, filter]);

  // Collect post slugs for view counts
  const postSlugs = useMemo(
    () =>
      displayItems
        .filter((i): i is FeedItem & { type: "post" } => i.type === "post")
        .map((i) => i.data.slug),
    [displayItems],
  );
  const { data: viewCounts } = useViewCounts(postSlugs);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-6 md:px-0 py-12 md:py-20 space-y-16">
      {/* Intro Section */}
      <section className="space-y-8">
        <header className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground flex items-center gap-4">
            {m.home_greeting()}{" "}
            <span className="animate-wave origin-[70%_70%]">👋</span>
          </h1>

          <div className="space-y-4 max-w-2xl text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            <p>
              {m.home_intro_prefix()}{" "}
              <span className="text-foreground font-medium">
                {siteConfig.author}
              </span>
              {m.home_intro_separator()}
              {siteConfig.description}
            </p>
          </div>
        </header>

        {/* Social Links */}
        <div className="flex items-center gap-6 text-muted-foreground">
          {siteConfig.social
            .filter((link) => link.url)
            .map((link, i) => {
              const preset =
                link.platform !== "custom"
                  ? SOCIAL_PLATFORMS[link.platform]
                  : null;
              const Icon = preset?.icon;
              const label = preset?.label ?? link.label ?? "";
              const href = resolveSocialHref(link.platform, link.url);

              return (
                <a
                  key={`${link.platform}-${i}`}
                  href={href}
                  target={link.platform === "email" ? undefined : "_blank"}
                  rel={link.platform === "email" ? undefined : "noreferrer"}
                  className="hover:text-foreground transition-colors"
                  aria-label={label}
                >
                  {Icon ? (
                    <Icon size={20} strokeWidth={1.5} />
                  ) : (
                    <img src={link.icon} alt={label} className="w-5 h-5" />
                  )}
                </a>
              );
            })}
        </div>
      </section>

      {/* Main Content: Block Layout Feed */}
      <section className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles size={16} className="text-muted-foreground" />
            <span className="font-serif tracking-tight text-foreground text-lg">
              探索精选
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-lg text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md transition-all ${
                filter === "all"
                  ? "bg-background text-foreground shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => setFilter("posts")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                filter === "posts"
                  ? "bg-background text-foreground shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen size={13} />
              文章
            </button>
            <button
              type="button"
              onClick={() => setFilter("albums")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                filter === "albums"
                  ? "bg-background text-foreground shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon size={13} />
              相册
            </button>
          </div>
        </div>

        {/* Responsive Block Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) =>
            item.type === "post" ? (
              <ArticleTextCard
                key={`post-${item.data.id}`}
                post={item.data}
                pinned={item.isPinned}
                views={viewCounts?.[item.data.slug]}
              />
            ) : (
              <AlbumCoverCard
                key={`album-${item.data.id}`}
                album={item.data}
                pinned={item.isPinned}
                authorName={siteConfig.author}
              />
            ),
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/40 text-sm font-mono text-muted-foreground">
          <Link
            to="/posts"
            className="hover:text-foreground transition-colors flex items-center gap-2"
          >
            <Terminal size={14} />
            cd /posts <span className="text-xs opacity-60">(全部文章)</span>
          </Link>

          <Link
            to="/album"
            className="hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ImageIcon size={14} />
            cd /album <span className="text-xs opacity-60">(生活相册)</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Pure Text Article Card (纯文字卡片)
 */
function ArticleTextCard({
  post,
  pinned,
  views,
}: {
  post: PostItemType;
  pinned?: boolean;
  views?: number;
}) {
  return (
    <Link
      to="/post/$slug"
      params={{ slug: post.slug }}
      className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border/50 bg-card hover:border-foreground/30 hover:shadow-md transition-all duration-300"
    >
      <div className="space-y-3.5">
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-medium tracking-wide uppercase">
              文章
            </span>
            {pinned && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                <Pin size={11} className="rotate-45" />
                置顶
              </span>
            )}
          </div>
          <time dateTime={post.publishedAt?.toISOString()}>
            <ClientOnly fallback="-">
              {formatDate(post.publishedAt)}
            </ClientOnly>
          </time>
        </div>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-serif font-medium text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Summary (Pure text) */}
        {post.summary && (
          <p className="text-sm text-muted-foreground/80 font-light leading-relaxed line-clamp-3">
            {post.summary}
          </p>
        )}
      </div>

      {/* Card Bottom Meta */}
      <div className="pt-5 mt-4 border-t border-border/30 flex items-center justify-between text-xs font-mono text-muted-foreground/70">
        <div className="flex items-center gap-2">
          {post.tags && post.tags.length > 0 && (
            <span className="truncate max-w-[140px]">
              #{post.tags[0].name}
            </span>
          )}
          {post.readTimeInMinutes && (
            <span>· {post.readTimeInMinutes} 分钟</span>
          )}
        </div>

        {views !== undefined && (
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {views}
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * Xiaohongshu-style Album Card (小红书风格相册卡片：第一张作为封面图)
 */
function AlbumCoverCard({
  album,
  pinned,
  authorName,
}: {
  album: AlbumItem;
  pinned?: boolean;
  authorName: string;
}) {
  const coverImage = album.media?.[0];
  const imageCount = album.media?.length ?? 0;

  return (
    <Link
      to="/album"
      className="group relative flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-foreground/30 hover:shadow-md transition-all duration-300"
    >
      {/* Cover Image */}
      {coverImage ? (
        <div className="relative aspect-4/3 w-full bg-muted/30 overflow-hidden">
          <img
            src={coverImage.url}
            alt={coverImage.fileName || "动态封面"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {/* Photos Count Badge */}
          {imageCount > 1 && (
            <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[11px] font-mono flex items-center gap-1">
              <ImageIcon size={12} />
              {imageCount}
            </span>
          )}
          {/* Pinned Tag */}
          {pinned && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-amber-500/90 text-white text-[11px] font-mono flex items-center gap-1 shadow-sm">
              <Pin size={11} className="rotate-45" />
              置顶
            </span>
          )}
        </div>
      ) : (
        <div className="aspect-4/3 w-full bg-muted/20 flex items-center justify-center text-muted-foreground/40">
          <ImageIcon size={32} />
        </div>
      )}

      {/* Caption & Meta */}
      <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-medium uppercase">
              相册动态
            </span>
            {album.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin size={11} />
                {album.location}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/90 font-light leading-relaxed line-clamp-2">
            {album.content}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs font-mono text-muted-foreground/70">
          <span className="truncate max-w-[120px]">{authorName}</span>
          <time dateTime={album.publishedAt?.toISOString?.()}>
            <ClientOnly fallback="-">
              {formatDate(album.publishedAt)}
            </ClientOnly>
          </time>
        </div>
      </div>
    </Link>
  );
}
