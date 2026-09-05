import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { Heatmap, HeatmapSkeleton } from "./heatmap";
import { Profile } from "./profile";
import { Tags, TagsSkeleton } from "./tags";

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn("flex flex-col gap-4", className)}>
      <div
        className="fuwari-onload-animation"
        style={{ animationDelay: "100ms" }}
      >
        <Profile />
      </div>
      <div
        className="fuwari-onload-animation"
        style={{ animationDelay: "150ms" }}
      >
        <Suspense fallback={<TagsSkeleton />}>
          <Tags />
        </Suspense>
      </div>
      <div
        className="sticky top-4 fuwari-onload-animation"
        style={{ animationDelay: "200ms" }}
      >
        <Suspense fallback={<HeatmapSkeleton />}>
          <Heatmap />
        </Suspense>
      </div>
    </aside>
  );
}
