import { z } from "zod";

export const SiteStatusEnum = z.enum([
  "active",
  "inactive",
  "commissioning",
]);
export type SiteStatus = z.infer<typeof SiteStatusEnum>;

export const SiteTypeEnum = z.enum([
  "residential",
  "commercial",
  "industrial",
]);
export type SiteType = z.infer<typeof SiteTypeEnum>;

export const SiteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timezone: z.string().default("Europe/Vienna"),
  type: SiteTypeEnum,
  grid_connection_kva: z.number().positive(),
  status: SiteStatusEnum,
  created_at: z.coerce.date(),
});

export type Site = z.infer<typeof SiteSchema>;
