---
name: koslink-design-constraints
description: Use when writing or reviewing UI code that touches color, shadcn/ui components, confidence/percentage displays, article text, or the graph node visual language in this repo — e.g. adding a shadcn component, choosing a Tailwind color class, rendering impact/confidence, showing article summaries, or building the mobile news list. Encodes KOSLINK's hard constraints: orange (#F26722) is reserved exclusively for graph "impact" states and must never be used decoratively (buttons, tabs, GNB); impact is expressed only via hop-count labels (direct/indirect/propagated), never confidence percentages; article content is 3-line summary + source link only, never full text; Korean-only UI (no i18n); shadcn's default theme must be overridden with the KOSLINK warm-neutral/orange/deep-azure token set; never wrap a shadcn Card inside a React Flow node; no horizontal-scroll news list on mobile; no numbered-page pagination UI on the news list or verification screen (both use cursor-based infinite scroll). Do NOT use for React Flow mechanics/animation code (see react-flow-graph) or for route/data-fetching wiring (see tanstack-route-data).
---

# Design & content constraints (KOSLINK)

These are the rules most likely to be violated by default instincts, because
they reverse what a generic frontend build would normally do. Checklist
below; full detail in `CLAUDE.md` "Design Constraints" / "Things to Avoid"
and `docs/KOSLINK-FRONTEND.md` §8–§9.

## Color

- Orange `#F26722` is reserved **exclusively** for graph "impact" states
  (see react-flow-graph skill). Never use it decoratively — not on buttons,
  tabs, GNB, badges, or any non-graph UI. The point is that orange lighting
  up is a rare, meaningful event.
- Deep azure (`--d-500` `#0E6E96`), not a saturated blue, is the "down"
  color — a bright blue clashes with the orange.
- Use the warm-neutral scale (`--n-*`) for backgrounds/borders/text, not
  cool grays — cool gray makes the orange look out of place.
- After `pnpm dlx shadcn@latest add <component>`, immediately override
  shadcn's default `--primary` / `--border` / `--radius` with the tokens in
  `docs/KOSLINK-FRONTEND.md` §8. The default shadcn theme is visibly wrong
  for this app if left as-is.

## No confidence percentages

- Impact/influence is expressed **only** as a hop-count label (direct /
  indirect / propagated), derived from `chain.length - 1`. Never render a
  probability or confidence percentage for a prediction.
- The one explicit exception: the verification screen's _actual_ measured
  hit-rate and return percentages (real historical outcomes, not a
  confidence score) are allowed and expected there.

## Article content

- Show only the 3-line LLM summary plus a link to the original source.
  Never store or render full article text (copyright).

## Component placement

- Never wrap a shadcn `Card` inside a React Flow node — its wrapper
  interferes with React Flow's node-size measurement. See the
  react-flow-graph skill for the correct custom node structure instead.

## Responsive & screen-level bans

- No horizontal-scroll news list on mobile — under ~1080px it becomes a top
  "current news" bar + bottom sheet with prev/next arrows instead.
- No numbered-page pagination UI on the news list or verification screen —
  both fetch via cursor-based infinite scroll (`useInfiniteScrollTrigger`),
  detail/graph stays fixed alongside the scrolling list.
- No login, signup, settings, or "my page" screens, and no `localStorage` or
  other client-side persistence anywhere in the app.

## Language

- Korean-only UI. Do not add i18n scaffolding, language switchers, or
  English-first copy.
