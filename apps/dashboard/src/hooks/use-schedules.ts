"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleListParams, CreateScheduleInput } from "@/repositories/interfaces/IScheduleRepository";

export function useSchedules(params?: ScheduleListParams) {
  return useQuery({
    queryKey: ["schedules", params],
    queryFn: async () => {
      const { getScheduleRepository } = await import("@/repositories/factory");
      const repo = await getScheduleRepository();
      return repo.list(params);
    },
    staleTime: 30_000,
  });
}

export function useDeviceSchedules(deviceId: string) {
  return useQuery({
    queryKey: ["schedules", "device", deviceId],
    queryFn: async () => {
      const { getScheduleRepository } = await import("@/repositories/factory");
      const repo = await getScheduleRepository();
      return repo.getForDevice(deviceId);
    },
    enabled: !!deviceId,
    staleTime: 30_000,
  });
}

export function useScheduleRange(from: Date | undefined, to: Date | undefined) {
  return useQuery({
    queryKey: ["schedules", "range", from?.toISOString(), to?.toISOString()],
    queryFn: async () => {
      const { getScheduleRepository } = await import("@/repositories/factory");
      const repo = await getScheduleRepository();
      return repo.getForDateRange(from!, to!);
    },
    enabled: !!from && !!to,
    staleTime: 30_000,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const { getScheduleRepository } = await import("@/repositories/factory");
      const repo = await getScheduleRepository();
      return repo.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useCancelSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { getScheduleRepository } = await import("@/repositories/factory");
      const repo = await getScheduleRepository();
      return repo.cancel(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}
