"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeviceStatusBadge } from "./device-status-badge";
import { formatDistanceToNow } from "date-fns";
import type { Device } from "@/schemas/device";

function formatType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface DeviceInfoCardProps {
  device: Device;
  siteName: string | null;
}

export function DeviceInfoCard({ device, siteName }: DeviceInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Device Info</span>
          <DeviceStatusBadge status={device.status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd>
              <Badge variant="outline">{formatType(device.type)}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rated Capacity</dt>
            <dd className="font-medium">{device.rated_capacity_kw} kW</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Protocol</dt>
            <dd className="font-medium">{device.protocol}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Firmware</dt>
            <dd className="font-medium">{device.firmware_version}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Site</dt>
            <dd>
              {siteName ? (
                <Link
                  href={`/sites/${device.site_id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {siteName}
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last Seen</dt>
            <dd className="font-medium">
              {formatDistanceToNow(device.last_seen_at, { addSuffix: true })}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
