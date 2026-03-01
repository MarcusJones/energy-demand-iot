import { create } from "zustand";
import {
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns";

export type DatePreset = "today" | "yesterday" | "7d" | "30d";

export interface DateRange {
  from: Date;
  to: Date;
  preset: DatePreset;
}

function getDateRange(preset: DatePreset, now: Date): DateRange {
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: now, preset };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday), preset };
    }
    case "7d":
      return { from: startOfDay(subDays(now, 7)), to: now, preset };
    case "30d":
      return { from: startOfDay(subDays(now, 30)), to: now, preset };
  }
}

interface FilterState {
  /** null = all sites aggregated */
  siteId: string | null;
  dateRange: DateRange;
  setSiteId: (id: string | null) => void;
  setDateRange: (preset: DatePreset) => void;
}

/** Reference "now" for mock data — matches seed.ts */
const MOCK_NOW = new Date("2026-02-28T14:30:00+01:00");

export const useFilterStore = create<FilterState>((set) => ({
  siteId: null,
  dateRange: getDateRange("today", MOCK_NOW),
  setSiteId: (id) => set({ siteId: id }),
  setDateRange: (preset) =>
    set({ dateRange: getDateRange(preset, MOCK_NOW) }),
}));
