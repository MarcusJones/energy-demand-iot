import { z } from "zod";

export const DREventTypeEnum = z.enum([
  "curtailment",
  "load_shift",
  "frequency_response",
]);
export type DREventType = z.infer<typeof DREventTypeEnum>;

export const DREventStatusEnum = z.enum([
  "announced",
  "active",
  "completed",
  "cancelled",
]);
export type DREventStatus = z.infer<typeof DREventStatusEnum>;

export const DREventSchema = z.object({
  id: z.string().uuid(),
  type: DREventTypeEnum,
  signal_value: z.number(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date(),
  target_reduction_kw: z.number().nonnegative(),
  actual_reduction_kw: z.number().nonnegative().nullable(),
  status: DREventStatusEnum,
  participating_site_ids: z.array(z.string().uuid()),
  created_at: z.coerce.date(),
});

export type DREvent = z.infer<typeof DREventSchema>;
