import type {
  Direction,
  NewsImpact,
  NewsImpactGraph,
  NewsListItem,
  NewsListPage,
} from '#/types'

/**
 * 실 백엔드가 내려줄 wire(snake_case) 응답 타입 + 프론트 도메인 타입(camelCase)으로의
 * 변환 함수 모음. lib/api.ts(목 데이터)와 MSW 핸들러는 이 wire 타입 그대로를 다루고,
 * lib/queries.ts의 fetch 함수가 여기를 거쳐 컴포넌트에 camelCase 도메인 타입을 넘긴다.
 * 실 백엔드가 붙을 때도 이 매퍼만 유지하면 컴포넌트 쪽은 손댈 필요가 없다.
 */

export interface NewsListItemWire {
  news_id: number
  title: string
  press: string
  published_at: string
}

export interface NewsListPageWire {
  items: NewsListItemWire[]
  nextCursor: string | null
}

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

export function mapNewsListPage(wire: NewsListPageWire): NewsListPage {
  return {
    items: wire.items.map(
      (item): NewsListItem => ({
        id: item.news_id,
        title: item.title,
        press: item.press,
        publishedAt: item.published_at,
      }),
    ),
    nextCursor: wire.nextCursor,
  }
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
    originStocks: wire.origin_stocks.map((o) => ({
      ticker: o.ticker,
      name: o.name,
      direction: toDirection(o.status),
      reason: o.reason,
    })),
    relatedStocks: wire.related_stocks.map((r) => ({
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
