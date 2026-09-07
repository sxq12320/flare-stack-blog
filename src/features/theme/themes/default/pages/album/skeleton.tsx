import { Skeleton } from "@/components/ui/skeleton";

export function AlbumPageSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-6 md:px-0 py-12 md:py-20 space-y-16">
      <header className="space-y-4">
        <Skeleton className="h-9 w-32 rounded-none bg-muted/60" />
        <Skeleton className="h-4 w-64 rounded-none bg-muted/40" />
      </header>

      <div className="divide-y divide-border/40 space-y-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="pt-10 first:pt-0 flex gap-4 md:gap-5">
            <Skeleton className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-3.5">
              <Skeleton className="h-4 w-28 bg-muted/60" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-muted/40" />
                <Skeleton className="h-4 w-4/5 bg-muted/40" />
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-sm pt-2">
                <Skeleton className="aspect-square rounded-lg bg-muted/50" />
                <Skeleton className="aspect-square rounded-lg bg-muted/50" />
                <Skeleton className="aspect-square rounded-lg bg-muted/50" />
              </div>
              <Skeleton className="h-3 w-20 bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
