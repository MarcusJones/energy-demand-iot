# PRD: App Shell & Navigation
## Status: In Progress
## Last Updated: 2026-03-01

## 1. Overview
Establish the foundational shell for the EnergyOS dashboard — a persistent sidebar with navigation, a top header with breadcrumbs and utility controls, and the responsive layout that all subsequent route pages render inside. This is the first deliverable in Phase 1 and is a prerequisite for every other PRD. Without it, nothing is navigable.

## 2. Goals
- **G1** — A working Next.js app scaffold exists at `apps/dashboard/` with Turborepo wired up
- **G2** — All 7 routes render inside a consistent shell (sidebar + header + main content area)
- **G3** — Sidebar navigation highlights the active route and collapses responsively
- **G4** — Dark mode persists across navigation
- **G5** — Stage badge in header makes the deployment environment visually obvious
- **G6** — Every route has a `loading.tsx` skeleton so navigation never shows blank screens

## 3. User Stories
- **US-1** — As a user, I want sidebar navigation so I can move between sections without losing my place
- **US-2** — As a user, I want breadcrumbs in the header so I always know where I am
- **US-3** — As a user, I want dark mode so I can work comfortably in low-light conditions
- **US-4** — As a developer, I want a stage badge so I can immediately see which environment I'm looking at
- **US-5** — As a user on a small screen, I want the sidebar to collapse to a drawer so the dashboard is usable on mobile

## 4. Functional Requirements
- **FR-1** — Root layout (`app/layout.tsx`) provides Inter font, `QueryClientProvider`, `ThemeProvider` (next-themes), and `SidebarProvider`
- **FR-2** — Dashboard layout (`app/(dashboard)/layout.tsx`) renders `<AppSidebar />` + `<SidebarInset>` wrapping `<AppHeader />` and `{children}`
- **FR-3** — Sidebar contains exactly 7 navigation items: Overview (`/`), Sites (`/sites`), Devices (`/devices`), Analytics (`/analytics`), Forecasts (`/forecasts`), Schedules (`/schedules`), Settings (`/settings`)
- **FR-4** — Each nav item displays its `lucide-react` icon and label; the item matching the current pathname is visually active
- **FR-5** — Sidebar footer displays "EnergyOS" and a `v0.1.0` version badge
- **FR-6** — Sidebar collapses to icon-only at ≤ 768px viewport width; at < 768px it renders as a sheet/drawer overlay
- **FR-7** — Header displays: a `SidebarTrigger` button, breadcrumbs auto-generated from the current pathname, a stage badge, and a dark mode toggle
- **FR-8** — Stage badge shows "DEV" (amber) / "STAGING" / "PROD" (red/destructive) derived from `NEXT_PUBLIC_APP_STAGE`
- **FR-9** — Dark mode toggle persists via `next-themes` with `attribute="class"` and `defaultTheme="system"`
- **FR-10** — All 7 routes exist as stub pages showing a heading and placeholder content
- **FR-11** — Every route segment under `(dashboard)/` has a `loading.tsx` using `<Skeleton>` components
- **FR-12** — `@media (prefers-reduced-motion: reduce)` suppresses all animations (in `globals.css`)
- **FR-13** — Dev server runs on port **4500**

## 5. Non-Goals / Out of Scope
- Real data — all pages are stubs with no data fetching
- Authentication / login gate
- Route-level permissions or role-based navigation
- The `packages/ui` shared package — shadcn components live in `apps/dashboard/src/components/ui/` for Phase 1

## 6. Design Considerations
- shadcn init: **New York** style, **Neutral** color, CSS variables enabled
- Design tokens defined in `globals.css` via Tailwind v4 `@theme inline` with OKLCH colors — copy the full token block from `docs/technical-architecture.md` § 2.5
- `next.config.ts` must set `output: "standalone"` for Lambda deployment

## 7. Technical Considerations
- The monorepo has no `package.json` yet — scaffolding is Task 1.0
- `packages/ui/` stub must exist as an empty workspace package (it will be referenced as a dep)
- `sst.config.ts` stub at monorepo root prevents Turborepo resolution errors
- New packages needed: `next-themes`, `lucide-react`, `@tanstack/react-query`
- shadcn components needed: `sidebar`, `skeleton`, `button`, `badge`, `separator`, `tooltip`

## 8. Success Metrics
- `pnpm --filter @app/dashboard dev` starts on port 4500 without errors
- Navigating all 7 routes renders the correct stub inside the persistent shell
- Active nav item highlights correctly on each route
- Dark mode toggles and persists on page refresh
- `pnpm typecheck` passes with zero errors
- `pnpm lint` passes with zero errors

