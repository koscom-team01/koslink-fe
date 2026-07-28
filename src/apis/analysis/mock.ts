import { NEWS_RECORDS } from '#/mocks/news/data'
import { ONTOLOGY_EDGES, ONTOLOGY_NODES } from '#/mocks/graph/data'
import type { NewsImpactWire } from './mappers'
import type { Direction } from '#/shared/types'
import type { ImpactGraphNode, OntologyEdge, OntologyNode } from '#/types/graph'

/**
 * `docs/KOSLINK-FRONTEND.md` §5 API 명세와 같은 시그니처를 갖는 헬퍼. 지금은 백엔드가
 * 없어 mocks/news/data.ts + mocks/graph/data.ts를 동기적으로 가공해 반환한다.
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
  return `${origin} 관련 이슈로 관련 종목 ${relatedCount}개까지 영향이 파급됐다.`
}

/**
 * GET /api/news/{id}/impact. 분석 패널과 그래프 패널이 같은 화면 전환에서 동시에
 * 필요한 데이터를 하나로 합쳐 내려준다.
 */
export function getNewsImpact(newsId: number): NewsImpactWire | null {
  const record = NEWS_RECORDS.find((n) => n.id === newsId)
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

  const directionById = new Map<string, Direction>()
  record.originStocks.forEach((o) => directionById.set(o.nodeId, o.direction))
  record.relatedStocks.forEach((r) => directionById.set(r.nodeId, r.direction))

  const graphNodes: ImpactGraphNode[] = Array.from(nodeIds).map((id) => {
    const node = requireNode(id)
    const direction = directionById.get(id)
    return direction ? { ...node, direction } : { ...node }
  })

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
      edges: Array.from(edgeById.values()),
    },
  }
}
