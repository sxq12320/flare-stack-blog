import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { useMemo } from "react";
import { albumsInfiniteQueryOptions } from "@/features/albums/queries";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { m } from "@/paraglide/messages";

const { albumsPerPage } = theme.config.album;

export const Route = createFileRoute("/_public/album/")({
  component: AlbumRouteComponent,
  pendingComponent: AlbumSkeleton,
  loader: async ({ context }) => {
    const [, domain, siteConfig] = await Promise.all([
      context.queryClient.prefetchInfiniteQuery(
        albumsInfiniteQueryOptions(albumsPerPage),
      ),
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: m.nav_album ? m.nav_album() : "相册",
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/album"),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
      {
        name: "description",
        content: loaderData?.description,
      },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/album")],
  }),
});

function AlbumRouteComponent() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(albumsInfiniteQueryOptions(albumsPerPage));

  const albums = useMemo(() => {
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  return (
    <theme.AlbumPage
      albums={albums}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}

function AlbumSkeleton() {
  return <theme.AlbumPageSkeleton />;
}
