import { faker } from "@faker-js/faker";

// Deterministic seed — same data on every run
faker.seed(42);

export { faker };

// ── Constants ──────────────────────────────────────────────
export const NUM_SITES = 20;
export const DATE_RANGE_DAYS = 30;
export const READING_INTERVAL_MIN = 15;

/** Fixed reference "now" so mock data is deterministic across renders */
export const NOW = new Date("2026-02-28T14:30:00+01:00");

/** 30 days before NOW */
export const DATE_RANGE_START = new Date(
  NOW.getTime() - DATE_RANGE_DAYS * 24 * 60 * 60 * 1000
);

// ── Vienna coordinate bounds ───────────────────────────────
export const VIENNA_LAT_MIN = 48.1;
export const VIENNA_LAT_MAX = 48.3;
export const VIENNA_LNG_MIN = 16.2;
export const VIENNA_LNG_MAX = 16.5;

// ── Device distribution constants ──────────────────────────
export const DEVICE_STATUS_WEIGHTS = {
  online: 0.9,
  offline: 0.05,
  error: 0.03,
  maintenance: 0.02,
} as const;

// ── Energy constants ───────────────────────────────────────
export const BASE_LOAD_KW = {
  residential: 1.2,
  commercial: 15,
  industrial: 80,
} as const;

export const SOLAR_CAPACITY_KW = {
  residential: 8,
  commercial: 50,
  industrial: 200,
} as const;

export const BATTERY_CAPACITY_KWH = {
  residential: 10,
  commercial: 100,
  industrial: 500,
} as const;
