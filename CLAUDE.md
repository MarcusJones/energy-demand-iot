# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Preferences
- Do NOT run pnpm/npm commands directly. Tell me the commands to run instead.
- Use `pnpm` (not npm). This is a pnpm workspace monorepo.
- **NEVER start the dev server** — I always run `pnpm dev` in my own terminal.

## Project Overview

EnergyOS — Next.js 16 Turborepo monorepo for IoT energy management. A dashboard for monitoring sites, devices, energy readings, forecasts, and demand-response schedules.

**Phase 1 (current):** Fully functional frontend with mock data only, deployed to AWS. No real backend yet — `NEXT_PUBLIC_USE_MOCK=true` activates mock repositories everywhere.

**Monorepo structure:** `apps/dashboard/` (`@app/dashboard`) + `packages/ui/` (`@repo/ui` — shared shadcn/ui)

## Commands

```bash
# Development (port 4200)
pnpm dev                                # All apps via Turborepo
pnpm --filter @app/dashboard dev        # Dashboard only

# Build & Quality
pnpm build                              # All packages (Turborepo cached)
pnpm lint                               # ESLint across monorepo
pnpm typecheck                          # tsc --noEmit (strict — unused imports are errors)
pnpm clean                              # Remove .next, dist, .turbo

# shadcn components (run from apps/dashboard/)
cd apps/dashboard && pnpm dlx shadcn@latest add [component]

# Deployment — MUST run from HOST machine, never from dev container
pnpm deploy:dev                         # Deploy dev stage (mock mode)
pnpm deploy                             # Deploy production
pnpm diff:dev                           # Preview infra changes (like terraform plan)
pnpm sst:dev                            # Local SST dev with real AWS resources
pnpm sst:unlock                         # Release a stuck deployment lock
```

## Architecture

**Tech stack:**
- **Framework:** Next.js 16 App Router + Turbopack
- **Language:** TypeScript strict (unused imports break build)
- **Data fetching:** TanStack Query v5
- **State:** Zustand (global filter/UI state)
- **Validation:** Zod — schemas are the single source of truth; types are `z.infer<>`, never declared separately
- **Mocking:** MSW v2 + `@faker-js/faker` (seeded with `faker.seed(42)`)
- **Charts:** uPlot (real-time/time-series) + Apache ECharts (analytics/Sankey) — always wrapped, never used directly in pages
- **UI:** `@repo/ui` (packages/ui — shadcn/ui) + Tailwind CSS v4 (OKLCH design tokens)
- **Deployment:** SST v3 Ion → AWS eu-central-1, CloudFront + Lambda via OpenNext

**Key `apps/dashboard/src/` directories:**
```
app/
  (dashboard)/        # Shared shell layout (sidebar + header)
    page.tsx          # / → Overview KPIs + energy flow + power curve
    sites/            # /sites, /sites/[siteId]
    devices/          # /devices, /devices/[deviceId]
    analytics/        # /analytics — time-series explorer + heatmap
    forecasts/        # /forecasts — 48h prediction + forecast vs. actual
    schedules/        # /schedules — Gantt timeline + DR events
    settings/         # /settings
  api/sse/readings/   # Server-Sent Events — pushes readings every 5s
components/
  ui/                 # shadcn/ui — CLI-managed, never edit manually
  charts/             # uPlot + ECharts wrappers — always import these, never raw libs
  layout/             # AppSidebar, AppHeader, Providers (QueryClient + ThemeProvider)
  [domain]/           # Domain client components (devices/, sites/, analytics/, etc.)
schemas/              # Zod schemas — one file per entity
repositories/
  interfaces/         # I[Entity]Repository.ts — TypeScript contracts
  mock/               # Mock[Entity]Repository.ts + data/
    data/             # seed.ts, generators.ts, sites.ts, devices.ts
  factory.ts          # Checks NEXT_PUBLIC_USE_MOCK → returns correct repo
hooks/                # TanStack Query hooks — one per entity, calls factory
stores/               # Zustand: use-filter-store.ts, use-ui-store.ts
lib/
  env.ts              # Zod-validated env vars — import from here, never from process.env directly
  utils.ts            # cn() and shared utilities
```

## Repository Pattern

The core architectural rule: **all data access goes through repositories.** Never import fetch, Supabase, or any data source directly in a component or page.

The chain is always:

