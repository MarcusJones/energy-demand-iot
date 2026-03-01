"use client";

import { useSites } from "@/hooks/use-sites";
import {
  useFilterStore,
  type DatePreset,
} from "@/stores/use-filter-store";
import { cn } from "@/lib/utils";
import { Building2, Calendar } from "lucide-react";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

export function OverviewFilterBar() {
  const { siteId, dateRange, setSiteId, setDateRange } = useFilterStore();
  const { data: sitesData } = useSites({ pageSize: 100 });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Site selector */}
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-muted-foreground" />
        <select
          value={siteId ?? ""}
          onChange={(e) => setSiteId(e.target.value || null)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All Sites</option>
          {sitesData?.data.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date range presets */}
      <div className="flex items-center gap-1">
        <Calendar className="size-4 text-muted-foreground mr-1" />
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => setDateRange(preset.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              dateRange.preset === preset.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
