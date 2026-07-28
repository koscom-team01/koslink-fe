import { NEWS_RECORDS } from '#/mocks/news/data'
import { ONTOLOGY_EDGES, ONTOLOGY_NODES } from '#/mocks/graph/data'
import { marketCapToCapSize } from '#/shared/utils/format'
import refreshNewsExamples from '#/mocks/analysis/refreshNewsExamples.json'
import hmiSubgraph from '#/mocks/analysis/hmiSubgraph.json'
import type {
  ImpactGraphNodeWire,
  NewsImpactWire,
  OntologyEdgeWire,
} from './mappers'
import type { Direction } from '#/shared/types'
import type { OntologyEdge, OntologyNode } from '#/types/graph'

/** "새로고침" 데모용 한미반도체 뉴스 3건(20001~20003) — 셋 다 실제 온톨로지
 * 2-hop 서브그래프(hmiSubgraph.json)를 공유하고, 뉴스별 요약/기점/관련종목만 다르다. */
const REFRESH_EXAMPLES = refreshNewsExamples as unknown as Partial<
  Record<
    string,
    Omit<NewsImpactWire, 'graph'> & {
      graph: { newsId: number; originId: string }
    }
  >
>

/**
 * `docs/KOSLINK_API.md` §2 GET /news/{news_id}/impact 명세와 같은 시그니처를 갖는
 * 헬퍼. 지금은 백엔드가 없어 mocks/news/data.ts + mocks/graph/data.ts를 동기적으로
 * 가공해 반환한다.
 */

const nodeById = new Map(ONTOLOGY_NODES.map((n) => [n.id, n]))

function requireNode(id: string): OntologyNode {
  const node = nodeById.get(id)
  if (!node) throw new Error(`Unknown ontology node: ${id}`)
  return node
}

function findOntologyEdge(a: string, b: string): OntologyEdge | undefined {
  return ONTOLOGY_EDGES.find(
    (e) =>
      (e.source === a && e.target === b) ||
      (e.source === b && e.target === a),
  )
}

// wire 그래프는 kind/sector/marketCap 없이 GET /graph?mode=full과 동일한
// {id,name,ticker,capSize,marketType} 스키마로 통일한다. 개념 노드(HBM 등)는 실제
// ticker가 없어 내부 id를 placeholder로 채운다 — mapNewsImpact()가 다시 STOCK으로
// 취급하므로 그래프에서는 더 이상 점선(추상) 카드로 구분되지 않는다.
function toGraphNodeWire(id: string): ImpactGraphNodeWire {
  const node = requireNode(id)
  return {
    id: node.id,
    name: node.name,
    ticker: node.ticker ?? node.id,
    capSize: marketCapToCapSize(node.marketCap),
    marketType: 'KOSPI', // 데모 데이터는 실제 상장시장 구분을 두지 않아 고정값으로 채운다
  }
}

function toGraphEdgeWire(edge: OntologyEdge): OntologyEdgeWire {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    relation: edge.relation,
  }
}

/** 관련주 카드의 근거 문장 — 서버가 그래프 경로(관계 레이블 + 방향)에서 템플릿 생성한다. */
function buildPropagation(
  originName: string,
  relationLabel: string,
  relatedName: string,
  relatedDirection: Direction,
): string {
  const effect = relatedDirection === 'UP' ? '상승 요인' : '하락 요인'
  return `${originName}과(와) ${relationLabel} 관계인 ${relatedName}에는 ${effect}으로 작용한다.`
}

/** 패널 하단 최종 요약 — 영향 기점과 파급된 관련주 수를 요약한다. */
function buildFinalSummary(originNames: string[], relatedCount: number): string {
  const origin = originNames.join(', ')
  if (relatedCount === 0) {
    return `${origin} 관련 이슈이나, 온톨로지 상 이어진 관련 종목은 확인되지 않았다.`
  }
  return `${origin} 관련 이슈로 관련 종목 ${relatedCount}개까지 영향이 파급됐다.`
}

/**
 * GET /api/news/{id}/impact. 분석 패널과 그래프 패널이 같은 화면 전환에서 동시에
 * 필요한 데이터를 하나로 합쳐 내려준다.
 */
export function getNewsImpact(newsId: number): NewsImpactWire | null {
  const record = NEWS_RECORDS.find((n) => n.id === newsId)

  // "새로고침"으로 받아온 한미반도체 뉴스 3건 — 그래프는 실제 온톨로지 2-hop
  // 서브그래프(hmiSubgraph.json)를 그대로 쓰고, 발행 시각은 리스트에 실제로
  // 찍힌 값(새로고침 클릭 시점)을 그대로 맞춘다.
  const example = REFRESH_EXAMPLES[String(newsId)]
  if (example) {
    return {
      ...example,
      source: {
        ...example.source,
        published_at: record?.publishedAt ?? example.source.published_at,
      },
      graph: {
        newsId: example.graph.newsId,
        originId: example.graph.originId,
        nodes: hmiSubgraph.nodes as ImpactGraphNodeWire[],
        edges: hmiSubgraph.edges,
      },
    }
  }

  if (!record) return null

  const originNames = record.originStocks.map(
    (o) => nodeById.get(o.nodeId)?.name ?? o.nodeId,
  )

  const originStocks = record.originStocks.map((o) => {
    const node = requireNode(o.nodeId)
    return {
      ticker: node.ticker ?? node.id,
      name: node.name,
      status: o.direction === 'UP' ? ('up' as const) : ('down' as const),
      reason: o.reason,
    }
  })

  const relatedStocks = record.relatedStocks.map((r) => {
    const node = requireNode(r.nodeId)
    const relationPath = r.chain
      .map((id) => nodeById.get(id)?.name ?? id)
      .join(' → ')
    return {
      ticker: node.ticker ?? node.id,
      name: node.name,
      status: r.direction === 'UP' ? ('up' as const) : ('down' as const),
      relation_label: r.relationLabel,
      relation_path: relationPath,
      propagation: buildPropagation(
        originNames[0] ?? '',
        r.relationLabel,
        node.name,
        r.direction,
      ),
    }
  })

  // 파급 경로 그래프 — 노드/엣지만 내려주고 좌표는 프론트가 hop 레벨로 계산한다.
  const originId = record.originStocks[0].nodeId
  const nodeIds = new Set<string>(record.originStocks.map((o) => o.nodeId))
  const edgeById = new Map<string, OntologyEdge>()
  record.relatedStocks.forEach((r) => {
    nodeIds.add(r.nodeId)
    r.chain.forEach((id) => nodeIds.add(id))
    for (let i = 1; i < r.chain.length; i++) {
      const edge = findOntologyEdge(r.chain[i - 1], r.chain[i])
      if (edge) edgeById.set(edge.id, edge)
    }
  })

  const graphNodes: ImpactGraphNodeWire[] = Array.from(nodeIds).map((id) =>
    toGraphNodeWire(id),
  )

  return {
    news_summary: record.summary,
    source: {
      press: record.press,
      published_at: record.publishedAt,
      url: record.url,
    },
    origin_stocks: originStocks,
    related_stocks: relatedStocks,
    final_summary: buildFinalSummary(originNames, relatedStocks.length),
    graph: {
      newsId: record.id,
      originId,
      nodes: graphNodes,
      edges: Array.from(edgeById.values()).map(toGraphEdgeWire),
    },
  }
}
