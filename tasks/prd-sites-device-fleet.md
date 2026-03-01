# PRD: Sites & Device Fleet (PRD-04)
## Status: In Progress
## Last Updated: 2026-03-01

## 1. Overview

EnergyOS manages 20 sites across Vienna, each with 5-15 IoT devices. Users need to browse, search, and drill into sites and devices efficiently. This PRD delivers: a Sites page with an interactive Leaflet map + filterable list; a Site Detail page with tabbed views (Devices, Energy, Tariff); a fully-controlled Devices fleet table with sorting, filtering, search, and pagination; and a Device Detail page showing metadata, a 24h reading chart, and reading history. All pages reuse the chart wrappers and data hooks established in PRD-02 and PRD-03.

## 2. Goals

- **G1:** Provide a navigable, filterable view of all 20 sites with a geographic map centered on Vienna
- **G2:** Deliver a full-featured device fleet table with column sorting, multi-filter, search, and pagination controls
- **G3:** Build site detail pages with 3 tabbed views: Devices, Energy (power curve), and Tariff (rate timeline)
- **G4:** Build device detail pages showing metadata, 24h reading chart, and reading history
- **G5:** Reuse existing chart wrappers (uPlot, ECharts) and design tokens (`bg-status-*`, `bg-solar`, etc.) consistently
- **G6:** Establish the sortable/filterable DataTable pattern reusable across future pages (analytics, schedules)

## 3. User Stories

- **US-1:** As an energy manager, I want to see all sites on a map so I can visually locate and select sites by geography
- **US-2:** As an energy manager, I want to filter sites by status and type so I can find commissioning or inactive sites quickly
- **US-3:** As an energy manager, I want a site detail page with tabs so I can see a site's devices, energy profile, and tariff in one place
- **US-4:** As an energy manager, I want to sort the device table by any column so I can find devices by status, type, or last-seen time
- **US-5:** As an energy manager, I want to search devices by name so I can jump to a specific inverter or meter without scrolling
- **US-6:** As an energy manager, I want to filter devices by status and type so I can see all offline batteries or all EV chargers
- **US-7:** As an energy manager, I want pagination controls so I can navigate through 200+ devices efficiently
- **US-8:** As an energy manager, I want a device detail page showing its 24h readings chart so I can diagnose issues without going to analytics
- **US-9:** As a developer, I want a reusable DataTable component so future pages (schedules, DR events) can use the same pattern

## 4. Functional Requirements

### Sites List Page (`/sites`)
- **FR-1:** The sites page displays a **Leaflet map** (top half) and a **site list/grid** (bottom half) side by side on desktop, stacked on mobile
- **FR-2:** The map is centered on Vienna (48.2°N, 16.37°E) at zoom level 12. Each site renders as a circle marker colored by status: `bg-status-online` (active), `bg-status-offline` (inactive), `bg-status-commissioning` (commissioning)
- **FR-3:** Clicking a map marker opens a popup with the site name, type badge, and a "View Details" link to `/sites/[siteId]`
- **FR-4:** The Leaflet map is loaded via `next/dynamic` with `ssr: false` to prevent server-side rendering issues
- **FR-5:** The site list below the map shows all sites as cards in a responsive grid (2 cols desktop, 1 col mobile). Each card shows: site name, address, type badge (residential/commercial/industrial), status badge, device count, and grid connection (kVA)
- **FR-6:** A filter bar above the list provides: search input (filters by name/address), status dropdown, type dropdown
- **FR-7:** Clicking a site card navigates to `/sites/[siteId]`

### Site Detail Page (`/sites/[siteId]`)
- **FR-8:** Header shows site name, address, status badge, type badge, and a breadcrumb (`Sites > [Site Name]`)
- **FR-9:** Three tabs: **Devices**, **Energy**, **Tariff**
- **FR-10:** **Devices tab** renders the device table (same component as `/devices` page) pre-filtered to `siteId`
- **FR-11:** **Energy tab** renders a power curve chart (reuses `PowerCurve` component from PRD-03) scoped to the selected site, plus a KPI summary row showing site-level consumption, solar, grid import/export
- **FR-12:** **Tariff tab** shows the active tariff structure: rate type (ToU/flat/demand), current price, and a 24h price timeline showing peak/offpeak/shoulder periods using `bg-tariff-*` design tokens

