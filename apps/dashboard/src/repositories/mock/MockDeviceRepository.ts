import type { Device, DeviceStatus, DeviceType } from "@/schemas/device";
import type {
  IDeviceRepository,
  DeviceListParams,
  StatusCount,
  TypeCount,
} from "@/repositories/interfaces/IDeviceRepository";
import type { PaginatedResult } from "@/repositories/interfaces/common";
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

export class MockDeviceRepository implements IDeviceRepository {
  async list(params?: DeviceListParams): Promise<PaginatedResult<Device>> {
    let filtered = [...mockDevices];

    if (params?.siteId) {
      filtered = filtered.filter((d) => d.site_id === params.siteId);
    }

    if (params?.type) {
      filtered = filtered.filter((d) => d.type === params.type);
    }

    if (params?.status) {
      filtered = filtered.filter((d) => d.status === params.status);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((d) => d.name.toLowerCase().includes(q));
    }

    if (params?.sortBy) {
      filtered = sortBy(filtered, params.sortBy, params.sortDir ?? "asc");
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    return paginate(filtered, page, pageSize);
  }

  async getById(id: string): Promise<Device | null> {
    return mockDevices.find((d) => d.id === id) ?? null;
  }

  async getCountsByStatus(siteId?: string): Promise<StatusCount[]> {
    const devices = siteId
      ? mockDevices.filter((d) => d.site_id === siteId)
      : mockDevices;

    const counts = new Map<DeviceStatus, number>();
    for (const d of devices) {
      counts.set(d.status, (counts.get(d.status) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }

  async getCountsByType(siteId?: string): Promise<TypeCount[]> {
    const devices = siteId
      ? mockDevices.filter((d) => d.site_id === siteId)
      : mockDevices;

    const counts = new Map<DeviceType, number>();
    for (const d of devices) {
      counts.set(d.type, (counts.get(d.type) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([type, count]) => ({
      type,
      count,
    }));
  }
}

let instance: MockDeviceRepository | null = null;
export function getMockDeviceRepository(): MockDeviceRepository {
  if (!instance) instance = new MockDeviceRepository();
  return instance;
}
