"use client";

import { useMemo } from "react";
import { usePowerCurve } from "@/hooks/use-dashboard";
import { UPlotWrapper, getDomainColor } from "@/components/charts/uplot-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type uPlot from "uplot";

/** Map series names to domain color keys */
const SERIES_COLOR_MAP: Record<string, string> = {
  Solar: "solar",
  Consumption: "consumption",
  "Grid Import": "grid-import",
  "Grid Export": "grid-export",
  "Battery Charge": "battery-charge",
  "Battery Discharge": "battery-discharge",
};

/** Map series names to display styles */
const SERIES_STYLE_MAP: Record<string, { dash?: number[]; fill?: boolean }> = {
  Solar: { fill: true },
  Consumption: {},
  "Grid Import": { dash: [5, 3] },
  "Grid Export": { dash: [5, 3] },
  "Battery Charge": {},
  "Battery Discharge": {},
};

export function PowerCurve() {
  const { data: curveData, isLoading, error } = usePowerCurve();

  const { data, options } = useMemo(() => {
    if (!curveData) return { data: null, options: null };

    const seriesNames = Object.keys(curveData.series);

    // uPlot data format: [timestamps, ...seriesArrays]
    const alignedData: uPlot.AlignedData = [
      curveData.timestamps,
      ...seriesNames.map((name) => curveData.series[name]),
    ];

    const uPlotSeries: uPlot.Series[] = [
      {}, // x-axis (implicit)
      ...seriesNames.map((name) => {
        const colorKey = SERIES_COLOR_MAP[name] ?? "foreground";
        const color = getDomainColor(colorKey) || "#888";
        const style = SERIES_STYLE_MAP[name] ?? {};

        const series: uPlot.Series = {
          label: name,
          stroke: color,
          width: 2,
          points: { show: false },
        };

        if (style.dash) {
          series.dash = style.dash;
        }

        if (style.fill) {
          series.fill = color + "25"; // ~15% opacity
        }

        return series;
      }),
    ];

    const opts: Omit<uPlot.Options, "width" | "height"> = {
      cursor: {
        drag: { x: false, y: false },
      },
      scales: {
        x: { time: true },
      },
      axes: [
        {
          stroke: "#888",
          grid: { stroke: "#8881", width: 1 },
          ticks: { stroke: "#8882", width: 1 },
          values: (_self: uPlot, ticks: number[]) =>
            ticks.map((t) => {
              const d = new Date(t * 1000);
              return `${d.getHours().toString().padStart(2, "0")}:00`;
            }),
        },
        {
          stroke: "#888",
          grid: { stroke: "#8881", width: 1 },
          ticks: { stroke: "#8882", width: 1 },
          label: "Power (kW)",
          size: 60,
        },
      ],
      series: uPlotSeries,
    };

    return { data: alignedData, options: opts };
  }, [curveData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Power Curve (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Power Curve (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Failed to load power curve: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !options) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Power Curve (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <UPlotWrapper
          data={data}
          options={options}
          height={350}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