### Devices Fleet Page (`/devices`)
- **FR-13:** Replaces the current stub with a full **DataTable** component. Columns: Name, Type, Site, Status, Capacity (kW), Last Seen, Protocol
- **FR-14:** All columns are **sortable** (click header to toggle asc/desc). Default sort: name ascending
- **FR-15:** Filter controls above the table: search input (name), status dropdown (all/online/offline/error/maintenance/commissioning), type dropdown (all/solar_inverter/battery/ev_charger/heat_pump/smart_meter/grid_meter)
- **FR-16:** **Pagination controls** below the table: previous/next buttons, page number display ("Page 1 of 10"), page size selector (10/20/50 per page)
- **FR-17:** Status column renders a **DeviceStatusBadge** component using `bg-status-{status}` design tokens with a colored dot indicator
- **FR-18:** Clicking a device row navigates to `/devices/[deviceId]`

### Device Detail Page (`/devices/[deviceId]`)
- **FR-19:** Header shows device name, type badge, status badge, and breadcrumb (`Devices > [Device Name]`)
- **FR-20:** **Info card** displaying: device type, rated capacity, protocol, firmware version, site name (linked to `/sites/[siteId]`), last seen timestamp (relative: "5 minutes ago")
- **FR-21:** **24h reading chart** using the uPlot wrapper. Shows power_w over the last 24 hours at 15-minute resolution. Uses the `useReadingRange()` hook
- **FR-22:** **Reading history table** showing the last 50 readings: timestamp, power (W), energy (kWh), voltage (V), SoC (if battery), quality badge. Sortable by timestamp

### Shared Components
- **FR-23:** `DeviceStatusBadge` — reusable component showing a colored dot + status text. Colors from `bg-status-*` tokens
- **FR-24:** `DataTable` — generic sortable, filterable, paginated table component. Accepts column definitions, data, and filter config as props. Handles sort state and pagination internally
- **FR-25:** All pages have `loading.tsx` with appropriate skeleton layouts
- **FR-26:** All detail pages handle 404 gracefully — if site/device not found, show a "Not found" message with a back link

## 5. Non-Goals / Out of Scope

