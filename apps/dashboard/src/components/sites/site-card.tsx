"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Building2, Factory } from "lucide-react";
import type { Site, SiteType } from "@/schemas/site";

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

interface SiteCardProps {
  site: Site;
  deviceCount?: number;
}

export function SiteCard({ site, deviceCount }: SiteCardProps) {
  const router = useRouter();
  const Icon = TYPE_ICONS[site.type] ?? Building2;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => router.push(`/sites/${site.id}`)}
    >
      <CardContent className="flex gap-4 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium truncate">{site.name}</h3>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium shrink-0"
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{
                  backgroundColor: `var(--color-status-${site.status === "active" ? "online" : site.status === "inactive" ? "offline" : "commissioning"})`,
                }}
              />
              {STATUS_LABELS[site.status] ?? site.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{site.address}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {site.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {site.grid_connection_kva} kVA
            </span>
            {deviceCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                {deviceCount} device{deviceCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
