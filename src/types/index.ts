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
  id: number
  title: string
  press: string
  publishedAt: string // ISO
}

/** GET /api/news의 커서 기반 페이지 응답. cursor는 클라이언트가 해석하지 않는 opaque 값이다. */
export interface NewsListPage {
  items: NewsListItem[]
  nextCursor: string | null
}

/** 뉴스에 직접 언급된 당사자 종목 (구 main). 배열이라 여러 종목이 동시에 언급된 뉴스도 표현한다. */
export interface OriginStock {
  ticker: string
  name: string
  direction: Direction
  reason: string
}

/** 온톨로지로 파생된 관련 종목. relationPath는 표시용 문자열("SK하이닉스 → 한미반도체")이며 그래프 좌표 계산에는 쓰이지 않는다. */
export interface RelatedStock {
  ticker: string
  name: string
  direction: Direction
  relationLabel: string
  relationPath: string
  propagation: string
}

export interface NewsImpact {
  newsId: number
  newsSummary: string[] // 3줄
  source: {
    press: string
    publishedAt: string
    url: string
  }
  originStocks: OriginStock[]
  relatedStocks: RelatedStock[]
  finalSummary: string
  graph: NewsImpactGraph
}

/** 파급 경로 그래프의 노드. direction은 이 뉴스의 파급 경로에 포함된 STOCK에만 붙는다. */
export interface ImpactGraphNode extends OntologyNode {
  direction?: Direction
}

/**
 * GET /api/news/{id}/impact 응답의 graph 필드. 좌표는 내려주지 않는다 — 화면에 그릴
 * 위치는 프론트가 hop 레벨(originId부터의 BFS 거리)로 계산한다.
 */
export interface NewsImpactGraph {
  newsId: number
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
