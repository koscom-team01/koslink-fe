---
name: tanstack-route-data
description: Use when adding or editing a TanStack Router file-based route under src/routes/, wiring a new page/panel to the /api backend, or adding a TanStack Query hook in lib/api.ts. Covers running `pnpm generate-routes` after route file changes (never hand-edit src/routeTree.gen.ts), path aliases, and the server-state-in-TanStack-Query vs UI-state-in-Zustand split (news/graph/analysis/verify data must never live in the Zustand store). Also covers the KOSLINK /api endpoint shapes and the demo-day fallback requirement. Do NOT use for styling/design-token questions (see koslink-design-constraints) or for React Flow node/edge code (see react-flow-graph).
---

# TanStack routing & data wiring (KOSLINK)

## Route mechanics

- Routes are file-based under `src/routes/`. Any new or renamed route file
  requires running `pnpm generate-routes` (`tsr generate`) before the router
  picks it up and route typing is correct.
- `src/routeTree.gen.ts` is generated — never hand-edit it.
- Root layout (`Header`/`Footer`/devtools) lives in `src/routes/__root.tsx`;
  new top-level UI belongs there, not duplicated per-route.
- Path aliases: both `#/*` and `@/*` resolve to `./src/*` (see `package.json`
  `imports` and `components.json`). Pick one consistently within a file
  rather than mixing `#/` and `@/` imports in the same module.

## Data layer pattern

Base path is `/api`, no auth headers, everything wrapped in TanStack Query
(see `CLAUDE.md` "API Pattern"). Exact request/response shapes for each
endpoint (`GET /api/news`, `GET /api/news/{id}/analysis`, `GET /api/graph`,
`POST /api/briefing`, `GET /api/verify`) are documented in
`docs/KOSLINK-FRONTEND.md` §5 — reference that section for payload shapes
rather than re-deriving or copying them here, so the skill doesn't drift when
the spec changes.

## Server state vs UI state — do not mix these

- **Server state** (news list, graph, analysis, verify data) → TanStack
  Query only.
- **UI state** (current view, selected news id, graph mode, highlighted
  node, sector filter, briefing tickers/result — session memory only) →
  Zustand only. Store shape: `docs/KOSLINK-FRONTEND.md` §7.
- **Never** put fetched news/graph/analysis/verify data into the Zustand
  store, and never persist anything to `localStorage` — watchlist/briefing
  state is session memory only (`CLAUDE.md` "Things to Avoid").

## Demo-day safety net (§11, called out as high priority)

This is a hackathon demo — the network may fail live. Every query hook
should degrade gracefully:

- Give every query a local mock/placeholder fallback (`placeholderData` or
  an error-path fallback), not just a loading spinner.
- The handful of demo-featured news items should have their analysis result
  bundled/cached so they respond instantly even offline.
- Bundle external CDN dependencies locally rather than relying on runtime
  CDN fetches.
- The actual demo runs off a production build, not `pnpm dev`.
