/**
 * Repository factory — returns mock or (future) real implementation
 * based on the NEXT_PUBLIC_USE_MOCK environment variable.
 *
 * Uses dynamic import() so mock code is tree-shaken when USE_MOCK=false.
 * Each getter returns a singleton instance.
 */

import type { ISiteRepository } from "./interfaces/ISiteRepository";
import type { IDeviceRepository } from "./interfaces/IDeviceRepository";
import type { IReadingRepository } from "./interfaces/IReadingRepository";
import type { IForecastRepository } from "./interfaces/IForecastRepository";
import type { IScheduleRepository } from "./interfaces/IScheduleRepository";
import type { ITariffRepository } from "./interfaces/ITariffRepository";
import type { IDREventRepository } from "./interfaces/IDREventRepository";

function useMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK !== "false";
}

function notImplemented(name: string): never {
  throw new Error(
    `Real ${name} repository is not yet implemented. ` +
      `Set NEXT_PUBLIC_USE_MOCK=true or implement the Supabase repository.`
  );
}

export async function getSiteRepository(): Promise<ISiteRepository> {
  if (useMock()) {
    const { getMockSiteRepository } = await import(
      "./mock/MockSiteRepository"
    );
    return getMockSiteRepository();
  }
  notImplemented("Site");
}

export async function getDeviceRepository(): Promise<IDeviceRepository> {
  if (useMock()) {
    const { getMockDeviceRepository } = await import(
      "./mock/MockDeviceRepository"
    );
    return getMockDeviceRepository();
  }
  notImplemented("Device");
}

export async function getReadingRepository(): Promise<IReadingRepository> {
  if (useMock()) {
    const { getMockReadingRepository } = await import(
      "./mock/MockReadingRepository"
    );
    return getMockReadingRepository();
  }
  notImplemented("Reading");
}

export async function getForecastRepository(): Promise<IForecastRepository> {
  if (useMock()) {
    const { getMockForecastRepository } = await import(
      "./mock/MockForecastRepository"
    );
    return getMockForecastRepository();
  }
  notImplemented("Forecast");
}

export async function getScheduleRepository(): Promise<IScheduleRepository> {
  if (useMock()) {
    const { getMockScheduleRepository } = await import(
      "./mock/MockScheduleRepository"
    );
    return getMockScheduleRepository();
  }
  notImplemented("Schedule");
}

export async function getTariffRepository(): Promise<ITariffRepository> {
  if (useMock()) {
    const { getMockTariffRepository } = await import(
      "./mock/MockTariffRepository"
    );
    return getMockTariffRepository();
  }
  notImplemented("Tariff");
}

export async function getDREventRepository(): Promise<IDREventRepository> {
  if (useMock()) {
    const { getMockDREventRepository } = await import(
      "./mock/MockDREventRepository"
    );
    return getMockDREventRepository();
  }
  notImplemented("DREvent");
}
