import { capSizeToMarketCap } from '#/shared/utils/format'
import type { Direction } from '#/shared/types'
import type { NewsImpact, OriginStock, RelatedStock } from '#/types/analysis'
import type {
  CapSize,
  ImpactGraphNode,
  MarketType,
  NewsImpactGraph,
  OntologyEdge,
} from '#/types/graph'

/**
 * docs/KOSLINK_API.md §2 GET /news/{news_id}/impact 명세와 같은 wire(snake_case)
 * 응답 타입 + 프론트 도메인 타입(camelCase)으로의 변환 함수 모음. apis/analysis/mock.ts
 * (목 데이터)와 mocks/analysis/handlers.ts는 이 wire 타입 그대로를 다루고,
 * apis/analysis/queries.ts의 fetch 함수가 여기를 거쳐 컴포넌트에 camelCase 도메인
 * 타입을 넘긴다.
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

/** wire 그래프 노드 — kind/sector/marketCap 없이 capSize/marketType 구간값만 싣는다
 * (GET /graph?mode=full의 graph.json과 동일한 스키마). */
export interface ImpactGraphNodeWire {
  id: string
  name: string
  ticker: string
  capSize: CapSize
  marketType: MarketType
}

export interface OntologyEdgeWire {
  id: string
  source: string
  target: string
  relation: string
}

export interface NewsImpactGraphWire {
  newsId: number
  originId: string
  nodes: ImpactGraphNodeWire[]
  edges: OntologyEdgeWire[]
}

export interface NewsImpactWire {
  news_summary: string[]
  source: { press: string; published_at: string; url: string }
  origin_stocks: OriginStockWire[]
  related_stocks: RelatedStockWire[]
  final_summary: string
  graph: NewsImpactGraphWire
}

function toDirection(status: StockStatus): Direction {
  return status === 'up' ? 'UP' : 'DOWN'
}

// wire 그래프 노드는 kind를 싣지 않는다 — 이 엔드포인트의 그래프는 GET /graph?mode=full과
// 같은 스키마로 통일해 전부 STOCK으로 취급한다(개념 노드도 ticker 자리에 id를 채운
// placeholder로 내려온다).
function toOntologyNode(wireNode: ImpactGraphNodeWire): Omit<ImpactGraphNode, 'direction'> {
  return {
    id: wireNode.id,
    name: wireNode.name,
    kind: 'STOCK',
    ticker: wireNode.ticker,
    sector: '반도체',
    marketCap: capSizeToMarketCap(wireNode.capSize),
  }
}

// wire 엣지는 relationType을 싣지 않는다. 극성을 반전시키는 경쟁 관계는 데이터
// 출처에 따라 레이블 표기가 다르다 — mocks/graph/data.ts(뉴스별 온톨로지 엣지)는
// '경쟁', graph.json 계열(hmiSubgraph.json 등, mocks/graph/fullGraph.ts의
// RELATION_LABEL/RELATION_TYPE과 동일한 어휘)은 '경쟁사'/'시장 경쟁'을 쓴다.
// 이 셋 중 하나면 COMPETITOR로 복원한다(polarityOf()는 relationType === 'COMPETITOR'일
// 때만 반전시키고, 나머지는 항상 동조로 취급되므로 undefined와 'OTHER' 등은 결과가 같다).
const COMPETITOR_RELATION_LABELS = new Set(['경쟁', '경쟁사', '시장 경쟁'])

function toOntologyEdge(wireEdge: OntologyEdgeWire): OntologyEdge {
  return {
    id: wireEdge.id,
    source: wireEdge.source,
    target: wireEdge.target,
    relation: wireEdge.relation,
    relationType: COMPETITOR_RELATION_LABELS.has(wireEdge.relation)
      ? 'COMPETITOR'
      : undefined,
  }
}

/** newsId는 wire 응답에 담기지 않는다(그래프 안의 graph.newsId만 존재) — 요청한 id를 그대로 채운다. */
export function mapNewsImpact(newsId: number, wire: NewsImpactWire): NewsImpact {
  // 그래프 노드에는 direction이 없다 — origin/related 종목 목록(둘 다 ticker 기준)에서
  // 상승/하락 상태를 조인해 붙인다.
  const directionByTicker = new Map<string, Direction>()
  wire.origin_stocks.forEach((o) =>
    directionByTicker.set(o.ticker, toDirection(o.status)),
  )
  wire.related_stocks.forEach((r) =>
    directionByTicker.set(r.ticker, toDirection(r.status)),
  )

  const nodes: ImpactGraphNode[] = wire.graph.nodes.map((n): ImpactGraphNode => {
    const direction = directionByTicker.get(n.ticker)
    const node = toOntologyNode(n)
    return direction ? { ...node, direction } : node
  })

  // graph.nodes가 origin_stocks에 있는 기점 종목을 포함하지 않을 수 있다(예:
  // 연관 종목이 하나도 없어 그래프가 통째로 빈 배열로 내려오는 경우) — bfsBuild가
  // originId를 노드 유무와 무관하게 무조건 시드하기 때문에, 여기서 보정해두지
  // 않으면 실제로는 없는 노드를 참조하게 되어 하위에서 undefined.marketCap로 터진다.
  if (!nodes.some((n) => n.id === wire.graph.originId)) {
    const originStock = wire.origin_stocks.find(
      (o) => o.ticker === wire.graph.originId,
    )
    if (originStock) {
      nodes.push({
        id: wire.graph.originId,
        name: originStock.name,
        kind: 'STOCK',
        ticker: originStock.ticker,
        sector: '반도체',
        direction: toDirection(originStock.status),
      })
    }
  }

  const graph: NewsImpactGraph = {
    newsId: wire.graph.newsId,
    originId: wire.graph.originId,
    nodes,
    edges: wire.graph.edges.map(toOntologyEdge),
  }

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
    graph,
  }
}
