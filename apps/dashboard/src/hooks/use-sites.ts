"use client";

import { useQuery } from "@tanstack/react-query";
import type { SiteListParams } from "@/repositories/interfaces/ISiteRepository";

export function useSites(params?: SiteListParams) {
  return useQuery({
    queryKey: ["sites", params],
    queryFn: async () => {
      const { getSiteRepository } = await import("@/repositories/factory");
      const repo = await getSiteRepository();
      return repo.list(params);
    },
    staleTime: 30_000,
  });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: ["site", id],
    queryFn: async () => {
      const { getSiteRepository } = await import("@/repositories/factory");
      const repo = await getSiteRepository();
      return repo.getById(id);
    },
    enabled: !!id,
  });
}

export function useSiteSummary(id: string) {
  return useQuery({
    queryKey: ["site", "summary", id],
    queryFn: async () => {
      const { getSiteRepository } = await import("@/repositories/factory");
      const repo = await getSiteRepository();
      return repo.getSummary(id);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
