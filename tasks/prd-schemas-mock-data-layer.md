# PRD: Schemas & Mock Data Layer (PRD-02)
## Status: In Progress
## Last Updated: 2026-03-01

## 1. Overview

EnergyOS needs a **data foundation** before any real UI pages can be built. This PRD establishes the complete data layer: Zod schemas defining 7 domain entities, seeded mock data generators producing realistic time-series patterns, repository interfaces enforcing a clean data access contract, mock implementations with filtering/pagination/sorting, a factory pattern for swapping mock ↔ real backends, TanStack Query hooks for every entity, and MSW for API route interception. After this PRD, every hook call in every page returns realistic, deterministic mock data — enabling PRD-03 (Overview Dashboard) and PRD-04 (Sites & Devices) to proceed in parallel.

## 2. Goals

- **G1:** Define Zod schemas as the single source of truth for all 7 domain entities — types are always `z.infer<>`, never declared separately
- **G2:** Generate deterministic mock data (`faker.seed(42)`) with mathematically realistic patterns (dual-peak consumption, solar bell curves, battery SoC integration)
- **G3:** Establish the repository pattern (interface → mock impl → factory → hook) so Phase 2 Supabase swap requires zero component changes
- **G4:** Provide TanStack Query hooks with correct cache keys, stale times, and enabled conditions for every entity
- **G5:** Set up MSW v2 for server-side API route interception via `instrumentation.ts`
- **G6:** Validate all environment variables at startup via Zod (fail fast, not at runtime)

## 3. User Stories

- **US-1:** As a developer, I want Zod schemas for every entity so that runtime validation and TypeScript types come from one source
- **US-2:** As a developer, I want `useDevices()` / `useSites()` / etc. hooks so that any page can fetch data with a one-liner
- **US-3:** As a developer, I want mock data that looks like real energy data (solar curves, consumption patterns, battery cycling) so that chart components can be tested with realistic visuals
- **US-4:** As a developer, I want a factory pattern so that swapping from mock → Supabase in Phase 2 requires only adding a new implementation, not changing any hooks or components
- **US-5:** As a developer, I want MSW intercepting API routes so that SSR data fetching works identically to production even in mock mode
- **US-6:** As a reviewer/stakeholder, I want the dashboard pages to show realistic-looking data so I can evaluate the UI without a backend

## 4. Functional Requirements

**Schemas:**
- **FR-1:** `SiteSchema` — id (uuid), name, address, lat/lng (Vienna area: 48.1-48.3°N, 16.2-16.5°E), timezone, grid_connection_kva, status (active/inactive/commissioning), created_at
- **FR-2:** `DeviceSchema` + `DeviceTypeEnum` (solar_inverter, battery, ev_charger, heat_pump, smart_meter, grid_meter) + `DeviceStatusEnum` (online, offline, error, maintenance, commissioning) — id, site_id, name, type, rated_capacity_kw, protocol, firmware_version, status, last_seen_at
- **FR-3:** `ReadingSchema` + `AggregatedReadingSchema` — device_id, timestamp, power_w, energy_kwh, voltage_v, current_a, state_of_charge (nullable, batteries only), temperature_c (nullable), quality (good/interpolated/estimated/missing)
- **FR-4:** `TariffSchema` + `TariffPeriodSchema` — name, currency, price_per_kwh, feed_in_per_kwh, periods[]{start_hour, end_hour, day_types, season, rate_type (peak/offpeak/shoulder)}
- **FR-5:** `ScheduleSchema` — device_id, action (charge/discharge/heat/cool/curtail), start_at, end_at, target_value, priority (1-5), source (manual/optimizer/dr_signal), status (pending/active/completed/cancelled)
- **FR-6:** `ForecastSchema` + `ForecastValueSchema` — site_id, type (solar/consumption/price), source (ml_model/weather_api/persistence), horizon_hours, created_at, values[]{timestamp, value_kw, confidence_lower, confidence_upper}
- **FR-7:** `DREventSchema` — id, type (curtailment/load_shift/frequency_response), signal_value, start_at, end_at, target_reduction_kw, actual_reduction_kw (nullable), status (announced/active/completed/cancelled), participating_site_ids[]

