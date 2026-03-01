"use client";

import { useSites } from "@/hooks/use-sites";
import { SiteMap } from "@/components/sites/site-map";
import { SiteList } from "@/components/sites/site-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function SitesPage() {
  const { data: sitesData, isLoading } = useSites({ pageSize: 100 });
  const sites = sitesData?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
        <p className="mt-1 text-muted-foreground">
          {sites.length} sites across Vienna.
        </p>
      </div>

      {/* Map */}
      {isLoading ? (
        <Skeleton className="h-[400px] w-full rounded-lg" />
      ) : (
        <SiteMap sites={sites} />
      )}

      {/* Filtered site list */}
      <SiteList />
    </div>
  );
}
