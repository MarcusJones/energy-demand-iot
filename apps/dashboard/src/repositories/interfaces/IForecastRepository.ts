import type { Forecast, ForecastType } from "@/schemas/forecast";

export interface ForecastComparison {
  forecast: Forecast;
  actuals: { timestamp: Date; value_kw: number }[];
}

export interface IForecastRepository {
  getLatest(siteId: string, type: ForecastType): Promise<Forecast | null>;
  getForHorizon(
    siteId: string,
    type: ForecastType,
    hours: number
  ): Promise<Forecast | null>;
  compareWithActual(
    siteId: string,
    type: ForecastType,
    from: Date,
    to: Date
  ): Promise<ForecastComparison | null>;
}
