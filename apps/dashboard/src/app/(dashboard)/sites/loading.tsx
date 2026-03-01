import { Skeleton } from "@/components/ui/skeleton";

export default function SitesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      {/* Map placeholder */}
      <Skeleton className="h-[400px] w-full rounded-lg" />
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 flex-1 min-w-[200px]" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      {/* Site cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
