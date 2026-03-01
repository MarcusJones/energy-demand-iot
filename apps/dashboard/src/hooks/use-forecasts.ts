"use client";

import { useQuery } from "@tanstack/react-query";
import type { ForecastType } from "@/schemas/forecast";

export function useLatestForecast(siteId: string, type: ForecastType) {
  return useQuery({
    queryKey: ["forecast", "latest", siteId, type],
    queryFn: async () => {
      const { getForecastRepository } = await import("@/repositories/factory");
      const repo = await getForecastRepository();
      return repo.getLatest(siteId, type);
    },
    enabled: !!siteId,
    staleTime: 60_000,
  });
}

export function useForecastHorizon(
  siteId: string,
  type: ForecastType,
  hours: number
) {
  return useQuery({
    queryKey: ["forecast", "horizon", siteId, type, hours],
    queryFn: async () => {
      const { getForecastRepository } = await import("@/repositories/factory");
      const repo = await getForecastRepository();
      return repo.getForHorizon(siteId, type, hours);
    },
    enabled: !!siteId,
    staleTime: 60_000,
  });
}

export function useForecastVsActual(
  siteId: string,
  type: ForecastType,
  from: Date | undefined,
  to: Date | undefined
) {
  return useQuery({
    queryKey: ["forecast", "comparison", siteId, type, from?.toISOString(), to?.toISOString()],
    queryFn: async () => {
      const { getForecastRepository } = await import("@/repositories/factory");
      const repo = await getForecastRepository();
      return repo.compareWithActual(siteId, type, from!, to!);
    },
    enabled: !!siteId && !!from && !!to,
    staleTime: 60_000,
  });
}
