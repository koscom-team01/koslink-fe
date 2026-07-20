export type NodeKind = 'COMPANY' | 'PRODUCT' | 'THEME' | 'MATERIAL'
export type Direction = 'UP' | 'DOWN'

export interface OntologyNode {
  id: string
  name: string
  kind: NodeKind
  ticker?: string // COMPANY만
  sector: string // '반도체' | '2차전지' | '방산'
  marketCap?: number // 억원, COMPANY만
}

export interface OntologyEdge {
  id: string
  source: string
  target: string
  relation: string // '장비 공급', '경쟁', '양극재 조달' ...
  polarity: 1 | -1 // 1 동조 / -1 반대(경쟁·대체)
}

export interface NewsListItem {
  id: string
  title: string
  press: string
  publishedAt: string // ISO
  sector: string
  /** 뉴스 카드에 노출하는 상대 시각 문구(예: "12분 전"). 정적 목데이터 전용 — 실 API 응답에는 없을 수 있다. */
  relativeTime?: string
}

export interface NewsRelatedStock {
  nodeId: string
  name: string
  ticker?: string
  direction: Direction
  relation: string
  chain: string[] // 기점부터 대상까지의 노드 ID 배열
}

export interface NewsAnalysis {
  newsId: string
  article: {
    summary: string[] // 3줄
    originUrl: string
    press: string
    publishedAt: string
  }
  main: {
    nodeId: string
    name: string
    ticker?: string
    direction: Direction
    reason: string
  }
  related: NewsRelatedStock[]
  rationale: {
    event: string
    propagation: string
    precedent: string
  }
}

export interface VerifyItem {
  name: string
  predicted: Direction
  actualReturn: number
  hit: boolean
  pathLabel: string
}

export interface VerifyEntry {
  newsId: string
  date: string
  sector: string
  title: string
  items: VerifyItem[]
}

export interface VerifyDaily {
  date: string
  hitRate: number
}

export interface VerifyResponse {
  daily: VerifyDaily[]
  news: VerifyEntry[]
}

export interface BriefingMatch {
  ticker: string
  name: string
  direction: Direction
  relation: string
  chain: string[]
  newsId: string
  newsTitle: string
}

export interface BriefingUnmatched {
  ticker: string
  name: string
}

export interface BriefingResult {
  totalNews: number
  matched: BriefingMatch[]
  unmatched: BriefingUnmatched[]
}
