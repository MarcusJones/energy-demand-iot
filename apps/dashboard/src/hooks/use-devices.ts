"use client";

import { useQuery } from "@tanstack/react-query";
import type { DeviceListParams } from "@/repositories/interfaces/IDeviceRepository";

export function useDevices(params?: DeviceListParams) {
  return useQuery({
    queryKey: ["devices", params],
    queryFn: async () => {
      const { getDeviceRepository } = await import("@/repositories/factory");
      const repo = await getDeviceRepository();
      return repo.list(params);
    },
    staleTime: 30_000,
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ["device", id],
    queryFn: async () => {
      const { getDeviceRepository } = await import("@/repositories/factory");
      const repo = await getDeviceRepository();
      return repo.getById(id);
    },
    enabled: !!id,
  });
}

export function useDeviceCountsByStatus(siteId?: string) {
  return useQuery({
    queryKey: ["devices", "counts", "status", siteId],
    queryFn: async () => {
      const { getDeviceRepository } = await import("@/repositories/factory");
      const repo = await getDeviceRepository();
      return repo.getCountsByStatus(siteId);
    },
    staleTime: 60_000,
  });
}

export function useDeviceCountsByType(siteId?: string) {
  return useQuery({
    queryKey: ["devices", "counts", "type", siteId],
    queryFn: async () => {
      const { getDeviceRepository } = await import("@/repositories/factory");
      const repo = await getDeviceRepository();
      return repo.getCountsByType(siteId);
    },
    staleTime: 60_000,
  });
}
