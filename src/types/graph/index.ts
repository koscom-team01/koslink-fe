import type { Edge, Node } from '@xyflow/react'
import type { Direction } from '#/shared/types'

/**
 * 실제 온톨로지(Neo4j)는 Stock/Role/Theme 3계층 + BELONGS_TO/SUPPLY_TO/RELATED_TO
 * 관계로 이뤄져 있지만, 프론트는 "거래 가능한 종목인지" 여부만 렌더링에 쓴다
 * (카드 크기·티커 표시 여부). 그래서 Role/Theme는 CONCEPT 하나로 뭉뚱그려 받는다.
 */
export type NodeKind = 'STOCK' | 'CONCEPT'

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

export type NodeVisualState =
  | 'hide'
  | 'idle'
  | 'dim'
  | 'via'
  | 'via2'
  | 'up'
  | 'down'
  | 'up2'
  | 'down2'
  | 'origin'

export interface StockNodeData extends Record<string, unknown> {
  label: string
  ticker?: string
  abstract: boolean
  tier?: 't1' | 't2' | 't3'
  state: NodeVisualState
  isMain?: boolean
  badge?: Direction | null
  pulseToken?: number
}

export type StockFlowNode = Node<StockNodeData, 'stock'>

export type EdgeVisualState =
  'hide' | 'idle' | 'dim' | 'near' | 'up' | 'down' | 'up2' | 'down2'

export interface RelEdgeData extends Record<string, unknown> {
  relation: string
  state: EdgeVisualState
  draw?: boolean
  /** draw가 true가 된 시각(performance.now()). 그리기 애니메이션의 진행률을
   * 경과 시간으로 계산해, 리렌더/리마운트가 일어나도 처음부터 다시 그려지지
   * 않고 진행 중이던 지점부터 이어 그리게 하는 데 쓰인다. */
  drawAt?: number
}

export type RelFlowEdge = Edge<RelEdgeData, 'rel'>
