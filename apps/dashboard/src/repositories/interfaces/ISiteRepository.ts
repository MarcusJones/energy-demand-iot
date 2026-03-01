import type { Site, SiteStatus } from "@/schemas/site";
import type { ListParams, PaginatedResult } from "./common";

export interface SiteListParams extends ListParams {
  search?: string;
  status?: SiteStatus;
  type?: string;
}

export interface SiteSummary {
  site: Site;
  deviceCount: number;
  onlineDeviceCount: number;
  totalConsumptionKwh: number;
  totalSolarKwh: number;
  gridImportKwh: number;
  gridExportKwh: number;
}

export interface ISiteRepository {
  list(params?: SiteListParams): Promise<PaginatedResult<Site>>;
  getById(id: string): Promise<Site | null>;
  getSummary(id: string): Promise<SiteSummary | null>;
}
