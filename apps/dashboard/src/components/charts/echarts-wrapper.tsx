"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ECharts, EChartsOption } from "echarts";

export interface EChartsWrapperProps {
  /** ECharts option object */
  option: EChartsOption;
  /** Container height in pixels */
  height?: number;
  /** Optional className for the container div */
  className?: string;
}

export function EChartsWrapper({
  option,
  height = 400,
  className,
}: EChartsWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const echartsRef = useRef<typeof import("echarts") | null>(null);

  const initChart = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    // Dynamic import to avoid SSR
    if (!echartsRef.current) {
      echartsRef.current = await import("echarts");
    }
    const echarts = echartsRef.current;

    // Dispose previous instance
    if (chartRef.current) {
      chartRef.current.dispose();
      chartRef.current = null;
    }

    chartRef.current = echarts.init(el);
    chartRef.current.setOption(option);
  }, [option]);

  // Init chart on mount
  useEffect(() => {
    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  // Update option
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, { notMerge: true });
    }
  }, [option]);

  // Handle resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: height, width: "100%" }}
    />
  );
}
