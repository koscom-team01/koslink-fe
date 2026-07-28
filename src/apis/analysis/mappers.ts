import type { Direction } from '#/shared/types'
import type { NewsImpact, OriginStock, RelatedStock } from '#/types/analysis'
import type { NewsImpactGraph } from '#/types/graph'

/**
 * 실 백엔드가 내려줄 wire(snake_case) 응답 타입 + 프론트 도메인 타입(camelCase)으로의
 * 변환 함수 모음. apis/analysis/mock.ts(목 데이터)와 mocks/analysis/handlers.ts는 이 wire
 * 타입 그대로를 다루고, apis/analysis/queries.ts의 fetch 함수가 여기를 거쳐 컴포넌트에
 * camelCase 도메인 타입을 넘긴다.
 */

export type StockStatus = 'up' | 'down'

export interface OriginStockWire {
  ticker: string
  name: string
  status: StockStatus
  reason: string
}

export interface RelatedStockWire {
  ticker: string
  name: string
  status: StockStatus
  relation_label: string
  relation_path: string
  propagation: string
}

export interface NewsImpactWire {
  news_summary: string[]
  source: { press: string; published_at: string; url: string }
  origin_stocks: OriginStockWire[]
  related_stocks: RelatedStockWire[]
  final_summary: string
  graph: NewsImpactGraph
}

function toDirection(status: StockStatus): Direction {
  return status === 'up' ? 'UP' : 'DOWN'
}

/** newsId는 wire 응답에 담기지 않는다(그래프 안의 graph.newsId만 존재) — 요청한 id를 그대로 채운다. */
export function mapNewsImpact(newsId: number, wire: NewsImpactWire): NewsImpact {
  return {
    newsId,
    newsSummary: wire.news_summary,
    source: {
      press: wire.source.press,
      publishedAt: wire.source.published_at,
      url: wire.source.url,
    },
    originStocks: wire.origin_stocks.map((o): OriginStock => ({
      ticker: o.ticker,
      name: o.name,
      direction: toDirection(o.status),
      reason: o.reason,
    })),
    relatedStocks: wire.related_stocks.map((r): RelatedStock => ({
      ticker: r.ticker,
      name: r.name,
      direction: toDirection(r.status),
      relationLabel: r.relation_label,
      relationPath: r.relation_path,
      propagation: r.propagation,
    })),
    finalSummary: wire.final_summary,
    graph: wire.graph,
  }
}
