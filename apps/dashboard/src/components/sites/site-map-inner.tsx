"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import type { Site } from "@/schemas/site";
import "leaflet/dist/leaflet.css";

const VIENNA_CENTER: [number, number] = [48.2, 16.37];
const ZOOM = 12;

const STATUS_COLORS: Record<string, string> = {
  active: "var(--color-status-online)",
  inactive: "var(--color-status-offline)",
  commissioning: "var(--color-status-commissioning)",
};

function getStatusColor(status: string): string {
  if (typeof document === "undefined") return "#888";
  const cssVar = STATUS_COLORS[status] ?? "var(--color-status-offline)";
  // Resolve CSS variable to actual color value
  const el = document.documentElement;
  const tempProp = "--_tmp-resolve";
  el.style.setProperty(tempProp, cssVar);
  const resolved = getComputedStyle(el).getPropertyValue(tempProp).trim();
  el.style.removeProperty(tempProp);
  return resolved || "#888";
}

interface SiteMapInnerProps {
  sites: Site[];
}

export function SiteMapInner({ sites }: SiteMapInnerProps) {
  const { resolvedTheme } = useTheme();

  const tileUrl =
    resolvedTheme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution =
    resolvedTheme === "dark"
      ? '&copy; <a href="https://carto.com/">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <MapContainer
      center={VIENNA_CENTER}
      zoom={ZOOM}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer url={tileUrl} attribution={tileAttribution} />
      {sites.map((site) => (
        <CircleMarker
          key={site.id}
          center={[site.lat, site.lng]}
          radius={10}
          pathOptions={{
            color: getStatusColor(site.status),
            fillColor: getStatusColor(site.status),
            fillOpacity: 0.7,
            weight: 2,
          }}
        >
          <Popup>
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <span className="font-semibold text-sm">{site.name}</span>
              <Badge variant="outline" className="w-fit">
                {site.type}
              </Badge>
              <Link
                href={`/sites/${site.id}`}
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                View Details &rarr;
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
