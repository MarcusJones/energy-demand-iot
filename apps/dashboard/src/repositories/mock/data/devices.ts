import type { Device, DeviceType, DeviceStatus } from "@/schemas/device";
import type { SiteType } from "@/schemas/site";
import { faker, DEVICE_STATUS_WEIGHTS } from "./seed";
import { mockSites } from "./sites";

const PROTOCOLS = ["Modbus TCP", "SunSpec", "OCPP 1.6", "OCPP 2.0.1", "MQTT", "REST API"];

function pickStatus(): DeviceStatus {
  return faker.helpers.weightedArrayElement([
    { value: "online" as const, weight: DEVICE_STATUS_WEIGHTS.online * 100 },
    { value: "offline" as const, weight: DEVICE_STATUS_WEIGHTS.offline * 100 },
    { value: "error" as const, weight: DEVICE_STATUS_WEIGHTS.error * 100 },
    { value: "maintenance" as const, weight: DEVICE_STATUS_WEIGHTS.maintenance * 100 },
  ]);
}

/** Devices assigned per site based on site type */
function getDeviceTypesForSite(
  siteType: SiteType,
  siteIndex: number
): { type: DeviceType; count: number; capacity: number }[] {
  const devices: { type: DeviceType; count: number; capacity: number }[] = [];

  // All sites get a smart meter + grid meter
  devices.push({ type: "smart_meter", count: 1, capacity: 0 });
  devices.push({ type: "grid_meter", count: 1, capacity: 0 });

  // All sites get solar inverters
  if (siteType === "residential") {
    devices.push({ type: "solar_inverter", count: 1, capacity: faker.helpers.arrayElement([5, 8, 10]) });
  } else if (siteType === "commercial") {
    devices.push({ type: "solar_inverter", count: faker.helpers.arrayElement([2, 3, 4]), capacity: faker.helpers.arrayElement([20, 25, 30]) });
  } else {
    devices.push({ type: "solar_inverter", count: faker.helpers.arrayElement([4, 6, 8]), capacity: faker.helpers.arrayElement([50, 60, 100]) });
  }

  // ~40% of sites get batteries
  if (siteIndex % 5 < 2) {
    if (siteType === "residential") {
      devices.push({ type: "battery", count: 1, capacity: faker.helpers.arrayElement([5, 10, 13.5]) });
    } else if (siteType === "commercial") {
      devices.push({ type: "battery", count: 1, capacity: faker.helpers.arrayElement([50, 100]) });
    } else {
      devices.push({ type: "battery", count: faker.helpers.arrayElement([2, 3]), capacity: faker.helpers.arrayElement([200, 500]) });
    }
  }

  // ~30% of sites get EV chargers
  if (siteIndex % 10 < 3) {
    const count = siteType === "residential" ? 1 : siteType === "commercial" ? faker.helpers.arrayElement([2, 4]) : faker.helpers.arrayElement([4, 8]);
    devices.push({ type: "ev_charger", count, capacity: faker.helpers.arrayElement([7.4, 11, 22]) });
  }

  // Residential sites get heat pumps
  if (siteType === "residential") {
    devices.push({ type: "heat_pump", count: 1, capacity: faker.helpers.arrayElement([6, 8, 12]) });
  }

  return devices;
}

function generateDevice(
  siteId: string,
  type: DeviceType,
  capacity: number,
  deviceIndex: number
): Device {
  const typeLabels: Record<DeviceType, string> = {
    solar_inverter: "Solar Inverter",
    battery: "Battery Storage",
    ev_charger: "EV Charger",
    heat_pump: "Heat Pump",
    smart_meter: "Smart Meter",
    grid_meter: "Grid Meter",
  };

  const status = pickStatus();

  return {
    id: faker.string.uuid(),
    site_id: siteId,
    name: `${typeLabels[type]} #${deviceIndex + 1}`,
    type,
    rated_capacity_kw: capacity,
    protocol: faker.helpers.arrayElement(PROTOCOLS),
    firmware_version: `${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 20 })}`,
    status,
    last_seen_at:
      status === "online"
        ? faker.date.recent({ days: 0.01 }) // minutes ago
        : status === "offline"
          ? faker.date.recent({ days: 7 }) // days ago
          : faker.date.recent({ days: 1 }),
  };
}

/** Generate all devices across all sites. ~200 total. */
function generateAllDevices(): Device[] {
  const devices: Device[] = [];

  for (let siteIndex = 0; siteIndex < mockSites.length; siteIndex++) {
    const site = mockSites[siteIndex];
    const deviceSpecs = getDeviceTypesForSite(site.type, siteIndex);

    for (const spec of deviceSpecs) {
      for (let i = 0; i < spec.count; i++) {
        devices.push(generateDevice(site.id, spec.type, spec.capacity, i));
      }
    }
  }

  return devices;
}

export const mockDevices: Device[] = generateAllDevices();
