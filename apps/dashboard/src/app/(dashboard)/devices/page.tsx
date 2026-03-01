"use client";

import { useDevices, useDeviceCountsByStatus } from "@/hooks/use-devices";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DevicesPage() {
  const { data, isLoading, error } = useDevices({ pageSize: 10 });
  const { data: statusCounts } = useDeviceCountsByStatus();

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
        <p className="mt-2 text-destructive">Error loading devices: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Devices</h1>

      {/* Status summary */}
      {statusCounts && (
        <div className="mt-3 flex flex-wrap gap-2">
          {statusCounts.map((sc) => (
            <Badge key={sc.status} variant="secondary">
              {sc.status}: {sc.count}
            </Badge>
          ))}
        </div>
      )}

      {/* Device list */}
      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {data.data.length} of {data.total} devices (page {data.page}/{data.totalPages})
          </p>
          <div className="mt-2 space-y-1">
            {data.data.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <span className="font-medium">{device.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{device.type}</Badge>
                  <Badge
                    variant={
                      device.status === "online"
                        ? "default"
                        : device.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {device.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
