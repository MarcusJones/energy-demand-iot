"use client";

import { useActiveTariff, useCurrentPrice } from "@/hooks/use-tariffs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TariffPeriod, RateType } from "@/schemas/tariff";

const RATE_TYPE_LABELS: Record<RateType, string> = {
  peak: "Peak",
  offpeak: "Off-Peak",
  shoulder: "Shoulder",
};

const RATE_TYPE_COLOR_VAR: Record<RateType, string> = {
  peak: "--color-tariff-peak",
  offpeak: "--color-tariff-offpeak",
  shoulder: "--color-tariff-shoulder",
};

interface SiteTariffTabProps {
  siteId: string;
}

export function SiteTariffTab({ siteId }: SiteTariffTabProps) {
  const { data: tariff, isLoading: tariffLoading } = useActiveTariff(siteId);
  const { data: currentPrice, isLoading: priceLoading } = useCurrentPrice(siteId);

  if (tariffLoading || priceLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (!tariff) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No tariff data available for this site.
      </p>
    );
  }

  // Build 24h timeline — find the period for each hour
  const hourlyPeriods = buildHourlyTimeline(tariff.periods);

  return (
    <div className="flex flex-col gap-6">
      {/* Current price card */}
      {currentPrice && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Rate</p>
              <p className="text-2xl font-bold">
                {currentPrice.price_per_kwh.toFixed(3)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {currentPrice.currency}/kWh
                </span>
              </p>
            </div>
            <Badge
              className="text-white"
              style={{
                backgroundColor: `var(${RATE_TYPE_COLOR_VAR[currentPrice.rate_type as RateType] ?? "--color-tariff-shoulder"})`,
              }}
            >
              {RATE_TYPE_LABELS[currentPrice.rate_type as RateType] ?? currentPrice.rate_type}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Tariff info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tariff.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Feed-in rate */}
          {currentPrice && currentPrice.feed_in_per_kwh > 0 && (
            <p className="text-sm text-muted-foreground">
              Feed-in rate: {currentPrice.feed_in_per_kwh.toFixed(3)} {currentPrice.currency}/kWh
            </p>
          )}

          {/* 24h timeline bar */}
          <div>
            <p className="text-sm font-medium mb-2">24h Rate Timeline (Weekday)</p>
            <div className="flex h-8 w-full overflow-hidden rounded-md border">
              {hourlyPeriods.map((period, i) => (
                <div
                  key={i}
                  className="relative flex-1 group"
                  style={{
                    backgroundColor: `var(${RATE_TYPE_COLOR_VAR[period.rateType]})`,
                    opacity: 0.8,
                  }}
                  title={`${i}:00 — ${RATE_TYPE_LABELS[period.rateType]} (${period.price.toFixed(3)} EUR/kWh)`}
                >
                  {/* Show hour label every 3rd hour */}
                  {i % 3 === 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white drop-shadow-sm">
                      {i}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block size-3 rounded"
                  style={{ backgroundColor: `var(${RATE_TYPE_COLOR_VAR.peak})` }}
                />
                Peak
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block size-3 rounded"
                  style={{ backgroundColor: `var(${RATE_TYPE_COLOR_VAR.offpeak})` }}
                />
                Off-Peak
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block size-3 rounded"
                  style={{ backgroundColor: `var(${RATE_TYPE_COLOR_VAR.shoulder})` }}
                />
                Shoulder
              </span>
            </div>
          </div>

          {/* Rate details */}
          <div>
            <p className="text-sm font-medium mb-2">Rate Details</p>
            <div className="grid gap-2">
              {tariff.periods.map((period, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{
                        backgroundColor: `var(${RATE_TYPE_COLOR_VAR[period.rate_type]})`,
                      }}
                    />
                    <span className="font-medium">
                      {RATE_TYPE_LABELS[period.rate_type]}
                    </span>
                    <span className="text-muted-foreground">
                      {period.start_hour.toString().padStart(2, "0")}:00 – {period.end_hour.toString().padStart(2, "0")}:00
                    </span>
                    {period.day_type !== "all" && (
                      <Badge variant="outline" className="text-xs">
                        {period.day_type}
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium">
                    {period.price_per_kwh.toFixed(3)} EUR/kWh
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface HourlyPeriod {
  rateType: RateType;
  price: number;
}

function buildHourlyTimeline(periods: TariffPeriod[]): HourlyPeriod[] {
  const timeline: HourlyPeriod[] = [];

  for (let hour = 0; hour < 24; hour++) {
    // Find the matching period for this hour (weekday default)
    const match = periods.find((p) => {
      const dayMatch = p.day_type === "all" || p.day_type === "weekday";
      // Handle periods that wrap around midnight
      if (p.start_hour <= p.end_hour) {
        return dayMatch && hour >= p.start_hour && hour < p.end_hour;
      }
      return dayMatch && (hour >= p.start_hour || hour < p.end_hour);
    });

    timeline.push({
      rateType: match?.rate_type ?? "offpeak",
      price: match?.price_per_kwh ?? 0,
    });
  }

  return timeline;
}
