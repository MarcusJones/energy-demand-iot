import { Skeleton } from "@/components/ui/skeleton";

export default function DeviceDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <Skeleton className="h-5 w-48" />
      {/* Info card */}
      <Skeleton className="h-[200px] w-full rounded-lg" />
      {/* Chart */}
      <Skeleton className="h-[350px] w-full rounded-lg" />
      {/* Reading table */}
      <Skeleton className="h-[300px] w-full rounded-lg" />
    </div>
  );
}
