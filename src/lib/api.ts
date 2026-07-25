import {
  ONTOLOGY_EDGES,
  ONTOLOGY_NODES,
  NEWS_RECORDS,
  VERIFY_ENTRIES,
  buildVerifyDaily,
} from './data'
import type {
  BriefingMatch,
  BriefingResult,
  BriefingUnmatched,
  ImpactGraphNode,
  NewsAnalysis,
  NewsImpactGraph,
  NewsListPage,
  OntologyEdge,
  OntologyNode,
  VerifyResponse,
} from '#/types'

/**
 * `docs/KOSLINK-FRONTEND.md` §5 API 명세와 같은 시그니처를 갖는 헬퍼 모음.
 * 지금은 백엔드가 없어 lib/data.ts를 동기적으로 가공해 반환한다. 실 API가
 * 준비되면 이 함수들의 본문만 fetch 호출로 바꾸면 되고, 호출부(컴포넌트)는
 * 그대로 둘 수 있다.
 */

const nodeById = new Map(ONTOLOGY_NODES.map((n) => [n.id, n]))

function requireNode(id: string): OntologyNode {
  const node = nodeById.get(id)
  if (!node) throw new Error(`Unknown ontology node: ${id}`)
  return node
}

function bySector<T extends { sector: string }>(
  items: T[],
  sector?: string,
): T[] {
  return items.filter(
    (n) => !sector || sector === '전체' || n.sector === sector,
  )
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
  sector?: string
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string
  limit?: number
}

const DEFAULT_NEWS_LIMIT = 20

export function getNews({
  sector,
  cursor,
  limit = DEFAULT_NEWS_LIMIT,
}: GetNewsParams = {}): NewsListPage {
  const { page, nextCursor } = paginate(
    bySector(NEWS_RECORDS, sector),
    cursor,
    limit,
    (n) => n.id,
  )

  return {
    items: page.map((n) => ({
      id: n.id,
      title: n.title,
      press: n.press,
      publishedAt: n.publishedAt,
      sector: n.sector,
      relativeTime: n.relativeTime,
    })),
    nextCursor,
  }
}

export function getNewsAnalysis(newsId: string): NewsAnalysis | null {
  const record = NEWS_RECORDS.find((n) => n.id === newsId)
  if (!record) return null
  const mainNode = requireNode(record.main.nodeId)
  return {
    newsId: record.id,
    title: record.title,
    sector: record.sector,
    article: {
      summary: record.summary,
      originUrl: record.originUrl,
      press: record.press,
      publishedAt: record.publishedAt,
    },
    main: {
      nodeId: mainNode.id,
      name: mainNode.name,
      ticker: mainNode.ticker,
      direction: record.main.direction,
      reason: record.main.reason,
    },
    related: record.related.map((r) => {
      const node = requireNode(r.nodeId)
      return {
        nodeId: node.id,
        name: node.name,
        ticker: node.ticker,
        direction: r.direction,
        relation: r.relation,
      }
    }),
    rationale: record.rationale,
  }
}

export function getGraph(): { nodes: OntologyNode[]; edges: OntologyEdge[] } {
  return { nodes: ONTOLOGY_NODES, edges: ONTOLOGY_EDGES }
}

function findOntologyEdge(a: string, b: string): OntologyEdge | undefined {
  return ONTOLOGY_EDGES.find(
    (e) =>
      (e.source === a && e.target === b) ||
      (e.source === b && e.target === a),
  )
}

/**
 * GET /api/news/{id}/graph. 뉴스별 파급 경로에 등장하는 노드·엣지만 추려서
 * 내려준다 — 좌표는 포함하지 않는다(프론트가 hop 레벨로 계산한다).
 */
export function getNewsImpactGraph(newsId: string): NewsImpactGraph | null {
  const record = NEWS_RECORDS.find((n) => n.id === newsId)
  if (!record) return null

  const nodeIds = new Set<string>([record.main.nodeId])
  const edgeById = new Map<string, OntologyEdge>()
  record.related.forEach((r) => {
    r.chain.forEach((id) => nodeIds.add(id))
    for (let i = 1; i < r.chain.length; i++) {
      const edge = findOntologyEdge(r.chain[i - 1], r.chain[i])
      if (edge) edgeById.set(edge.id, edge)
    }
  })

  const directionById = new Map<string, typeof record.main.direction>()
  directionById.set(record.main.nodeId, record.main.direction)
  record.related.forEach((r) => directionById.set(r.nodeId, r.direction))

  const nodes: ImpactGraphNode[] = Array.from(nodeIds).map((id) => {
    const node = requireNode(id)
    const direction = directionById.get(id)
    return direction ? { ...node, direction } : { ...node }
  })

  return {
    newsId: record.id,
    originId: record.main.nodeId,
    nodes,
    edges: Array.from(edgeById.values()),
  }
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

/** 종목명·티커·노드ID 어느 것으로 들어와도 온톨로지 COMPANY 노드를 찾는다. */
function findCompanyNode(query: string): OntologyNode | undefined {
  return ONTOLOGY_NODES.find(
    (n) =>
      n.kind === 'STOCK' &&
      (n.ticker === query ||
        n.id === query ||
        n.name === query ||
        n.name.includes(query)),
  )
}

export function runBriefing(tickers: string[]): BriefingResult {
  const matched: BriefingMatch[] = []
  const unmatched: BriefingUnmatched[] = []

  tickers.forEach((query) => {
    const node = findCompanyNode(query)
    if (!node) {
      unmatched.push({ ticker: query, name: query })
      return
    }

    for (const record of NEWS_RECORDS) {
      if (record.main.nodeId === node.id) {
        matched.push({
          ticker: node.ticker ?? node.id,
          name: node.name,
          direction: record.main.direction,
          relation: '뉴스에서 직접 언급',
          chain: [node.id],
          newsId: record.id,
          newsTitle: record.title,
        })
        return
      }
      const rel = record.related.find((r) => r.nodeId === node.id)
      if (rel) {
        matched.push({
          ticker: node.ticker ?? node.id,
          name: node.name,
          direction: rel.direction,
          relation: rel.relation,
          chain: rel.chain,
          newsId: record.id,
          newsTitle: record.title,
        })
        return
      }
    }

    unmatched.push({ ticker: node.ticker ?? node.id, name: node.name })
  })

  return { totalNews: NEWS_RECORDS.length, matched, unmatched }
}
