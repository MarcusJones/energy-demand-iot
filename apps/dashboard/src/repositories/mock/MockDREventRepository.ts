import type { DREvent, DREventType, DREventStatus } from "@/schemas/dr-event";
import type {
  IDREventRepository,
  DREventListParams,
} from "@/repositories/interfaces/IDREventRepository";
import type { PaginatedResult } from "@/repositories/interfaces/common";
import { faker, NOW } from "./data/seed";
import { mockSites } from "./data/sites";

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

const DR_TYPES: DREventType[] = ["curtailment", "load_shift", "frequency_response"];

function generateDREvents(): DREvent[] {
  const events: DREvent[] = [];
  const siteIds = mockSites.map((s) => s.id);

  for (let i = 0; i < 10; i++) {
    const type = faker.helpers.arrayElement(DR_TYPES);
    const daysOffset = faker.number.int({ min: -5, max: 5 });
    const startHour = faker.number.int({ min: 8, max: 18 });
    const durationHours = faker.number.int({ min: 1, max: 4 });

    const start_at = new Date(
      NOW.getTime() + daysOffset * 24 * 60 * 60_000 + startHour * 60 * 60_000
    );
    const end_at = new Date(
      start_at.getTime() + durationHours * 60 * 60_000
    );

    // Pick 3-8 participating sites
    const numParticipants = faker.number.int({ min: 3, max: 8 });
    const participatingSites = faker.helpers
      .shuffle(siteIds)
      .slice(0, numParticipants);

    const targetReduction = faker.number.float({
      min: 20,
      max: 500,
      fractionDigits: 1,
    });

    // Status based on timing
    let status: DREventStatus;
    let actual_reduction_kw: number | null = null;

    if (end_at.getTime() < NOW.getTime()) {
      status = faker.helpers.weightedArrayElement([
        { value: "completed" as const, weight: 8 },
        { value: "cancelled" as const, weight: 2 },
      ]);
      if (status === "completed") {
        // Actual reduction is 70-110% of target
        actual_reduction_kw =
          Math.round(
            targetReduction *
              faker.number.float({ min: 0.7, max: 1.1 }) *
              100
          ) / 100;
      }
    } else if (start_at.getTime() <= NOW.getTime()) {
      status = "active";
      actual_reduction_kw =
        Math.round(
          targetReduction *
            faker.number.float({ min: 0.5, max: 0.9 }) *
            100
        ) / 100;
    } else {
      status = "announced";
    }

    events.push({
      id: faker.string.uuid(),
      type,
      signal_value: faker.number.float({
        min: 0.5,
        max: 2.0,
        fractionDigits: 2,
      }),
      start_at,
      end_at,
      target_reduction_kw: targetReduction,
      actual_reduction_kw,
      status,
      participating_site_ids: participatingSites,
      created_at: new Date(start_at.getTime() - 48 * 60 * 60_000),
    });
  }

  return events.sort(
    (a, b) => a.start_at.getTime() - b.start_at.getTime()
  );
}

export class MockDREventRepository implements IDREventRepository {
  private events: DREvent[] = generateDREvents();

  async list(
    params?: DREventListParams
  ): Promise<PaginatedResult<DREvent>> {
    let filtered = [...this.events];

    if (params?.status) {
      filtered = filtered.filter((e) => e.status === params.status);
    }

    if (params?.type) {
      filtered = filtered.filter((e) => e.type === params.type);
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    return paginate(filtered, page, pageSize);
  }

  async getById(id: string): Promise<DREvent | null> {
    return this.events.find((e) => e.id === id) ?? null;
  }

  async getActive(): Promise<DREvent[]> {
    return this.events.filter((e) => e.status === "active");
  }

  async getForSite(siteId: string): Promise<DREvent[]> {
    return this.events.filter((e) =>
      e.participating_site_ids.includes(siteId)
    );
  }
}

let instance: MockDREventRepository | null = null;
export function getMockDREventRepository(): MockDREventRepository {
  if (!instance) instance = new MockDREventRepository();
  return instance;
}
