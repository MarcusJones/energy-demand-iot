import type { Schedule, ScheduleAction, ScheduleSource, ScheduleStatus } from "@/schemas/schedule";
import type {
  IScheduleRepository,
  ScheduleListParams,
  CreateScheduleInput,
} from "@/repositories/interfaces/IScheduleRepository";
import type { PaginatedResult } from "@/repositories/interfaces/common";
import { faker, NOW } from "./data/seed";
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

const ACTIONS: ScheduleAction[] = ["charge", "discharge", "heat", "cool", "curtail"];
const SOURCES: ScheduleSource[] = ["manual", "optimizer", "dr_signal"];

/** Actions relevant to each device type */
const TYPE_ACTIONS: Record<string, ScheduleAction[]> = {
  battery: ["charge", "discharge"],
  ev_charger: ["charge"],
  heat_pump: ["heat", "cool"],
  solar_inverter: ["curtail"],
  smart_meter: ["curtail"],
  grid_meter: ["curtail"],
};

function generateSchedules(): Schedule[] {
  const schedules: Schedule[] = [];
  const schedulableDevices = mockDevices.filter((d) =>
    ["battery", "ev_charger", "heat_pump"].includes(d.type)
  );

  for (let i = 0; i < 50; i++) {
    const device = faker.helpers.arrayElement(schedulableDevices);
    const validActions = TYPE_ACTIONS[device.type] ?? ACTIONS;
    const action = faker.helpers.arrayElement(validActions);
    const source = faker.helpers.arrayElement(SOURCES);

    // Schedules spread across past 7 days and next 3 days
    const daysOffset = faker.number.int({ min: -7, max: 3 });
    const startHour = faker.number.int({ min: 0, max: 20 });
    const durationHours = faker.number.int({ min: 1, max: 4 });

    const start_at = new Date(
      NOW.getTime() + daysOffset * 24 * 60 * 60_000 + startHour * 60 * 60_000
    );
    const end_at = new Date(
      start_at.getTime() + durationHours * 60 * 60_000
    );

    // Status based on timing relative to NOW
    let status: ScheduleStatus;
    if (end_at.getTime() < NOW.getTime()) {
      status = faker.helpers.weightedArrayElement([
        { value: "completed" as const, weight: 8 },
        { value: "cancelled" as const, weight: 2 },
      ]);
    } else if (start_at.getTime() <= NOW.getTime()) {
      status = "active";
    } else {
      status = "pending";
    }

    schedules.push({
      id: faker.string.uuid(),
      device_id: device.id,
      action,
      start_at,
      end_at,
      target_value: faker.number.float({ min: 10, max: 90, fractionDigits: 1 }),
      priority: faker.number.int({ min: 1, max: 5 }),
      source,
      status,
      created_at: new Date(start_at.getTime() - 24 * 60 * 60_000),
    });
  }

  return schedules.sort((a, b) => a.start_at.getTime() - b.start_at.getTime());
}

export class MockScheduleRepository implements IScheduleRepository {
  private schedules: Schedule[] = generateSchedules();

  async list(
    params?: ScheduleListParams
  ): Promise<PaginatedResult<Schedule>> {
    let filtered = [...this.schedules];

    if (params?.deviceId) {
      filtered = filtered.filter((s) => s.device_id === params.deviceId);
    }

    if (params?.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    return paginate(filtered, page, pageSize);
  }

  async getForDevice(deviceId: string): Promise<Schedule[]> {
    return this.schedules.filter((s) => s.device_id === deviceId);
  }

  async getForDateRange(from: Date, to: Date): Promise<Schedule[]> {
    return this.schedules.filter(
      (s) =>
        s.start_at.getTime() <= to.getTime() &&
        s.end_at.getTime() >= from.getTime()
    );
  }

  async create(input: CreateScheduleInput): Promise<Schedule> {
    const schedule: Schedule = {
      ...input,
      id: faker.string.uuid(),
      status: "pending",
      created_at: new Date(),
    };
    this.schedules.push(schedule);
    this.schedules.sort(
      (a, b) => a.start_at.getTime() - b.start_at.getTime()
    );
    return schedule;
  }

  async cancel(id: string): Promise<Schedule | null> {
    const schedule = this.schedules.find((s) => s.id === id);
    if (!schedule) return null;
    if (schedule.status === "completed" || schedule.status === "cancelled") {
      return schedule;
    }
    schedule.status = "cancelled";
    return schedule;
  }
}

let instance: MockScheduleRepository | null = null;
export function getMockScheduleRepository(): MockScheduleRepository {
  if (!instance) instance = new MockScheduleRepository();
  return instance;
}
