import { ClientOnly, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Eye,
  Flame,
  Pin,
  Tag as TagIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";

interface PostBlockCardProps {
  post: PostItem;
  pinned?: boolean;
  popular?: boolean;
  views?: number;
  isLoadingViews?: boolean;
  isWide?: boolean;
}

export function PostBlockCard({
  post,
  pinned,
  popular,
  views,
  isLoadingViews,
  isWide,
}: PostBlockCardProps) {
  const tagNames = (post.tags ?? []).map((t) => t.name);

  return (
    <div
      className={`fuwari-card-base group flex flex-col justify-between h-full p-6 md:p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md border ${
        pinned
          ? "border-2 border-(--fuwari-primary)/30 shadow-sm"
          : "border-black/5 dark:border-white/5 hover:border-(--fuwari-primary)/30"
      }`}
    >
      {/* Background ambient light for pinned */}
      {pinned && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-(--fuwari-primary) opacity-5 rounded-bl-[80px] -z-10 pointer-events-none" />
      )}

      {/* Top row: Badges and Tags */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {pinned && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-(--fuwari-primary) bg-(--fuwari-primary)/10 px-2 py-0.5 rounded-full">
                <Pin size={12} className="fill-current" />
                <span>{m.home_pinned_posts()}</span>
              </span>
            )}
            {!pinned && popular && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                <Flame size={12} />
                <span>{m.home_popular_posts()}</span>
              </span>
            )}
          </div>

          {/* Tags */}
          {tagNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <TagIcon size={12} className="fuwari-text-50" />
              {tagNames.slice(0, isWide ? 3 : 2).map((name) => (
                <Link
                  key={name}
                  to="/posts"
                  search={{ tagName: name }}
                  className="fuwari-text-50 hover:text-(--fuwari-primary) transition-colors text-xs"
                >
                  #{name}
                </Link>
              ))}
              {tagNames.length > (isWide ? 3 : 2) && (
                <span className="fuwari-text-50 text-[10px]">
                  +{tagNames.length - (isWide ? 3 : 2)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <Link
          to="/post/$slug"
          params={{ slug: post.slug }}
          className={`block font-bold fuwari-text-90 group-hover:text-(--fuwari-primary) transition-colors leading-snug mb-2.5 ${
            isWide ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          }`}
        >
          {post.title}
        </Link>

        {/* Summary */}
        <p
          className={`fuwari-text-75 text-sm leading-relaxed mb-6 ${
            isWide
              ? "line-clamp-3 md:line-clamp-2"
              : "line-clamp-3"
          }`}
        >
          {post.summary ?? ""}
        </p>
      </div>

      {/* Bottom Metadata & Arrow Action */}
      <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs fuwari-text-50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Calendar size={13} strokeWidth={1.5} />
            <time
              dateTime={
                post.publishedAt
                  ? new Date(post.publishedAt).toISOString()
                  : undefined
              }
            >
              <ClientOnly fallback="-">
                {formatDate(post.publishedAt)}
              </ClientOnly>
            </time>
          </div>

          <div className="flex items-center gap-1">
            <Clock size={13} />
            <span>{m.read_time({ count: post.readTimeInMinutes })}</span>
          </div>

          {isLoadingViews ? (
            <span className="inline-flex items-center gap-1">
              <Eye size={13} />
              <Skeleton className="h-3 w-6 rounded bg-black/10 dark:bg-white/10" />
            </span>
          ) : (
            views !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Eye size={13} />
                <span>{views.toLocaleString()}</span>
              </span>
            )
          )}
        </div>

        {/* Link icon button */}
        <Link
          to="/post/$slug"
          params={{ slug: post.slug }}
          aria-label={post.title}
          className="fuwari-btn-regular w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:text-(--fuwari-primary) group-hover:bg-(--fuwari-primary)/10 transition-colors"
        >
          <ArrowUpRight size={15} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
