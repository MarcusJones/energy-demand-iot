# EnergyOS — Phase 1 Implementation Guide (v2)

**Scope**: Prototype with mock data — fully functional frontend on AWS
**Developer**: Solo + Claude Code
**Target**: Working dashboard with 7 route groups, mock data layer, deployed via SST v3
**Stack alignment**: CES unified tech stack (Next.js 16, Turborepo, Tailwind v4, SST v3)

---

## Table of Contents

1. [Repository & Dev Environment Setup](#1-repository--dev-environment-setup)
2. [Project Scaffolding](#2-project-scaffolding)
3. [PRD-01: App Shell & Navigation](#3-prd-01-app-shell--navigation)
4. [PRD-02: Schemas & Mock Data Layer](#4-prd-02-schemas--mock-data-layer)
5. [PRD-03: Overview Dashboard](#5-prd-03-overview-dashboard)
6. [PRD-04: Sites & Device Fleet](#6-prd-04-sites--device-fleet)
7. [PRD-05: Analytics & Forecasts](#7-prd-05-analytics--forecasts)
8. [PRD-06: Schedules & DR Events](#8-prd-06-schedules--dr-events)
9. [PRD-07: Real-Time SSE & Live Indicators](#9-prd-07-real-time-sse--live-indicators)

---

## 1. Repository & Dev Environment Setup

### 1.1 Prerequisites

- GitHub repository (private)
- Docker Desktop (for devcontainer)
- VS Code with Dev Containers extension
- AWS account with CLI credentials configured
- Node.js 22 LTS, pnpm 9+

### 1.2 Devcontainer Configuration

Create `.devcontainer/devcontainer.json`:

```jsonc
{
  "name": "EnergyOS",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-22",
  "features": {
    "ghcr.io/devcontainers/features/aws-cli:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers-contrib/features/pnpm:2": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-contrib/features/turborepo:1": {}
  },
  "mounts": [
    "source=${localEnv:HOME}/.aws,target=/home/node/.aws,type=bind,consistency=cached"
  ],
  "forwardPorts": [4200, 13557],
  "portsAttributes": {
    "4200": { "label": "Dashboard Dev", "onAutoForward": "notify" },
    "13557": { "label": "SST Console", "onAutoForward": "silent" }
  },
  "postCreateCommand": "pnpm install",
  "customizations": {
    "vscode": {
      "settings": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit"
        },
        "typescript.tsdk": "node_modules/typescript/lib",
        "files.associations": {
          "*.css": "tailwindcss"
        }
      },
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-typescript-next",
        "streetsidesoftware.code-spell-checker"
      ]
    }
  },
  "remoteEnv": {
    "NEXT_PUBLIC_USE_MOCK": "true",
    "NEXT_PUBLIC_APP_STAGE": "dev"
  }
}
```

### 1.3 CLAUDE.md (Claude Code Project Context)

Create `CLAUDE.md` in the monorepo root:

```markdown
# EnergyOS — Claude Code Context

## Project
IoT energy management platform. Turborepo monorepo, Next.js 16 App Router, SST v3, AWS.
Currently Phase 1: mock data, no real backend.

## Monorepo Structure
- `apps/dashboard/` — Main Next.js 16 app (energy management dashboard)
- `packages/ui/` — Shared component library (@repo/ui)
- Root: Turborepo config, SST config, workspace settings

## Stack
- Next.js 16, App Router, RSC, Turbopack (default)
- TypeScript strict mode
- pnpm 9 with workspaces
- Turborepo for build orchestration
- SST v3 (Ion) for AWS deployment (eu-central-1)
- Tailwind CSS v4 (CSS-first config, @theme inline, OKLCH)
- shadcn/ui (copy-paste components in packages/ui or apps/dashboard)
- TanStack Query v5 for data fetching
- Zod for schema validation
- Zustand for global state
- MSW v2 for API mocking
- @faker-js/faker v10 for mock data
- uPlot for real-time charts, Apache ECharts for analytics, Tremor for KPIs

## Architecture Rules
1. ALL data access goes through repositories in `apps/dashboard/src/repositories/`
2. Never import Supabase or fetch directly in components
3. Zod schemas in `apps/dashboard/src/schemas/` are the single source of truth
4. Use `'use client'` only when needed (hooks, event handlers, browser APIs)
5. Server Components are the default — fetch data in RSC, pass to client components
6. Chart libraries wrapped in `apps/dashboard/src/components/charts/` — never use uPlot/ECharts directly in pages
7. All hooks go in `apps/dashboard/src/hooks/` and use TanStack Query
8. Environment: `NEXT_PUBLIC_USE_MOCK=true` in dev, repositories auto-switch
9. next.config.ts must have `output: "standalone"` for Lambda deployment

## File Patterns
- `apps/dashboard/src/app/(dashboard)/[route]/page.tsx` — Server Component, fetches data
- `apps/dashboard/src/app/(dashboard)/[route]/loading.tsx` — Suspense fallback
- `apps/dashboard/src/components/[domain]/[Component].tsx` — Domain-specific client components
- `apps/dashboard/src/components/ui/` — shadcn/ui (do not edit manually, use CLI)
- `apps/dashboard/src/schemas/[entity].ts` — Zod schemas + exported types
- `apps/dashboard/src/repositories/interfaces/I[Entity]Repository.ts` — Interface
- `apps/dashboard/src/repositories/mock/Mock[Entity]Repository.ts` — Mock implementation
- `apps/dashboard/src/hooks/use[Entity].ts` — TanStack Query hooks

## Monorepo Commands
- `pnpm dev` — Run all apps (Turborepo parallel)
- `pnpm --filter @app/dashboard dev` — Run dashboard only
- `pnpm build` — Build all (Turborepo cached)
- `pnpm lint` — ESLint across monorepo
- `pnpm typecheck` — tsc --noEmit across monorepo
- `pnpm deploy:dev` — Deploy to AWS dev stage
- `pnpm deploy` — Deploy to AWS production

## Conventions
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`
- No barrel exports (no index.ts re-exports) in apps
- packages/ui uses barrel exports (index.ts) for shared components
- Prefer named exports over default exports (except page.tsx)
- Use `date-fns` for dates, never `moment`
- Error boundaries per route segment
- Loading states via `loading.tsx` files
- Port 4200 for dashboard dev server (CES standard)
```

---

## 2. Project Scaffolding

### 2.1 Initialize Monorepo

This is the exact CC-ready script. Run in sequence:

```bash
# Create monorepo root
mkdir energyos && cd energyos
git init

# Root package.json
cat > package.json << 'EOF'
{
  "name": "energyos",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo type-check",
    "clean": "turbo clean",
    "deploy": "bash -c 'source .env && sst deploy --stage production'",
    "deploy:dev": "bash -c 'source .env && sst deploy --stage dev'",
    "remove": "bash -c 'source .env && sst remove --stage production'",
    "remove:dev": "bash -c 'source .env && sst remove --stage dev'",
    "diff": "bash -c 'source .env && sst diff --stage production'",
    "diff:dev": "bash -c 'source .env && sst diff --stage dev'",
    "sst:dev": "bash -c 'source .env && sst dev'",
    "sst:unlock": "bash -c 'source .env && sst unlock --stage dev'"
  }
}
EOF

# pnpm workspace
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# Turborepo config
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
EOF

# Install root dev deps
pnpm add -D turbo sst@latest typescript

# Create the Next.js dashboard app
mkdir -p apps
cd apps
pnpm create next-app@latest dashboard \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --turbopack \
  --import-alias "@/*"
cd dashboard

# Update package.json name and port
# (CC: update "name" to "@app/dashboard" and dev script to use port 4200)
```

### 2.2 Configure Dashboard App

**`apps/dashboard/package.json`** — Key changes from scaffolded default:

```jsonc
{
  "name": "@app/dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 4200",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/ui": "workspace:*"
    // ... rest of deps
  }
}
```

**`apps/dashboard/next.config.ts`**:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // Required for Lambda deployment via SST/OpenNext
  turbopack: {},
};

export default nextConfig;
```

### 2.3 Install Dashboard Dependencies

```bash
cd apps/dashboard

# Core dependencies
pnpm add zod zustand @tanstack/react-query date-fns lucide-react next-themes

# Chart libraries
pnpm add uplot echarts

# Dev / mock dependencies
pnpm add -D msw @faker-js/faker @anatine/zod-mock

# shadcn/ui init
pnpm dlx shadcn@latest init
# Select: New York style, Neutral color, CSS variables: yes

# Add initial shadcn components
pnpm dlx shadcn@latest add \
  button card badge separator \
  table tabs tooltip \
  dropdown-menu sheet sidebar \
  skeleton select input label \
  scroll-area avatar command \
  dialog alert sonner
```

### 2.4 Create Shared UI Package

```bash
cd ../../packages
mkdir -p ui/src/components ui/src/assets

cat > ui/package.json << 'EOF'
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "echo 'No build step — consumed via workspace protocol'",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/react": "^19.0.0"
  }
}
EOF

cat > ui/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
EOF

# Barrel export (packages/ui is the one place barrel exports are OK)
cat > ui/src/index.ts << 'EOF'
// Shared components will be exported from here
// e.g. export { EnergyOSLogo } from './components/logo';
export {};
EOF
```

### 2.5 Tailwind CSS v4 — CSS-First Config

Replace the scaffolded globals.css with the CES-standard approach:

**`apps/dashboard/src/app/globals.css`**:

```css
@import "tailwindcss";

/* ============================================
   EnergyOS Design Tokens
   ============================================ */

:root {
  /* Brand colors — OKLCH for perceptual uniformity */
  --brand-primary: oklch(0.55 0.18 250);       /* Deep blue — energy/trust */
  --brand-secondary: oklch(0.72 0.16 145);     /* Green — sustainability */
  --brand-accent: oklch(0.78 0.15 85);         /* Amber — warnings/energy */
  --brand-black: oklch(0.13 0.02 250);
  --brand-white: oklch(0.99 0 0);

  /* Semantic tokens (shadcn/ui compatible) */
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.13 0.02 250);
  --primary: var(--brand-primary);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.96 0.01 250);
  --secondary-foreground: oklch(0.13 0.02 250);
  --muted: oklch(0.96 0.01 250);
  --muted-foreground: oklch(0.55 0.02 250);
  --accent: oklch(0.95 0.02 250);
  --accent-foreground: oklch(0.13 0.02 250);
  --destructive: oklch(0.55 0.22 29);
  --destructive-foreground: oklch(0.99 0 0);
  --border: oklch(0.88 0.02 250);
  --input: oklch(0.88 0.02 250);
  --ring: var(--brand-primary);
  --radius: 0.5rem;

  /* Energy domain semantic colors */
  --color-solar: oklch(0.82 0.18 85);          /* Yellow — solar generation */
  --color-grid-import: oklch(0.60 0.20 25);    /* Red — grid import */
  --color-grid-export: oklch(0.65 0.18 145);   /* Green — grid export */
  --color-battery-charge: oklch(0.60 0.15 250);/* Blue — battery charging */
  --color-battery-discharge: oklch(0.72 0.16 75);/* Orange — battery discharge */
  --color-consumption: oklch(0.55 0.12 280);   /* Purple — consumption */
  --color-ev: oklch(0.60 0.20 170);            /* Teal — EV charging */

  /* Status colors */
  --color-status-online: oklch(0.65 0.18 145);
  --color-status-offline: oklch(0.60 0.02 250);
  --color-status-error: oklch(0.55 0.22 29);
  --color-status-maintenance: oklch(0.75 0.15 85);
  --color-status-commissioning: oklch(0.60 0.15 250);

  /* Tariff period colors */
  --color-tariff-peak: oklch(0.60 0.20 25);
  --color-tariff-offpeak: oklch(0.65 0.18 145);
  --color-tariff-shoulder: oklch(0.78 0.15 85);
}

.dark {
  --background: oklch(0.13 0.02 250);
  --foreground: oklch(0.95 0 0);
  --primary: oklch(0.65 0.18 250);
  --primary-foreground: oklch(0.13 0.02 250);
  --secondary: oklch(0.20 0.02 250);
  --secondary-foreground: oklch(0.95 0 0);
  --muted: oklch(0.20 0.02 250);
  --muted-foreground: oklch(0.60 0.02 250);
  --accent: oklch(0.22 0.03 250);
  --accent-foreground: oklch(0.95 0 0);
  --destructive: oklch(0.60 0.22 29);
  --destructive-foreground: oklch(0.99 0 0);
  --border: oklch(0.28 0.03 250);
  --input: oklch(0.28 0.03 250);
  --ring: oklch(0.65 0.18 250);
}

/* Bridge CSS variables to Tailwind v4 utilities */
@theme inline {
  --color-brand-primary: var(--brand-primary);
  --color-brand-secondary: var(--brand-secondary);
  --color-brand-accent: var(--brand-accent);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Energy domain utilities: bg-solar, text-grid-import, etc. */
  --color-solar: var(--color-solar);
  --color-grid-import: var(--color-grid-import);
  --color-grid-export: var(--color-grid-export);
  --color-battery-charge: var(--color-battery-charge);
  --color-battery-discharge: var(--color-battery-discharge);
  --color-consumption: var(--color-consumption);
  --color-ev: var(--color-ev);

  --color-status-online: var(--color-status-online);
  --color-status-offline: var(--color-status-offline);
  --color-status-error: var(--color-status-error);
  --color-status-maintenance: var(--color-status-maintenance);
  --color-status-commissioning: var(--color-status-commissioning);

  --color-tariff-peak: var(--color-tariff-peak);
  --color-tariff-offpeak: var(--color-tariff-offpeak);
  --color-tariff-shoulder: var(--color-tariff-shoulder);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
  --radius-xl: calc(var(--radius) + 8px);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This gives you Tailwind utilities like `bg-solar`, `text-grid-import`, `bg-status-online`, `border-tariff-peak` — all domain-specific, all dark-mode aware.

### 2.6 SST Config (with CES fixes)

```typescript
// sst.config.ts (monorepo root)
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "energyos",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "eu-central-1",  // Frankfurt — closest to Vienna
        },
      },
    };
  },
  async run() {
    // Fix for newer AWS accounts: Lambda Function URL invoke permissions
    // See: https://github.com/anomalyco/sst/issues/6397
    $transform(aws.lambda.FunctionUrl, (args, opts, name) => {
      new aws.lambda.Permission(`${name}InvokePermission`, {
        action: "lambda:InvokeFunction",
        function: args.functionName,
        principal: "*",
        statementId: "FunctionURLInvokeAllowPublicAccess",
      });
    });

    const useMock = $app.stage === "dev" || $app.stage === "preview";

    const dashboard = new sst.aws.Nextjs("EnergyOSDashboard", {
      path: "apps/dashboard",
      environment: {
        NEXT_PUBLIC_USE_MOCK: String(useMock),
        NEXT_PUBLIC_APP_STAGE: $app.stage,
      },
      // Uncomment when domain is ready:
      // domain: {
      //   name: $app.stage === "production"
      //     ? "app.energyos.example.com"
      //     : `${$app.stage}.energyos.example.com`,
      //   dns: sst.aws.dns({ zone: "Z1234567890ABC" }),
      // },
    });

    return {
      url: dashboard.url,
    };
  },
});
```

### 2.7 Environment Files

```bash
# .env.example (committed)
# AWS credentials for SST deployment
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-central-1

# App config
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_APP_STAGE=dev

# Phase 2 — uncomment when ready
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_KEY=
```

```bash
# .env (gitignored — local dev + deployment)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_APP_STAGE=dev
```

### 2.8 Target Directory Structure

```
energyos/
├── .devcontainer/
│   └── devcontainer.json
├── .env
├── .env.example
├── .gitignore
├── CLAUDE.md
├── package.json                       # Root workspace scripts
├── pnpm-workspace.yaml
├── sst.config.ts                      # Infrastructure definition
├── sst-env.d.ts
├── turbo.json
│
├── apps/
│   └── dashboard/                     # @app/dashboard — Next.js 16
│       ├── next.config.ts             # output: "standalone"
│       ├── package.json
│       ├── tsconfig.json
│       ├── public/
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── globals.css        # Tailwind v4 + OKLCH design tokens
│           │   │
│           │   ├── (dashboard)/       # Route group: shared shell
│           │   │   ├── layout.tsx     # Sidebar + header
│           │   │   ├── page.tsx       # / → Overview
│           │   │   ├── loading.tsx
│           │   │   ├── sites/
│           │   │   │   ├── page.tsx
│           │   │   │   ├── loading.tsx
│           │   │   │   └── [siteId]/
│           │   │   │       ├── page.tsx
│           │   │   │       └── loading.tsx
│           │   │   ├── devices/
│           │   │   │   ├── page.tsx
│           │   │   │   ├── loading.tsx
│           │   │   │   └── [deviceId]/
│           │   │   │       ├── page.tsx
│           │   │   │       └── loading.tsx
│           │   │   ├── analytics/
│           │   │   │   ├── page.tsx
│           │   │   │   └── loading.tsx
│           │   │   ├── forecasts/
│           │   │   │   ├── page.tsx
│           │   │   │   └── loading.tsx
│           │   │   ├── schedules/
│           │   │   │   ├── page.tsx
│           │   │   │   └── loading.tsx
│           │   │   └── settings/
│           │   │       └── page.tsx
│           │   │
│           │   └── api/
│           │       ├── devices/
│           │       │   └── route.ts
│           │       ├── readings/
│           │       │   └── route.ts
│           │       └── sse/
│           │           └── readings/
│           │               └── route.ts
│           │
│           ├── components/
│           │   ├── ui/                # shadcn/ui (CLI-managed)
│           │   ├── layout/
│           │   │   ├── app-sidebar.tsx
│           │   │   ├── app-header.tsx
│           │   │   └── providers.tsx
│           │   ├── charts/
│           │   │   ├── time-series-chart.tsx
│           │   │   ├── analytics-chart.tsx
│           │   │   └── kpi-card.tsx
│           │   ├── dashboard/
│           │   │   ├── overview-kpis.tsx
│           │   │   ├── energy-flow.tsx
│           │   │   └── power-curve.tsx
│           │   ├── devices/
│           │   │   ├── device-table.tsx
│           │   │   ├── device-status-badge.tsx
│           │   │   ├── device-detail-panel.tsx
│           │   │   └── device-map.tsx
│           │   ├── sites/
│           │   │   ├── site-list.tsx
│           │   │   ├── site-card.tsx
│           │   │   └── site-map.tsx
│           │   ├── analytics/
│           │   │   ├── time-series-explorer.tsx
│           │   │   ├── heatmap-chart.tsx
│           │   │   └── forecast-actual-chart.tsx
│           │   └── schedules/
│           │       ├── schedule-timeline.tsx
│           │       ├── schedule-form.tsx
│           │       └── price-signal-overlay.tsx
│           │
│           ├── schemas/
│           │   ├── site.ts
│           │   ├── device.ts
│           │   ├── reading.ts
│           │   ├── tariff.ts
│           │   ├── schedule.ts
│           │   ├── forecast.ts
│           │   └── dr-event.ts
│           │
│           ├── repositories/
│           │   ├── interfaces/
│           │   │   ├── ISiteRepository.ts
│           │   │   ├── IDeviceRepository.ts
│           │   │   ├── IReadingRepository.ts
│           │   │   ├── IForecastRepository.ts
│           │   │   ├── IScheduleRepository.ts
│           │   │   └── ITariffRepository.ts
│           │   ├── mock/
│           │   │   ├── MockSiteRepository.ts
│           │   │   ├── MockDeviceRepository.ts
│           │   │   ├── MockReadingRepository.ts
│           │   │   ├── MockForecastRepository.ts
│           │   │   ├── MockScheduleRepository.ts
│           │   │   └── data/
│           │   │       ├── seed.ts
│           │   │       ├── sites.ts
│           │   │       ├── devices.ts
│           │   │       └── generators.ts
│           │   └── factory.ts
│           │
│           ├── hooks/
│           │   ├── use-sites.ts
│           │   ├── use-devices.ts
│           │   ├── use-readings.ts
│           │   ├── use-forecasts.ts
│           │   ├── use-schedules.ts
│           │   └── use-realtime-reading.ts
│           │
│           ├── lib/
│           │   ├── utils.ts           # cn() helper
│           │   ├── env.ts             # Zod-validated env vars
│           │   └── constants.ts
│           │
│           ├── stores/
│           │   ├── use-filter-store.ts
│           │   └── use-ui-store.ts
│           │
│           ├── mocks/
│           │   ├── handlers.ts
│           │   ├── browser.ts
│           │   └── server.ts
│           │
│           └── instrumentation.ts
│
├── packages/
│   └── ui/                            # @repo/ui — shared components
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts               # Barrel exports
│           ├── components/            # Future: shared across apps
│           └── assets/                # SVG logos, icons
│
└── supabase/                          # Future — not used in Phase 1
    ├── migrations/
    └── seed.sql
```

### 2.9 Initial Git Setup

```bash
# .gitignore (add to root)
cat >> .gitignore << 'EOF'
.env
.sst
.turbo
node_modules
.next
dist
EOF

git add .
git commit -m "chore: initial monorepo scaffold with Next.js 16, SST v3, Turborepo"
git remote add origin git@github.com:ces-vienna/energyos.git
git push -u origin main
```

---

## 3. PRD-01: App Shell & Navigation

### Goal
Establish the dashboard layout — sidebar navigation, top header with breadcrumbs, responsive shell. All subsequent pages render inside this shell.

### Acceptance Criteria

- [ ] Root layout (`apps/dashboard/src/app/layout.tsx`) wraps all pages with `QueryClientProvider`, `ThemeProvider` (next-themes), and Inter font
- [ ] Dashboard layout (`(dashboard)/layout.tsx`) renders sidebar + header + `{children}`
- [ ] Sidebar uses shadcn `Sidebar` component with collapsible behavior
- [ ] Navigation items: Overview, Sites, Devices, Analytics, Forecasts, Schedules, Settings
- [ ] Each nav item uses `lucide-react` icons and highlights on active route
- [ ] Header shows breadcrumbs derived from the current pathname
- [ ] Dark mode toggle in header (persisted via `next-themes`)
- [ ] Stage badge in header: shows "DEV" / "STAGING" / "PROD" from `NEXT_PUBLIC_APP_STAGE`
- [ ] Sidebar collapses to icon-only on mobile/small screens
- [ ] Responsive: sidebar becomes a sheet/drawer on viewport < 768px
- [ ] All 7 route pages exist as stub pages with title + placeholder skeleton
- [ ] `@media (prefers-reduced-motion: reduce)` respected (from globals.css)

### Component Breakdown

**`src/app/layout.tsx`** — Root Layout (Server Component)
- Loads Inter font via `next/font/google`
- Sets `<html lang="en" suppressHydrationWarning>`
- Wraps `{children}` with `<Providers>`
- Metadata: `title: "EnergyOS"`, `description: "IoT Energy Management Platform"`

**`src/components/layout/providers.tsx`** — Client Component
- `QueryClientProvider` with default `queryClient` instance (staleTime: 30s default)
- `ThemeProvider` from `next-themes`: `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- `SidebarProvider` from shadcn

**`src/app/(dashboard)/layout.tsx`** — Dashboard Shell (Server Component)
- Renders `<AppSidebar />` + `<SidebarInset>` with `<AppHeader />` + `{children}`

**`src/components/layout/app-sidebar.tsx`** — Client Component
- shadcn `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`
- Nav items:

```typescript
const navItems = [
  { title: 'Overview',   href: '/',           icon: LayoutDashboard },
  { title: 'Sites',      href: '/sites',      icon: Building2 },
  { title: 'Devices',    href: '/devices',     icon: Cpu },
  { title: 'Analytics',  href: '/analytics',   icon: BarChart3 },
  { title: 'Forecasts',  href: '/forecasts',   icon: TrendingUp },
  { title: 'Schedules',  href: '/schedules',   icon: Calendar },
  { title: 'Settings',   href: '/settings',    icon: Settings },
];
```

- Footer: "EnergyOS" + `v0.1.0` badge
- Active state: check `usePathname()` against `href`

**`src/components/layout/app-header.tsx`** — Client Component
- `SidebarTrigger` for mobile
- Breadcrumb from `usePathname()` — split path, capitalize, link each segment
- Right side: stage badge (`bg-brand-accent` for dev, `bg-destructive` for prod), dark mode toggle (Sun/Moon)

### Implementation Order (CC Tasks)

1. Create `src/components/layout/providers.tsx`
2. Update `src/app/layout.tsx` — Inter font, Providers wrapper, metadata
3. Add shadcn sidebar component if not already present: `pnpm dlx shadcn@latest add sidebar`
4. Create `src/components/layout/app-sidebar.tsx`
5. Create `src/components/layout/app-header.tsx`
6. Create `src/app/(dashboard)/layout.tsx`
7. Create all 7 stub pages under `(dashboard)/` — each with a heading and "Coming soon" text
8. Create `loading.tsx` files with `<Skeleton>` grids for each route
9. Verify: `pnpm --filter @app/dashboard dev` → navigate all routes, sidebar highlights, dark mode works, responsive collapse works

---

## 4. PRD-02: Schemas & Mock Data Layer

### Goal
Define all Zod schemas, build mock data generators, implement mock repositories, and wire up the factory pattern. After this PRD, every hook returns realistic mock data.

### Acceptance Criteria

- [ ] All 7 Zod schemas in `src/schemas/` — site, device, reading, tariff, schedule, forecast, dr-event
- [ ] TypeScript types exported via `z.infer<>` from each schema
- [ ] Seeded mock data: 20 sites (Vienna area), ~200 devices, 30 days of readings
- [ ] Time-series generators: consumption (dual-peak Gaussian), solar (bell curve + seasonal + cloud), battery (charge/discharge constrained), weather (sinusoidal + noise)
- [ ] Repository interfaces for Site, Device, Reading, Forecast, Schedule, Tariff
- [ ] Mock implementations with filtering, pagination, sorting
- [ ] Factory checks `NEXT_PUBLIC_USE_MOCK` → returns mock or (future) Supabase implementation
- [ ] TanStack Query hooks in `src/hooks/` — one per entity, using factory
- [ ] MSW handlers intercept `/api/*` routes
- [ ] `instrumentation.ts` initializes MSW server-side
- [ ] `src/lib/env.ts` validates environment with Zod

### Schema Files

Each file exports `[Entity]Schema` and `type [Entity]`:

| File | Schema | Key fields |
|---|---|---|
| `site.ts` | SiteSchema | id, name, address, lat, lng, timezone, grid_connection_kva, status |
| `device.ts` | DeviceSchema, DeviceTypeEnum, DeviceStatusEnum | id, site_id, name, type, rated_capacity_kw, protocol, status, last_seen_at |
| `reading.ts` | ReadingSchema, AggregatedReadingSchema | device_id, timestamp, power_w, energy_kwh, voltage_v, state_of_charge, quality |
| `tariff.ts` | TariffSchema, TariffPeriodSchema | name, price_per_kwh, feed_in_per_kwh, start_hour, end_hour, season |
| `schedule.ts` | ScheduleSchema | device_id, action (charge/discharge/heat/cool), start_at, end_at, target_value, priority, source |
| `forecast.ts` | ForecastSchema, ForecastValueSchema | site_id, type, source, horizon_hours, values[]{timestamp, value_kw, confidence_lower, confidence_upper} |
| `dr-event.ts` | DREventSchema | type, signal_value, start_at, end_at, target_reduction_kw, status, participating_sites |

### Mock Data Generators

**`seed.ts`**: `faker.seed(42)`, constants for NUM_SITES, DEVICES_PER_SITE, DATE_RANGE

**`generators.ts`** — six functions:

| Function | Mathematical pattern | Notes |
|---|---|---|
| `generateConsumptionCurve()` | Base load × night dip + Gaussian morning peak (σ=1.5h) + Gaussian evening peak (σ=2h) + noise | Dual-peak residential pattern |
| `generateSolarCurve()` | Bell curve at noon × seasonal factor (cos day-of-year) × (1 - cloudCover) | Returns 0 outside 6am-8pm |
| `generateBatterySoC()` | Integrates net = solar - consumption, clamps 0-100%, max charge/discharge rate | Derived from other generators |
| `generateWeatherData()` | Sinusoidal temp (daily: amplitude 5°C, seasonal: amplitude 15°C) + noise | Humidity, wind, irradiance |
| `generateForecast()` | Base curve + Gaussian noise that widens over horizon | Confidence band grows ±2%/hour |
| `generatePriceSignal()` | Step function from tariff periods | Peak/off-peak/shoulder mapping |

**`sites.ts`**: 20 sites around Vienna (48.1-48.3°N, 16.2-16.5°E), mix of residential/commercial/industrial

**`devices.ts`**: Generated per site type. ~200 total. 90% online, 5% offline, 3% error, 2% maintenance.

### Repository Interfaces

Common types shared across all interfaces:

```typescript
// src/repositories/interfaces/common.ts
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SortParams {
  sortBy: string;
  sortDir: 'asc' | 'desc';
}
```

Per-entity interfaces with domain-specific query methods:

| Interface | Key methods |
|---|---|
| `IDeviceRepository` | `list(params)`, `getById(id)`, `getCountsByStatus()`, `getCountsByType()` |
| `ISiteRepository` | `list(params)`, `getById(id)`, `getSummary(id)` — aggregates devices + energy |
| `IReadingRepository` | `getLatest(deviceId)`, `getRange(deviceId, from, to, resolution)`, `getAggregate(siteId, from, to)`, `getDailyTotals(siteId, days)` |
| `IForecastRepository` | `getLatest(siteId, type)`, `getForHorizon(siteId, type, hours)`, `compareWithActual(siteId, type, from, to)` |
| `IScheduleRepository` | `list(params)`, `getForDevice(deviceId)`, `getForDateRange(from, to)`, `create(schedule)`, `cancel(id)` |
| `ITariffRepository` | `getActive(siteId)`, `getForSite(siteId)`, `getCurrentPrice(siteId)` |

### Hook Pattern

```typescript
// src/hooks/use-devices.ts
import { useQuery } from '@tanstack/react-query';
import type { DeviceListParams } from '@/repositories/interfaces/IDeviceRepository';

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

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['device', id],
    queryFn: async () => {
      const { getDeviceRepository } = await import('@/repositories/factory');
      const repo = await getDeviceRepository();
      return repo.getById(id);
    },
    enabled: !!id,
  });
}

export function useDeviceCountsByStatus(siteId?: string) {
  return useQuery({
    queryKey: ['devices', 'counts', 'status', siteId],
    queryFn: async () => {
      const { getDeviceRepository } = await import('@/repositories/factory');
      const repo = await getDeviceRepository();
      return repo.getCountsByStatus(siteId);
    },
    staleTime: 60_000,
  });
}
```

### Implementation Order (CC Tasks)

1. Create `src/lib/env.ts` — Zod-validated environment
2. Create all 7 schema files in `src/schemas/`
3. Create `src/repositories/interfaces/common.ts` and all 6 interface files
4. Create `src/repositories/mock/data/seed.ts`
5. Create `src/repositories/mock/data/generators.ts` — all 6 generator functions
6. Create `src/repositories/mock/data/sites.ts` and `devices.ts`
7. Create all 6 mock repository implementations
8. Create `src/repositories/factory.ts`
9. Create all hooks in `src/hooks/`
10. Create MSW handlers in `src/mocks/`
11. Create `src/instrumentation.ts`
12. Verify: import `useDevices()` in the devices stub page, confirm it returns mock data

---

## 5. PRD-03: Overview Dashboard

*Unchanged from v1 — see original Phase 1 doc for full spec.*

### Summary
KPI row (6 cards with sparklines), Energy Flow Sankey (ECharts), 24h Power Curve (uPlot), Zustand filter store for date range. All components use domain-specific Tailwind colors: `bg-solar`, `text-grid-import`, `border-consumption`, etc.

### Key v2 addition
Use the energy domain color tokens from `globals.css`:
- Solar series: `var(--color-solar)` → `bg-solar`
- Grid import: `var(--color-grid-import)` → `bg-grid-import`
- Battery: `var(--color-battery-charge)` / `var(--color-battery-discharge)`
- Consumption: `var(--color-consumption)`

These map directly to chart series colors in both uPlot and ECharts configs.

### Implementation Order (CC Tasks)

1. Create `src/stores/use-filter-store.ts`
2. Create `src/components/charts/kpi-card.tsx`
3. Create `src/components/dashboard/overview-kpis.tsx`
4. Create `src/components/charts/analytics-chart.tsx` (ECharts wrapper)
5. Create `src/components/dashboard/energy-flow.tsx` (Sankey)
6. Create `src/components/charts/time-series-chart.tsx` (uPlot wrapper)
7. Create `src/components/dashboard/power-curve.tsx`
8. Wire `src/app/(dashboard)/page.tsx`
9. Add date range selector
10. Add `loading.tsx` with skeleton grid

---

## 6. PRD-04: Sites & Device Fleet

*Unchanged from v1 — see original Phase 1 doc for full spec.*

### Summary
Sites: map + list, site detail with tabs (Devices, Energy, Tariff). Devices: fleet table (sortable, filterable, paginated), device detail with live chart + history. React Leaflet (dynamic import, `ssr: false`) for maps. Status badges use `bg-status-online`, `bg-status-error`, etc. from design tokens.

### Implementation Order (CC Tasks)

1. Create `src/components/devices/device-status-badge.tsx` — uses `bg-status-{status}` tokens
2. Create `src/components/devices/device-table.tsx`
3. Create `src/app/(dashboard)/devices/page.tsx`
4. Create `src/components/sites/site-map.tsx` (dynamic import)
5. Create `src/components/sites/site-list.tsx`
6. Create `src/app/(dashboard)/sites/page.tsx`
7. Create `src/app/(dashboard)/sites/[siteId]/page.tsx` with tabs
8. Create `src/app/(dashboard)/devices/[deviceId]/page.tsx`
9. Verify navigation and filter persistence

---

## 7. PRD-05: Analytics & Forecasts

*Unchanged from v1 — see original Phase 1 doc for full spec.*

### Summary
Analytics: time-series explorer (multi-device overlay), heatmap (hour × day-of-week), CSV export. Forecasts: 48h solar/consumption prediction with confidence bands, forecast vs. actual overlay, accuracy metrics. All via ECharts wrapper.

### Implementation Order (CC Tasks)

1. Create date range picker (shadcn Calendar + Popover)
2. Create `src/components/analytics/time-series-explorer.tsx`
3. Create `src/components/analytics/heatmap-chart.tsx`
4. Create `src/app/(dashboard)/analytics/page.tsx`
5. Create `src/components/analytics/forecast-actual-chart.tsx`
6. Create `src/app/(dashboard)/forecasts/page.tsx`
7. Add CSV export

---

## 8. PRD-06: Schedules & DR Events

*Unchanged from v1 — see original Phase 1 doc for full spec.*

### Summary
Timeline/Gantt for scheduled operations, price signal overlay using `bg-tariff-peak` / `bg-tariff-offpeak` / `bg-tariff-shoulder` tokens, schedule creation form (React Hook Form + Zod), DR event cards with status indicators.

### Implementation Order (CC Tasks)

1. Create `src/components/schedules/price-signal-overlay.tsx`
2. Create `src/components/schedules/schedule-timeline.tsx`
3. Create `src/components/schedules/schedule-form.tsx`
4. Create `src/app/(dashboard)/schedules/page.tsx`
5. Wire schedule creation to mock repository
6. Verify: create → appears on timeline → persists in session

---

## 9. PRD-07: Real-Time SSE & Live Indicators

*Unchanged from v1 — see original Phase 1 doc for full spec.*

### Summary
SSE endpoint at `/api/sse/readings`, mock generates new reading every 5s, `EventSource` on client updates TanStack Query cache, uPlot appends points in scrolling window. Connection status indicator. Graceful fallback to polling.

### Implementation Order (CC Tasks)

1. Create `src/app/api/sse/readings/route.ts`
2. Create `src/hooks/use-realtime-reading.ts`
3. Create `src/components/devices/live-reading-card.tsx`
4. Integrate into device detail page
5. Add scrolling uPlot chart
6. Add polling fallback to overview dashboard
7. Add connection status indicator
8. Test cleanup on navigation

---

## Implementation Sequence

```
PRD-01: App Shell & Navigation        ← Start here
  │
  ▼
PRD-02: Schemas & Mock Data Layer      ← Data foundation
  │
  ├──▶ PRD-03: Overview Dashboard      ← Parallel track A
  ├──▶ PRD-04: Sites & Device Fleet    ← Parallel track B
  │
  ▼
PRD-05: Analytics & Forecasts          ← After chart wrappers exist
  │
  ▼
PRD-06: Schedules & DR Events          ← After data layer stable
  │
  ▼
PRD-07: Real-Time SSE                  ← Enhances existing pages
```

### Estimated Effort (Solo + CC)

| PRD | Sessions | Notes |
|---|---|---|
| 00 — Scaffolding (Section 2) | 1 session | Monorepo setup, deps, Tailwind tokens, SST config |
| 01 — Shell | 1-2 sessions | Sidebar, nav, dark mode, stub pages |
| 02 — Schemas + Mock | 2-3 sessions | Generators need tuning for realism |
| 03 — Dashboard | 2-3 sessions | Chart wrapper setup is the bottleneck |
| 04 — Sites + Devices | 2-3 sessions | Table + Leaflet map |
| 05 — Analytics | 2 sessions | Reuses wrappers from PRD-03 |
| 06 — Schedules | 2 sessions | Timeline/Gantt complexity |
| 07 — SSE | 1 session | Well-scoped |

**Total: ~13-18 CC sessions** for a fully functional Phase 1 prototype deployed on AWS.

---

## Appendix: Quick Reference Commands

```bash
# Development
pnpm dev                              # All apps (Turborepo)
pnpm --filter @app/dashboard dev      # Dashboard only (port 4200)

# Build
pnpm build                            # All (cached)
pnpm --filter @app/dashboard build    # Dashboard only

# Quality
pnpm lint
pnpm typecheck

# Deploy
pnpm deploy:dev                       # Dev stage (mock mode)
pnpm deploy                           # Production
pnpm diff:dev                         # Preview changes (like terraform plan)

# SST
pnpm sst:dev                          # Local dev with real AWS resources
pnpm sst:unlock                       # Release stuck deployment lock

# shadcn (run from apps/dashboard/)
cd apps/dashboard
pnpm dlx shadcn@latest add [component]

# Clean
pnpm clean                            # Remove .next, dist, .turbo
```