1. **`schemas/[entity].ts`** — Zod schema + `type Entity = z.infer<typeof EntitySchema>`
2. **`repositories/interfaces/I[Entity]Repository.ts`** — TypeScript interface defining query methods
3. **`repositories/mock/Mock[Entity]Repository.ts`** — Mock implementation using seeded faker data
4. **`repositories/factory.ts`** — Returns mock or (future) Supabase implementation based on `NEXT_PUBLIC_USE_MOCK`
5. **`hooks/use[Entity].ts`** — TanStack Query hook; imports from factory only

```typescript
// Pattern for all hooks
export function useDevices(params?: DeviceListParams) {
  return useQuery({
    queryKey: ['devices', params],
    queryFn: async () => {
      const { getDeviceRepository } = await import('@/repositories/factory');
      const repo = await getDeviceRepository();
      return repo.list(params);
    },
    staleTime: 30_000,
  });
}
```

Pagination uses a shared type: `PaginatedResult<T>` — `{ data, total, page, pageSize, totalPages }`.

Phase 2 will add Supabase repositories behind the same factory interface. No component or hook code changes.

## Mock Data Layer

`repositories/mock/data/`:
- `seed.ts` — `faker.seed(42)`, shared constants (`NUM_SITES=20`, date ranges)
- `generators.ts` — Six mathematical generators: `generateConsumptionCurve()` (dual-peak Gaussian), `generateSolarCurve()` (bell curve + seasonal factor), `generateBatterySoC()` (integrates net flow), `generateWeatherData()` (sinusoidal + noise), `generateForecast()` (widening confidence band), `generatePriceSignal()` (step function from tariff periods)
- `sites.ts` — 20 sites around Vienna (48.1–48.3°N, 16.2–16.5°E), mix of residential/commercial/industrial
- `devices.ts` — ~200 devices; 90% online, 5% offline, 3% error, 2% maintenance

## Tailwind Design Tokens

Defined in `globals.css` using OKLCH. Domain-specific Tailwind utilities — always use these, never hardcode colors:
- Energy: `bg-solar`, `text-grid-import`, `bg-grid-export`, `bg-battery-charge`, `bg-battery-discharge`, `bg-consumption`, `bg-ev`
- Status: `bg-status-online`, `bg-status-offline`, `bg-status-error`, `bg-status-maintenance`, `bg-status-commissioning`
- Tariff: `bg-tariff-peak`, `bg-tariff-offpeak`, `bg-tariff-shoulder`

These tokens map directly to chart series colors in uPlot and ECharts configs via `getComputedStyle` / CSS variable lookup.

## Key Patterns

**RSC by default:** Server Components fetch data and pass to client components. Use `'use client'` only for hooks, event handlers, and browser APIs. Each route segment has a `loading.tsx` with `<Skeleton>` grids.

**No barrel exports in apps:** No `index.ts` re-exports inside `apps/`. `packages/ui` is the sole exception (exports via `src/index.ts`).

**Chart wrapping is mandatory:** uPlot and ECharts are never imported in pages or domain components — only the wrappers in `components/charts/` are.

**Leaflet maps:** Always dynamic import with `ssr: false`.

**Real-time SSE:** `api/sse/readings/route.ts` emits a new reading every 5s. Client hook (`use-realtime-reading.ts`) uses `EventSource` and updates the TanStack Query cache directly. Polling fallback if SSE unavailable.

**`next.config.ts` must have `output: "standalone"`** — required for Lambda deployment via OpenNext.

## Environment Variables

Three env files (all gitignored): `.env` (local), `.env.demo`, `.env.prod`. See `.env.example` for documentation.

**Phase 1:**
- `NEXT_PUBLIC_USE_MOCK=true` — activates mock repositories (all stages in Phase 1)
- `NEXT_PUBLIC_APP_STAGE` — controls stage badge in header (`dev` / `staging` / `production`)

**Phase 2 additions (Supabase):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`

**Deployment (SST/AWS):**
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=eu-central-1`
- `CUSTOM_DOMAIN`, `ROUTE53_ZONE_ID` — optional, enables custom domain via SST

## Deployment

SST v3 Ion → AWS eu-central-1 (Frankfurt). **Deploy from the HOST machine only — never from inside the dev container** (no Docker daemon available in devcontainer).

The SST config applies a `$transform` on `aws.lambda.FunctionUrl` adding invoke permissions — required for newer AWS accounts. Stages: `dev` (mock mode) and `production`. Use `pnpm diff:dev` to preview infra changes before deploying.
