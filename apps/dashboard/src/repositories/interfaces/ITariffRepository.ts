import type { Tariff } from "@/schemas/tariff";

export interface CurrentPrice {
  price_per_kwh: number;
  feed_in_per_kwh: number;
  rate_type: string;
  currency: string;
}

export interface ITariffRepository {
  getActive(siteId: string): Promise<Tariff | null>;
  getForSite(siteId: string): Promise<Tariff[]>;
  getCurrentPrice(siteId: string): Promise<CurrentPrice | null>;
}
