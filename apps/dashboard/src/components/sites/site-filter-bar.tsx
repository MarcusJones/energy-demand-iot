"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { SiteStatus, SiteType } from "@/schemas/site";

const SITE_STATUSES: { value: SiteStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "commissioning", label: "Commissioning" },
];

const SITE_TYPES: { value: SiteType; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
];

interface SiteFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: SiteStatus | "";
  onStatusChange: (value: SiteStatus | "") => void;
  typeFilter: SiteType | "";
  onTypeChange: (value: SiteType | "") => void;
}

export function SiteFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
}: SiteFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search sites..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as SiteStatus | "")}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All Statuses</option>
        {SITE_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as SiteType | "")}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All Types</option>
        {SITE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
