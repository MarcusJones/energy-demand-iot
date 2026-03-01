import type { Reading, AggregatedReading, DailyTotal, ReadingResolution } from "@/schemas/reading";

export interface IReadingRepository {
  getLatest(deviceId: string): Promise<Reading | null>;
  getRange(
    deviceId: string,
    from: Date,
    to: Date,
    resolution: ReadingResolution
  ): Promise<Reading[]>;
  getAggregate(
    siteId: string,
    from: Date,
    to: Date
  ): Promise<AggregatedReading>;
  getDailyTotals(siteId: string, days: number): Promise<DailyTotal[]>;
}
