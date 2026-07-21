---
name: react-flow-graph
description: Use when implementing, editing, reviewing, or debugging KOSLINK's @xyflow/react (React Flow v12) relationship graph — anything in components/graph/ (GraphPanel, StockNode, RelEdge, usePropagation) or lib/layout.ts. Trigger on mentions of React Flow, xyflow, ReactFlow, nodeTypes, edgeTypes, Handle, custom node, floating edge, getBezierPath, EdgeLabelRenderer, useInternalNode, markerEnd, radial layout, fullLayout, node/edge highlight animation, propagation sequence, or "the graph is remounting/jumping/edges are misaligned". Do NOT use for generic charts, plots, dashboards, or data-viz color/axis/legend questions (that's the dataviz skill) — this is specifically about the node-link ontology graph. Do NOT use for just launching/screenshotting the app (that's the run skill).
---

# React Flow graph implementation (KOSLINK)

This skill encodes the hard-won rules for `@xyflow/react` v12 in this repo. The
full reference implementation (exact component code, CSS keyframes, layout
math) lives in `docs/KOSLINK-FRONTEND.md` §6 "그래프 — @xyflow/react"
(§6.1–§6.7) — **read that section before writing graph code**, and prefer
copying patterns from there over re-deriving them, since it's the source of
truth. This skill is the checklist that keeps you from re-introducing the
mistakes it already solved.

## Before touching graph code

React Flow has **no built-in layout engine** — you compute every `position`
yourself. Do not add `dagre`, `elkjs`, or any other layout library (see
`CLAUDE.md` "Things to Avoid"). All layout math belongs in `lib/layout.ts`
using plain trigonometry (see §6.4 for `radialLayout`, `focusBuild`,
`nodeBuild`, `fullLayout`).

Import the stylesheet once, globally — omitting it makes nodes render
stacked on top of each other:

```tsx
import '@xyflow/react/dist/style.css'
```

## The 6 rules (in order of how often they get violated)

1. **`nodeTypes` / `edgeTypes` must be module-level constants, never created
   inside a component.** Defining them inline (`<ReactFlow nodeTypes={{ stock: StockNode }} />`)
   creates a new object every render, which forces a full remount of the
   entire graph. Declare them once, outside any component:

   ```tsx
   const nodeTypes = { stock: StockNode }
   const edgeTypes = { rel: RelEdge }
   ```

   This is called out as "가장 흔한 실수" (the most common mistake) in the spec
   — treat any inline `nodeTypes`/`edgeTypes` object as a bug on sight.

2. **Wrap in `<ReactFlowProvider>`.** It's required for `useInternalNode`
   (used by the floating-edge math below) to work at all.

3. **Edges must be a custom floating-edge component, not default React Flow
   edges.** Default edges snap to fixed `Handle` positions, which look wrong
   against a radially-computed layout. Instead, compute the intersection of
   each node's bounding box with the line to the other node's center
   (`rectPoint`), pick the emitting side (`sideOf`), and feed those into
   `getBezierPath`. Full implementation: §6.3. Handles must still exist on
   custom nodes (hidden via CSS if needed) — omitting them entirely makes
   React Flow log connection warnings.

4. **Never set React Flow's `animated: true` on an edge.** It produces an
   infinite dash-offset loop, not a one-shot reveal. Use a CSS keyframe with
   `animation-fill-mode: forwards` instead so the animation plays once and
   holds its end state:

   ```css
   .ep.draw {
     stroke-dasharray: 1400;
     stroke-dashoffset: 1400;
     animation: draw 0.48s cubic-bezier(0.33, 0, 0.2, 1) forwards;
   }
   @keyframes draw {
     to {
       stroke-dashoffset: 0;
     }
   }
   ```

   The news-selection reveal sequence (origin pulse → hop-by-hop edge draw →
   related-stock stagger) is timer-driven (`setTimeout` chain updating
   `data.state`); collect timer ids in a `useRef<number[]>` and
   `clearTimeout` all of them on unmount/reselect. Full timing table: §6.6.

5. **Cache `fullLayout()` output; don't recompute it on every view switch.**
   Recalculating positions when the user toggles between 파급경로(focus)/
   전체관계망(all)/종목기점(node) views makes nodes visibly jump. Compute
   once (e.g. memoize keyed on the graph data, not the current view) and
   reuse.

6. **Guard hover-reset while a click-driven highlight is active.** If
   `onNodeMouseLeave` unconditionally resets hover styling, moving the mouse
   off a node erases the highlight the user just triggered by clicking it:
   ```ts
   const onNodeMouseLeave = () => {
     if (highlightedNode) return // without this guard the highlight vanishes on mouseout
     resetHoverEdges()
   }
   ```

## Visual/data contract (don't reinvent — reference, don't duplicate)

- Node sizing/shape/tier rules (solid vs dashed card, 3-tier ink strength,
  market-cap-based sizing) — §6.5. Do not wrap nodes in shadcn `Card`
  (breaks React Flow's size measurement — see koslink-design-constraints
  skill).
- Color rule: orange = up/impact, deep azure (`--d-500` `#0E6E96`, not a
  saturated blue) = down, white+orange border = via/pass-through, dim = 무관.
  Orange is reserved for this purpose only — see koslink-design-constraints.
- Impact is hop-count only (`chain.length - 1`), never a confidence
  percentage — the `chain` array from `GET /api/news/{id}/analysis` (see
  `docs/KOSLINK-FRONTEND.md` §5.2) drives both node/edge layer and animation
  order.
- Click-behavior state machine (which view re-centers vs. highlights in
  place) — §6.7.

## Before finishing a graph change

- Confirm `nodeTypes`/`edgeTypes` are still declared at module scope (a
  refactor can accidentally move them inside a component).
- Confirm no `animated: true` was introduced.
- If you touched `lib/layout.ts`, confirm `fullLayout` results are still
  memoized/cached rather than recomputed per render or per view switch.
- If you touched hover/click handlers, confirm the `highlightedNode` guard
  in `onNodeMouseLeave` (or equivalent) is intact.
