import { z } from "zod";

export const ForecastTypeEnum = z.enum(["solar", "consumption", "price"]);
export type ForecastType = z.infer<typeof ForecastTypeEnum>;

export const ForecastSourceEnum = z.enum([
  "ml_model",
  "weather_api",
  "persistence",
]);
export type ForecastSource = z.infer<typeof ForecastSourceEnum>;

export const ForecastValueSchema = z.object({
  timestamp: z.coerce.date(),
  value_kw: z.number(),
  confidence_lower: z.number(),
  confidence_upper: z.number(),
});

export type ForecastValue = z.infer<typeof ForecastValueSchema>;

export const ForecastSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  type: ForecastTypeEnum,
  source: ForecastSourceEnum,
  horizon_hours: z.number().positive(),
  created_at: z.coerce.date(),
  values: z.array(ForecastValueSchema),
});

export type Forecast = z.infer<typeof ForecastSchema>;
