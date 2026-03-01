import type { Tariff } from "@/schemas/tariff";
import type {
  ITariffRepository,
  CurrentPrice,
} from "@/repositories/interfaces/ITariffRepository";
import { faker, NOW } from "./data/seed";
import { mockSites } from "./data/sites";
import { generatePriceSignal } from "./data/generators";

/** Pre-built tariff templates by site type */
function buildTariffs(): Map<string, Tariff[]> {
  const tariffMap = new Map<string, Tariff[]>();

  for (const site of mockSites) {
    const tariffs: Tariff[] = [];

    if (site.type === "residential") {
      tariffs.push({
        id: faker.string.uuid(),
        site_id: site.id,
        name: "Residential Time-of-Use",
        currency: "EUR",
        periods: [
          {
            start_hour: 0, end_hour: 7,
            day_type: "all", season: "all", rate_type: "offpeak",
            price_per_kwh: 0.15, feed_in_per_kwh: 0.06,
          },
          {
            start_hour: 7, end_hour: 9,
            day_type: "weekday", season: "all", rate_type: "shoulder",
            price_per_kwh: 0.22, feed_in_per_kwh: 0.07,
          },
          {
            start_hour: 9, end_hour: 12,
            day_type: "weekday", season: "all", rate_type: "peak",
            price_per_kwh: 0.30, feed_in_per_kwh: 0.08,
          },
          {
            start_hour: 12, end_hour: 17,
            day_type: "weekday", season: "all", rate_type: "shoulder",
            price_per_kwh: 0.22, feed_in_per_kwh: 0.07,
          },
          {
            start_hour: 17, end_hour: 21,
            day_type: "weekday", season: "all", rate_type: "peak",
            price_per_kwh: 0.30, feed_in_per_kwh: 0.08,
          },
          {
            start_hour: 21, end_hour: 0,
            day_type: "all", season: "all", rate_type: "offpeak",
            price_per_kwh: 0.15, feed_in_per_kwh: 0.06,
          },
          {
            start_hour: 7, end_hour: 21,
            day_type: "weekend", season: "all", rate_type: "offpeak",
            price_per_kwh: 0.15, feed_in_per_kwh: 0.06,
          },
        ],
        valid_from: new Date("2025-01-01"),
        valid_to: null,
      });
    } else if (site.type === "commercial") {
      tariffs.push({
        id: faker.string.uuid(),
        site_id: site.id,
        name: "Commercial Flat Rate",
        currency: "EUR",
        periods: [
          {
            start_hour: 0, end_hour: 0,
            day_type: "all", season: "all", rate_type: "offpeak",
            price_per_kwh: 0.18, feed_in_per_kwh: 0.065,
          },
        ],
        valid_from: new Date("2025-01-01"),
        valid_to: null,
      });
    } else {
      tariffs.push({
        id: faker.string.uuid(),
        site_id: site.id,
        name: "Industrial Demand Tariff",
        currency: "EUR",
        periods: [
          {
            start_hour: 0, end_hour: 6,
            day_type: "all", season: "all", rate_type: "offpeak",
            price_per_kwh: 0.10, feed_in_per_kwh: 0.05,
          },
          {
            start_hour: 6, end_hour: 22,
            day_type: "weekday", season: "all", rate_type: "peak",
            price_per_kwh: 0.25, feed_in_per_kwh: 0.07,
          },
          {
            start_hour: 6, end_hour: 22,
            day_type: "weekend", season: "all", rate_type: "shoulder",
            price_per_kwh: 0.16, feed_in_per_kwh: 0.06,
          },
          {
            start_hour: 22, end_hour: 0,
            day_type: "all", season: "all", rate_type: "offpeak",
            price_per_kwh: 0.10, feed_in_per_kwh: 0.05,
          },
        ],
        valid_from: new Date("2025-01-01"),
        valid_to: null,
      });
    }

    tariffMap.set(site.id, tariffs);
  }

  return tariffMap;
}

export class MockTariffRepository implements ITariffRepository {
  private tariffMap = buildTariffs();

  async getActive(siteId: string): Promise<Tariff | null> {
    const tariffs = this.tariffMap.get(siteId);
    if (!tariffs || tariffs.length === 0) return null;
    // Return the one without an end date (currently active)
    return tariffs.find((t) => t.valid_to === null) ?? tariffs[0];
  }

  async getForSite(siteId: string): Promise<Tariff[]> {
    return this.tariffMap.get(siteId) ?? [];
  }

  async getCurrentPrice(siteId: string): Promise<CurrentPrice | null> {
    const tariff = await this.getActive(siteId);
    if (!tariff) return null;

    const hour = NOW.getHours();
    const isWeekend = NOW.getDay() === 0 || NOW.getDay() === 6;
    const priceSignal = generatePriceSignal(hour, isWeekend);

    return {
      price_per_kwh: priceSignal.price_per_kwh,
      feed_in_per_kwh: priceSignal.feed_in_per_kwh,
      rate_type: priceSignal.rate_type,
      currency: tariff.currency,
    };
  }
}

let instance: MockTariffRepository | null = null;
export function getMockTariffRepository(): MockTariffRepository {
  if (!instance) instance = new MockTariffRepository();
  return instance;
}