**Mock Data:**
- **FR-8:** Seeded randomness via `faker.seed(42)` — same data on every run for deterministic snapshots
- **FR-9:** 20 sites around Vienna, mix of residential (60%), commercial (30%), industrial (10%)
- **FR-10:** ~200 devices distributed across sites by type — solar inverters + smart meters on all sites, batteries on 40%, EV chargers on 30%, heat pumps on residential. 90% online, 5% offline, 3% error, 2% maintenance
- **FR-11:** `generateConsumptionCurve(hour)` — base load × night dip factor + Gaussian morning peak (center=8h, σ=1.5h) + Gaussian evening peak (center=19h, σ=2h) + random noise ±5%
- **FR-12:** `generateSolarCurve(hour, dayOfYear)` — bell curve centered at solar noon × seasonal factor (cos-based, peaking summer solstice) × (1 - cloudCover). Returns 0 outside 6am-8pm
- **FR-13:** `generateBatterySoC(hour, solarKw, consumptionKw, prevSoC)` — integrates net power flow, clamps 0-100%, respects max charge/discharge rate
- **FR-14:** `generateWeatherData(hour, dayOfYear)` — sinusoidal temperature (daily amplitude ±5°C, seasonal amplitude ±15°C) + noise, derived humidity/wind/irradiance
- **FR-15:** `generateForecast(baseCurve, hoursAhead)` — base curve + Gaussian noise that widens ±2% per hour of horizon. Confidence band from percentiles
- **FR-16:** `generatePriceSignal(hour, tariff)` — step function mapping hour to tariff period rate

**Repositories:**
- **FR-17:** `PaginatedResult<T>` shared type: `{ data, total, page, pageSize, totalPages }`
- **FR-18:** `ISiteRepository` — `list(params)`, `getById(id)`, `getSummary(id)` (aggregates devices + energy totals)
- **FR-19:** `IDeviceRepository` — `list(params)`, `getById(id)`, `getCountsByStatus(siteId?)`, `getCountsByType(siteId?)`
- **FR-20:** `IReadingRepository` — `getLatest(deviceId)`, `getRange(deviceId, from, to, resolution)`, `getAggregate(siteId, from, to)`, `getDailyTotals(siteId, days)`
- **FR-21:** `IForecastRepository` — `getLatest(siteId, type)`, `getForHorizon(siteId, type, hours)`, `compareWithActual(siteId, type, from, to)`
- **FR-22:** `IScheduleRepository` — `list(params)`, `getForDevice(deviceId)`, `getForDateRange(from, to)`, `create(schedule)`, `cancel(id)`
- **FR-23:** `ITariffRepository` — `getActive(siteId)`, `getForSite(siteId)`, `getCurrentPrice(siteId)`
- **FR-24:** Each mock repository implements filtering, pagination (`page`/`pageSize` params), and sorting (`sortBy`/`sortDir`)
- **FR-25:** Factory function per entity — checks `NEXT_PUBLIC_USE_MOCK`, returns mock instance (future: Supabase instance)

**Hooks:**
- **FR-26:** One TanStack Query hook file per entity in `src/hooks/`, using dynamic `import()` of factory for tree-shaking
- **FR-27:** Each hook uses descriptive query keys: `['devices', params]`, `['device', id]`, `['devices', 'counts', 'status', siteId]`
- **FR-28:** `staleTime: 30_000` default, `60_000` for aggregations, `enabled: !!id` guards for detail queries

**Infrastructure:**
- **FR-29:** `src/lib/env.ts` — Zod schema validating `NEXT_PUBLIC_USE_MOCK`, `NEXT_PUBLIC_APP_STAGE`, future Supabase vars (optional). Export typed `env` object
- **FR-30:** MSW v2 handlers intercepting `/api/devices`, `/api/sites`, `/api/readings`, etc.
- **FR-31:** `src/instrumentation.ts` — initializes MSW server-side for Next.js API routes

## 5. Non-Goals / Out of Scope

