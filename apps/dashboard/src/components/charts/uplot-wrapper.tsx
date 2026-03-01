"use client";

import { useRef, useEffect, useCallback } from "react";
import type uPlot from "uplot";

/** Read a CSS variable value from the document root */
function getCSSVar(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export interface UPlotWrapperProps {
  /** uPlot data: array of arrays. First is x (timestamps), rest are y series */
  data: uPlot.AlignedData;
  /** Partial uPlot options — width/height are managed by the wrapper */
  options: Omit<uPlot.Options, "width" | "height">;
  /** Container height in pixels */
  height?: number;
  /** Optional className for the container div */
  className?: string;
}

export function UPlotWrapper({
  data,
  options,
  height = 350,
  className,
}: UPlotWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);
  const uPlotRef = useRef<typeof uPlot | null>(null);

  const createChart = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    // Dynamic import to avoid SSR issues
    if (!uPlotRef.current) {
      const mod = await import("uplot");
      uPlotRef.current = mod.default;
      // Import uPlot CSS
      await import("uplot/dist/uPlot.min.css");
    }

    const UPlot = uPlotRef.current;
    const rect = el.getBoundingClientRect();

    // Destroy previous instance
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const fullOpts: uPlot.Options = {
      ...options,
      width: Math.floor(rect.width),
      height,
    };

    chartRef.current = new UPlot(fullOpts, data, el);
  }, [data, options, height]);

  // Create chart on mount
  useEffect(() => {
    createChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [createChart]);

  // Update data without recreating
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setData(data);
    }
  }, [data]);

  // Handle resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.floor(entry.contentRect.width);
        if (chartRef.current && width > 0) {
          chartRef.current.setSize({ width, height });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [height]);

  return (
    <div ref={containerRef} className={className} style={{ minHeight: height }} />
  );
}

/** Helper: resolve a domain color key to its CSS variable value */
export function getDomainColor(colorKey: string): string {
  return getCSSVar(`--color-${colorKey}`);
}