## 9. Open Questions
- **OQ-1** — Should the sidebar version badge (`v0.1.0`) be read from `package.json` or hardcoded? *(Default: hardcode for Phase 1)*
- **OQ-2** — Does Settings need any content in Phase 1, or is a stub sufficient? *(Default: stub)*
- **OQ-3 [BLOCKER]** — `.env` file cannot be written by Claude Code (permission denied). User must manually create `.env` at repo root containing `NEXT_PUBLIC_APP_STAGE=dev`.

---

## Implementation

### Relevant Files
- `package.json` — Root workspace scripts (turbo dev/build/lint/typecheck/clean)
- `pnpm-workspace.yaml` — Declares `apps/*` and `packages/*`
- `turbo.json` — Task graph: dev (persistent), build (outputs .next), lint, type-check, clean
- `sst.config.ts` — Minimal stub (prevents resolution errors; real config comes in deployment PRD)
- `.gitignore` — Updated: removed stale Green TFP entries, added `apps/dashboard/.open-next/`
- `packages/ui/package.json` — Empty shared package stub (`@repo/ui`)
- `packages/ui/tsconfig.json` — Strict TypeScript config for shared package
- `packages/ui/src/index.ts` — Barrel export stub
- `apps/dashboard/package.json` — App package (`@app/dashboard`), dev script on port 4500
- `apps/dashboard/next.config.ts` — `output: "standalone"`, turbopack enabled
- `apps/dashboard/tsconfig.json` — Strict TypeScript, path alias `@/*`
- `apps/dashboard/eslint.config.mjs` — ESLint flat config for Next.js
- `apps/dashboard/src/app/globals.css` — Tailwind v4 import + full OKLCH design token block
- `apps/dashboard/src/app/layout.tsx` — Root layout: Inter font, metadata, `<Providers>`
- `apps/dashboard/src/app/(dashboard)/layout.tsx` — Dashboard shell: AppSidebar + SidebarInset + AppHeader
- `apps/dashboard/src/components/layout/providers.tsx` — QueryClientProvider + ThemeProvider + SidebarProvider
- `apps/dashboard/src/components/layout/app-sidebar.tsx` — Sidebar with nav items, active state, footer badge
- `apps/dashboard/src/components/layout/app-header.tsx` — SidebarTrigger, breadcrumbs, stage badge, dark mode toggle
- `apps/dashboard/src/app/(dashboard)/page.tsx` — Overview stub
- `apps/dashboard/src/app/(dashboard)/loading.tsx` — Dashboard root skeleton
- `apps/dashboard/src/app/(dashboard)/sites/page.tsx` — Sites stub
- `apps/dashboard/src/app/(dashboard)/sites/loading.tsx` — Sites skeleton
- `apps/dashboard/src/app/(dashboard)/devices/page.tsx` — Devices stub
- `apps/dashboard/src/app/(dashboard)/devices/loading.tsx` — Devices skeleton
- `apps/dashboard/src/app/(dashboard)/analytics/page.tsx` — Analytics stub
- `apps/dashboard/src/app/(dashboard)/analytics/loading.tsx` — Analytics skeleton
- `apps/dashboard/src/app/(dashboard)/forecasts/page.tsx` — Forecasts stub
- `apps/dashboard/src/app/(dashboard)/forecasts/loading.tsx` — Forecasts skeleton
- `apps/dashboard/src/app/(dashboard)/schedules/page.tsx` — Schedules stub
- `apps/dashboard/src/app/(dashboard)/schedules/loading.tsx` — Schedules skeleton
- `apps/dashboard/src/app/(dashboard)/settings/page.tsx` — Settings stub

### Notes
- **Install command (tell user to run):** `pnpm install` from repo root after all `package.json` files are created
- **shadcn init (tell user to run):** `cd apps/dashboard && pnpm dlx shadcn@latest init` — choose New York, Neutral, CSS variables yes
- **Add shadcn components (tell user to run):** `cd apps/dashboard && pnpm dlx shadcn@latest add sidebar skeleton button badge separator tooltip breadcrumb`
- **Dev server (tell user to run):** `pnpm --filter @app/dashboard dev` — starts on port 4500
- **Type check:** `pnpm typecheck`
- **Lint:** `pnpm lint`
- `NEXT_PUBLIC_APP_STAGE=dev` must be set in `.env` for the stage badge to render

### Tasks

- [x] 1.0 Scaffold the monorepo root configuration
  - [x] 1.1 Create `package.json` at repo root with workspace scripts: `dev`, `build`, `lint`, `typecheck`, `clean` (all delegating to turbo)
  - [x] 1.2 Create `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`
  - [x] 1.3 Create `turbo.json` with tasks: `dev` (persistent, no cache), `build` (outputs `.next/**`), `lint` (dependsOn `^build`), `type-check` (dependsOn `^build`), `clean` (no cache)
  - [x] 1.4 Create a minimal `sst.config.ts` stub at repo root (app name `energyos`, home `aws`, no resources yet)
  - [x] 1.5 Update `.gitignore` — removed stale Green TFP entries, added `apps/dashboard/.open-next/`

