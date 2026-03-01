"use client";

import { useMemo } from "react";
import { useReadingRange } from "@/hooks/use-readings";
import { UPlotWrapper, getDomainColor } from "@/components/charts/uplot-wrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type uPlot from "uplot";
import type { DeviceType } from "@/schemas/device";

/** Map device type to chart color key */
const TYPE_COLOR_MAP: Record<DeviceType, string> = {
  solar_inverter: "solar",
  battery: "battery-charge",
  ev_charger: "ev",
  heat_pump: "consumption",
  smart_meter: "consumption",
  grid_meter: "grid-import",
};

interface DeviceReadingChartProps {
  deviceId: string;
  deviceType: DeviceType;
  from: Date;
  to: Date;
}

export function DeviceReadingChart({
  deviceId,
  deviceType,
  from,
  to,
}: DeviceReadingChartProps) {
  const { data: readings, isLoading, error } = useReadingRange(
    deviceId,
    from,
    to,
    "15min"
  );

  const { chartData, chartOptions } = useMemo(() => {
    if (!readings || readings.length === 0) {
      return { chartData: null, chartOptions: null };
    }

    const timestamps = readings.map((r) => Math.floor(r.timestamp.getTime() / 1000));
    const powerValues = readings.map((r) => r.power_w / 1000); // Convert W → kW

    const alignedData: uPlot.AlignedData = [timestamps, powerValues];

    const colorKey = TYPE_COLOR_MAP[deviceType] ?? "consumption";
    const color = getDomainColor(colorKey) || "#888";

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
      series: [
        {}, // x-axis
        {
          label: "Power",
          stroke: color,
          fill: color + "25",
          width: 2,
          points: { show: false },
        },
      ],
    };

    return { chartData: alignedData, chartOptions: opts };
  }, [readings, deviceType]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>24h Power Output</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>24h Power Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Failed to load readings: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || !chartOptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>24h Power Output</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            No reading data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>24h Power Output</CardTitle>
      </CardHeader>
      <CardContent>
        <UPlotWrapper
          data={chartData}
          options={chartOptions}
          height={300}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
