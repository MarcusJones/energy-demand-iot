"use client";

import { useState, useMemo } from "react";
import { useReadingRange } from "@/hooks/use-readings";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Reading, ReadingQuality } from "@/schemas/reading";

const QUALITY_VARIANT: Record<ReadingQuality, "default" | "secondary" | "outline" | "destructive"> = {
  good: "default",
  interpolated: "secondary",
  estimated: "outline",
  missing: "destructive",
};

interface DeviceReadingTableProps {
  deviceId: string;
  isBattery: boolean;
  from: Date;
  to: Date;
}

export function DeviceReadingTable({
  deviceId,
  isBattery,
  from,
  to,
}: DeviceReadingTableProps) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { data: readings, isLoading, error } = useReadingRange(
    deviceId,
    from,
    to,
    "15min"
  );

  // Take last 50 readings, sorted by timestamp
  const displayData = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const sorted = [...readings].sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted.slice(0, 50);
  }, [readings, sortDir]);

  function toggleSort() {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  function formatReading(value: number | null, unit: string): string {
    if (value === null) return "—";
    return `${value.toFixed(1)} ${unit}`;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reading History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reading History</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reading History (last 50)</CardTitle>
      </CardHeader>
      <CardContent>
        {displayData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No readings available
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1"
                  >
                    Timestamp
                    {sortDir === "asc" ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowDown className="size-3.5" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Power (W)</TableHead>
                <TableHead>Energy (kWh)</TableHead>
                <TableHead>Voltage (V)</TableHead>
                {isBattery && <TableHead>SoC (%)</TableHead>}
                <TableHead>Quality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((reading: Reading, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="text-muted-foreground">
                    {format(reading.timestamp, "HH:mm:ss")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {reading.power_w.toFixed(1)}
                  </TableCell>
                  <TableCell>{reading.energy_kwh.toFixed(3)}</TableCell>
                  <TableCell>
                    {formatReading(reading.voltage_v, "")}
                  </TableCell>
                  {isBattery && (
                    <TableCell>
                      {reading.state_of_charge !== null
                        ? `${reading.state_of_charge.toFixed(1)}%`
                        : "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={QUALITY_VARIANT[reading.quality]}>
                      {reading.quality}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
