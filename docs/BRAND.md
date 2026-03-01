# CES Brand Guidelines

## Colors

### Logo Colors (from SVG source files)
| Token           | Hex       | Usage                                      |
|----------------|-----------|---------------------------------------------|
| Logo Dark Teal | #1a2b25   | Letterforms ("ces"), subtitle text, all type in logo |
| Logo Gold      | #f8c802   | Chevron mark (the right-pointing arrow)     |

### Web Palette (design tokens in globals.css)
| Token        | OKLCH                  | Hex       | Usage                    |
|-------------|------------------------|-----------|--------------------------|
| Brand Gold  | oklch(0.75 0.12 85)   | #D4A843   | Primary, CTAs, accents   |
| Brand Black | oklch(0 0 0)          | #000000   | Text, backgrounds        |
| White       | oklch(1 0 0)          | #FFFFFF   | Backgrounds, text on dark|

**Note:** The logo SVG gold (`#f8c802`) is a bright saturated yellow-gold optimized for print/logo use. The web palette gold (`#D4A843`) is a more muted antique gold chosen for on-screen readability against dark backgrounds. Both are valid brand colors for their respective contexts.

## Typography

### Current Web App
- Self-hosted via next/font (GDPR)
- Font: Inter (variable weight)
- CSS variable: `--font-inter`
- Font files loaded by next/font from npm (no local font files)

### Live Site (ic-ces.at) — Reference
The existing WordPress/Divi site uses:
- **Primary:** Open Sans (weights: 300–800)
- **Secondary:** Montserrat (weights: 100–900)
- Body: 14px, line-height 1.7em
- Heading sizes: h1=30px, h2=26px, h3=22px, h4=18px

**Decision:** The new site uses Inter instead — a more modern/neutral sans-serif. Open Sans/Montserrat are referenced here for brand continuity awareness only.

### Logo Typeface
Custom/proprietary — rendered as vector paths in SVG, not a web font.

## Logo

### Source Files: `packages/ui/src/assets/`

| File                    | Contents                                         | Colors                          |
|------------------------|---------------------------------------------------|---------------------------------|
| `ces-logo-full.svg`   | Complete assembled logo (text + chevron + subtitle) | `#1a2b25` text, `#f8c802` chevron |
| `ces-text.svg`         | "ces" letterforms only (the 3 large letters c, e, s) | `#1a2b25`                       |
| `ces-subtitle.svg`     | "CLEAN ENERGY SOLUTIONS" subtitle text             | `#1a2b25`                       |
| `ces-chevron.svg`      | Gold right-pointing chevron/arrow mark only        | `#f8c802`                       |
| `ces-logo-white-bg.jpg`| Full logo raster on white background (reference)   | —                               |
| `ces-logo-grey-bg.jpg` | Full logo raster on grey background (reference)    | —                               |

### Logo Anatomy

```
┌──────────────────────────────────┐
│  ces               ▶             │  ← "ces" letterforms (dark teal) + chevron (gold)
│                                  │
│  CLEAN ENERGY                    │  ← subtitle row 1 (dark teal)
│  SOLUTIONS                       │  ← subtitle row 2 (dark teal)
└──────────────────────────────────┘
```

The logo has 4 composable parts, each available as a separate SVG:
1. **Letterforms** (`ces-text.svg`) — the three large lowercase letters in a heavy sans-serif
2. **Chevron** (`ces-chevron.svg`) — a right-pointing arrow/chevron in brand gold, positioned to the right of the "s"
3. **Subtitle** (`ces-subtitle.svg`) — "CLEAN ENERGY SOLUTIONS" in all-caps, lighter weight
4. **Full assembly** (`ces-logo-full.svg`) — all three combined in correct positioning

### Usage Notes
- On dark backgrounds: swap `#1a2b25` fill to `#FFFFFF` (white) — keep chevron gold
- The SVGs use a coordinate transform (`scale(0.012, -0.012)`) from the original design tool — they render correctly as-is
- For web use, the component parts allow flexible layouts (e.g., chevron-only favicon, text-only header)
- JPG files are reference copies only — always use SVGs for production

## Live Site Reference (ic-ces.at)

The existing company site runs WordPress + Divi v4.27.4. Its CSS mostly uses Divi defaults, **not** the actual CES brand colors:

| What | Live Site | Our New Site |
|------|-----------|--------------|
| Primary accent | `#2ea3f2` (Divi default blue) | `#D4A843` (brand gold) |
| Text color | `#666` body, `#333` headings | `#FFFFFF` on dark bg |
| Background | White (`#fff`) | Black (`#000000`) |
| Fonts | Open Sans + Montserrat | Inter |
| Border-radius | 3px | 0.5rem (8px) |
| Max container | 1080px | 1024px (max-w-4xl) |
| Theme | Divi (template builder) | Custom Next.js |

**Key takeaway:** The live site's colors are generic Divi defaults — the actual CES brand identity lives in the logo SVGs (`#1a2b25` dark teal + `#f8c802` gold). Our new site's dark theme with gold accents is a better expression of the brand than the current WordPress site.

## Design Tokens

- Source of truth: `apps/web/src/app/globals.css`
- Follows shadcn/ui token naming convention
- Uses OKLCH color space (Tailwind v4 default)
