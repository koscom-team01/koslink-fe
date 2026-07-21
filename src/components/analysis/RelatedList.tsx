import { arrow, directionLabel, impactOf } from '#/lib/format'
import { graphIndex } from '#/lib/layout'
import type { NewsAnalysis, NewsRelatedStock } from '#/types'

function sortRelated(a: NewsRelatedStock, b: NewsRelatedStock) {
  const hopDiff = a.chain.length - b.chain.length
  if (hopDiff !== 0) return hopDiff
  if (a.direction === b.direction) return 0
  return a.direction === 'UP' ? -1 : 1
}

/** 관계로 이어진 종목 — 기점에서 chain을 따라 파급되는 관련주 목록 */
export default function RelatedList({ analysis }: { analysis: NewsAnalysis }) {
  const sorted = [...analysis.related].sort(sortRelated)

  return (
    <div>
      <div
        className="mb-[9px] text-[11.5px] font-bold"
        style={{ color: 'var(--n-500)' }}
      >
        관계로 이어진 종목 {analysis.related.length}
      </div>
      <div className="flex flex-col gap-[7px]">
        {sorted.map((r) => {
          const hop = r.chain.length - 1
          const impact = impactOf(hop)
          const down = r.direction === 'DOWN'
          return (
            <div
              key={r.nodeId}
              data-id={r.nodeId}
              className="rounded-xl border px-[13px] py-3"
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
                  {r.relation}
                </b>{' '}
                관계
              </div>
              <div
                className="mt-[7px] text-[11.5px]"
                style={{ color: 'var(--n-400)' }}
              >
                {r.chain
                  .map((id) => graphIndex.byId.get(id)?.name ?? id)
                  .join(' → ')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
