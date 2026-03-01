import { Skeleton } from "@/components/ui/skeleton";

export default function SiteDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <Skeleton className="h-5 w-48" />
      {/* Header */}
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <Skeleton className="h-10 w-64" />
      {/* Tab content */}
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  );
}
