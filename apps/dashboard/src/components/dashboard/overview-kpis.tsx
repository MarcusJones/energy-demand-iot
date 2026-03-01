"use client";

import { useKPIs } from "@/hooks/use-dashboard";
import { KpiCard } from "@/components/charts/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function OverviewKPIs() {
  const { data: kpis, isLoading, error } = useKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>Failed to load KPI data: {error.message}</span>
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.key}
          label={kpi.label}
          value={kpi.value}
          unit={kpi.unit}
          delta={kpi.delta}
          invertDelta={kpi.invertDelta}
          sparklineData={kpi.sparklineData}
          colorKey={kpi.colorKey}
        />
      ))}
    </div>
  );
}
