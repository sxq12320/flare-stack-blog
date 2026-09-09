import { Skeleton } from "@/components/ui/skeleton";

export function AlbumDetailPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Skeleton className="h-10 w-28 rounded-xl" />

      <div className="fuwari-card-base p-5 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton className="size-12 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        </div>
        <div className="space-y-2 mb-5">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 max-w-xl">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="aspect-square rounded-lg" />
        </div>
      </div>
    </div>
  );
}
