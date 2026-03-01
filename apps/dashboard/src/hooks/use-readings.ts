"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReadingResolution } from "@/schemas/reading";

export function useLatestReading(deviceId: string) {
  return useQuery({
    queryKey: ["reading", "latest", deviceId],
    queryFn: async () => {
      const { getReadingRepository } = await import("@/repositories/factory");
      const repo = await getReadingRepository();
      return repo.getLatest(deviceId);
    },
    enabled: !!deviceId,
    staleTime: 10_000,
  });
}

export function useReadingRange(
  deviceId: string,
  from: Date | undefined,
  to: Date | undefined,
  resolution: ReadingResolution = "15min"
) {
  return useQuery({
    queryKey: ["readings", "range", deviceId, from?.toISOString(), to?.toISOString(), resolution],
    queryFn: async () => {
      const { getReadingRepository } = await import("@/repositories/factory");
      const repo = await getReadingRepository();
      return repo.getRange(deviceId, from!, to!, resolution);
    },
    enabled: !!deviceId && !!from && !!to,
    staleTime: 30_000,
  });
}

export function useAggregateReadings(
  siteId: string,
  from: Date | undefined,
  to: Date | undefined
) {
  return useQuery({
    queryKey: ["readings", "aggregate", siteId, from?.toISOString(), to?.toISOString()],
    queryFn: async () => {
      const { getReadingRepository } = await import("@/repositories/factory");
      const repo = await getReadingRepository();
      return repo.getAggregate(siteId, from!, to!);
    },
    enabled: !!siteId && !!from && !!to,
    staleTime: 60_000,
  });
}

export function useDailyTotals(siteId: string, days: number = 30) {
  return useQuery({
    queryKey: ["readings", "dailyTotals", siteId, days],
    queryFn: async () => {
      const { getReadingRepository } = await import("@/repositories/factory");
      const repo = await getReadingRepository();
      return repo.getDailyTotals(siteId, days);
    },
    enabled: !!siteId,
    staleTime: 60_000,
  });
}
