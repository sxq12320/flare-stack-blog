import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import theme from "@theme";
import { albumDetailQuery } from "@/features/albums/queries";
import { siteDomainQuery } from "@/features/config/queries";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_public/album/$id")({
  component: AlbumDetailRouteComponent,
  pendingComponent: AlbumDetailSkeleton,
  pendingMs: __THEME_CONFIG__.pendingMs,
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();

    const [album, domain] = await Promise.all([
      context.queryClient.ensureQueryData(albumDetailQuery(id)),
      context.queryClient.ensureQueryData(siteDomainQuery),
    ]);

    if (!album) throw notFound();

    const description =
      album.content.length > 80 ? `${album.content.slice(0, 80)}…` : album.content;

    return {
      album,
      description,
      canonicalHref: buildCanonicalUrl(domain, `/album/${id}`),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.description,
      },
      {
        name: "description",
        content: loaderData?.description,
      },
      { property: "og:description", content: loaderData?.description ?? "" },
      { property: "og:type", content: "article" },
      { property: "og:url", content: loaderData?.canonicalHref ?? "" },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/album")],
  }),
});

function AlbumDetailRouteComponent() {
  const { id } = Route.useParams();
  const { data: album } = useSuspenseQuery(albumDetailQuery(Number(id)));

  if (!album) throw notFound();

  return <theme.AlbumDetailPage album={album} />;
}

function AlbumDetailSkeleton() {
  return <theme.AlbumDetailPageSkeleton />;
}