- **NG-1:** No Supabase or real database implementation — mock only (Phase 2)
- **NG-2:** No UI changes to existing pages beyond wiring one hook for verification
- **NG-3:** No chart components or visualization — that's PRD-03
- **NG-4:** No real-time SSE — that's PRD-07
- **NG-5:** No Zustand stores — `use-filter-store` and `use-ui-store` belong to PRD-03 when the overview page needs cross-component state
- **NG-6:** No API route handlers (Next.js route.ts files) — MSW intercepts at the network level

## 6. Design Considerations

N/A — this PRD is purely data layer, no UI work.

## 7. Technical Considerations

- **TC-1:** All types derived from Zod via `z.infer<>` — never declare a separate `interface` or `type` for an entity
- **TC-2:** Mock data generators must produce 30 days of 15-minute-resolution readings (~2,880 data points per device). For ~200 devices that's ~576,000 readings — generate lazily on query, not all upfront
- **TC-3:** `faker.seed(42)` must be called once in `seed.ts` and imported before any data generation to guarantee determinism
- **TC-4:** Factory uses dynamic `import()` so mock code is tree-shaken in production builds when `NEXT_PUBLIC_USE_MOCK=false`
- **TC-5:** MSW v2 uses `http.get()` / `http.post()` handlers (not the v1 `rest.get()` API)
- **TC-6:** `instrumentation.ts` is a Next.js convention file — it runs once on server startup. Use conditional `import()` to load MSW only when `USE_MOCK=true`
- **TC-7:** TypeScript strict mode — no unused imports (build breaks). Every export must be consumed or explicitly typed as public API

**New dependencies to add to `apps/dashboard/package.json`:**
- `zod` — schema validation
- `@faker-js/faker` — seeded mock data (devDependency)
- `msw` — API mocking (devDependency)

## 8. Success Metrics

- **SM-1:** `pnpm typecheck` passes with zero errors after all schemas, repos, and hooks are created
- **SM-2:** Importing `useDevices()` in the devices stub page returns 200 deterministic mock devices with correct types
- **SM-3:** Mock reading data produces visually realistic patterns when plotted (dual-peak consumption, solar bell curve, battery cycling)
- **SM-4:** `pnpm build` succeeds — no unused imports, no type errors
- **SM-5:** Reloading the page produces identical data (deterministic seeding works)

## 9. Open Questions

- **OQ-1:** Should `DREvent` have its own repository interface, or fold into `IScheduleRepository`? (Recommendation: separate — they have different query patterns)
- **OQ-2:** Reading resolution options — fixed set (1min, 5min, 15min, 1h, 1d) or arbitrary? (Recommendation: fixed enum for mock simplicity)
- **OQ-3:** Should mock repos be singletons (constructed once) or new instance per call? (Recommendation: singletons — data consistency across hooks)

---

## Implementation

### Relevant Files

