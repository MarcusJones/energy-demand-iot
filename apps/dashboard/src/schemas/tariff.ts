import { z } from "zod";

export const RateTypeEnum = z.enum(["peak", "offpeak", "shoulder"]);
export type RateType = z.infer<typeof RateTypeEnum>;

export const SeasonEnum = z.enum(["summer", "winter", "all"]);
export type Season = z.infer<typeof SeasonEnum>;

export const DayTypeEnum = z.enum(["weekday", "weekend", "all"]);
export type DayType = z.infer<typeof DayTypeEnum>;

export const TariffPeriodSchema = z.object({
  start_hour: z.number().int().min(0).max(23),
  end_hour: z.number().int().min(0).max(23),
  day_type: DayTypeEnum,
  season: SeasonEnum,
  rate_type: RateTypeEnum,
  price_per_kwh: z.number().nonnegative(),
  feed_in_per_kwh: z.number().nonnegative(),
});

export type TariffPeriod = z.infer<typeof TariffPeriodSchema>;

export const TariffSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  name: z.string().min(1),
  currency: z.string().length(3).default("EUR"),
  periods: z.array(TariffPeriodSchema).min(1),
  valid_from: z.coerce.date(),
  valid_to: z.coerce.date().nullable(),
});

export type Tariff = z.infer<typeof TariffSchema>;
