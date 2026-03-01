import type { Device, DeviceStatus, DeviceType } from "@/schemas/device";
import type { ListParams, PaginatedResult } from "./common";

export interface DeviceListParams extends ListParams {
  siteId?: string;
  type?: DeviceType;
  status?: DeviceStatus;
  search?: string;
}

export interface StatusCount {
  status: DeviceStatus;
  count: number;
}

export interface TypeCount {
  type: DeviceType;
  count: number;
}

export interface IDeviceRepository {
  list(params?: DeviceListParams): Promise<PaginatedResult<Device>>;
  getById(id: string): Promise<Device | null>;
  getCountsByStatus(siteId?: string): Promise<StatusCount[]>;
  getCountsByType(siteId?: string): Promise<TypeCount[]>;
}