**New files to create:**
- `src/lib/env.ts` — Zod-validated environment variables
- `src/schemas/site.ts` — Site entity schema
- `src/schemas/device.ts` — Device entity schema + enums
- `src/schemas/reading.ts` — Reading + AggregatedReading schemas
- `src/schemas/tariff.ts` — Tariff + TariffPeriod schemas
- `src/schemas/schedule.ts` — Schedule entity schema
- `src/schemas/forecast.ts` — Forecast + ForecastValue schemas
- `src/schemas/dr-event.ts` — DR Event entity schema
- `src/repositories/interfaces/common.ts` — PaginatedResult, SortParams shared types
- `src/repositories/interfaces/ISiteRepository.ts` — Site repository contract
- `src/repositories/interfaces/IDeviceRepository.ts` — Device repository contract
- `src/repositories/interfaces/IReadingRepository.ts` — Reading repository contract
- `src/repositories/interfaces/IForecastRepository.ts` — Forecast repository contract
- `src/repositories/interfaces/IScheduleRepository.ts` — Schedule repository contract
- `src/repositories/interfaces/ITariffRepository.ts` — Tariff repository contract
- `src/repositories/interfaces/IDREventRepository.ts` — DR Event repository contract
- `src/repositories/mock/data/seed.ts` — faker.seed(42), constants, date ranges
- `src/repositories/mock/data/generators.ts` — 6 mathematical generator functions
- `src/repositories/mock/data/sites.ts` — 20 Vienna-area sites
- `src/repositories/mock/data/devices.ts` — ~200 devices across sites
- `src/repositories/mock/MockSiteRepository.ts` — Mock site data access
- `src/repositories/mock/MockDeviceRepository.ts` — Mock device data access
- `src/repositories/mock/MockReadingRepository.ts` — Mock reading data access (lazy generation)
- `src/repositories/mock/MockForecastRepository.ts` — Mock forecast data access
- `src/repositories/mock/MockScheduleRepository.ts` — Mock schedule data access
- `src/repositories/mock/MockTariffRepository.ts` — Mock tariff data access
- `src/repositories/mock/MockDREventRepository.ts` — Mock DR event data access
- `src/repositories/factory.ts` — Mock/real selector per entity
- `src/hooks/use-sites.ts` — TanStack Query hooks for sites
- `src/hooks/use-devices.ts` — TanStack Query hooks for devices
- `src/hooks/use-readings.ts` — TanStack Query hooks for readings
- `src/hooks/use-forecasts.ts` — TanStack Query hooks for forecasts
- `src/hooks/use-schedules.ts` — TanStack Query hooks for schedules
- `src/hooks/use-tariffs.ts` — TanStack Query hooks for tariffs
- `src/hooks/use-dr-events.ts` — TanStack Query hooks for DR events
- `src/mocks/handlers.ts` — MSW v2 request handlers
- `src/mocks/server.ts` — MSW server setup (Node/SSR)
- `src/mocks/browser.ts` — MSW browser setup (client-side)
- `src/instrumentation.ts` — Next.js instrumentation hook for MSW init

**Files to modify:**
- `apps/dashboard/package.json` — Add zod, @faker-js/faker, msw dependencies

### Notes
- Dependencies needed: `zod` (production), `@faker-js/faker` (devDependency), `msw` (devDependency)
- After adding deps to package.json, user must run `pnpm install` and potentially rebuild devcontainer
- Typecheck: `pnpm typecheck`
- Build verification: `pnpm build`
- All paths below are relative to `apps/dashboard/src/`

### Tasks

- [x] 1.0 Dependencies & Environment Setup
  - [x] 1.1 Add `zod` to `dependencies` and `@faker-js/faker`, `msw` to `devDependencies` in `apps/dashboard/package.json` — ⚠️ USER ACTION: run `pnpm install` after
  - [x] 1.2 Create `src/lib/env.ts` — Zod schema parsing `NEXT_PUBLIC_USE_MOCK` (boolean string), `NEXT_PUBLIC_APP_STAGE` (enum: dev/staging/production), optional Supabase vars. Export typed `env` object. Use `z.coerce` for boolean.

- [x] 2.0 Zod Schemas
  - [x] 2.1 Create `src/schemas/site.ts` — `SiteStatusEnum`, `SiteSchema`, export `type Site = z.infer<typeof SiteSchema>`
  - [x] 2.2 Create `src/schemas/device.ts` — `DeviceTypeEnum`, `DeviceStatusEnum`, `DeviceSchema`, export inferred types
  - [x] 2.3 Create `src/schemas/reading.ts` — `ReadingQualityEnum`, `ReadingSchema`, `AggregatedReadingSchema`, `ReadingResolutionEnum` (1min/5min/15min/1h/1d), export inferred types
  - [x] 2.4 Create `src/schemas/tariff.ts` — `TariffPeriodSchema`, `TariffSchema`, `RateTypeEnum` (peak/offpeak/shoulder), export inferred types
  - [x] 2.5 Create `src/schemas/schedule.ts` — `ScheduleActionEnum`, `ScheduleStatusEnum`, `ScheduleSourceEnum`, `ScheduleSchema`, export inferred types
  - [x] 2.6 Create `src/schemas/forecast.ts` — `ForecastTypeEnum`, `ForecastSourceEnum`, `ForecastValueSchema`, `ForecastSchema`, export inferred types
  - [x] 2.7 Create `src/schemas/dr-event.ts` — `DREventTypeEnum`, `DREventStatusEnum`, `DREventSchema`, export inferred types