- Editing site or device data (read-only in Phase 1)
- Device firmware update or remote control actions
- Real-time SSE updates on device detail (that's PRD-07)
- Map clustering for dense site areas (only 20 sites, not needed)
- Bulk device operations (selection checkboxes, bulk status change)
- Site creation/deletion
- Device provisioning/decommissioning workflow

## 6. Design Considerations

- **Map:** Leaflet with OpenStreetMap tiles. Map height: 400px on desktop, 300px on mobile. Markers sized 10px radius
- **Site cards:** shadcn Card with site type icon (Building2 for commercial, Home for residential, Factory for industrial). Status badge in top-right corner
- **Device table:** shadcn Table with sticky header. Alternating row colors in dark mode. Hover highlight on rows. Active sort column highlighted
- **Tabs:** shadcn Tabs component on the site detail page. Tab content lazy-loads (only fetches data when tab is active)
- **Status badges:** Consistent pattern — colored dot (8px circle) + text label. Colors from CSS variables: online=green, offline=gray, error=red, maintenance=amber, commissioning=blue
- **Responsive:** Table scrolls horizontally on mobile. Map stacks above site list on mobile. Detail pages are single-column on mobile
- **Dark mode:** Map tiles switch to a dark tile provider (CartoDB dark_all). All components respect theme

## 7. Technical Considerations

- **New dependencies:** `leaflet` (production), `react-leaflet` (production), `@types/leaflet` (dev). Must be added to `apps/dashboard/package.json`
- **Leaflet SSR:** Leaflet accesses `window` on import — must use `next/dynamic` with `ssr: false`. The map component wrapper must handle this
- **Leaflet CSS:** Import `leaflet/dist/leaflet.css` in the map component or via a type declaration (same pattern as uPlot CSS)
- **shadcn components needed:** Table, Tabs, Select (or native select for filters). May need to add these via shadcn CLI
- **DataTable is client-side:** All sorting, filtering, and pagination happens client-side using the paginated data from TanStack Query. The mock repository already supports server-side pagination — the DataTable passes params to the hook, which passes them to the repository
- **Date formatting:** Use `date-fns` `formatDistanceToNow()` for "last seen" relative times, `format()` for timestamps
- **Reading chart reuse:** The device detail page reuses `UPlotWrapper` from PRD-03 with single-series data from `useReadingRange()`
- **Dynamic routes:** Both `[siteId]` and `[deviceId]` are dynamic route segments. Pages fetch data with `useParams()` + the entity-specific hook
- **Tariff timeline:** A simple horizontal bar chart showing 24 hours divided into rate periods. Can be built with plain divs + Tailwind — no chart library needed

## 8. Success Metrics

- **SM-1:** Sites page loads map + list within 2 seconds
- **SM-2:** Device table sorts, filters, and paginates without page reload — all interactions < 200ms
- **SM-3:** Navigating from site card to site detail preserves context (back button works)
- **SM-4:** Device detail chart renders 96 data points (24h × 15min) within 500ms
- **SM-5:** All status badges use the correct design token colors across light and dark mode

## 9. Open Questions

- **OQ-1:** Dark mode map tiles — use CartoDB dark_all or Stadia dark? Starting with CartoDB.
- **OQ-2:** Should the device table remember its sort/filter state across navigation? Defer to PRD state management improvements.

---

## Implementation

### Relevant Files

**New files (all paths relative to `apps/dashboard/src/`):**
- `components/ui/table.tsx` — shadcn Table component
- `components/ui/tabs.tsx` — shadcn Tabs component
- `components/devices/device-status-badge.tsx` — Colored dot + status text
- `components/devices/device-table.tsx` — Full DataTable with sort/filter/pagination
- `components/devices/device-info-card.tsx` — Device metadata display
- `components/devices/device-reading-chart.tsx` — 24h uPlot reading chart
- `components/devices/device-reading-table.tsx` — Recent readings table
- `components/sites/site-map.tsx` — Leaflet map wrapper (dynamic import)
- `components/sites/site-card.tsx` — Individual site card
- `components/sites/site-list.tsx` — Filtered site card grid
- `components/sites/site-filter-bar.tsx` — Search + status + type filters
- `components/sites/site-detail-header.tsx` — Site name, badges, breadcrumb
- `components/sites/site-energy-tab.tsx` — Power curve + KPI row for single site
- `components/sites/site-tariff-tab.tsx` — Tariff rate timeline
- `app/(dashboard)/sites/page.tsx` — Sites list + map page (modify existing stub)
- `app/(dashboard)/sites/[siteId]/page.tsx` — Site detail with tabs (new)
- `app/(dashboard)/sites/loading.tsx` — Sites loading skeleton (new or modify)
- `app/(dashboard)/sites/[siteId]/loading.tsx` — Site detail skeleton (new)
- `app/(dashboard)/devices/page.tsx` — Devices fleet table (rewrite existing)
- `app/(dashboard)/devices/[deviceId]/page.tsx` — Device detail (new)
- `app/(dashboard)/devices/loading.tsx` — Devices loading skeleton (new or modify)
- `app/(dashboard)/devices/[deviceId]/loading.tsx` — Device detail skeleton (new)
- `types/leaflet.d.ts` — Type declarations for leaflet CSS

**Modified files:**
- `apps/dashboard/package.json` — Add leaflet, react-leaflet, @types/leaflet

### Notes
- Dependencies needed: `leaflet` (production), `react-leaflet` (production), `@types/leaflet` (dev)
- After adding deps to package.json, user must run `pnpm install`
- shadcn components to add: `table`, `tabs` — run `cd apps/dashboard && pnpm dlx shadcn@latest add table tabs`
- Typecheck: `pnpm typecheck` (or `npx turbo type-check`)
- Build verification: `pnpm clean && pnpm build`
- All paths below are relative to `apps/dashboard/src/`

### Tasks

- [x] 1.0 Dependencies & UI Primitives
  - [x] 1.1 Add `leaflet`, `react-leaflet` to production dependencies and `@types/leaflet` to devDependencies in `apps/dashboard/package.json` — user will run `pnpm install`
  - [x] 1.2 Create `src/components/ui/table.tsx` — shadcn Table component (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
  - [x] 1.3 Create `src/components/ui/tabs.tsx` — shadcn Tabs component (Tabs, TabsList, TabsTrigger, TabsContent)
  - [x] 1.4 Create `src/types/leaflet.d.ts` — type declaration for `leaflet/dist/leaflet.css` module (added to existing css.d.ts)

- [x] 2.0 Shared Device Components
  - [x] 2.1 Create `src/components/devices/device-status-badge.tsx` — renders colored dot (8px circle) + status label. Props: `status: DeviceStatus`. Uses `bg-status-{status}` design tokens via inline style reading CSS variable
  - [x] 2.2 Create `src/components/devices/device-table.tsx` — full DataTable. Props: `siteId?: string` (for filtering when embedded in site detail). Columns: Name, Type, Site, Status (badge), Capacity, Last Seen (relative), Protocol. Sortable headers (click toggles asc/desc, highlighted active column). Filter bar: search input, status dropdown, type dropdown. Pagination: prev/next, page display, page size selector (10/20/50). Row click navigates to `/devices/[deviceId]`. Uses `useDevices()` hook with all params
  - [x] 2.3 Create `src/components/devices/device-info-card.tsx` — shadcn Card showing device metadata: type, rated capacity, protocol, firmware, site name (linked), status badge, last seen (relative time via `formatDistanceToNow`)
  - [x] 2.4 Create `src/components/devices/device-reading-chart.tsx` — `"use client"` component. Uses `useReadingRange(deviceId, from, to, "15min")` for last 24h. Renders single-series power_w line via UPlotWrapper. Loading skeleton and error state
  - [x] 2.5 Create `src/components/devices/device-reading-table.tsx` — Table showing last 50 readings. Columns: Timestamp (formatted), Power (W), Energy (kWh), Voltage (V), SoC (% if battery, else —), Quality badge. Sortable by timestamp

- [ ] 3.0 Devices Pages
  - [ ] 3.1 Rewrite `src/app/(dashboard)/devices/page.tsx` — replace current stub with DeviceTable component. Page title + description header
  - [ ] 3.2 Create `src/app/(dashboard)/devices/[deviceId]/page.tsx` — `"use client"` page. Uses `useParams()` + `useDevice(id)`. Renders breadcrumb, DeviceInfoCard, DeviceReadingChart, DeviceReadingTable. 404 handling if device not found
  - [ ] 3.3 Create `src/app/(dashboard)/devices/loading.tsx` — skeleton: search bar + table rows
  - [ ] 3.4 Create `src/app/(dashboard)/devices/[deviceId]/loading.tsx` — skeleton: info card + chart + table

- [ ] 4.0 Site Map & List Components
  - [ ] 4.1 Create `src/components/sites/site-map.tsx` — Leaflet map wrapped in `"use client"` + loaded via `next/dynamic` with `ssr: false`. Centers on Vienna (48.2, 16.37), zoom 12. OpenStreetMap tiles (light) / CartoDB dark_all (dark mode). Circle markers per site colored by status. Click marker → popup with site name, type, "View Details" link. Props: `sites: Site[]`
  - [ ] 4.2 Create `src/components/sites/site-card.tsx` — shadcn Card. Shows: icon by type (Home/Building2/Factory), site name, address, type badge, status badge, device count, grid connection kVA. Clickable → navigates to `/sites/[siteId]`
  - [ ] 4.3 Create `src/components/sites/site-filter-bar.tsx` — Search input + status dropdown + type dropdown. Props: filter state + setters. Filters site list client-side
  - [ ] 4.4 Create `src/components/sites/site-list.tsx` — `"use client"` component. Uses `useSites()`. Renders SiteFilterBar + responsive grid of SiteCards (grid-cols-1 md:grid-cols-2). Handles loading + error

- [ ] 5.0 Sites Pages
  - [ ] 5.1 Rewrite `src/app/(dashboard)/sites/page.tsx` — Renders SiteMap (top) + SiteList (bottom). Uses `useSites({pageSize: 100})` to get all sites for the map
  - [ ] 5.2 Create `src/app/(dashboard)/sites/loading.tsx` — skeleton: map placeholder + card grid
  - [ ] 5.3 Create `src/app/(dashboard)/sites/[siteId]/page.tsx` — `"use client"` page. Uses `useParams()` + `useSite(id)` + `useSiteSummary(id)`. Renders header (name, address, badges), shadcn Tabs with 3 tabs. Devices tab → DeviceTable with `siteId` prop. Energy tab → site-scoped PowerCurve + KPI row. Tariff tab → tariff timeline. 404 handling
  - [ ] 5.4 Create `src/components/sites/site-energy-tab.tsx` — `"use client"`. Uses `usePowerCurve` scoped to siteId (via filter store override or direct hook). Shows 4 mini KPI cards (consumption, solar, grid import, grid export) + PowerCurve chart
  - [ ] 5.5 Create `src/components/sites/site-tariff-tab.tsx` — `"use client"`. Uses `useActiveTariff(siteId)` + `useCurrentPrice(siteId)`. Shows current price card + 24h period bar (horizontal bar divided into peak/offpeak/shoulder segments with `bg-tariff-*` colors)
  - [ ] 5.6 Create `src/app/(dashboard)/sites/[siteId]/loading.tsx` — skeleton: header + tabs + content area

- [ ] 6.0 Verification & Cleanup
  - [ ] 6.1 Run `npx turbo type-check` — fix any type errors
  - [ ] 6.2 Run `pnpm clean && pnpm build` — verify clean production build
  - [ ] 6.3 Visual smoke test — navigate all routes: /sites, /sites/[id], /devices, /devices/[id]. Verify map renders, table sorts/filters, detail pages load

### Progress Log
| Date | Task | Notes |
|------|------|-------|
| 2026-03-01 | 1.1–1.4 | Deps already installed, created shadcn Table + Tabs, added leaflet CSS type declaration |
| 2026-03-01 | 2.1–2.5 | DeviceStatusBadge, DeviceTable, DeviceInfoCard, DeviceReadingChart, DeviceReadingTable |
