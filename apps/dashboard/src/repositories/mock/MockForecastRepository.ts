import type { Forecast, ForecastType } from "@/schemas/forecast";
import type { SiteType } from "@/schemas/site";
import type {
  IForecastRepository,
  ForecastComparison,
} from "@/repositories/interfaces/IForecastRepository";
import { faker, NOW, BASE_LOAD_KW, SOLAR_CAPACITY_KW } from "./data/seed";
import { mockSites } from "./data/sites";
import {
  generateConsumptionCurve,
  generateSolarCurve,
  generateForecast,
  generatePriceSignal,
} from "./data/generators";

/** Day of year from a Date */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function fractionalHour(d: Date): number {
  return d.getHours() + d.getMinutes() / 60;
}

function buildForecast(
  siteId: string,
  type: ForecastType,
  horizonHours: number
): Forecast {
  const site = mockSites.find((s) => s.id === siteId);
  const siteType: SiteType = site?.type ?? "residential";
  const baseLoad = BASE_LOAD_KW[siteType];
  const solarCap = SOLAR_CAPACITY_KW[siteType];
  const seed = siteId.charCodeAt(0) + type.charCodeAt(0);

  const values: Forecast["values"] = [];

  for (let h = 0; h < horizonHours; h++) {
    const t = new Date(NOW.getTime() + h * 60 * 60_000);
    const hour = fractionalHour(t);
    const doy = dayOfYear(t);

    let baseValue: number = 0;
    if (type === "solar") {
      baseValue = generateSolarCurve(hour, doy, solarCap);
    } else if (type === "consumption") {
      baseValue = generateConsumptionCurve(hour, baseLoad, doy);
    } else {
      baseValue = generatePriceSignal(
        Math.floor(hour),
        t.getDay() === 0 || t.getDay() === 6
      ).price_per_kwh;
    }

    const forecast = generateForecast(baseValue, h, seed);

    values.push({
      timestamp: t,
      value_kw: forecast.value_kw,
      confidence_lower: forecast.confidence_lower,
      confidence_upper: forecast.confidence_upper,
    });
  }

  return {
    id: faker.string.uuid(),
    site_id: siteId,
    type,
    source: type === "solar" ? "weather_api" : "ml_model",
    horizon_hours: horizonHours,
    created_at: NOW,
    values,
  };
}

export class MockForecastRepository implements IForecastRepository {
  async getLatest(
    siteId: string,
    type: ForecastType
  ): Promise<Forecast | null> {
    if (!mockSites.find((s) => s.id === siteId)) return null;
    return buildForecast(siteId, type, 48);
  }

  async getForHorizon(
    siteId: string,
    type: ForecastType,
    hours: number
  ): Promise<Forecast | null> {
    if (!mockSites.find((s) => s.id === siteId)) return null;
    return buildForecast(siteId, type, hours);
  }

  async compareWithActual(
    siteId: string,
    type: ForecastType,
    from: Date,
    to: Date
  ): Promise<ForecastComparison | null> {
    const site = mockSites.find((s) => s.id === siteId);
    if (!site) return null;

    const siteType = site.type;
    const baseLoad = BASE_LOAD_KW[siteType];
    const solarCap = SOLAR_CAPACITY_KW[siteType];

    const hours = Math.ceil(
      (to.getTime() - from.getTime()) / (60 * 60_000)
    );
    const forecast = buildForecast(siteId, type, hours);

    // Generate "actuals" — the base curve without forecast noise
    const actuals: { timestamp: Date; value_kw: number }[] = [];
    for (let h = 0; h < hours; h++) {
      const t = new Date(from.getTime() + h * 60 * 60_000);
      const hour = fractionalHour(t);
      const doy = dayOfYear(t);

      let value: number = 0;
      if (type === "solar") {
        value = generateSolarCurve(hour, doy, solarCap);
      } else if (type === "consumption") {
        value = generateConsumptionCurve(hour, baseLoad, doy);
      } else {
        value = generatePriceSignal(
          Math.floor(hour),
          t.getDay() === 0 || t.getDay() === 6
        ).price_per_kwh;
      }

      actuals.push({
        timestamp: t,
        value_kw: Math.round(value * 100) / 100,
      });
    }

    return { forecast, actuals };
  }
}

let instance: MockForecastRepository | null = null;
export function getMockForecastRepository(): MockForecastRepository {
  if (!instance) instance = new MockForecastRepository();
  return instance;
}
