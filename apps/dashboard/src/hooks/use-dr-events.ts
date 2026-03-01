"use client";

import { useQuery } from "@tanstack/react-query";
import type { DREventListParams } from "@/repositories/interfaces/IDREventRepository";

export function useDREvents(params?: DREventListParams) {
  return useQuery({
    queryKey: ["dr-events", params],
    queryFn: async () => {
      const { getDREventRepository } = await import("@/repositories/factory");
      const repo = await getDREventRepository();
      return repo.list(params);
    },
    staleTime: 30_000,
  });
}

export function useDREvent(id: string) {
  return useQuery({
    queryKey: ["dr-event", id],
    queryFn: async () => {
      const { getDREventRepository } = await import("@/repositories/factory");
      const repo = await getDREventRepository();
      return repo.getById(id);
    },
    enabled: !!id,
  });
}

export function useActiveDREvents() {
  return useQuery({
    queryKey: ["dr-events", "active"],
    queryFn: async () => {
      const { getDREventRepository } = await import("@/repositories/factory");
      const repo = await getDREventRepository();
      return repo.getActive();
    },
    staleTime: 30_000,
  });
}

export function useSiteDREvents(siteId: string) {
  return useQuery({
    queryKey: ["dr-events", "site", siteId],
    queryFn: async () => {
      const { getDREventRepository } = await import("@/repositories/factory");
      const repo = await getDREventRepository();
      return repo.getForSite(siteId);
    },
    enabled: !!siteId,
    staleTime: 30_000,
  });
}
