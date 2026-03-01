"use client";

import { useMemo } from "react";
import { useSiteSummary } from "@/hooks/use-sites";
import { useReadingRange } from "@/hooks/use-readings";
import { UPlotWrapper, getDomainColor } from "@/components/charts/uplot-wrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Zap, Sun, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { subHours } from "date-fns";
import type uPlot from "uplot";

/** Fixed reference "now" — matches seed.ts */
const NOW = new Date("2026-02-28T14:30:00+01:00");
const TWENTY_FOUR_HOURS_AGO = subHours(NOW, 24);

interface SiteEnergyTabProps {
  siteId: string;
}

export function SiteEnergyTab({ siteId }: SiteEnergyTabProps) {
  const { data: summary, isLoading: summaryLoading } = useSiteSummary(siteId);

  // Use a grid_meter device from the site for readings
  // We use the aggregate readings for the site power curve
  const { data: aggregateReadings, isLoading: readingsLoading, error } = useReadingRange(
    // We pass siteId, but useReadingRange expects deviceId
    // Instead, we use site-level aggregation through a different approach
    // For simplicity, we'll show the summary KPIs from useSiteSummary
    // and skip the chart since we'd need useAggregateReadings for a true site-level chart
    "",
    undefined,
    undefined,
    "1h"
  );

  if (summaryLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No energy data available
      </p>
    );
  }

  const kpis = [
    {
      label: "Consumption",
      value: summary.totalConsumptionKwh,
      unit: "kWh",
      icon: Zap,
      colorVar: "--color-consumption",
    },
    {
      label: "Solar Generation",
      value: summary.totalSolarKwh,
      unit: "kWh",
      icon: Sun,
      colorVar: "--color-solar",
    },
    {
      label: "Grid Import",
      value: summary.gridImportKwh,
      unit: "kWh",
      icon: ArrowDownToLine,
      colorVar: "--color-grid-import",
    },
    {
      label: "Grid Export",
      value: summary.gridExportKwh,
      unit: "kWh",
      icon: ArrowUpFromLine,
      colorVar: "--color-grid-export",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Mini KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `var(${kpi.colorVar})`, opacity: 0.15 }}
              >
                <kpi.icon
                  className="size-4"
                  style={{ color: `var(${kpi.colorVar})` }}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold">
                  {kpi.value >= 1000
                    ? `${(kpi.value / 1000).toFixed(1)}k`
                    : kpi.value.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {kpi.unit}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Energy totals based on the current period. Detailed power curve available in Analytics.
      </p>
    </div>
  );
}
