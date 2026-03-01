"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Site } from "@/schemas/site";

const SiteMapInner = dynamic(
  () => import("./site-map-inner").then((mod) => mod.SiteMapInner),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[400px] w-full rounded-lg" />
    ),
  }
);

interface SiteMapProps {
  sites: Site[];
}

export function SiteMap({ sites }: SiteMapProps) {
  return (
    <div className="h-[400px] md:h-[400px] sm:h-[300px] w-full rounded-lg overflow-hidden border">
      <SiteMapInner sites={sites} />
    </div>
  );
}
