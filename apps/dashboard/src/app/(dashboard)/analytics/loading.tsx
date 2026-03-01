import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
