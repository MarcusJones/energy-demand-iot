# PRD: Overview Dashboard (PRD-03)
## Status: Draft
## Last Updated: 2026-03-01

## 1. Overview

The Overview Dashboard is the landing page (`/`) of EnergyOS — the first thing a user sees when they open the application. It provides a portfolio-wide snapshot of energy operations across all 20 sites: six KPI cards with sparklines showing consumption, solar generation, grid import/export, battery state, and current tariff rate; an animated Energy Flow Sankey diagram showing how energy moves from sources through storage to loads; and a 24-hour Power Curve showing all energy series overlaid on a time-series chart. A global filter bar (Zustand store) lets users narrow the view to a specific site or date range, and that selection persists across all pages.

## 2. Goals

- **G1:** Deliver a portfolio-wide energy overview that loads in < 2 seconds with mock data
- **G2:** Establish reusable chart wrappers (uPlot for time-series, ECharts for analytics) that all subsequent PRDs reuse
- **G3:** Create a Zustand-based global filter store (date range + site selector) that persists across navigation
- **G4:** Build a KPI card component pattern (value + delta + sparkline) reusable across other pages
- **G5:** Use domain-specific Tailwind color tokens (`bg-solar`, `text-grid-import`, etc.) consistently in all visualizations

## 3. User Stories

- **US-1:** As an energy manager, I want to see total consumption vs. generation at a glance so I can assess portfolio performance without drilling into individual sites
- **US-2:** As an energy manager, I want sparklines on each KPI so I can spot trends (rising consumption, declining solar) within the current period
- **US-3:** As an energy manager, I want a Sankey diagram showing energy flow so I can understand how solar, grid, and battery interact in real time
- **US-4:** As an energy manager, I want a 24h power curve so I can see how load profiles, solar generation, and battery cycling play out over the day
- **US-5:** As an energy manager, I want to filter the overview by site so I can compare individual site performance against the portfolio
- **US-6:** As an energy manager, I want to switch date ranges (today, yesterday, 7d, 30d) so I can compare performance across periods
- **US-7:** As a developer, I want reusable chart wrappers so I don't import uPlot or ECharts directly in any page component

## 4. Functional Requirements

- **FR-1:** The overview page (`/`) renders as a Server Component that composes four client component sections: filter bar, KPI row, energy flow, and power curve
- **FR-2:** A global filter bar at the top contains a **site selector** (dropdown: "All Sites" + individual sites) and a **date range selector** (preset buttons: Today, Yesterday, 7D, 30D, plus optional custom range). Filter state is stored in a Zustand store (`use-filter-store.ts`) and persists across navigation
- **FR-3:** Six KPI cards displayed in a responsive grid (3×2 on desktop, 2×3 on tablet, 1×6 stacked on mobile). Each card shows:
  - Label (e.g., "Total Consumption")
  - Current value with unit (e.g., "1,247 kWh")
  - Delta badge showing % change vs. previous equivalent period (e.g., "+4.2%" with up arrow, colored green for favorable / red for unfavorable)
  - A sparkline (tiny uPlot chart, 24 data points, no axes, just the line) showing the trend
  - Domain-specific color accent (e.g., solar card uses `border-solar` left border)
- **FR-4:** The six KPI metrics are:
  1. **Total Consumption** — sum of all consumption across selected scope, color: `consumption`
  2. **Solar Generation** — sum of all solar generation, color: `solar`
  3. **Grid Import** — total energy drawn from grid, color: `grid-import`
  4. **Grid Export** — total energy exported to grid, color: `grid-export`
  5. **Battery SoC** — average state of charge across all batteries, color: `battery-charge`
  6. **Current Price** — current €/kWh from active tariff, color: `tariff-peak` or `tariff-offpeak` based on current period
- **FR-5:** An Energy Flow Sankey diagram (ECharts) visualizes energy flow with these nodes and links:
  - **Source nodes:** Solar, Grid Import
  - **Intermediate node:** Battery (charge in / discharge out)
  - **Sink nodes:** Consumption (loads), Grid Export
  - Links show kWh values for the selected period with animated flow particles
  - Node colors use domain tokens: solar yellow, grid-import red, grid-export green, battery blue, consumption purple
- **FR-6:** A 24-hour Power Curve (uPlot) shows overlaid time series for:
  - Solar generation (yellow fill)
  - Consumption (purple line)
  - Grid import (red, dashed)
  - Grid export (green, dashed)
  - Battery charge/discharge (blue/orange)
  - X-axis: time (24h, labeled every 3h)
  - Y-axis: power in kW
  - Interactive crosshair cursor with tooltip showing all series values at hover point
  - Legend with toggle to show/hide individual series
