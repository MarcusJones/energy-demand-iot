"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSite, useSiteSummary } from "@/hooks/use-sites";
import { DeviceTable } from "@/components/devices/device-table";
import { SiteEnergyTab } from "@/components/sites/site-energy-tab";
import { SiteTariffTab } from "@/components/sites/site-tariff-tab";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Home, Building2, Factory } from "lucide-react";
import type { SiteType } from "@/schemas/site";

const TYPE_ICONS: Record<SiteType, React.ComponentType<{ className?: string }>> = {
  residential: Home,
  commercial: Building2,
  industrial: Factory,
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  commissioning: "Commissioning",
};

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const { data: site, isLoading, error } = useSite(siteId);
  const { data: summary } = useSiteSummary(siteId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>Failed to load site: {error.message}</span>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <h2 className="text-xl font-semibold">Site not found</h2>
        <p className="text-muted-foreground">
          The site you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/sites"
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to Sites
        </Link>
      </div>
    );
  }

  const Icon = TYPE_ICONS[site.type] ?? Building2;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/sites">Sites</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{site.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{site.name}</h1>
          <p className="text-sm text-muted-foreground">{site.address}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{site.type}</Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <span
                className="inline-block size-2 rounded-full"
                style={{
                  backgroundColor: `var(--color-status-${site.status === "active" ? "online" : site.status === "inactive" ? "offline" : "commissioning"})`,
                }}
              />
              {STATUS_LABELS[site.status] ?? site.status}
            </span>
            <span className="text-xs text-muted-foreground">
              {site.grid_connection_kva} kVA
            </span>
            {summary && (
              <span className="text-xs text-muted-foreground">
                {summary.deviceCount} device{summary.deviceCount !== 1 ? "s" : ""} ({summary.onlineDeviceCount} online)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
          <TabsTrigger value="tariff">Tariff</TabsTrigger>
        </TabsList>
        <TabsContent value="devices" className="mt-4">
          <DeviceTable siteId={siteId} />
        </TabsContent>
        <TabsContent value="energy" className="mt-4">
          <SiteEnergyTab siteId={siteId} />
        </TabsContent>
        <TabsContent value="tariff" className="mt-4">
          <SiteTariffTab siteId={siteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