- [x] 3.0 Repository Interfaces
  - [x] 3.1 Create `src/repositories/interfaces/common.ts` — `PaginatedResult<T>`, `SortParams`, `ListParams` (page, pageSize, sortBy, sortDir)
  - [x] 3.2 Create `src/repositories/interfaces/ISiteRepository.ts` — `SiteListParams extends ListParams` (search?, status?), interface with `list()`, `getById()`, `getSummary()`
  - [x] 3.3 Create `src/repositories/interfaces/IDeviceRepository.ts` — `DeviceListParams extends ListParams` (siteId?, type?, status?, search?), interface with `list()`, `getById()`, `getCountsByStatus()`, `getCountsByType()`
  - [x] 3.4 Create `src/repositories/interfaces/IReadingRepository.ts` — interface with `getLatest()`, `getRange()`, `getAggregate()`, `getDailyTotals()`
  - [x] 3.5 Create `src/repositories/interfaces/IForecastRepository.ts` — interface with `getLatest()`, `getForHorizon()`, `compareWithActual()`
  - [x] 3.6 Create `src/repositories/interfaces/IScheduleRepository.ts` — `ScheduleListParams extends ListParams`, interface with `list()`, `getForDevice()`, `getForDateRange()`, `create()`, `cancel()`
  - [x] 3.7 Create `src/repositories/interfaces/ITariffRepository.ts` — interface with `getActive()`, `getForSite()`, `getCurrentPrice()`
  - [x] 3.8 Create `src/repositories/interfaces/IDREventRepository.ts` — `DREventListParams extends ListParams`, interface with `list()`, `getById()`, `getActive()`, `getForSite()`

- [ ] 4.0 Mock Data Seed & Generators
  - [ ] 4.1 Create `src/repositories/mock/data/seed.ts` — `faker.seed(42)`, export constants: `NUM_SITES=20`, `DATE_RANGE_DAYS=30`, `READING_INTERVAL_MIN=15`, `NOW` (fixed reference date), Vienna coordinate bounds
  - [ ] 4.2 Create `src/repositories/mock/data/generators.ts` — implement all 6 generator functions: `generateConsumptionCurve()`, `generateSolarCurve()`, `generateBatterySoC()`, `generateWeatherData()`, `generateForecast()`, `generatePriceSignal()`
  - [ ] 4.3 Create `src/repositories/mock/data/sites.ts` — generate 20 sites using faker + Vienna coordinates. 12 residential, 6 commercial, 2 industrial. Deterministic names/addresses
  - [ ] 4.4 Create `src/repositories/mock/data/devices.ts` — generate ~200 devices distributed by site type. Solar + smart meter on all, battery on 40%, EV charger on 30%, heat pump on residential. Apply status distribution (90/5/3/2)

- [ ] 5.0 Mock Repository Implementations
  - [ ] 5.1 Create `src/repositories/mock/MockSiteRepository.ts` — implements `ISiteRepository`. Singleton. Filters by status/search, paginates, sorts. `getSummary()` aggregates device counts + energy from readings
  - [ ] 5.2 Create `src/repositories/mock/MockDeviceRepository.ts` — implements `IDeviceRepository`. Singleton. Filters by siteId/type/status/search, paginates, sorts. `getCountsByStatus()` and `getCountsByType()` return grouped counts
  - [ ] 5.3 Create `src/repositories/mock/MockReadingRepository.ts` — implements `IReadingRepository`. **Lazy generation**: `getRange()` generates readings on-the-fly using generators for the requested time window. `getLatest()` generates single current reading. `getDailyTotals()` aggregates generated data
  - [ ] 5.4 Create `src/repositories/mock/MockForecastRepository.ts` — implements `IForecastRepository`. Generates forecast using `generateForecast()` for requested horizon. `compareWithActual()` returns forecast + generated actuals with intentional drift
  - [ ] 5.5 Create `src/repositories/mock/MockScheduleRepository.ts` — implements `IScheduleRepository`. Pre-generates ~50 schedules across devices. `create()` adds to in-memory array (session-persistent). `cancel()` updates status
  - [ ] 5.6 Create `src/repositories/mock/MockTariffRepository.ts` — implements `ITariffRepository`. 2-3 tariff structures (residential ToU, commercial flat, industrial demand). `getCurrentPrice()` maps current hour to period rate
  - [ ] 5.7 Create `src/repositories/mock/MockDREventRepository.ts` — implements `IDREventRepository`. Pre-generates ~10 DR events (mix of statuses). `getActive()` filters by current time window

