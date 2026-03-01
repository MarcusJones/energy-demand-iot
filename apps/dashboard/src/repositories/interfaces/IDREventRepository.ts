import type { DREvent } from "@/schemas/dr-event";
import type { ListParams, PaginatedResult } from "./common";

export interface DREventListParams extends ListParams {
  status?: string;
  type?: string;
}

export interface IDREventRepository {
  list(params?: DREventListParams): Promise<PaginatedResult<DREvent>>;
  getById(id: string): Promise<DREvent | null>;
  getActive(): Promise<DREvent[]>;
  getForSite(siteId: string): Promise<DREvent[]>;
}