- [x] 2.0 Scaffold `packages/ui` stub
  - [x] 2.1 Create `packages/ui/package.json` with name `@repo/ui`, main `./src/index.ts`
  - [x] 2.2 Create `packages/ui/tsconfig.json` (strict, ESNext, bundler resolution, jsx react-jsx)
  - [x] 2.3 Create `packages/ui/src/index.ts` with `export {};` (empty barrel — populated in later PRDs)

- [x] 3.0 Scaffold `apps/dashboard` Next.js application
  - [x] 3.1 Create `apps/dashboard/package.json` with name `@app/dashboard`, dev script `next dev --turbopack -p 4500`
  - [x] 3.2 Create `apps/dashboard/next.config.ts` with `output: "standalone"` and `turbopack: {}`
  - [x] 3.3 Create `apps/dashboard/tsconfig.json` with strict mode, path alias `@/*` → `./src/*`, bundler module resolution
  - [x] 3.4 ⚠️ USER ACTION REQUIRED: Run `pnpm install` from repo root, then `cd apps/dashboard && pnpm dlx shadcn@latest init` (New York, Neutral, CSS variables yes)
  - [x] 3.5 ⚠️ USER ACTION REQUIRED: Run `cd apps/dashboard && pnpm dlx shadcn@latest add sidebar skeleton button badge separator tooltip breadcrumb`

- [x] 4.0 Set up global styles and design tokens
  - [x] 4.1 Created `globals.css` with Tailwind v4 `@import "tailwindcss"` + full OKLCH design token block (brand, semantic, energy domain, status, tariff, sidebar, `@theme inline` bridge, reduced-motion)

- [x] 5.0 Build layout components
  - [x] 5.1 Created `src/components/layout/providers.tsx` — QueryClientProvider → ThemeProvider → SidebarProvider
  - [x] 5.2 Created `src/app/layout.tsx` — Inter font, metadata, `<Providers>`
  - [x] 5.3 Created `src/components/layout/app-sidebar.tsx` — 7 nav items, active state via `usePathname()`, footer with EnergyOS + v0.1.0 badge
  - [x] 5.4 Created `src/components/layout/app-header.tsx` — SidebarTrigger, breadcrumbs, stage badge, dark mode toggle
  - [x] 5.5 Created `src/app/(dashboard)/layout.tsx` — AppSidebar + SidebarInset + AppHeader + main

- [x] 6.0 Create stub pages and loading skeletons
  - [x] 6.1 Created `src/app/(dashboard)/page.tsx` — Overview stub
  - [x] 6.2 Created `src/app/(dashboard)/loading.tsx` — 2×3 skeleton grid
  - [x] 6.3 Created stub `page.tsx` + `loading.tsx` for: sites, devices, analytics, forecasts, schedules, settings

- [ ] 7.0 Verify and clean up
  - [ ] 7.1 ⚠️ USER ACTION REQUIRED: Create `.env` at repo root with `NEXT_PUBLIC_APP_STAGE=dev` (Claude Code cannot write this file due to permission settings)
  - [ ] 7.2 ⚠️ USER ACTION REQUIRED: Run `pnpm --filter @app/dashboard dev` and verify: all 7 routes load, sidebar highlights active route, dark mode persists, stage badge shows "DEV"
  - [ ] 7.3 ⚠️ USER ACTION REQUIRED: Run `pnpm typecheck` — fix any TypeScript errors
  - [ ] 7.4 ⚠️ USER ACTION REQUIRED: Run `pnpm lint` — fix any ESLint errors

### Progress Log
| Date | Task | Notes |
|------|------|-------|
| 2026-03-01 | 1.1–1.5 | Root package.json, pnpm-workspace.yaml, turbo.json, sst.config.ts stub, .gitignore cleanup |
| 2026-03-01 | 2.1–2.3 | packages/ui stub: package.json, tsconfig.json, index.ts |
| 2026-03-01 | 3.1–3.3 | apps/dashboard: package.json, next.config.ts, tsconfig.json, eslint.config.mjs |
| 2026-03-01 | 4.1 | globals.css with full OKLCH design token block |
| 2026-03-01 | 5.1–5.5 | All layout components: providers, root layout, sidebar, header, dashboard layout |
| 2026-03-01 | 6.1–6.3 | All 7 stub pages + 7 loading skeletons |
| 2026-03-01 | 7.1 | BLOCKED: .env write denied by permissions — user must create manually |
