import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/stores/use-filter-store";

export function useKPIs() {
  const { siteId, dateRange } = useFilterStore();

  return useQuery({
    queryKey: ["dashboard", "kpis", siteId, dateRange.preset],
    queryFn: async () => {
      const { getDashboardRepository } = await import(
        "@/repositories/factory"
      );
      const repo = await getDashboardRepository();
      return repo.getKPIs(siteId, dateRange.from, dateRange.to);
    },
    staleTime: 30_000,
  });
}

export function useEnergyFlow() {
  const { siteId, dateRange } = useFilterStore();

  return useQuery({
    queryKey: ["dashboard", "energy-flow", siteId, dateRange.preset],
    queryFn: async () => {
      const { getDashboardRepository } = await import(
        "@/repositories/factory"
      );
      const repo = await getDashboardRepository();
      return repo.getEnergyFlow(siteId, dateRange.from, dateRange.to);
    },
    staleTime: 30_000,
  });
}

export function usePowerCurve() {
  const { siteId, dateRange } = useFilterStore();

  return useQuery({
    queryKey: ["dashboard", "power-curve", siteId, dateRange.preset],
    queryFn: async () => {
      const { getDashboardRepository } = await import(
        "@/repositories/factory"
      );
      const repo = await getDashboardRepository();
      return repo.getPowerCurve(siteId, dateRange.from, dateRange.to);
    },
    staleTime: 30_000,
  });
}
