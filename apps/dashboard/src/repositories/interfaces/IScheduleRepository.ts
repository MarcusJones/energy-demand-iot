import type { Schedule } from "@/schemas/schedule";
import type { ListParams, PaginatedResult } from "./common";

export interface ScheduleListParams extends ListParams {
  deviceId?: string;
  status?: string;
}

export type CreateScheduleInput = Omit<Schedule, "id" | "status" | "created_at">;

export interface IScheduleRepository {
  list(params?: ScheduleListParams): Promise<PaginatedResult<Schedule>>;
  getForDevice(deviceId: string): Promise<Schedule[]>;
  getForDateRange(from: Date, to: Date): Promise<Schedule[]>;
  create(input: CreateScheduleInput): Promise<Schedule>;
  cancel(id: string): Promise<Schedule | null>;
}
