"use client";

import { useQuery } from "@tanstack/react-query";

export function useActiveTariff(siteId: string) {
  return useQuery({
    queryKey: ["tariff", "active", siteId],
    queryFn: async () => {
      const { getTariffRepository } = await import("@/repositories/factory");
      const repo = await getTariffRepository();
      return repo.getActive(siteId);
    },
    enabled: !!siteId,
    staleTime: 60_000,
  });
}

export function useSiteTariffs(siteId: string) {
  return useQuery({
    queryKey: ["tariffs", siteId],
    queryFn: async () => {
      const { getTariffRepository } = await import("@/repositories/factory");
      const repo = await getTariffRepository();
      return repo.getForSite(siteId);
    },
    enabled: !!siteId,
    staleTime: 60_000,
  });
}

export function useCurrentPrice(siteId: string) {
  return useQuery({
    queryKey: ["tariff", "price", siteId],
    queryFn: async () => {
      const { getTariffRepository } = await import("@/repositories/factory");
      const repo = await getTariffRepository();
      return repo.getCurrentPrice(siteId);
    },
    enabled: !!siteId,
    staleTime: 30_000,
  });
}
