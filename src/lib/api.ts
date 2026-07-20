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
  NewsAnalysis,
  NewsListItem,
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

export function getNews(sector?: string): NewsListItem[] {
  return NEWS_RECORDS.filter(
    (n) => !sector || sector === '전체' || n.sector === sector,
  ).map((n) => ({
    id: n.id,
    title: n.title,
    press: n.press,
    publishedAt: n.publishedAt,
    sector: n.sector,
    relativeTime: n.relativeTime,
  }))
}

export function getNewsAnalysis(newsId: string): NewsAnalysis | null {
  const record = NEWS_RECORDS.find((n) => n.id === newsId)
  if (!record) return null
  const mainNode = requireNode(record.main.nodeId)
  return {
    newsId: record.id,
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
        chain: r.chain,
      }
    }),
    rationale: record.rationale,
  }
}

export function getGraph(): { nodes: OntologyNode[]; edges: OntologyEdge[] } {
  return { nodes: ONTOLOGY_NODES, edges: ONTOLOGY_EDGES }
}

export function getVerify(): VerifyResponse {
  return { daily: buildVerifyDaily(), news: VERIFY_ENTRIES }
}

/** 종목명·티커·노드ID 어느 것으로 들어와도 온톨로지 COMPANY 노드를 찾는다. */
function findCompanyNode(query: string): OntologyNode | undefined {
  return ONTOLOGY_NODES.find(
    (n) =>
      n.kind === 'COMPANY' &&
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
