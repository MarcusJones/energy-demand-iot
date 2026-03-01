"use client";

import { useRef, useEffect, useCallback } from "react";
import type uPlot from "uplot";

interface SparklineProps {
  /** Array of y-values (no timestamps — just sequential data points) */
  data: number[];
  /** CSS color string for the line/fill */
  color: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Accessible description */
  label?: string;
}

export function Sparkline({
  data,
  color,
  width = 80,
  height = 32,
  label,
}: SparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);
  const uPlotRef = useRef<typeof uPlot | null>(null);

  const createChart = useCallback(async () => {
    const el = containerRef.current;
    if (!el || data.length === 0) return;

    if (!uPlotRef.current) {
      const mod = await import("uplot");
      uPlotRef.current = mod.default;
      await import("uplot/dist/uPlot.min.css");
    }

    const UPlot = uPlotRef.current;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    // Sequential x-axis (0, 1, 2, ...)
    const xData = data.map((_, i) => i);

    const opts: uPlot.Options = {
      width,
      height,
      cursor: { show: false },
      select: { show: false, left: 0, top: 0, width: 0, height: 0 },
      legend: { show: false },
      axes: [
        { show: false },
        { show: false },
      ],
      series: [
        {}, // x-axis series (implicit)
        {
          stroke: color,
          fill: color + "30", // 30 = ~19% opacity hex
          width: 1.5,
          points: { show: false },
        },
      ],
    };

    chartRef.current = new UPlot(opts, [xData, data], el);
  }, [data, color, width, height]);

  useEffect(() => {
    createChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [createChart]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={label ?? "Sparkline chart"}
      style={{ width, height, overflow: "hidden" }}
    />
  );
}
