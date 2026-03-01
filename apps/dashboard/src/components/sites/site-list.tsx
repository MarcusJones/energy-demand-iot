"use client";

import { useState, useMemo } from "react";
import { useSites } from "@/hooks/use-sites";
import { SiteFilterBar } from "./site-filter-bar";
import { SiteCard } from "./site-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { SiteStatus, SiteType } from "@/schemas/site";

export function SiteList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SiteStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<SiteType | "">("");

  const { data, isLoading, error } = useSites({
    pageSize: 100,
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const sites = useMemo(() => data?.data ?? [], [data]);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>Failed to load sites: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SiteFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No sites found
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}
