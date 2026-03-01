"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "./sparkline";
import { getDomainColor } from "./uplot-wrapper";

interface KpiCardProps {
  label: string;
  value: number;
  unit: string;
  /** Percentage change (e.g., 0.042 = +4.2%) */
  delta: number;
  /** When true, positive delta is bad (e.g., consumption going up) */
  invertDelta?: boolean;
  /** 24 data points for the sparkline */
  sparklineData: number[];
  /** CSS variable key (e.g., "solar", "grid-import") */
  colorKey: string;
}

function formatValue(value: number, unit: string): string {
  if (unit === "€/kWh") return `€${value.toFixed(2)}`;
  if (unit === "%") return `${value}%`;
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 1_000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function formatDelta(delta: number): string {
  const pct = Math.abs(delta * 100);
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  invertDelta = false,
  sparklineData,
  colorKey,
}: KpiCardProps) {
  const color = getDomainColor(colorKey);
  const isPositive = delta > 0;
  const isFavorable = invertDelta ? !isPositive : isPositive;
  const isNeutral = Math.abs(delta) < 0.001;

  return (
    <Card
      className="gap-3 py-4 pl-0 pr-4 overflow-hidden"
      style={{ borderLeft: `4px solid ${color || "var(--border)"}` }}
    >
      <div className="flex items-start justify-between px-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold tracking-tight">
              {formatValue(value, unit)}
            </span>
            {unit !== "€/kWh" && unit !== "%" && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {!isNeutral && (
            <Badge
              variant="outline"
              className={`text-xs ${
                isFavorable
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {formatDelta(delta)}
            </Badge>
          )}
          {isNeutral && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <Minus className="size-3" />
              0%
            </Badge>
          )}
        </div>
      </div>
      <div className="px-4">
        <Sparkline
          data={sparklineData}
          color={color || "#888"}
          label={`${label} trend`}
        />
      </div>
    </Card>
  );
}
