import {
  ONTOLOGY_EDGES,
  ONTOLOGY_NODES,
  NEWS_RECORDS,
  VERIFY_ENTRIES,
  buildVerifyDaily,
} from './data'
import type { NewsImpactWire, NewsListPageWire } from './mappers'
import type {
  Direction,
  ImpactGraphNode,
  OntologyEdge,
  OntologyNode,
  VerifyResponse,
} from '#/types'

/**
 * `docs/KOSLINK-FRONTEND.md` §5 API 명세와 같은 시그니처를 갖는 헬퍼 모음.
 * 지금은 백엔드가 없어 lib/data.ts를 동기적으로 가공해 반환한다. 반환 모양은 실
 * 백엔드가 내려줄 wire(snake_case) 그대로다 — MSW 핸들러가 이 함수들을 그대로
 * HttpResponse.json()으로 흘려보내고, lib/queries.ts가 lib/mappers.ts를 거쳐
 * camelCase 도메인 타입으로 바꾼다. 실 API가 준비되면 이 함수들의 본문만 fetch
 * 호출로 바꾸면 되고, 매퍼·호출부는 그대로 둘 수 있다.
 */

const nodeById = new Map(ONTOLOGY_NODES.map((n) => [n.id, n]))

function requireNode(id: string): OntologyNode {
  const node = nodeById.get(id)
  if (!node) throw new Error(`Unknown ontology node: ${id}`)
  return node
}

/**
 * 목록 커서 페이징 공통 로직. cursor는 "마지막으로 받은 항목의 커서 키" 관례를
 * 쓰지만, 클라이언트는 이 값을 해석하지 않고 nextCursor를 그대로 되돌려주기만
 * 한다. GET /api/news, GET /api/verify가 함께 쓴다.
 */
function paginate<T>(
  items: T[],
  cursor: string | undefined,
  limit: number,
  cursorOf: (item: T) => string,
): { page: T[]; nextCursor: string | null } {
  const startIndex = cursor
    ? Math.max(items.findIndex((item) => cursorOf(item) === cursor) + 1, 0)
    : 0
  const page = items.slice(startIndex, startIndex + limit)
  const last = page.at(-1)
  const nextCursor =
    startIndex + limit < items.length && last ? cursorOf(last) : null
  return { page, nextCursor }
}

export interface GetNewsParams {
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string
  limit?: number
}

const DEFAULT_NEWS_LIMIT = 20

export function getNews({
  cursor,
  limit = DEFAULT_NEWS_LIMIT,
}: GetNewsParams = {}): NewsListPageWire {
  const { page, nextCursor } = paginate(NEWS_RECORDS, cursor, limit, (n) =>
    String(n.id),
  )

  return {
    items: page.map((n) => ({
      news_id: n.id,
      title: n.title,
      press: n.press,
      published_at: n.publishedAt,
    })),
    nextCursor,
  }
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
 * GET /api/news/{id}/impact. 기존 analysis + graph 두 엔드포인트를 하나로 합친 것 —
 * 분석 패널과 그래프 패널이 같은 화면 전환에서 동시에 필요한 데이터라서다.
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

export interface GetGraphParams {
  mode: 'full'
}

export function getGraph(
  _params?: GetGraphParams,
): { nodes: OntologyNode[]; edges: OntologyEdge[] } {
  return { nodes: ONTOLOGY_NODES, edges: ONTOLOGY_EDGES }
}

function bySector<T extends { sector: string }>(
  items: T[],
  sector?: string,
): T[] {
  return items.filter(
    (n) => !sector || sector === '전체' || n.sector === sector,
  )
}

export interface GetVerifyParams {
  sector?: string
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string
  limit?: number
}

const DEFAULT_VERIFY_LIMIT = 10

export function getVerify({
  sector,
  cursor,
  limit = DEFAULT_VERIFY_LIMIT,
}: GetVerifyParams = {}): VerifyResponse {
  const { page, nextCursor } = paginate(
    bySector(VERIFY_ENTRIES, sector),
    cursor,
    limit,
    (v) => v.newsId,
  )
  // daily 추이는 섹터/페이지와 무관한 전체 집계라 페이징하지 않는다.
  return { daily: buildVerifyDaily(), news: page, nextCursor }
}
