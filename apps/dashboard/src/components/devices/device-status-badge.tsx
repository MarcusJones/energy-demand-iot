"use client";

import type { DeviceStatus } from "@/schemas/device";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<DeviceStatus, string> = {
  online: "Online",
  offline: "Offline",
  error: "Error",
  maintenance: "Maintenance",
  commissioning: "Commissioning",
};

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
  className?: string;
}

export function DeviceStatusBadge({ status, className }: DeviceStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        className
      )}
    >
      <span
        className="inline-block size-2 rounded-full shrink-0"
        style={{
          backgroundColor: `var(--color-status-${status})`,
        }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
