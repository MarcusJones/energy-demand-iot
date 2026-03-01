import { z } from "zod";

export const ReadingQualityEnum = z.enum([
  "good",
  "interpolated",
  "estimated",
  "missing",
]);
export type ReadingQuality = z.infer<typeof ReadingQualityEnum>;

export const ReadingResolutionEnum = z.enum([
  "1min",
  "5min",
  "15min",
  "1h",
  "1d",
]);
export type ReadingResolution = z.infer<typeof ReadingResolutionEnum>;

export const ReadingSchema = z.object({
  device_id: z.string().uuid(),
  timestamp: z.coerce.date(),
  power_w: z.number(),
  energy_kwh: z.number(),
  voltage_v: z.number().nonnegative().nullable(),
  current_a: z.number().nullable(),
  state_of_charge: z.number().min(0).max(100).nullable(),
  temperature_c: z.number().nullable(),
  quality: ReadingQualityEnum,
});

export type Reading = z.infer<typeof ReadingSchema>;

export const AggregatedReadingSchema = z.object({
  site_id: z.string().uuid(),
  timestamp: z.coerce.date(),
  total_consumption_kwh: z.number(),
  total_solar_kwh: z.number(),
  total_grid_import_kwh: z.number(),
  total_grid_export_kwh: z.number(),
  total_battery_charge_kwh: z.number(),
  total_battery_discharge_kwh: z.number(),
  avg_battery_soc: z.number().min(0).max(100).nullable(),
});

export type AggregatedReading = z.infer<typeof AggregatedReadingSchema>;

export const DailyTotalSchema = z.object({
  date: z.coerce.date(),
  consumption_kwh: z.number(),
  solar_kwh: z.number(),
  grid_import_kwh: z.number(),
  grid_export_kwh: z.number(),
  battery_charge_kwh: z.number(),
  battery_discharge_kwh: z.number(),
  peak_power_w: z.number(),
  self_consumption_ratio: z.number().min(0).max(1),
});

export type DailyTotal = z.infer<typeof DailyTotalSchema>;
