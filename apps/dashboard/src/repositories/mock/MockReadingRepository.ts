import type { Reading, AggregatedReading, DailyTotal, ReadingResolution } from "@/schemas/reading";
import type { SiteType } from "@/schemas/site";
import type { IReadingRepository } from "@/repositories/interfaces/IReadingRepository";
import { mockDevices } from "./data/devices";
import { mockSites } from "./data/sites";
import { BASE_LOAD_KW, SOLAR_CAPACITY_KW, BATTERY_CAPACITY_KWH, NOW } from "./data/seed";
import {
  generateConsumptionCurve,
  generateSolarCurve,
  generateBatterySoC,
} from "./data/generators";

/** Resolution to interval in milliseconds */
const RESOLUTION_MS: Record<ReadingResolution, number> = {
  "1min": 60_000,
  "5min": 5 * 60_000,
  "15min": 15 * 60_000,
  "1h": 60 * 60_000,
  "1d": 24 * 60 * 60_000,
};

/** Day of year from a Date */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

/** Fractional hour from a Date */
function fractionalHour(d: Date): number {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/** Look up site type for a device */
function getSiteTypeForDevice(deviceId: string): SiteType {
  const device = mockDevices.find((d) => d.id === deviceId);
  if (!device) return "residential";
  const site = mockSites.find((s) => s.id === device.site_id);
  return site?.type ?? "residential";
}

/** Generate a single reading for a device at a timestamp */
function generateReading(deviceId: string, timestamp: Date): Reading {
  const device = mockDevices.find((d) => d.id === deviceId);
  const siteType = getSiteTypeForDevice(deviceId);
  const hour = fractionalHour(timestamp);
  const doy = dayOfYear(timestamp);

  const baseLoad = BASE_LOAD_KW[siteType];
  const solarCap = SOLAR_CAPACITY_KW[siteType];

  let power_w: number;
  let energy_kwh: number;
  let state_of_charge: number | null = null;

  switch (device?.type) {
    case "solar_inverter": {
      const solarKw = generateSolarCurve(hour, doy, solarCap);
      power_w = solarKw * 1000;
      energy_kwh = solarKw * 0.25; // 15min interval
      break;
    }
    case "battery": {
      const solarKw = generateSolarCurve(hour, doy, solarCap);
      const consumptionKw = generateConsumptionCurve(hour, baseLoad, doy);
      const batCap = BATTERY_CAPACITY_KWH[siteType];
      // Approximate SoC based on time of day
      const prevSoC = 50 + 20 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
      state_of_charge = generateBatterySoC(
        prevSoC,
        solarKw,
        consumptionKw,
        batCap,
        batCap * 0.5, // max rate = 50% of capacity
        0.25
      );
      const netKw = solarKw - consumptionKw;
      power_w = Math.max(-batCap * 500, Math.min(batCap * 500, netKw * 1000));
      energy_kwh = power_w * 0.25 / 1000;
      break;
    }
    case "smart_meter":
    case "grid_meter": {
      const consumptionKw = generateConsumptionCurve(hour, baseLoad, doy);
      power_w = consumptionKw * 1000;
      energy_kwh = consumptionKw * 0.25;
      break;
    }
    case "ev_charger": {
      // EV charging mainly at night (22:00-06:00) and midday (11:00-14:00)
      const isCharging =
        (hour >= 22 || hour < 6) || (hour >= 11 && hour < 14);
      const chargeKw = isCharging ? (device?.rated_capacity_kw ?? 11) * 0.8 : 0;
      power_w = chargeKw * 1000;
      energy_kwh = chargeKw * 0.25;
      break;
    }
    case "heat_pump": {
      // Heat pump runs more in winter, less in summer
      const seasonalFactor =
        0.3 + 0.7 * Math.cos(((doy - 15) / 365) * 2 * Math.PI);
      const hpKw =
        (device?.rated_capacity_kw ?? 8) * 0.5 * seasonalFactor *
        (hour >= 6 && hour <= 22 ? 1 : 0.3);
      power_w = hpKw * 1000;
      energy_kwh = hpKw * 0.25;
      break;
    }
    default: {
      const consumptionKw = generateConsumptionCurve(hour, baseLoad, doy);
      power_w = consumptionKw * 1000;
      energy_kwh = consumptionKw * 0.25;
    }
  }

  return {
    device_id: deviceId,
    timestamp,
    power_w: Math.round(power_w * 100) / 100,
    energy_kwh: Math.round(Math.abs(energy_kwh) * 1000) / 1000,
    voltage_v: 230 + (Math.sin(hour) * 5),
    current_a: Math.abs(power_w) / 230,
    state_of_charge: state_of_charge !== null ? Math.round(state_of_charge * 10) / 10 : null,
    temperature_c: device?.type === "battery" ? 20 + Math.sin(hour) * 5 : null,
    quality: "good",
  };
}

export class MockReadingRepository implements IReadingRepository {
  async getLatest(deviceId: string): Promise<Reading | null> {
    const device = mockDevices.find((d) => d.id === deviceId);
    if (!device) return null;
    return generateReading(deviceId, NOW);
  }

  async getRange(
    deviceId: string,
    from: Date,
    to: Date,
    resolution: ReadingResolution
  ): Promise<Reading[]> {
    const device = mockDevices.find((d) => d.id === deviceId);
    if (!device) return [];

    const intervalMs = RESOLUTION_MS[resolution];
    const readings: Reading[] = [];
    let current = new Date(from.getTime());

    while (current.getTime() <= to.getTime()) {
      readings.push(generateReading(deviceId, new Date(current)));
      current = new Date(current.getTime() + intervalMs);
    }

    return readings;
  }

  async getAggregate(
    siteId: string,
    from: Date,
    to: Date
  ): Promise<AggregatedReading> {
    const siteDevices = mockDevices.filter((d) => d.site_id === siteId);
    const site = mockSites.find((s) => s.id === siteId);
    const siteType: SiteType = site?.type ?? "residential";

    const baseLoad = BASE_LOAD_KW[siteType];
    const solarCap = SOLAR_CAPACITY_KW[siteType];
    const batCap = BATTERY_CAPACITY_KWH[siteType];

    const hours = (to.getTime() - from.getTime()) / (60 * 60 * 1000);
    const intervals = Math.ceil(hours * 4); // 15-min intervals

    let totalConsumption = 0;
    let totalSolar = 0;
    let totalBatteryCharge = 0;
    let totalBatteryDischarge = 0;
    let socSum = 0;
    let socCount = 0;

    for (let i = 0; i < intervals; i++) {
      const t = new Date(from.getTime() + i * 15 * 60_000);
      const hour = fractionalHour(t);
      const doy = dayOfYear(t);

      const consumption = generateConsumptionCurve(hour, baseLoad, doy);
      const solar = generateSolarCurve(hour, doy, solarCap);
      const net = solar - consumption;

      totalConsumption += consumption * 0.25;
      totalSolar += solar * 0.25;

      if (net > 0) {
        totalBatteryCharge += Math.min(net, batCap * 0.5) * 0.25;
      } else {
        totalBatteryDischarge += Math.abs(Math.max(net, -batCap * 0.5)) * 0.25;
      }

      const soc = 50 + 20 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
      socSum += soc;
      socCount++;
    }

    const hasBattery = siteDevices.some((d) => d.type === "battery");
    const gridImport = Math.max(0, totalConsumption - totalSolar + totalBatteryCharge);
    const gridExport = Math.max(0, totalSolar - totalConsumption - totalBatteryDischarge);

    return {
      site_id: siteId,
      timestamp: from,
      total_consumption_kwh: Math.round(totalConsumption * 100) / 100,
      total_solar_kwh: Math.round(totalSolar * 100) / 100,
      total_grid_import_kwh: Math.round(gridImport * 100) / 100,
      total_grid_export_kwh: Math.round(gridExport * 100) / 100,
      total_battery_charge_kwh: hasBattery
        ? Math.round(totalBatteryCharge * 100) / 100
        : 0,
      total_battery_discharge_kwh: hasBattery
        ? Math.round(totalBatteryDischarge * 100) / 100
        : 0,
      avg_battery_soc: hasBattery
        ? Math.round((socSum / socCount) * 10) / 10
        : null,
    };
  }

  async getDailyTotals(siteId: string, days: number): Promise<DailyTotal[]> {
    const totals: DailyTotal[] = [];
    const site = mockSites.find((s) => s.id === siteId);
    const siteType: SiteType = site?.type ?? "residential";

    const baseLoad = BASE_LOAD_KW[siteType];
    const solarCap = SOLAR_CAPACITY_KW[siteType];

    for (let d = 0; d < days; d++) {
      const dayStart = new Date(
        NOW.getTime() - (days - d) * 24 * 60 * 60_000
      );
      const doy = dayOfYear(dayStart);

      let consumption = 0;
      let solar = 0;
      let peakPower = 0;

      // Sweep 24h in 15-min steps
      for (let step = 0; step < 96; step++) {
        const hour = step * 0.25;
        const c = generateConsumptionCurve(hour, baseLoad, doy);
        const s = generateSolarCurve(hour, doy, solarCap);
        consumption += c * 0.25;
        solar += s * 0.25;
        peakPower = Math.max(peakPower, c * 1000);
      }

      const gridImport = Math.max(0, consumption - solar);
      const gridExport = Math.max(0, solar - consumption);
      const selfConsumption = solar > 0
        ? Math.min(1, consumption / solar)
        : 0;

      totals.push({
        date: dayStart,
        consumption_kwh: Math.round(consumption * 100) / 100,
        solar_kwh: Math.round(solar * 100) / 100,
        grid_import_kwh: Math.round(gridImport * 100) / 100,
        grid_export_kwh: Math.round(gridExport * 100) / 100,
        battery_charge_kwh: 0, // simplified — full integration in getAggregate
        battery_discharge_kwh: 0,
        peak_power_w: Math.round(peakPower * 100) / 100,
        self_consumption_ratio: Math.round(selfConsumption * 1000) / 1000,
      });
    }

    return totals;
  }
}

let instance: MockReadingRepository | null = null;
export function getMockReadingRepository(): MockReadingRepository {
  if (!instance) instance = new MockReadingRepository();
  return instance;
}
