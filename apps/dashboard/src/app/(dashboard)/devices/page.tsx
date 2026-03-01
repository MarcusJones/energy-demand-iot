"use client";

import { DeviceTable } from "@/components/devices/device-table";

export default function DevicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
        <p className="mt-1 text-muted-foreground">
          Fleet overview of all IoT devices across your sites.
        </p>
      </div>
      <DeviceTable />
    </div>
  );
}