- [ ] 6.0 Repository Factory
  - [ ] 6.1 Create `src/repositories/factory.ts` — one `get[Entity]Repository()` async function per entity. Checks `NEXT_PUBLIC_USE_MOCK` env var. Uses dynamic `import()` for mock implementations. Returns singleton instances. Throws descriptive error if real repo requested but not yet implemented

- [ ] 7.0 TanStack Query Hooks
  - [ ] 7.1 Create `src/hooks/use-sites.ts` — `useSites(params?)`, `useSite(id)`, `useSiteSummary(id)`. Dynamic import of factory in queryFn
  - [ ] 7.2 Create `src/hooks/use-devices.ts` — `useDevices(params?)`, `useDevice(id)`, `useDeviceCountsByStatus(siteId?)`, `useDeviceCountsByType(siteId?)`
  - [ ] 7.3 Create `src/hooks/use-readings.ts` — `useLatestReading(deviceId)`, `useReadingRange(deviceId, from, to, resolution)`, `useAggregateReadings(siteId, from, to)`, `useDailyTotals(siteId, days)`
  - [ ] 7.4 Create `src/hooks/use-forecasts.ts` — `useLatestForecast(siteId, type)`, `useForecastHorizon(siteId, type, hours)`, `useForecastVsActual(siteId, type, from, to)`
  - [ ] 7.5 Create `src/hooks/use-schedules.ts` — `useSchedules(params?)`, `useDeviceSchedules(deviceId)`, `useScheduleRange(from, to)`, `useCreateSchedule()`, `useCancelSchedule()`
  - [ ] 7.6 Create `src/hooks/use-tariffs.ts` — `useActiveTariff(siteId)`, `useSiteTariffs(siteId)`, `useCurrentPrice(siteId)`
  - [ ] 7.7 Create `src/hooks/use-dr-events.ts` — `useDREvents(params?)`, `useDREvent(id)`, `useActiveDREvents()`, `useSiteDREvents(siteId)`

- [ ] 8.0 MSW Setup & Instrumentation
  - [ ] 8.1 Create `src/mocks/handlers.ts` — MSW v2 `http.get()`/`http.post()` handlers for all `/api/*` endpoints. Each handler calls the corresponding mock repository and returns JSON
  - [ ] 8.2 Create `src/mocks/server.ts` — `setupServer(...handlers)` for Node/SSR environment
  - [ ] 8.3 Create `src/mocks/browser.ts` — `setupWorker(...handlers)` for browser environment
  - [ ] 8.4 Create `src/instrumentation.ts` — Next.js instrumentation hook. Conditionally imports and starts MSW server when `NEXT_PUBLIC_USE_MOCK=true`

- [ ] 9.0 Verification & Cleanup
  - [ ] 9.1 Wire `useDevices()` into `src/app/(dashboard)/devices/page.tsx` — display device count and first device name to verify data flows end-to-end
  - [ ] 9.2 Run `pnpm typecheck` — fix any type errors across all new files
  - [ ] 9.3 Run `pnpm build` — verify no unused imports, clean production build
  - [ ] 9.4 Verify determinism — reload page twice, confirm same device names/counts appear

### Progress Log
| Date | Task | Notes |
|------|------|-------|
| 2026-03-01 | 1.1 | Added zod, @faker-js/faker, msw to package.json |
| 2026-03-01 | 1.2 | Created src/lib/env.ts with Zod-validated env |
| 2026-03-01 | 2.1-2.7 | All 7 Zod schemas created (site, device, reading, tariff, schedule, forecast, dr-event) |
| 2026-03-01 | 3.1-3.8 | All 8 repository interface files created (common, site, device, reading, forecast, schedule, tariff, dr-event) |
