import type { Site } from "@/schemas/site";
import type {
  ISiteRepository,
  SiteListParams,
  SiteSummary,
} from "@/repositories/interfaces/ISiteRepository";
import type { PaginatedResult } from "@/repositories/interfaces/common";
import { mockSites } from "./data/sites";
import { mockDevices } from "./data/devices";

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return { data, total, page, pageSize, totalPages };
}

function sortBy<T>(items: T[], key: string, dir: "asc" | "desc"): T[] {
  return [...items].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[key];
    const bVal = (b as Record<string, unknown>)[key];
    if (aVal == null || bVal == null) return 0;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return dir === "desc" ? -cmp : cmp;
  });
}

export class MockSiteRepository implements ISiteRepository {
  async list(params?: SiteListParams): Promise<PaginatedResult<Site>> {
    let filtered = [...mockSites];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      );
    }

    if (params?.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }

    if (params?.type) {
      filtered = filtered.filter((s) => s.type === params.type);
    }

    if (params?.sortBy) {
      filtered = sortBy(filtered, params.sortBy, params.sortDir ?? "asc");
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    return paginate(filtered, page, pageSize);
  }

  async getById(id: string): Promise<Site | null> {
    return mockSites.find((s) => s.id === id) ?? null;
  }

  async getSummary(id: string): Promise<SiteSummary | null> {
    const site = mockSites.find((s) => s.id === id);
    if (!site) return null;

    const siteDevices = mockDevices.filter((d) => d.site_id === id);
    const onlineDevices = siteDevices.filter((d) => d.status === "online");

    // Rough energy estimates based on site type for summary display
    const baseMultiplier =
      site.type === "industrial" ? 80 : site.type === "commercial" ? 15 : 1.2;

    return {
      site,
      deviceCount: siteDevices.length,
      onlineDeviceCount: onlineDevices.length,
      totalConsumptionKwh: Math.round(baseMultiplier * 24 * 30),
      totalSolarKwh: Math.round(baseMultiplier * 0.6 * 6 * 30),
      gridImportKwh: Math.round(baseMultiplier * 0.4 * 24 * 30),
      gridExportKwh: Math.round(baseMultiplier * 0.2 * 6 * 30),
    };
  }
}

// Singleton
let instance: MockSiteRepository | null = null;
export function getMockSiteRepository(): MockSiteRepository {
  if (!instance) instance = new MockSiteRepository();
  return instance;
}
