/**
 * 실제 온톨로지(Neo4j)는 Stock/Role/Theme 3계층 + BELONGS_TO/SUPPLY_TO/RELATED_TO
 * 관계로 이뤄져 있지만, 프론트는 "거래 가능한 종목인지" 여부만 렌더링에 쓴다
 * (카드 크기·티커 표시 여부). 그래서 Role/Theme는 CONCEPT 하나로 뭉뚱그려 받는다.
 */
export type NodeKind = 'STOCK' | 'CONCEPT'
export type Direction = 'UP' | 'DOWN'

export interface OntologyNode {
  id: string
  name: string
  kind: NodeKind
  ticker?: string // STOCK만
  sector: string // '반도체' | '2차전지' | '방산'
  marketCap?: number // 억원, STOCK만
}

/** 실제 RELATED_TO 엣지의 relation_type 값 중 일부. STOCK-STOCK 엣지에만 존재한다. */
export type RelationType =
  | 'EQUITY_INVESTMENT'
  | 'AFFILIATE'
  | 'LICENSING'
  | 'COMPETITOR'
  | 'MNA'
  | 'OTHER'

export interface OntologyEdge {
  id: string
  source: string
  target: string
  relation: string // 화면에 보여줄 관계 레이블 — '장비 공급', '경쟁', '양극재 조달' ...
  /** SUPPLY_TO·BELONGS_TO 등 relation_type이 없는 엣지는 생략된다(항상 동조로 취급). */
  relationType?: RelationType
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

/** GET /api/news의 커서 기반 페이지 응답. cursor는 클라이언트가 해석하지 않는 opaque 값이다. */
export interface NewsListPage {
  items: NewsListItem[]
  nextCursor: string | null
}

export interface NewsRelatedStock {
  nodeId: string
  name: string
  ticker?: string
  direction: Direction
  relation: string
}

export interface NewsAnalysis {
  newsId: string
  /** 뉴스 목록은 페이지네이션되므로, 목록을 다시 훑지 않고도 헤더에 표시할 수 있게 여기 포함한다. */
  title: string
  sector: string
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

/** 파급 경로 그래프의 노드. direction은 이 뉴스의 파급 경로에 포함된 STOCK에만 붙는다. */
export interface ImpactGraphNode extends OntologyNode {
  direction?: Direction
}

/**
 * GET /api/news/{id}/graph 응답. 좌표는 내려주지 않는다 — 화면에 그릴 위치는
 * 프론트가 hop 레벨(originId부터의 BFS 거리)로 계산한다.
 */
export interface NewsImpactGraph {
  newsId: string
  originId: string
  nodes: ImpactGraphNode[]
  edges: OntologyEdge[]
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

/** GET /api/verify 응답. news는 커서 기반 페이지, daily는 필터와 무관한 전체 추이라 페이징하지 않는다. */
export interface VerifyResponse {
  daily: VerifyDaily[]
  news: VerifyEntry[]
  nextCursor: string | null
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
