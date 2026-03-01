"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDevices } from "@/hooks/use-devices";
import { useSites } from "@/hooks/use-sites";
import { DeviceStatusBadge } from "./device-status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DeviceStatus, DeviceType } from "@/schemas/device";

const DEVICE_STATUSES: DeviceStatus[] = [
  "online",
  "offline",
  "error",
  "maintenance",
  "commissioning",
];

const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: "solar_inverter", label: "Solar Inverter" },
  { value: "battery", label: "Battery" },
  { value: "ev_charger", label: "EV Charger" },
  { value: "heat_pump", label: "Heat Pump" },
  { value: "smart_meter", label: "Smart Meter" },
  { value: "grid_meter", label: "Grid Meter" },
];

const PAGE_SIZES = [10, 20, 50];

type SortField = "name" | "type" | "site_id" | "status" | "rated_capacity_kw" | "last_seen_at" | "protocol";

interface DeviceTableProps {
  /** Pre-filter to a specific site (used in site detail tabs) */
  siteId?: string;
}

export function DeviceTable({ siteId }: DeviceTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<DeviceType | "">("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useDevices({
    siteId,
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    sortBy,
    sortDir,
    page,
    pageSize,
  });

  // Load all sites for the site name column lookup
  const { data: sitesData } = useSites({ pageSize: 100 });
  const siteMap = useMemo(() => {
    const map = new Map<string, string>();
    if (sitesData?.data) {
      for (const s of sitesData.data) {
        map.set(s.id, s.name);
      }
    }
    return map;
  }, [sitesData]);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <ArrowUpDown className="size-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    );
  }

  function formatType(type: string): string {
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>Failed to load devices: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as DeviceStatus | "");
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Statuses</option>
          {DEVICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {!siteId && (
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as DeviceType | "");
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Types</option>
            {DEVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort("name")}
                    className="inline-flex items-center gap-1"
                  >
                    Name <SortIcon field="name" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("type")}
                    className="inline-flex items-center gap-1"
                  >
                    Type <SortIcon field="type" />
                  </button>
                </TableHead>
                {!siteId && (
                  <TableHead>
                    <button
                      onClick={() => handleSort("site_id")}
                      className="inline-flex items-center gap-1"
                    >
                      Site <SortIcon field="site_id" />
                    </button>
                  </TableHead>
                )}
                <TableHead>
                  <button
                    onClick={() => handleSort("status")}
                    className="inline-flex items-center gap-1"
                  >
                    Status <SortIcon field="status" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("rated_capacity_kw")}
                    className="inline-flex items-center gap-1"
                  >
                    Capacity <SortIcon field="rated_capacity_kw" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("last_seen_at")}
                    className="inline-flex items-center gap-1"
                  >
                    Last Seen <SortIcon field="last_seen_at" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("protocol")}
                    className="inline-flex items-center gap-1"
                  >
                    Protocol <SortIcon field="protocol" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={siteId ? 6 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No devices found
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((device) => (
                  <TableRow
                    key={device.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/devices/${device.id}`)}
                  >
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatType(device.type)}</Badge>
                    </TableCell>
                    {!siteId && (
                      <TableCell className="text-muted-foreground">
                        {siteMap.get(device.site_id) ?? "—"}
                      </TableCell>
                    )}
                    <TableCell>
                      <DeviceStatusBadge status={device.status} />
                    </TableCell>
                    <TableCell>{device.rated_capacity_kw} kW</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(device.last_seen_at, { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {device.protocol}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded border border-input bg-background px-2 text-sm"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
