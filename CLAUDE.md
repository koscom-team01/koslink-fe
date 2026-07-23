# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KOSLINK is a Korean-language web service that shows how a single news article affects multiple stocks using an ontology graph. It visualizes the relationship between news and stocks with a focus on the "why" - showing the propagation path through supply chains, competition, and material flows.

## Development Commands

```bash
pnpm dev           # Start dev server on port 3000
pnpm build         # Production build
pnpm test          # Run tests (Vitest)
pnpm lint          # ESLint check
pnpm format        # Prettier + ESLint fix
pnpm check         # Prettier check only
pnpm generate-routes  # Generate TanStack Router route tree
```

### Adding Shadcn Components

```bash
pnpm dlx shadcn@latest add <component>
```

## Tech Stack

- **Framework**: React 19 + Vite (CSR)
- **Routing**: TanStack Router with file-based routing (`src/routes/`)
- **Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS v4 + shadcn/ui (new-york style)
- **HTTP Client**: ky
- **State**: Jotai (for UI state, watchlist memory)
- **Graph**: @xyflow/react (React Flow v12) - planned

## Path Aliases

Both `#/*` and `@/*` resolve to `./src/*`:

```typescript
import { cn } from '#/lib/utils'
import { cn } from '@/lib/utils'
```

## Architecture

### File-Based Routing

Routes are defined in `src/routes/`. The route tree is auto-generated to `src/routeTree.gen.ts`.

- `__root.tsx` - Root layout with Header (GNB) and devtools
- `index.tsx` - Home page
- `demo/` - Demo pages (can be safely deleted)

### Key Directories (Planned Structure)

```
src/
├── routes/          # File-based routes
├── components/
│   ├── ui/          # shadcn components
│   ├── news/        # News list, cards
│   ├── graph/       # React Flow graph components
│   ├── analysis/    # Impact analysis panel
│   ├── verify/      # Prediction verification
│   └── briefing/    # Watchlist briefing sheet
├── lib/
│   ├── utils.ts     # cn() utility
│   ├── api.ts       # API fetch + Query hooks
│   └── layout.ts    # Graph layout calculations
├── integrations/tanstack-query/  # Query provider setup
└── types/
```

### State Management Pattern

- **Server state**: TanStack Query only (news, graph, analysis, verification data)
- **UI state**: Jotai (view mode, selected news, graph mode, sector filter, briefing state)
- **No localStorage**: Watchlist is session memory only

## Graph Implementation Notes (@xyflow/react)

When implementing the graph visualization:

1. **Declare nodeTypes/edgeTypes outside components** - Defining inside causes full graph remount on every render
2. **No layout library needed** - Use simple trigonometry for radial/cluster layouts in `lib/layout.ts`
3. **Custom floating edges required** - Default edges snap to handles; calculate rectangle intersection points for proper connections
4. **One-shot animations only** - Never use React Flow's `animated: true`; use CSS with `animation-fill-mode: forwards`
5. **Cache fullLayout results** - Recalculating on view switches causes nodes to jump
6. **Handle hover state carefully** - Block hover reset while highlight is active

## Design Constraints

- **Orange (#F26722) is reserved for graph impact only** - Never use for decorative UI (buttons, tabs, GNB)
- **No confidence percentages** - Impact is expressed only by hop count (direct/indirect/propagated)
- **3-line summaries only** - No full article text (copyright); always link to source
- **Korean only** - No i18n needed

## API Pattern

Base path is `/api`. No authentication. All endpoints wrapped with TanStack Query:

- `GET /api/news` - News list, cursor-paginated (`sector?`, `cursor?`, `limit?` → `{ items, nextCursor }`), infinite scroll
- `GET /api/news/{id}/analysis` - Impact analysis with propagation chains (includes `title`/`sector` so the panel doesn't need the paginated list)
- `GET /api/graph` - Full ontology graph
- `POST /api/briefing` - Watchlist reverse lookup
- `GET /api/verify` - Prediction verification data; `news` is cursor-paginated the same way as `/api/news`, `daily` is not

## Things to Avoid

- Login/signup/settings screens
- localStorage or any client persistence
- dagre/elkjs or other layout libraries
- React Flow `animated: true`
- `nodeTypes`/`edgeTypes` declared inside components
- Horizontal scroll news list on mobile
- Numbered pagination UI (1, 2, 3…) in news list or verification screen — both use cursor-based infinite scroll instead (`useInfiniteScrollTrigger`)
- shadcn Card inside graph nodes (interferes with size calculation)
