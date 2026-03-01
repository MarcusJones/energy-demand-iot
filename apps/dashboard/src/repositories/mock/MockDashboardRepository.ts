import type { IDashboardRepository } from "@/repositories/interfaces/IDashboardRepository";
import type { KPIData, EnergyFlowData, PowerCurveData } from "@/schemas/dashboard";
import type { SiteType } from "@/schemas/site";
import { mockSites } from "./data/sites";
import { BASE_LOAD_KW, SOLAR_CAPACITY_KW, BATTERY_CAPACITY_KWH, NOW } from "./data/seed";
import {
  generateConsumptionCurve,
  generateSolarCurve,
  generateBatterySoC,
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

interface SiteEnergyProfile {
  siteId: string;
  siteType: SiteType;
  baseLoad: number;
  solarCap: number;
  batteryCap: number;
  hasBattery: boolean;
}

function getSiteProfiles(siteId: string | null): SiteEnergyProfile[] {
  const sites = siteId ? mockSites.filter((s) => s.id === siteId) : mockSites;
  return sites.map((s, i) => ({
    siteId: s.id,
    siteType: s.type,
    baseLoad: BASE_LOAD_KW[s.type],
    solarCap: SOLAR_CAPACITY_KW[s.type],
    batteryCap: BATTERY_CAPACITY_KWH[s.type],
    // ~40% of sites have batteries (same logic as devices.ts)
    hasBattery: i % 5 < 2,
  }));
}

/**
 * Compute hourly energy totals across sites for a time range.
 * Returns arrays of hourly values for each energy component.
 */
function computeHourlySeries(
  profiles: SiteEnergyProfile[],
  from: Date,
  to: Date
): {
  timestamps: number[];
  consumption: number[];
  solar: number[];
  gridImport: number[];
  gridExport: number[];
  batteryCharge: number[];
  batteryDischarge: number[];
  batterySoC: number[];
} {
  const hours = Math.ceil((to.getTime() - from.getTime()) / (60 * 60_000));
  const timestamps: number[] = [];
  const consumption: number[] = [];
  const solar: number[] = [];
  const gridImport: number[] = [];
  const gridExport: number[] = [];
  const batteryCharge: number[] = [];
  const batteryDischarge: number[] = [];
  const batterySoC: number[] = [];

  // Track battery SoC per site
  const siteSoC = new Map<string, number>();
  for (const p of profiles) {
    if (p.hasBattery) siteSoC.set(p.siteId, 50); // Start at 50%
  }

  for (let h = 0; h < hours; h++) {
    const t = new Date(from.getTime() + h * 60 * 60_000);
    const hour = fractionalHour(t);
    const doy = dayOfYear(t);
    const tsUnix = Math.floor(t.getTime() / 1000);

    let totalConsumption = 0;
    let totalSolar = 0;
    let totalGridImport = 0;
    let totalGridExport = 0;
    let totalBatteryCharge = 0;
    let totalBatteryDischarge = 0;
    let totalBatterySoC = 0;
    let batteryCount = 0;

    for (const p of profiles) {
      const cons = generateConsumptionCurve(hour, p.baseLoad, doy);
      const sol = generateSolarCurve(hour, doy, p.solarCap);

      totalConsumption += cons;
      totalSolar += sol;

      if (p.hasBattery) {
        const prevSoC = siteSoC.get(p.siteId) ?? 50;
        const maxChargeRate = p.batteryCap * 0.5; // C/2 rate
        const newSoC = generateBatterySoC(
          prevSoC,
          sol,
          cons,
          p.batteryCap,
          maxChargeRate,
          1 // 1-hour intervals
        );
        siteSoC.set(p.siteId, newSoC);

        const socDelta = newSoC - prevSoC;
        const energyKw = (socDelta / 100) * p.batteryCap;

        if (energyKw > 0) {
          totalBatteryCharge += energyKw;
        } else {
          totalBatteryDischarge += Math.abs(energyKw);
        }

        totalBatterySoC += newSoC;
        batteryCount++;
      }

      // Grid = consumption + battery_charge - solar - battery_discharge
      const netGrid = cons + (p.hasBattery ? 0 : 0) - sol;
      // Simplified: excess solar goes to grid export, deficit comes from grid import
      if (netGrid > 0) {
        totalGridImport += netGrid;
      } else {
        totalGridExport += Math.abs(netGrid);
      }
    }

    timestamps.push(tsUnix);
    consumption.push(Math.round(totalConsumption * 100) / 100);
    solar.push(Math.round(totalSolar * 100) / 100);
    gridImport.push(Math.round(totalGridImport * 100) / 100);
    gridExport.push(Math.round(totalGridExport * 100) / 100);
    batteryCharge.push(Math.round(totalBatteryCharge * 100) / 100);
    batteryDischarge.push(Math.round(totalBatteryDischarge * 100) / 100);
    batterySoC.push(
      batteryCount > 0
        ? Math.round((totalBatterySoC / batteryCount) * 10) / 10
        : 0
    );
  }

  return {
    timestamps,
    consumption,
    solar,
    gridImport,
    gridExport,
    batteryCharge,
    batteryDischarge,
    batterySoC,
  };
}

export class MockDashboardRepository implements IDashboardRepository {
  async getKPIs(
    siteId: string | null,
    from: Date,
    to: Date
  ): Promise<KPIData[]> {
    const profiles = getSiteProfiles(siteId);
    const series = computeHourlySeries(profiles, from, to);

    // Compute totals (sum hourly kW values → kWh since intervals are 1h)
    const totalConsumption = series.consumption.reduce((a, b) => a + b, 0);
    const totalSolar = series.solar.reduce((a, b) => a + b, 0);
    const totalGridImport = series.gridImport.reduce((a, b) => a + b, 0);
    const totalGridExport = series.gridExport.reduce((a, b) => a + b, 0);
    const avgBatterySoC =
      series.batterySoC.filter((v) => v > 0).length > 0
        ? series.batterySoC.filter((v) => v > 0).reduce((a, b) => a + b, 0) /
          series.batterySoC.filter((v) => v > 0).length
        : 0;

    // Compute previous period for delta (same duration, just before `from`)
    const duration = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - duration);
    const prevSeries = computeHourlySeries(profiles, prevFrom, from);
    const prevConsumption = prevSeries.consumption.reduce((a, b) => a + b, 0);
    const prevSolar = prevSeries.solar.reduce((a, b) => a + b, 0);
    const prevGridImport = prevSeries.gridImport.reduce((a, b) => a + b, 0);
    const prevGridExport = prevSeries.gridExport.reduce((a, b) => a + b, 0);
    const prevBatterySoC =
      prevSeries.batterySoC.filter((v) => v > 0).length > 0
        ? prevSeries.batterySoC.filter((v) => v > 0).reduce((a, b) => a + b, 0) /
          prevSeries.batterySoC.filter((v) => v > 0).length
        : 0;

    function delta(current: number, previous: number): number {
      if (previous === 0) return 0;
      return (current - previous) / previous;
    }

    // Get last 24 data points for sparklines
    const sparkLen = Math.min(24, series.consumption.length);
    const sparkSlice = (arr: number[]) => arr.slice(-sparkLen);

    // Current tariff
    const nowHour = fractionalHour(NOW);
    const isWeekend = NOW.getDay() === 0 || NOW.getDay() === 6;
    const price = generatePriceSignal(Math.floor(nowHour), isWeekend);

    return [
      {
        key: "consumption",
        label: "Total Consumption",
        value: Math.round(totalConsumption),
        unit: "kWh",
        delta: delta(totalConsumption, prevConsumption),
        invertDelta: true,
        sparklineData: sparkSlice(series.consumption),
        colorKey: "consumption",
      },
      {
        key: "solar",
        label: "Solar Generation",
        value: Math.round(totalSolar),
        unit: "kWh",
        delta: delta(totalSolar, prevSolar),
        invertDelta: false,
        sparklineData: sparkSlice(series.solar),
        colorKey: "solar",
      },
      {
        key: "grid-import",
        label: "Grid Import",
        value: Math.round(totalGridImport),
        unit: "kWh",
        delta: delta(totalGridImport, prevGridImport),
        invertDelta: true,
        sparklineData: sparkSlice(series.gridImport),
        colorKey: "grid-import",
      },
      {
        key: "grid-export",
        label: "Grid Export",
        value: Math.round(totalGridExport),
        unit: "kWh",
        delta: delta(totalGridExport, prevGridExport),
        invertDelta: false,
        sparklineData: sparkSlice(series.gridExport),
        colorKey: "grid-export",
      },
      {
        key: "battery-soc",
        label: "Battery SoC",
        value: Math.round(avgBatterySoC),
        unit: "%",
        delta: delta(avgBatterySoC, prevBatterySoC),
        invertDelta: false,
        sparklineData: sparkSlice(series.batterySoC),
        colorKey: "battery-charge",
      },
      {
        key: "current-price",
        label: "Current Price",
        value: price.price_per_kwh,
        unit: "€/kWh",
        delta: 0, // Price doesn't have a delta concept
        invertDelta: true,
        sparklineData: Array.from({ length: sparkLen }, (_, i) => {
          const h = (Math.floor(nowHour) - sparkLen + 1 + i + 24) % 24;
          return generatePriceSignal(h, isWeekend).price_per_kwh;
        }),
        colorKey: price.rate_type === "peak" ? "tariff-peak" : "tariff-offpeak",
      },
    ];
  }

  async getEnergyFlow(
    siteId: string | null,
    from: Date,
    to: Date
  ): Promise<EnergyFlowData> {
    const profiles = getSiteProfiles(siteId);
    const series = computeHourlySeries(profiles, from, to);

    const totalSolar = series.solar.reduce((a, b) => a + b, 0);
    const totalConsumption = series.consumption.reduce((a, b) => a + b, 0);
    const totalGridImport = series.gridImport.reduce((a, b) => a + b, 0);
    const totalGridExport = series.gridExport.reduce((a, b) => a + b, 0);
    const totalBatteryCharge = series.batteryCharge.reduce((a, b) => a + b, 0);
    const totalBatteryDischarge = series.batteryDischarge.reduce((a, b) => a + b, 0);

    // Compute flow proportions
    // Solar splits: to consumption (self-consumed), to battery, to grid
    const solarToConsumption = Math.min(totalSolar, totalConsumption) * 0.6;
    const solarToBattery = Math.min(totalBatteryCharge, totalSolar * 0.25);
    const solarToGrid = Math.max(0, totalGridExport * 0.9);

    // Grid import goes to consumption
    const gridToConsumption = totalGridImport;

    // Battery discharge goes to consumption
    const batteryToConsumption = totalBatteryDischarge;

    return {
      nodes: [
        { name: "Solar", colorKey: "solar" },
        { name: "Grid Import", colorKey: "grid-import" },
        { name: "Battery", colorKey: "battery-charge" },
        { name: "Consumption", colorKey: "consumption" },
        { name: "Grid Export", colorKey: "grid-export" },
      ],
      links: [
        { source: "Solar", target: "Consumption", value: Math.round(solarToConsumption) },
        { source: "Solar", target: "Battery", value: Math.round(solarToBattery) },
        { source: "Solar", target: "Grid Export", value: Math.round(solarToGrid) },
        { source: "Grid Import", target: "Consumption", value: Math.round(gridToConsumption) },
        { source: "Battery", target: "Consumption", value: Math.round(batteryToConsumption) },
      ].filter((link) => link.value > 0),
    };
  }

  async getPowerCurve(
    siteId: string | null,
    from: Date,
    to: Date
  ): Promise<PowerCurveData> {
    const profiles = getSiteProfiles(siteId);
    const series = computeHourlySeries(profiles, from, to);

    return {
      timestamps: series.timestamps,
      series: {
        Solar: series.solar,
        Consumption: series.consumption,
        "Grid Import": series.gridImport,
        "Grid Export": series.gridExport,
        "Battery Charge": series.batteryCharge,
        "Battery Discharge": series.batteryDischarge,
      },
    };
  }
}

let instance: MockDashboardRepository | null = null;
export function getMockDashboardRepository(): MockDashboardRepository {
  if (!instance) instance = new MockDashboardRepository();
  return instance;
}
