import { z } from "zod";

export const DeviceTypeEnum = z.enum([
  "solar_inverter",
  "battery",
  "ev_charger",
  "heat_pump",
  "smart_meter",
  "grid_meter",
]);
export type DeviceType = z.infer<typeof DeviceTypeEnum>;

export const DeviceStatusEnum = z.enum([
  "online",
  "offline",
  "error",
  "maintenance",
  "commissioning",
]);
export type DeviceStatus = z.infer<typeof DeviceStatusEnum>;

export const DeviceSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  name: z.string().min(1),
  type: DeviceTypeEnum,
  rated_capacity_kw: z.number().nonnegative(),
  protocol: z.string().min(1),
  firmware_version: z.string().min(1),
  status: DeviceStatusEnum,
  last_seen_at: z.coerce.date(),
});

export type Device = z.infer<typeof DeviceSchema>;
