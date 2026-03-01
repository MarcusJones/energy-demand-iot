import { z } from "zod";

export const ScheduleActionEnum = z.enum([
  "charge",
  "discharge",
  "heat",
  "cool",
  "curtail",
]);
export type ScheduleAction = z.infer<typeof ScheduleActionEnum>;

export const ScheduleStatusEnum = z.enum([
  "pending",
  "active",
  "completed",
  "cancelled",
]);
export type ScheduleStatus = z.infer<typeof ScheduleStatusEnum>;

export const ScheduleSourceEnum = z.enum([
  "manual",
  "optimizer",
  "dr_signal",
]);
export type ScheduleSource = z.infer<typeof ScheduleSourceEnum>;

export const ScheduleSchema = z.object({
  id: z.string().uuid(),
  device_id: z.string().uuid(),
  action: ScheduleActionEnum,
  start_at: z.coerce.date(),
  end_at: z.coerce.date(),
  target_value: z.number(),
  priority: z.number().int().min(1).max(5),
  source: ScheduleSourceEnum,
  status: ScheduleStatusEnum,
  created_at: z.coerce.date(),
});

export type Schedule = z.infer<typeof ScheduleSchema>;