- **FR-7:** All chart wrappers must:
  - Dynamically import the chart library (uPlot/ECharts) to avoid SSR issues
  - Handle resize via `ResizeObserver`
  - Clean up on unmount (destroy chart instance)
  - Accept data as props (never fetch internally)
  - Read domain colors from CSS variables via `getComputedStyle()` for theme-awareness
- **FR-8:** When "All Sites" is selected, data is aggregated across all 20 sites. When a specific site is selected, data is scoped to that site only
- **FR-9:** Loading state: the entire page shows a skeleton grid matching the layout (6 card skeletons + 2 chart skeletons) while data loads
- **FR-10:** Error state: if any data fetch fails, show an inline error message within the affected component (not a full-page error). Other components continue to render normally.

## 5. Non-Goals / Out of Scope

- Real-time SSE updates on the overview page (that's PRD-07)
- Custom date range picker with calendar popover (simple preset buttons for now)
- Drill-down from KPI cards to detail pages (future enhancement)
- Export/download of overview data
- Settings page implementation
- Map visualization on the overview

## 6. Design Considerations

- **Layout:** Single-column stack: filter bar → KPI grid → 2-column row (Sankey left, Power Curve right on desktop; stacked on mobile)
- **KPI cards:** Use shadcn `Card` with a 4px left border in the domain color. Value in `text-3xl font-bold`, delta in a small `Badge`. Sparkline is 80px wide × 32px tall, no padding
- **Sankey:** Minimum height 400px, responsive width. Use ECharts' built-in tooltip on hover
- **Power Curve:** Minimum height 350px, responsive width. uPlot's built-in cursor plugin for crosshair
- **Dark mode:** All charts must respond to theme changes. Read CSS custom properties at render time, re-read on theme change
- **Accessibility:** KPI values must be screen-readable (not just visual). Charts should have `aria-label` descriptions. Sparklines are decorative (`role="img"` with alt text)

## 7. Technical Considerations

- **New dependencies:** `uplot` (production), `echarts` (production), `zustand` (production), `date-fns` (production). These must be added to `apps/dashboard/package.json` — user will run `pnpm install`
- **Chart wrappers are mandatory:** Per CLAUDE.md, uPlot and ECharts are never imported directly in pages or domain components. All chart usage goes through wrappers in `components/charts/`
- **uPlot is a canvas library:** It doesn't use React rendering. The wrapper must manage a `<div>` ref, create the uPlot instance imperatively, and destroy it on unmount. It must handle data updates by calling `uPlot.setData()` rather than re-creating the instance
- **ECharts SSR:** ECharts supports server-side rendering but for simplicity we'll dynamic import it client-side only. The wrapper component should use `"use client"` and lazy-load echarts
- **CSS variable color lookup:** Chart series colors must come from CSS variables (e.g., `getComputedStyle(document.documentElement).getPropertyValue('--color-solar')`). This ensures dark mode and theme changes propagate to charts
- **New data layer additions:** The current reading repository methods are device-scoped or single-site-scoped. The overview needs portfolio-level aggregations. We'll add a new `IDashboardRepository` with:
  - `getKPIs(siteId: string | null, from: Date, to: Date)` → KPI values with deltas
  - `getEnergyFlow(siteId: string | null, from: Date, to: Date)` → Sankey node/link data
  - `getPowerCurve(siteId: string | null, from: Date, to: Date)` → multi-series time-series
- **Zustand store pattern:** Use Zustand with no middleware (no persistence for Phase 1). The store holds `{ dateRange, siteId, setSiteId, setDateRange }`. All dashboard components subscribe to this store
- **Performance:** uPlot is specifically chosen for performance — it renders 100K+ points without lag. The 24h power curve at 15-min resolution is ~96 points per series × 5 series = 480 points, well within budget

## 8. Success Metrics

- **SM-1:** Overview page renders all components within 2 seconds on first load (mock data)
- **SM-2:** Switching site filter or date range updates all components within 500ms
- **SM-3:** Dark mode toggle updates chart colors without page reload
- **SM-4:** All 6 KPI values match expected mock data calculations (verifiable via seed determinism)
- **SM-5:** Sankey flow values balance: total inflow (solar + grid import) = total outflow (consumption + grid export + battery net change)

## 9. Open Questions

- **OQ-1:** Should the Power Curve show stacked areas (solar fills beneath consumption line) or simple overlaid lines? Starting with overlaid lines, can iterate.
- **OQ-2:** Battery SoC KPI — show as percentage (avg across batteries) or as absolute kWh remaining? Starting with percentage.
