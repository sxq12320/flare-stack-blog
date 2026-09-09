import { Skeleton } from "@/components/ui/skeleton";

export function AlbumPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Banner skeleton */}
      <div className="fuwari-card-base p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="size-11 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      {/* Moment card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="fuwari-card-base p-5 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="size-11 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-1.5 max-w-xl">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
