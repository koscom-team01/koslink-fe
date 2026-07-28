import rawGraph from './graph.json'
import { capSizeToMarketCap } from '#/shared/utils/format'
import type {
  CapSize,
  MarketType,
  OntologyEdge,
  OntologyNode,
  RelationType,
} from '#/types/graph'

/**
 * "전체 관계망"(GNB 탭) 전용 데이터. mocks/graph/data.ts의 ONTOLOGY_NODES/EDGES와는
 * 별개다 — 그쪽은 뉴스별 파급 경로(apis/analysis/mock.ts)와 뉴스 목록 목데이터
 * (mocks/news/data.ts)가 CONCEPT 노드까지 포함해 공유하므로 건드리지 않는다.
 * 전체 관계망은 API를 거치지 않고 이 파일에서 graph.json을 정적으로 읽어 쓴다.
 */

interface RawNode {
  id: string
  name: string
  ticker: string
  marketType: MarketType
  capSize: CapSize
}

interface RawEdge {
  id: string
  source: string
  target: string
  relation: string
}

// 영문 상수만 한글 라벨로 번역한다 — 나머지는 이미 한글이라 그대로 노출한다.
const RELATION_LABEL: Record<string, string> = {
  SUPPLY_CHAIN: '공급망',
  MARKET_COMPETITION: '시장 경쟁',
  TECH_COOPERATION: '기술 협력',
}

// polarityOf()는 relationType === 'COMPETITOR'일 때만 극성을 반전시킨다.
// SUPPLY_CHAIN은 기존 공급망 엣지 관례와 동일하게 relationType을 생략해 항상 동조로 취급한다.
const RELATION_TYPE: Record<string, RelationType | undefined> = {
  SUPPLY_CHAIN: undefined,
  MARKET_COMPETITION: 'COMPETITOR',
  경쟁사: 'COMPETITOR',
  기타관계: 'OTHER',
  '계열/관계사': 'AFFILIATE',
  지분투자: 'EQUITY_INVESTMENT',
  TECH_COOPERATION: 'OTHER',
  기술라이선싱: 'LICENSING',
}

const { nodes, edges } = rawGraph as { nodes: RawNode[]; edges: RawEdge[] }

export const FULL_GRAPH_NODES: OntologyNode[] = nodes.map(
  (n): OntologyNode => ({
    id: n.id,
    name: n.name,
    kind: 'STOCK',
    ticker: n.ticker,
    sector: '반도체',
    marketCap: capSizeToMarketCap(n.capSize),
  }),
)

export const FULL_GRAPH_EDGES: OntologyEdge[] = edges.map(
  (e): OntologyEdge => ({
    id: e.id,
    source: e.source,
    target: e.target,
    relation: RELATION_LABEL[e.relation] ?? e.relation,
    relationType: RELATION_TYPE[e.relation],
  }),
)
