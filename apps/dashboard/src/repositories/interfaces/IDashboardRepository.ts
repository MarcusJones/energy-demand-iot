import type { KPIData, EnergyFlowData, PowerCurveData } from "@/schemas/dashboard";

export interface IDashboardRepository {
  /** Get 6 KPI values with deltas and sparkline data. siteId=null means all sites. */
  getKPIs(
    siteId: string | null,
    from: Date,
    to: Date
  ): Promise<KPIData[]>;

  /** Get Sankey node/link data for energy flow visualization */
  getEnergyFlow(
    siteId: string | null,
    from: Date,
    to: Date
  ): Promise<EnergyFlowData>;

  /** Get multi-series time-series data for the 24h power curve */
  getPowerCurve(
    siteId: string | null,
    from: Date,
    to: Date
  ): Promise<PowerCurveData>;
}
