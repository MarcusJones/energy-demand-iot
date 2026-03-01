"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useDevice } from "@/hooks/use-devices";
import { useSite } from "@/hooks/use-sites";
import { DeviceInfoCard } from "@/components/devices/device-info-card";
import { DeviceReadingChart } from "@/components/devices/device-reading-chart";
import { DeviceReadingTable } from "@/components/devices/device-reading-table";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { subHours } from "date-fns";

/** Fixed reference "now" — matches seed.ts */
const NOW = new Date("2026-02-28T14:30:00+01:00");
const TWENTY_FOUR_HOURS_AGO = subHours(NOW, 24);

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.deviceId as string;

  const { data: device, isLoading, error } = useDevice(deviceId);
  const { data: site } = useSite(device?.site_id ?? "");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>Failed to load device: {error.message}</span>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <h2 className="text-xl font-semibold">Device not found</h2>
        <p className="text-muted-foreground">
          The device you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/devices"
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to Devices
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/devices">Devices</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{device.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Device info */}
      <DeviceInfoCard device={device} siteName={site?.name ?? null} />

      {/* 24h reading chart */}
      <DeviceReadingChart
        deviceId={device.id}
        deviceType={device.type}
        from={TWENTY_FOUR_HOURS_AGO}
        to={NOW}
      />

      {/* Reading history table */}
      <DeviceReadingTable
        deviceId={device.id}
        isBattery={device.type === "battery"}
        from={TWENTY_FOUR_HOURS_AGO}
        to={NOW}
      />
    </div>
  );
}
