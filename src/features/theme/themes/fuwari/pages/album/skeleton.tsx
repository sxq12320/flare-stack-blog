import { Skeleton } from "@/components/ui/skeleton";

export function AlbumPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="fuwari-card-base p-6 md:p-8 flex flex-col items-center justify-center min-h-48">
        <Skeleton className="h-9 w-32 rounded-xl mb-3" />
        <Skeleton className="h-4 w-60 rounded-md" />
      </div>

      <div className="fuwari-card-base p-6 md:p-8 space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-sm pt-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="aspect-square rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
