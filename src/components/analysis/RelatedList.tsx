import { useState } from 'react'
import { arrow, directionLabel, impactOf } from '#/lib/format'
import { bfsBuild, buildGraphIndex } from '#/lib/graphIndex'
import type { NewsImpactGraph, RelatedStock } from '#/types'

function sortRelated(hopOf: (ticker: string) => number) {
  return (a: RelatedStock, b: RelatedStock) => {
    const hopDiff = hopOf(a.ticker) - hopOf(b.ticker)
    if (hopDiff !== 0) return hopDiff
    if (a.direction === b.direction) return 0
    return a.direction === 'UP' ? -1 : 1
  }
}

/** 관계로 이어진 종목 — 기점에서 파급 경로 그래프(BFS)를 따라 이어지는 관련주 목록 */
export default function RelatedList({
  relatedStocks,
  graph,
}: {
  relatedStocks: RelatedStock[]
  graph: NewsImpactGraph
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const index = buildGraphIndex(graph.nodes, graph.edges)
  const built = bfsBuild(index, graph.originId)
  const hopByTicker = new Map<string, number>()
  graph.nodes.forEach((n) => {
    if (n.ticker) hopByTicker.set(n.ticker, built.level[n.id] ?? 0)
  })
  const hopOf = (ticker: string) => hopByTicker.get(ticker) ?? 0

  const sorted = [...relatedStocks].sort(sortRelated(hopOf))

  return (
    <div>
      <div
        className="mb-[9px] text-[11.5px] font-bold"
        style={{ color: 'var(--n-500)' }}
      >
        관계로 이어진 종목 {relatedStocks.length}
      </div>
      <div className="flex flex-col gap-[7px]">
        {sorted.map((r) => {
          const hop = hopOf(r.ticker)
          const impact = impactOf(hop)
          const down = r.direction === 'DOWN'
          const isExpanded = expanded === r.ticker
          return (
            <button
              key={r.ticker}
              type="button"
              onClick={() => setExpanded(isExpanded ? null : r.ticker)}
              className="rounded-xl border px-[13px] py-3 text-left"
              style={{ borderColor: 'var(--n-150)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold tracking-[-0.025em]">
                  {r.name}
                </span>
                <span
                  className="flex-none rounded-lg px-2.5 py-1 text-[12.5px] font-extrabold tracking-[-0.02em] text-white"
                  style={{ background: down ? 'var(--d-500)' : 'var(--o-500)' }}
                >
                  {arrow(r.direction)} {directionLabel(r.direction)}
                </span>
              </div>
              <div className="mt-1.5 text-xs" style={{ color: 'var(--n-600)' }}>
                <span
                  className="mr-1.5 inline-block rounded-[5px] px-[7px] py-px text-[11px] font-extrabold"
                  style={
                    impact.tier === 't1'
                      ? { background: 'var(--o-100)', color: 'var(--o-700)' }
                      : impact.tier === 't2'
                        ? { background: 'var(--o-50)', color: 'var(--o-600)' }
                        : { background: 'var(--n-100)', color: 'var(--n-600)' }
                  }
                >
                  {impact.label}
                </span>
                <b className="font-bold" style={{ color: 'var(--n-900)' }}>
                  {r.relationLabel}
                </b>{' '}
                관계
              </div>
              <div
                className="mt-[7px] text-[11.5px]"
                style={{ color: 'var(--n-400)' }}
              >
                {r.relationPath}
              </div>
              {isExpanded && (
                <div
                  className="mt-2.5 rounded-lg px-3 py-2.5 text-[12px] leading-[1.55]"
                  style={{ background: 'var(--n-50)', color: 'var(--n-700)' }}
                >
                  {r.propagation}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
